"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { connectLiveSession, disconnectLiveSession } from '@/lib/ai/geminiLiveService';
import { Message, ConversationState } from '@/lib/types';

const CallAgentClient: React.FC = () => {
  const [conversationState, setConversationState] = useState<ConversationState>(ConversationState.IDLE);
  const [currentInputTranscription, setCurrentInputTranscription] = useState<string>('');
  const [currentOutputTranscription, setCurrentOutputTranscription] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationSummary, setConversationSummary] = useState<string>(''); // New state for summary
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
      setConversationSummary(''); // Clear summary on error
    },
    onSummary: (summary: string) => { // New callback handler
      setConversationSummary(summary);
    },
  }).current; // Use .current to ensure stable reference for useCallback

  const handleStartConversation = useCallback(async () => {
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;
    setCurrentInputTranscription('');
    setCurrentOutputTranscription('');
    setMessages([]);
    setConversationSummary(''); // Clear previous summary
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
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      case ConversationState.CONNECTING:
      case ConversationState.SUMMARIZING: // Added for summarizing state
        return 'bg-gray-400 cursor-not-allowed';
      case ConversationState.LISTENING:
      case ConversationState.SPEAKING:
      case ConversationState.CLOSING:
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
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
    <div className="flex flex-col h-full w-full  bg-white overflow-hidden ">
      {/* Header */}
      <div className=" bg-[#231ad4] p-4 text-white text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="block">Helixz Call Center Agent</span>
        </h1>
      </div>

      {/* Main Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm text-gray-800 bg-gray-50">
        {messages.length === 0 && !isConversationActive && !currentInputTranscription && !currentOutputTranscription && !conversationSummary && (
          <div className="flex items-center justify-center h-full text-gray-500 italic">
            Start a conversation to begin...
          </div>
        )}

        {conversationSummary && conversationState === ConversationState.IDLE && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg shadow-md mb-4 break-words whitespace-pre-wrap">
            <h3 className="font-bold text-lg mb-2">Conversation Summary:</h3>
            <p>{conversationSummary}</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-lg shadow-md relative ${
                message.sender === 'user'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              <div className="font-semibold text-xs mb-1">
                {message.sender === 'user' ? 'You' : 'Agent'}
              </div>
              <p className="break-words whitespace-pre-wrap">{message.text}</p>
              <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                {message.timestamp}
              </div>
            </div>
          </div>
        ))}

        {currentInputTranscription && (
          <div className="flex justify-end">
            <div className="max-w-[75%] px-4 py-2 rounded-lg shadow-md bg-blue-50 text-blue-700 italic animate-pulse">
              <div className="font-semibold text-xs mb-1">You (transcribing)</div>
              <p className="break-words whitespace-pre-wrap">{currentInputTranscription}</p>
            </div>
          </div>
        )}

        {currentOutputTranscription && (
          <div className="flex justify-start">
            <div className="max-w-[75%] px-4 py-2 rounded-lg shadow-md bg-green-50 text-green-700 italic animate-pulse">
              <div className="font-semibold text-xs mb-1">Agent (transcribing)</div>
              <p className="break-words whitespace-pre-wrap">{currentOutputTranscription}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Control Panel */}
      <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 flex flex-col items-center">
        <div className="flex items-center space-x-2 mb-4 text-gray-600 font-medium">
          <div
            className={`w-3 h-3 rounded-full ${
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
          className={`w-full py-3 px-6 rounded-full text-white text-lg font-bold shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 ${getButtonClass(conversationState)}`}
        >
          {isConversationActive ? 'Stop Conversation' : 'Start Conversation'}
        </button>
        <p className="mt-2 text-xs text-gray-500">
          Supports Sinhala, English, Tamil, and a mix of these languages.
        </p>
      </div>
    </div>
  );
};

export default CallAgentClient;