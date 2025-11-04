"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import FeedbackReport from "./FeedbackReport";
import { 
  getSTTInstance, 
  getTTSInstance, 
  isSpeechRecognitionSupported, 
  isTextToSpeechSupported 
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
  currentQuestionId: string | null;
  currentQuestion: string | null;
  currentContext: string[];
  answeredQuestions: Array<{
    question: string;
    answer: string;
    evaluation?: string;
  }>;
  totalQuestions: number;
}

export default function AssessmentChat() {
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
  const [assessmentData, setAssessmentData] = useState<{
    questions: Array<{
      question: string;
      answer: string;
      context: string[];
    }>;
  }>({ questions: [] });
  const [assessment, setAssessment] = useState<AssessmentSession>({
    isActive: false,
    currentQuestionId: null,
    currentQuestion: null,
    currentContext: [],
    answeredQuestions: [],
    totalQuestions: 5, // Default number of questions
  });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Check browser support
    setSttSupported(isSpeechRecognitionSupported());
    setTtsSupported(isTextToSpeechSupported());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const appendMessage = (m: Message) => {
    setMessages((prev) => [...prev, m]);
    
    // Auto-speak AI messages if TTS is enabled, then start mic for questions
    if (m.sender === "ai" && ttsEnabled && ttsSupported) {
      speakText(m.text, () => {
        // After TTS completes, start mic if it's a question
        if (m.isQuestion && sttSupported && !isListening) {
          setTimeout(() => startListening(), 500);
        }
      });
    } else if (m.isQuestion && sttSupported && !isListening) {
      // If TTS is disabled, start mic immediately after question
      setTimeout(() => startListening(), 1000);
    }
  };

  const speakText = (text: string, onComplete?: () => void) => {
    if (!ttsSupported || !ttsEnabled) {
      onComplete?.();
      return;
    }
    
    try {
      const tts = getTTSInstance();
      tts.speak(text, {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        onEnd: () => {
          setIsSpeaking(false);
          onComplete?.();
        },
        onError: (error) => {
          // Silently handle TTS errors
          console.warn('TTS error (non-critical):', error);
          setIsSpeaking(false);
          onComplete?.();
        },
      });
      setIsSpeaking(true);
    } catch (error) {
      console.warn("TTS not available:", error);
      setIsSpeaking(false);
      onComplete?.();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (!sttSupported) {
      alert("Speech recognition is not supported in your browser. Please try Chrome or Edge.");
      return;
    }

    try {
      const stt = getSTTInstance({
        continuous: false,
        interimResults: true,
        language: "en-US",
      });

      stt.start(
        (result) => {
          if (result.isFinal) {
            setMessage((prev) => {
              const newMessage = prev.trim() ? prev + " " + result.transcript : result.transcript;
              return newMessage.trim();
            });
            setIsListening(false);
          } else {
            // Show interim results in the input
            setMessage((prev) => {
              if (!prev.trim()) return result.transcript;
              const words = prev.split(" ");
              words[words.length - 1] = result.transcript;
              return words.join(" ");
            });
          }
        },
        (error) => {
          setIsListening(false);
          
          // Only show alerts for critical errors
          if (error === "not-allowed") {
            alert("Microphone access was denied. Please enable it in your browser settings.");
          } else if (error === "network") {
            alert("Network error occurred. Please check your connection.");
          } else if (error === "no-speech") {
            // No speech detected - silently restart if in assessment mode
            if (assessment.isActive && sttSupported) {
              console.info("No speech detected, mic ready for input...");
              // Optionally auto-restart after a delay
              setTimeout(() => {
                if (assessment.isActive && !isListening) {
                  startListening();
                }
              }, 500);
            }
          } else {
            console.warn("STT non-critical error:", error);
          }
        }
      );
      setIsListening(true);
    } catch (error) {
      console.error("Failed to start listening:", error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    try {
      const stt = getSTTInstance();
      stt.stop();
      setIsListening(false);
    } catch (error) {
      console.error("Error stopping STT:", error);
    }
  };

  const toggleTTS = () => {
    if (isSpeaking) {
      try {
        const tts = getTTSInstance();
        tts.stop();
        setIsSpeaking(false);
      } catch (error) {
        console.warn("Error stopping TTS:", error);
      }
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
        body: JSON.stringify({ action: "start" }),
      });

      const data = await response.json();

      // Welcome message
      appendMessage({
        id: Date.now().toString(),
        text: data.message,
        sender: "ai",
        timestamp: new Date(),
      });

      // First question
      setTimeout(() => {
        appendMessage({
          id: (Date.now() + 1).toString(),
          text: data.question,
          sender: "ai",
          timestamp: new Date(),
          isQuestion: true,
          questionId: data.questionId,
          context: data.context || [],
        });

        setAssessment({
          isActive: true,
          currentQuestionId: data.questionId,
          currentQuestion: data.question,
          currentContext: data.context || [],
          answeredQuestions: [],
          totalQuestions: 5,
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
      // Store the answer with context
      const newAnsweredQuestions = [
        ...assessment.answeredQuestions,
        {
          question: assessment.currentQuestion!,
          answer: userMessage.text,
        },
      ];

      // Store complete assessment data including context
      const newAssessmentData = {
        questions: [
          ...assessmentData.questions,
          {
            question: assessment.currentQuestion!,
            answer: userMessage.text,
            context: assessment.currentContext,
          },
        ],
      };
      setAssessmentData(newAssessmentData);

      // Check if we've reached the total questions limit
      if (newAnsweredQuestions.length >= assessment.totalQuestions) {
        // Generate final feedback
        const feedbackResponse = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "finish",
            history: messages
              .filter((m) => m.isQuestion || m.sender === "user")
              .map((m) => ({
                role: m.isQuestion ? "assistant" : "user",
                content: m.text,
              })),
          }),
        });

        const feedbackData = await feedbackResponse.json();

        // Store feedback and show modal instead of chat message
        setFinalFeedback(feedbackData.feedback);
        setShowFeedbackReport(true);

        // End assessment
        setAssessment({
          ...assessment,
          isActive: false,
          currentQuestionId: null,
          currentQuestion: null,
          answeredQuestions: newAnsweredQuestions,
        });
      } else {
        // Get next question
        const previousQuestions = newAnsweredQuestions.map((q) => q.question);
        const nextResponse = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "next",
            previousQuestions,
          }),
        });

        const nextData = await nextResponse.json();

        // Brief acknowledgment
        appendMessage({
          id: (Date.now() + 1).toString(),
          text: "Thank you for your answer. Here's your next question:",
          sender: "ai",
          timestamp: new Date(),
        });

        // Next question
        setTimeout(() => {
          appendMessage({
            id: (Date.now() + 2).toString(),
            text: nextData.question,
            sender: "ai",
            timestamp: new Date(),
            isQuestion: true,
            questionId: nextData.questionId,
            context: nextData.context || [],
          });

          setAssessment({
            ...assessment,
            currentQuestionId: nextData.questionId,
            currentQuestion: nextData.question,
            currentContext: nextData.context || [],
            answeredQuestions: newAnsweredQuestions,
          });
        }, 800);
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
      if (assessment.isActive) {
        handleSubmitAnswer();
      }
    }
  };

  return (
    <div className="flex h-screen bg-linear-to-br from-[#7B93DB] via-[#8DA8E3] to-[#9DB3E8]">
      <main className="flex flex-1 flex-col">
        <header className="flex justify-between items-center gap-3 px-4 py-4 pt-16 md:px-8 md:py-8 md:pt-8 lg:px-12 lg:py-10 xl:px-16 xl:py-12">
          <div className="text-white font-['IBM_Plex_Mono'] text-lg font-bold">
            {assessment.isActive && (
              <span>
                Question {assessment.answeredQuestions.length + 1} of {assessment.totalQuestions}
              </span>
            )}
          </div>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            aria-label="Sign out"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm transition-all hover:bg-white/30"
          >
            <span className="text-white">🚪</span>
          </button>
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
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-[#7B93DB] to-[#9DB3E8] shadow-lg transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* Feedback Report Modal */}
      <FeedbackReport
        isOpen={showFeedbackReport}
        onClose={() => {
          setShowFeedbackReport(false);
          // Optionally reset assessment or navigate away
        }}
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
          className="rounded-xl bg-linear-to-r from-[#7B93DB] to-[#9DB3E8] px-8 py-4 font-['Roboto'] text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
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
                    ? "bg-linear-to-r from-[#7B93DB] to-[#9DB3E8]"
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
                    ? "bg-linear-to-r from-[#7B93DB] to-[#9DB3E8] text-white"
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
