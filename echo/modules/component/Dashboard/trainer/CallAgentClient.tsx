"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { connectLiveSession, disconnectLiveSession } from '@/lib/ai/geminiLiveService';
import { Message, ConversationState } from '@/lib/types';

const CallAgentClient: React.FC = () => {
  const [conversationState, setConversationState] = useState<ConversationState>(ConversationState.IDLE);
  const [currentInputTranscription, setCurrentInputTranscription] = useState<string>('');
  const [currentOutputTranscription, setCurrentOutputTranscription] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationSummary, setConversationSummary] = useState<string>('');
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isConnectingRef = useRef<boolean>(false); // To prevent multiple connect calls

  // Scroll to the latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentInputTranscription, currentOutputTranscription, scrollToBottom]);

  // Callback functions for the Gemini Live Service
  const liveSessionCallbacks = useRef({
    onStateChange: (state: ConversationState) => {
      setConversationState(state);
      if (state === ConversationState.IDLE || state === ConversationState.ERROR) {
        isConnectingRef.current = false; // Reset flag
      }
      if (state === ConversationState.IDLE && conversationSummary) {
        // If back to IDLE and there's a summary, ensure it's displayed.
        // Or if IDLE but no summary (e.g., error during summarization), clear previous summary.
        if (state === ConversationState.IDLE && !conversationSummary) {
            setConversationSummary(''); // Clear summary if not available
        }
      }
    },
    // Fix: Update transcription callback signatures to match the modified interface in services/geminiLiveService.ts.
    onInputTranscription: (text: string) => { // Removed isFinal
      setCurrentInputTranscription(text);
    },
    // Fix: Update transcription callback signatures to match the modified interface in services/geminiLiveService.ts.
    onOutputTranscription: (text: string) => { // Removed isFinal
      setCurrentOutputTranscription(text);
    },
    onCompleteTurn: (userText: string, modelText: string) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: crypto.randomUUID(), sender: 'user', text: userText.trim(), timestamp: new Date().toLocaleTimeString() },
        { id: crypto.randomUUID(), sender: 'model', text: modelText.trim(), timestamp: new Date().toLocaleTimeString() },
      ]);
      setCurrentInputTranscription('');
      setCurrentOutputTranscription('');
    },
    onError: (error: Error) => {
      console.error('App-level error:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: crypto.randomUUID(), sender: 'model', text: `Error: ${error.message}`, timestamp: new Date().toLocaleTimeString() },
      ]);
      alert(`Conversation Error: ${error.message}. Please try again.`);
      isConnectingRef.current = false;
      setConversationSummary('');
      setIsSummaryModalOpen(false);
    },
    onSummary: (summary: string) => {
      setConversationSummary(summary);
      setIsSummaryModalOpen(true);
    },
  }).current; // Use .current to ensure stable reference for useCallback

  const handleStartConversation = useCallback(async () => {
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;
    setCurrentInputTranscription('');
    setCurrentOutputTranscription('');
    setMessages([]);
    setConversationSummary(''); // Clear previous summary
    setIsSummaryModalOpen(false);
    try {
      await connectLiveSession(liveSessionCallbacks);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      isConnectingRef.current = false;
      liveSessionCallbacks.onError(error as Error);
    }
  }, [liveSessionCallbacks]); // Ensure liveSessionCallbacks is stable

  const handleStopConversation = useCallback(async () => {
    isConnectingRef.current = false; // Allow new connection attempts
    // Fix: Pass the current callbacks AND messages to disconnectLiveSession
    await disconnectLiveSession(liveSessionCallbacks, messages);
    setCurrentInputTranscription('');
    setCurrentOutputTranscription('');
  }, [liveSessionCallbacks, messages]); // liveSessionCallbacks and messages are dependencies for this useCallback

  const getButtonClass = (state: ConversationState) => {
    switch (state) {
      case ConversationState.IDLE:
      case ConversationState.ERROR:
        return 'bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 focus:ring-gray-500';
      case ConversationState.CONNECTING:
      case ConversationState.SUMMARIZING: // Added for summarizing state
        return 'bg-gray-400 cursor-not-allowed';
      case ConversationState.LISTENING:
      case ConversationState.SPEAKING:
      case ConversationState.CLOSING:
        return 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 focus:ring-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (state: ConversationState) => {
    switch (state) {
      case ConversationState.IDLE:
        return 'Ready to start';
      case ConversationState.CONNECTING:
        return 'Connecting...';
      case ConversationState.LISTENING:
        return 'Listening...';
      case ConversationState.SPEAKING:
        return 'Agent speaking...';
      case ConversationState.ERROR:
        return 'Error occurred';
      case ConversationState.CLOSING:
        return 'Ending conversation...';
      case ConversationState.SUMMARIZING: // Added for summarizing state
        return 'Summarizing conversation...';
      default:
        return '';
    }
  };

  const isConversationActive = [
    ConversationState.CONNECTING,
    ConversationState.LISTENING,
    ConversationState.SPEAKING,
    ConversationState.CLOSING,
    ConversationState.SUMMARIZING, // Consider summarizing as active for UI purposes
  ].includes(conversationState);

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-hidden">

      {/* Main Conversation Area */}
      <div className="flex flex-1 min-h-0 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full flex-1 min-h-0 flex-col space-y-4 text-sm text-[#3D2D4C]">
          {messages.length === 0 && !isConversationActive && !currentInputTranscription && !currentOutputTranscription && !conversationSummary && (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#7B93DB]/40 bg-white/80 p-8 text-center shadow-inner">
              <p className="text-base font-semibold text-gray-500">Start a conversation to begin</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-gray-900 to-gray-700'
                      : 'bg-gradient-to-r from-orange-500 to-red-500'
                  } shadow-lg`}
                >
                  <span className="text-xs font-bold text-white">{message.sender === 'user' ? 'YOU' : 'AGENT'}</span>
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 shadow-md ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                      : 'border border-gray-200 bg-white text-[#3D2D4C]'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed md:text-base">{message.text}</p>
                  <p className={`mt-1 text-xs ${message.sender === 'user' ? 'text-white/70' : 'text-gray-500'}`}>{message.timestamp}</p>
                </div>
              </div>
            </div>
          ))}

          {currentInputTranscription && (
            <div className="flex justify-end">
              <div className="flex max-w-[85%] gap-3 flex-row-reverse">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-gray-900 to-gray-700 shadow-lg">
                  <span className="text-xs font-bold text-white">YOU</span>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 shadow-md">
                  <div className="mb-1 text-xs font-semibold text-gray-500">You (transcribing)</div>
                  <p className="whitespace-pre-wrap">{currentInputTranscription}</p>
                </div>
              </div>
            </div>
          )}

          {currentOutputTranscription && (
            <div className="flex justify-start">
              <div className="flex max-w-[85%] gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
                  <span className="text-xs font-bold text-white">AGENT</span>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-800 shadow-md">
                  <div className="mb-1 text-xs font-semibold">Agent (transcribing)</div>
                  <p className="whitespace-pre-wrap">{currentOutputTranscription}</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Control Panel */}
      <div className="mt-4 border-t border-gray-200 bg-white/80 p-4 md:p-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <div
              className={`h-3 w-3 rounded-full ${
                conversationState === ConversationState.LISTENING
                  ? 'bg-green-500 animate-pulse'
                  : conversationState === ConversationState.SPEAKING
                  ? 'bg-purple-500 animate-bounce'
                  : conversationState === ConversationState.CONNECTING || conversationState === ConversationState.SUMMARIZING
                  ? 'bg-yellow-500 animate-spin'
                  : 'bg-gray-400'
              }`}
            ></div>
            <span>Status: {getStatusText(conversationState)}</span>
          </div>

          <button
            onClick={isConversationActive ? handleStopConversation : handleStartConversation}
            disabled={conversationState === ConversationState.CONNECTING || conversationState === ConversationState.CLOSING || conversationState === ConversationState.SUMMARIZING}
            className={`w-full max-w-xs rounded-2xl py-3 px-6 text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 ${getButtonClass(conversationState)}`}
          >
            {isConversationActive ? 'Stop Conversation' : 'Start Conversation'}
          </button>
          {conversationSummary && (
            <button
              type="button"
              onClick={() => setIsSummaryModalOpen(true)}
              className="text-sm font-medium text-[#3D2D4C] underline-offset-4 hover:underline"
            >
              View last summary
            </button>
          )}
          <p className="text-center text-xs text-gray-500">
            Supports Sinhala, English, Tamil, and mixed utterances.
          </p>
        </div>
      </div>

      {conversationSummary && isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7B93DB]">Session Recap</p>
                <h3 className="text-xl font-semibold text-[#3D2D4C]">Conversation Summary</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
                aria-label="Close summary"
              >
                <span className="text-lg">&times;</span>
              </button>
            </div>
            <div className="mt-4 max-h-[50vh] overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-[#3D2D4C]/90">
              <p className="whitespace-pre-wrap leading-relaxed">{conversationSummary}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                className="rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:from-gray-800 hover:to-gray-600"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallAgentClient;