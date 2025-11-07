"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid,Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import FeedbackReport from "./FeedbackReport";
import {
  speakAndListen,
  speak,
  stopSpeaking,
  isSpeaking as checkSpeaking,
  isSTTSupported,
  isTTSSupported,
  cleanup,
  SpeechRecognitionCallbacks,
} from "@/lib/speech";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isQuestion?: boolean;
  questionId?: string;
  context?: string[];
}

interface AssessmentSession {
  isActive: boolean;
  questions: Array<{ id: string; question_text: string; context?: string[] }>;
  currentQuestionIndex: number;
  answeredQuestions: Array<{
    question: string;
    answer: string;
    evaluation?: string;
    questionId: string;
    isGoodAnswer?: boolean;
  }>;
  totalQuestions: number;
}

export default function AssessmentChat({ session_id }: { session_id: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [showFeedbackReport, setShowFeedbackReport] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState<string>("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [assessmentData, setAssessmentData] = useState<{
    questions: Array<{
      question: string;
      answer: string;
      context: string[];
    }>;
  }>({ questions: [] });
  const [assessment, setAssessment] = useState<AssessmentSession>({
    isActive: false,
    questions: [],
    currentQuestionIndex: 0,
    answeredQuestions: [],
    totalQuestions: 10,
  });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    setSttSupported(isSTTSupported());
    setTtsSupported(isTTSSupported());

    return () => cleanup();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const appendMessage = (m: Message) => {
    setMessages((prev) => [...prev, m]);

    if (m.isQuestion && sttSupported) {
      const speechCallbacks: SpeechRecognitionCallbacks = {
        onResult: (result) => {
          if (result.isFinal) {
            setFinalTranscript((prev) => {
              const newPart = result.transcript;
              if (prev.includes(newPart)) return prev;
              const combined = prev ? prev + " " + newPart : newPart;
              setMessage(combined.trim());
              return combined;
            });
          } else {
            setMessage((prev) => {
              const base = finalTranscript || "";
              return base ? base + " " + result.transcript : result.transcript;
            });
          }
        },
        onStart: () => {
          setIsListening(true);
          setFinalTranscript("");
        },
        onEnd: () => setIsListening(false),
        onError: handleSpeechError,
      };

      if (ttsEnabled && ttsSupported) {
        speakAndListen(m.text, speechCallbacks);
        setIsSpeaking(true);
      } else {
        setTimeout(() => {
          import("@/lib/speech").then(({ startListening }) => startListening(speechCallbacks));
        }, 1000);
      }
    } else if (m.sender === "ai" && ttsEnabled && ttsSupported) {
      speak(
          m.text,
          () => setIsSpeaking(false),
          () => setIsSpeaking(false)
      );
      setIsSpeaking(true);
    }
  };

  const handleSpeechError = (error: string) => {
    setIsListening(false);
    if (error === "not-allowed") alert("Microphone access denied. Enable it in your browser.");
    else if (error === "network") alert("Network error. Check your connection.");
    else if (error === "no-speech" && assessment.isActive && sttSupported) {
      console.info("No speech detected, mic ready...");
      setTimeout(() => {
        if (assessment.isActive && !isListening) startListening();
      }, 500);
    } else console.warn("STT non-critical error:", error);
  };

  const toggleListening = () => (isListening ? stopListening() : startListening());

  const startListening = () => {
    if (!sttSupported) return alert("Speech recognition not supported. Use Chrome/Edge.");
    const callbacks: SpeechRecognitionCallbacks = {
      onResult: (result) => {
        if (result.isFinal) {
          setFinalTranscript((prev) => {
            const newPart = result.transcript;
            if (prev.includes(newPart)) return prev;
            const combined = prev ? prev + " " + newPart : newPart;
            setMessage(combined.trim());
            return combined;
          });
        } else setMessage((prev) => (finalTranscript ? finalTranscript + " " + result.transcript : result.transcript));
      },
      onStart: () => {
        setIsListening(true);
        setFinalTranscript("");
      },
      onEnd: () => setIsListening(false),
      onError: handleSpeechError,
    };
    import("@/lib/speech").then(({ startListening: start }) => start(callbacks));
  };

  const stopListening = () => {
    import("@/lib/speech").then(({ stopListening: stop }) => {
      stop();
      setIsListening(false);
    });
  };

  const toggleTTS = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    }
    setTtsEnabled(!ttsEnabled);
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      router.push("/auth/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const startAssessment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", session_id }),
      });
      const data = await response.json();

      appendMessage({
        id: Date.now().toString(),
        text: data.message,
        sender: "ai",
        timestamp: new Date(),
      });

      setTimeout(() => {
        const firstQuestion = data.questions[0];
        appendMessage({
          id: (Date.now() + 1).toString(),
          text: firstQuestion.question_text,
          sender: "ai",
          timestamp: new Date(),
          isQuestion: true,
          questionId: firstQuestion.id,
          context: firstQuestion.context || [],
        });

        setAssessment({
          isActive: true,
          questions: data.questions,
          currentQuestionIndex: 0,
          answeredQuestions: [],
          totalQuestions: data.questions.length,
        });
      }, 500);
    } catch (err) {
      console.error("Error starting assessment:", err);
      appendMessage({
        id: Date.now().toString(),
        text: "⚠️ Failed to start assessment. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!message.trim() || isLoading || !assessment.isActive) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    };

    appendMessage(userMessage);
    setMessage("");
    setIsLoading(true);

    try {
      const currentQuestion = assessment.questions[assessment.currentQuestionIndex];

      const newAnsweredQuestions = [
        ...assessment.answeredQuestions,
        {
          question: currentQuestion.question_text,
          answer: userMessage.text,
          questionId: currentQuestion.id,
        },
      ];

      const newAssessmentData = {
        questions: [
          ...assessmentData.questions,
          {
            question: currentQuestion.question_text,
            answer: userMessage.text,
            context: currentQuestion.context || [],
          },
        ],
      };
      setAssessmentData(newAssessmentData);

      if (newAnsweredQuestions.length >= assessment.totalQuestions) {
        const feedbackResponse = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "finish",
            session_id,
            history: messages
                .filter((m) => m.isQuestion || m.sender === "user")
                .map((m) => ({
                  role: m.isQuestion ? "assistant" : "user",
                  content: m.text,
                })),
          }),
        });

        const feedbackData = await feedbackResponse.json();

        setFinalFeedback(feedbackData.feedback);
        setShowFeedbackReport(true);

        setAssessment({
          ...assessment,
          isActive: false,
          answeredQuestions: newAnsweredQuestions,
        });
      } else {
        const nextQuestionIndex = assessment.currentQuestionIndex + 1;
        const nextQuestion = assessment.questions[nextQuestionIndex];

        appendMessage({
          id: (Date.now() + 1).toString(),
          text: nextQuestion.question_text,
          sender: "ai",
          timestamp: new Date(),
          isQuestion: true,
          questionId: nextQuestion.id,
          context: nextQuestion.context || [],
        });

        setAssessment({
          ...assessment,
          currentQuestionIndex: nextQuestionIndex,
          answeredQuestions: newAnsweredQuestions,
        });
      }
    } catch (err) {
      console.error("Assessment error:", err);
      appendMessage({
        id: (Date.now() + 3).toString(),
        text: "⚠️ Something went wrong. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (assessment.isActive) handleSubmitAnswer();
    }
  };

  return (
      <div className="flex h-screen bg-gradient-to-br from-orange-400 via-blue-300 to-black">
        <main className="flex flex-1 flex-col">
          <header className="relative px-4 py-4 pt-16 md:px-8 md:py-8 lg:px-12 lg:py-10 xl:px-16 xl:py-12">
            {/* Dashboard button */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <button
                  onClick={() => router.push('/dashboard/trainer')}
                  title="Go to Dashboard"
                  aria-label="Go to dashboard"
                  className="flex h-10 items-center gap-2 px-3 rounded-lg bg-white/10 text-white/90 backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <LayoutGrid className="w-5 h-5" />
                <span className="hidden sm:inline font-semibold">Dashboard</span>
              </button>
            </div>

            {/* Question counter */}
            {assessment.isActive && (
                <div className="absolute top-4 right-4 text-white font-['IBM_Plex_Mono'] text-lg font-bold">
                  Question {assessment.answeredQuestions.length + 1} of {assessment.totalQuestions}
                </div>
            )}


          </header>

          <div className="flex flex-1 flex-col overflow-hidden px-4 pb-6 md:px-8 md:pb-8 lg:px-12 lg:pb-12 xl:px-20">
            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
              {messages.length === 0 ? (
                  <AssessmentStart onStart={startAssessment} isLoading={isLoading} />
              ) : (
                  <MessagesList messages={messages} isLoading={isLoading} />
              )}

              {assessment.isActive && (
                  <div className="border-t border-gray-200 bg-white/80 p-4 md:p-6">
                    <div className="mx-auto w-full max-w-3xl">
                      {/* STT/TTS Controls */}
                      <div className="flex items-center justify-end gap-2 mb-3">
                        {ttsSupported && (
                            <button
                                onClick={toggleTTS}
                                title={ttsEnabled ? "Disable auto-speak" : "Enable auto-speak"}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                                    ttsEnabled
                                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                }`}
                            >
                              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#7B93DB]/30 bg-white px-4 py-3 shadow-lg transition-all">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={isListening ? "Listening..." : "Type your answer or use voice..."}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading || isListening}
                            className="flex-1 bg-transparent font-['Roboto'] text-base text-[#3D2D4C] outline-none placeholder:text-[#3D2D4C]/60 disabled:opacity-50 md:text-lg lg:text-xl"
                        />
                        <div className="flex items-center gap-2">
                          {sttSupported && (
                              <button
                                  onClick={toggleListening}
                                  disabled={isLoading}
                                  title={isListening ? "Stop listening" : "Start voice input"}
                                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                                      isListening
                                          ? "bg-red-500 text-white animate-pulse hover:bg-red-600"
                                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  aria-label={isListening ? "Stop listening" : "Start voice input"}
                              >
                                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                              </button>
                          )}
                          <button
                              onClick={handleSubmitAnswer}
                              disabled={!message.trim() || isLoading}
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-gray-900 to-gray-700 shadow-lg transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label="Submit answer"
                          >
                            <span className="text-white text-xl">→</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>

        <FeedbackReport
            isOpen={showFeedbackReport}
            onClose={() => setShowFeedbackReport(false)}
            feedback={finalFeedback as any}
            questionsAnswered={assessment.answeredQuestions.length}
            totalQuestions={assessment.totalQuestions}
            questionsData={assessmentData.questions}
        />
      </div>
  );
}

function AssessmentStart({ onStart, isLoading }: { onStart: () => void; isLoading: boolean }) {
  return (
      <div className="flex flex-1 items-center justify-center p-6 md:p-8 lg:p-12 xl:p-16">
        <div className="flex w-full max-w-3xl flex-col items-center justify-center gap-6 md:gap-8 lg:gap-10">
          <h2 className="font-['IBM_Plex_Mono'] text-center text-3xl font-bold leading-tight text-[#3D2D4C]">
            Training Assessment
          </h2>
          <p className="text-center text-lg text-[#3D2D4C]/80 font-['Roboto']">
            I'll ask you questions based on the knowledge base. Take your time and answer thoughtfully.
            At the end, you'll receive comprehensive feedback on your performance.
          </p>
          <button
              onClick={onStart}
              disabled={isLoading}
              className="rounded-xl bg-linear-to-r from-gray-900 to-gray-700 px-8 py-4 font-['Roboto'] text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Starting..." : "Start Assessment"}
          </button>
        </div>
      </div>
  );
}

function MessagesList({ messages, isLoading }: { messages: Message[]; isLoading: boolean }) {
  return (
      <div className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[85%] gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          msg.sender === "user"
                              ? "bg-linear-to-r from-gray-900 to-gray-700"
                              : msg.isQuestion
                                  ? "bg-linear-to-r from-orange-500 to-red-500"
                                  : "bg-linear-to-r from-purple-500 to-pink-500"
                      } shadow-lg`}
                  >
                <span className="text-xs font-bold text-white">
                  {msg.sender === "user" ? "YOU" : msg.isQuestion ? "Q" : "AI"}
                </span>
                  </div>
                  <div
                      className={`rounded-2xl px-4 py-3 shadow-md ${
                          msg.sender === "user"
                              ? "bg-linear-to-r from-gray-500 to-gray-600 text-white"
                              : msg.isQuestion
                                  ? "bg-orange-50 text-gray-800 border-2 border-orange-200"
                                  : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    <p className="text-sm leading-relaxed md:text-base whitespace-pre-wrap">{msg.text}</p>
                    <p className={`mt-1 text-xs ${msg.sender === "user" ? "text-white/70" : "text-gray-500"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
          ))}

          {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-purple-500 to-pink-500 shadow-lg">
                    <span className="text-xs font-bold text-white">AI</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 shadow-md">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                    </div>
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>
  );
}
