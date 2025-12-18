export interface Message {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
}

export enum ConversationState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  LISTENING = 'LISTENING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR',
  CLOSING = 'CLOSING',
  SUMMARIZING = 'SUMMARIZING', // Added new state for summarization
}