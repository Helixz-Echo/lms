/**
 * Chat management custom hook
 */

"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message } from '@/types';
import { postAPI } from '@/lib/utils';
import { API_ROUTES } from '@/config';

export function useChat(sessionId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInputMessage('');
    setIsLoading(true);

    try {
      const data = await postAPI(API_ROUTES.CHAT, {
        message: text.trim(),
        session_id: sessionId,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'ai',
        timestamp: new Date(),
      };

      addMessage(aiMessage);
      return aiMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, something went wrong. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      addMessage(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    // State
    messages,
    isLoading,
    inputMessage,
    messagesEndRef,

    // Setters
    setInputMessage,
    setMessages,

    // Methods
    sendMessage,
    addMessage,
    clearMessages,
    scrollToBottom,
  };
}
