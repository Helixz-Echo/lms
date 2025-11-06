/**
 * Assessment-related type definitions
 */

export interface AssessmentQuestion {
  id: string;
  question_text: string;
  context?: string[];
  session_id?: string;
}

export interface AssessmentSession {
  isActive: boolean;
  totalQuestions: number;
  currentQuestionIndex: number;
  questions: AssessmentQuestion[];
  answeredQuestions: Array<{
    question: string;
    answer: string;
    questionId: string;
  }>;
}

export interface AssessmentData {
  questions: Array<{
    question: string;
    answer: string;
    context: string[];
  }>;
}

export interface FeedbackReportProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: string | ParsedFeedback;
  questionsAnswered: number;
  totalQuestions: number;
  questionsData?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface ParsedFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  questionAnalysis: Array<{ questionNumber: number; feedback: string }>;
}
