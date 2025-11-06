/**
 * Quick Reference Guide for Echo LMS Modular Structure
 * 
 * Use this as a cheat sheet when working with the new architecture
 */

// ============================================================================
// IMPORTING TYPES
// ============================================================================

import { 
  // Chat types
  Message,
  ChatProps,
  
  // Assessment types
  AssessmentQuestion,
  AssessmentSession,
  AssessmentData,
  FeedbackReportProps,
  ParsedFeedback,
  
  // Speech types
  SpeechRecognitionResult,
  SpeechRecognitionCallbacks,
  TrainingConfig,
  
  // Upload types
  Document,
  TrainingDocument,
  UploadResponse,
} from '@/types';

// ============================================================================
// IMPORTING CONFIGURATION
// ============================================================================

import { 
  // Route constants
  ROUTES,           // ROUTES.DASHBOARD.ADMIN, ROUTES.LOGIN, etc.
  API_ROUTES,       // API_ROUTES.ASSESSMENT, API_ROUTES.CHAT, etc.
  
  // App configuration
  APP_CONFIG,       // APP_CONFIG.UPLOAD.MAX_FILE_SIZE, etc.
  MESSAGE_TYPES,    // MESSAGE_TYPES.SUCCESS, MESSAGE_TYPES.ERROR, etc.
} from '@/config';

// ============================================================================
// IMPORTING UTILITIES
// ============================================================================

import {
  // Formatters
  formatFileSize,   // formatFileSize(bytes)
  formatDate,       // formatDate(date)
  truncateText,     // truncateText(text, maxLength)
  
  // Validators
  isValidFileType,  // isValidFileType(file, allowedTypes)
  isValidFileSize,  // isValidFileSize(file, maxSize)
  isValidEmail,     // isValidEmail(email)
  isNotEmpty,       // isNotEmpty(value)
  
  // API Helpers
  fetchAPI,         // fetchAPI<T>(url, options)
  postAPI,          // postAPI<T>(url, data)
  uploadFile,       // uploadFile(url, file, additionalData)
  APIError,         // new APIError(status, message)
} from '@/lib/utils';

// ============================================================================
// IMPORTING CUSTOM HOOKS
// ============================================================================

import {
  useSpeech,        // Speech recognition & synthesis
  useAssessment,    // Assessment workflow
  useChat,          // Chat management
} from '@/hooks';

// ============================================================================
// IMPORTING BUSINESS LOGIC
// ============================================================================

// AI & Chat
import { chat } from '@/lib/chat';
import { conversationalAgent } from '@/lib/agent';

// RAG & Embeddings
import { retrieveContext } from '@/lib/retriever';
import { generateEmbedding, generateEmbeddings } from '@/lib/embeddings';

// Speech
import { 
  speak, 
  startListening, 
  stopListening,
  isTTSSupported,
  isSTTSupported,
} from '@/lib/speech';

// Assessment
import {
  generateQuestionFromKnowledge,
  generateAndSaveAssessmentQuestions,
  generateFinalFeedback,
} from '@/lib/training-questions';

// Database
import { supabaseAdmin, supabase } from '@/lib/supabase';

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Using useSpeech hook
 */
function SpeechExample() {
  const {
    isListening,
    isSpeaking,
    ttsEnabled,
    setTtsEnabled,
    speak,
    startListening,
    stopListening,
    speakAndListen,
  } = useSpeech();

  const handleSpeak = () => {
    speak("Hello world", () => {
      console.log("Speech finished");
    });
  };

  const handleListen = () => {
    startListening(
      (transcript, isFinal) => {
        console.log("Transcript:", transcript);
      },
      () => {
        console.log("Listening stopped");
      }
    );
  };

  return null;
}

/**
 * Example: Using useAssessment hook
 */
function AssessmentExample({ sessionId }: { sessionId: string }) {
  const {
    assessment,
    assessmentData,
    finalFeedback,
    isLoading,
    startAssessment,
    submitAnswer,
    resetAssessment,
  } = useAssessment(sessionId);

  const handleStart = async () => {
    const firstQuestion = await startAssessment();
    console.log("First question:", firstQuestion);
  };

  const handleSubmit = async (answer: string, history: any[]) => {
    const result = await submitAnswer(answer, history);
    if (result.completed) {
      console.log("Assessment complete!", result.feedback);
    } else {
      console.log("Next question:", result.nextQuestion);
    }
  };

  return null;
}

