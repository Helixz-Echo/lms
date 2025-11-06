// File: `modules/component/Chat.tsx`
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import type { ChatMessage } from "@/lib/chat";
import { postChat } from "@/lib/chat";
import { 
  speak,
  stopSpeaking,
  startListening,
  stopListening,
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
}

export default function Chat({ session_id }: { session_id?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Check browser support
    setSttSupported(isSTTSupported());
    setTtsSupported(isTTSSupported());
    
    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const appendMessage = (m: Message) => {
    setMessages((prev) => [...prev, m]);
    
    // Auto-speak AI messages if TTS is enabled
    if (m.sender === "ai" && ttsEnabled && ttsSupported) {
      speak(
        m.text,
        () => setIsSpeaking(false),
        () => setIsSpeaking(false)
      );
      setIsSpeaking(true);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
    } else {
      handleStartListening();
    }
  };

  const handleStartListening = () => {
    if (!sttSupported) {
      alert("Speech recognition is not supported in your browser. Please try Chrome or Edge.");
      return;
    }

    const callbacks: SpeechRecognitionCallbacks = {
      onResult: (result) => {
        if (result.isFinal) {
          // Only add the new part that wasn't in finalTranscript
          setFinalTranscript((prev) => {
            const newPart = result.transcript;
            if (prev.includes(newPart)) {
              return prev; // Already added
            }
            const combined = prev ? prev + " " + newPart : newPart;
            setMessage(combined.trim());
            return combined;
          });
        } else {
          // Show interim results temporarily
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
      onError: (error) => {
        setIsListening(false);
        if (error === "not-allowed") {
          alert("Microphone access was denied. Please enable it in your browser settings.");
        }
      },
    };

    startListening(callbacks);
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

  const buildHistory = (msgs: Message[]) =>
    msgs.map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
      ts: m.timestamp.toISOString(),
    })) as ChatMessage[];

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    if (!session_id) {
      console.error("Session ID is not provided to Chat component.");
      appendMessage({
        id: (Date.now() + 2).toString(),
        text: "⚠️ Chat session not initialized. Please try again later.",
        sender: "ai",
        timestamp: new Date(),
      });
      return;
    }

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
      const history = buildHistory([...messages, userMessage]);
      const data = await postChat(session_id, history, userMessage.text);

      const aiText: string = data.answer ?? data.reply ?? data.text ?? "Sorry, I couldn't generate a reply.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: "ai",
        timestamp: new Date(),
      };

      appendMessage(aiMessage);
    } catch (err) {
      console.error("Chat error:", err);
      appendMessage({
        id: (Date.now() + 2).toString(),
        text: "⚠️ Something went wrong while contacting the AI. Please try again.",
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
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-linear-to-br from-[#7B93DB] via-[#8DA8E3] to-[#9DB3E8]">
      {/* Sidebar and header omitted for brevity - keep original structure if needed */}
      <main className="flex flex-1 flex-col">
        <header className="flex justify-end gap-3 px-4 py-4 pt-16 md:px-8 md:py-8 md:pt-8 lg:px-12 lg:py-10 xl:px-16 xl:py-12">
          <button aria-label="Toggle color mode" className="..."> {/* keep icons as before */} </button>
          <button onClick={handleSignOut} title="Sign Out" aria-label="Sign out" className="..."> {/* icon */} </button>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden px-4 pb-6 md:px-8 md:pb-8 lg:px-12 lg:pb-12 xl:px-20">
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
            {/* Messages */}
            {messages.length === 0 ? (
              <EmptyState onQuickAction={(a) => { setMessage(a); inputRef.current?.focus(); }} />
            ) : (
              <MessagesList messages={messages} isLoading={isLoading} />
            )}

            {/* Input */}
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
                    placeholder={isListening ? "Listening..." : "Message Soft GPT"}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading || isListening}
                    className="flex-1 bg-transparent font-['Roboto'] text-base text-[#3D2D4C] outline-none placeholder:text-[#3D2D4C]/60 disabled:opacity-50 md:text-lg lg:text-xl"
                  />
                  <div className="flex items-center gap-2 md:gap-3">
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
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isLoading}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-[#7B93DB] to-[#9DB3E8] shadow-lg transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Send message"
                    >
                      <span className="text-white text-xl">→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>
    </div>
  );
}

/* Small presentational subcomponents kept inside file for clarity */
function EmptyState({ onQuickAction }: { onQuickAction: (action: string) => void }) {
  const quickActions = ["Article", "Weather", "Sport", "Press", "Food", "Plants", "Suggest something"];
  return (
    <div className="flex flex-1 items-center justify-center p-6 md:p-8 lg:p-12 xl:p-16">
      <div className="flex w-full max-w-3xl flex-col items-center justify-center gap-6 md:gap-8 lg:gap-10">
        <h2 className="font-['IBM_Plex_Mono'] text-center text-2xl font-bold leading-tight text-[#3D2D4C]">What can I help with?</h2>
        <div className="flex w-full flex-wrap items-center justify-center gap-2 md:gap-3">
          {quickActions.map((action, i) => (
            <button key={i} onClick={() => onQuickAction(action)} className="group rounded-full border-2 px-3 py-2">
              <span className="font-['Roboto'] text-xs text-[#7B93DB] md:text-sm">{action}</span>
            </button>
          ))}
        </div>
        <p className="hidden text-center text-sm text-[#3D2D4C]/60 md:block">Soft GPT can make mistakes. Check important info.</p>
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
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.sender === "user" ? "bg-linear-to-r from-[#7B93DB] to-[#9DB3E8]" : "bg-linear-to-r from-purple-500 to-pink-500"} shadow-lg`}>
                <span className="text-xs font-bold text-white">{msg.sender === "user" ? "KI" : "AI"}</span>
              </div>
              <div className={`rounded-2xl px-4 py-3 shadow-md ${msg.sender === "user" ? "bg-linear-to-r from-[#7B93DB] to-[#9DB3E8] text-white" : "bg-gray-100 text-gray-800"}`}>
                <p className="text-sm leading-relaxed md:text-base">{msg.text}</p>
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
                <span className="text-sm text-gray-500">Typing...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}