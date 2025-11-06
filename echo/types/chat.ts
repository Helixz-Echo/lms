/**
 * Chat-related type definitions
 */

export interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isQuestion?: boolean;
  questionId?: string;
  context?: string[];
}

export interface ChatProps {
  session_id?: string;
}
