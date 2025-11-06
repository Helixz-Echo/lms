/**
 * Speech recognition and synthesis type definitions
 * Note: These are re-exported from lib/speech.ts
 */

export type SpeechRecognitionResult = {
  transcript: string;
  confidence: number;
  isFinal: boolean;
};

export type SpeechRecognitionCallbacks = {
  onResult: (result: SpeechRecognitionResult) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onStart?: () => void;
};

export interface TrainingConfig {
  tts: {
    rate: number;
    pitch: number;
    volume: number;
  };
  stt: {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
  };
  autoStartListening: boolean;
}