/**
 * Example: Using useChat hook
 */
function ChatExample({ sessionId }: { sessionId?: string }) {
  const {
    messages,
    isLoading,
    inputMessage,
    setInputMessage,
    sendMessage,
    addMessage,
    clearMessages,
  } = useChat(sessionId);

  const handleSend = async () => {
    const aiResponse = await sendMessage(inputMessage);
    console.log("AI response:", aiResponse);
  };

  return null;
}

/**
 * Example: Using utilities
 */
function UtilityExample() {
  // Formatting
  const size = formatFileSize(1024000);
  const date = formatDate(new Date());
  const text = truncateText("Very long text...", 50);

  // Validation
  const file = new File([], "test.csv");
  const isValid = isValidFileType(file, ['.csv']);
  const isSizeOk = isValidFileSize(file, APP_CONFIG.UPLOAD.MAX_FILE_SIZE);

  // API calls
  const fetchData = async () => {
    try {
      const data = await postAPI(API_ROUTES.ASSESSMENT, {
        action: 'start',
        session_id: 'abc123',
      });
      console.log(data);
    } catch (error) {
      if (error instanceof APIError) {
        console.error(`API Error ${error.status}:`, error.message);
      }
    }
  };

  return null;
}

/**
 * Example: Using configuration constants
 */
function ConfigExample() {
  const navigate = (path: string) => {};

  // Navigation
  navigate(ROUTES.DASHBOARD.ADMIN);
  navigate(ROUTES.LOGIN);

  // API calls
  fetch(API_ROUTES.CHAT);
  fetch(API_ROUTES.TRAINING.UPLOAD);

  // App settings
  const maxSize = APP_CONFIG.UPLOAD.MAX_FILE_SIZE;
  const maxQuestions = APP_CONFIG.ASSESSMENT.MAX_QUESTIONS;

  return null;
}

/**
 * Example: Creating a new feature component
 */
// File: features/my-feature/components/MyComponent.tsx

import React from 'react';
import { useSpeech } from '@/hooks';
import { formatDate } from '@/lib/utils';
import { API_ROUTES } from '@/config';
import { Message } from '@/types';

export function MyComponent() {
  const { speak } = useSpeech();

  return (
    <div>
      {/* Your component */}
    </div>
  );
}

/**
 * Example: Creating a reusable UI component
 */
// File: components/ui/Button.tsx

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ 
  onClick, 
  children, 
  variant = 'primary',
  disabled = false,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
    >
      {children}
    </button>
  );
}

/**
 * Example: Creating a custom hook
 */
// File: hooks/useMyFeature.ts

import { useState, useCallback } from 'react';
import { postAPI } from '@/lib/utils';
import { API_ROUTES } from '@/config';

export function useMyFeature() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await postAPI(API_ROUTES.CHAT, {});
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, fetchData };
}

// ============================================================================
// IMPORTANT NOTES
// ============================================================================

/**
 * 1. ALWAYS use path aliases with @/ prefix
 *    ✅ import { Message } from '@/types';
 *    ❌ import { Message } from '../../types/chat';
 * 
 * 2. Import from index files when available
 *    ✅ import { useSpeech } from '@/hooks';
 *    ❌ import { useSpeech } from '@/hooks/useSpeech';
 * 
 * 3. Use configuration constants, not magic strings
 *    ✅ navigate(ROUTES.DASHBOARD.ADMIN);
 *    ❌ navigate('/dashboard/admin');
 * 
 * 4. Use utilities instead of inline code
 *    ✅ const size = formatFileSize(bytes);
 *    ❌ const size = bytes < 1024 ? `${bytes} B` : ...;
 * 
 * 5. Extract logic into hooks when it's reusable
 *    ✅ const { speak } = useSpeech();
 *    ❌ const [isSpeaking, setIsSpeaking] = useState(false); // + 100 lines
 * 
 * 6. Keep components focused and small
 *    ✅ Use hooks for logic, components for UI
 *    ❌ Mix everything in one large component
 * 
 * 7. Follow the dependency hierarchy
 *    types → config → utils → lib → hooks → components → features → app
 *    Never import from a higher level (causes circular dependencies)
 */

export {};
