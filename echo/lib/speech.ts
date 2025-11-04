// Speech-to-Text (STT) and Text-to-Speech (TTS) utilities using Web APIs

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

// Speech-to-Text using Web Speech API
export class SpeechRecognitionService {
  private recognition: any;
  private isListening: boolean = false;

  constructor(config: SpeechRecognitionConfig = {}) {
    // Check browser support
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Speech Recognition is not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = config.language || 'en-US';
    this.recognition.continuous = config.continuous ?? false;
    this.recognition.interimResults = config.interimResults ?? true;
    this.recognition.maxAlternatives = config.maxAlternatives || 1;
  }

  start(
    onResult: (result: SpeechRecognitionResult) => void,
    onError?: (error: any) => void
  ) {
    if (this.isListening) {
      console.warn('Already listening');
      return;
    }

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      onResult({ transcript, confidence, isFinal });
    };

    this.recognition.onerror = (event: any) => {
      // Silently handle non-critical errors
      const nonCriticalErrors = ['no-speech', 'aborted', 'audio-capture'];
      
      if (!nonCriticalErrors.includes(event.error)) {
        console.error('Speech recognition error:', event.error);
      } else {
        // Just log as info for non-critical errors
        console.info('Speech recognition info:', event.error);
      }
      
      this.isListening = false;
      if (onError) {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.isListening = false;
      if (onError) {
        onError(error);
      }
    }
  }

  stop() {
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  isActive(): boolean {
    return this.isListening;
  }
}

// Text-to-Speech using SpeechSynthesis API
export class TextToSpeechService {
  private synthesis: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;

  constructor() {
    if (!('speechSynthesis' in window)) {
      throw new Error('Text-to-Speech is not supported in this browser');
    }
    this.synthesis = window.speechSynthesis;
  }

  speak(
    text: string,
    options: {
      lang?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
      voice?: SpeechSynthesisVoice;
      onEnd?: () => void;
      onError?: (error: any) => void;
    } = {}
  ) {
    // Stop any ongoing speech
    this.stop();

    try {
      this.utterance = new SpeechSynthesisUtterance(text);
      this.utterance.lang = options.lang || 'en-US';
      this.utterance.rate = options.rate ?? 1.0; // 0.1 to 10
      this.utterance.pitch = options.pitch ?? 1.0; // 0 to 2
      this.utterance.volume = options.volume ?? 1.0; // 0 to 1

      if (options.voice) {
        this.utterance.voice = options.voice;
      }

      this.utterance.onend = () => {
        this.isSpeaking = false;
        if (options.onEnd) {
          options.onEnd();
        }
      };

      this.utterance.onerror = (event) => {
        // Silently handle 'interrupted' and 'canceled' errors as they're expected
        if (event.error !== 'interrupted' && event.error !== 'canceled') {
          console.warn('Speech synthesis error:', event.error);
        }
        this.isSpeaking = false;
        if (options.onError) {
          options.onError(event);
        }
      };

      // Wait for voices to be loaded before speaking
      const voices = this.synthesis.getVoices();
      if (voices.length === 0) {
        // Voices not loaded yet, wait for them
        this.synthesis.addEventListener('voiceschanged', () => {
          this.synthesis.speak(this.utterance!);
          this.isSpeaking = true;
        }, { once: true });
      } else {
        this.synthesis.speak(this.utterance);
        this.isSpeaking = true;
      }
    } catch (error) {
      console.warn('Failed to initialize speech synthesis:', error);
      this.isSpeaking = false;
      if (options.onError) {
        options.onError(error);
      }
    }
  }

  stop() {
    try {
      if (this.synthesis.speaking || this.synthesis.pending) {
        this.synthesis.cancel();
      }
      this.isSpeaking = false;
    } catch (error) {
      console.warn('Error stopping speech synthesis:', error);
      this.isSpeaking = false;
    }
  }

  pause() {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  resume() {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  isActive(): boolean {
    return this.isSpeaking;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  // Helper to get voices by language
  getVoicesByLanguage(lang: string): SpeechSynthesisVoice[] {
    return this.getVoices().filter(voice => voice.lang.startsWith(lang));
  }
}

// Browser support detection
export function isSpeechRecognitionSupported(): boolean {
  return !!(
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition
  );
}

export function isTextToSpeechSupported(): boolean {
  return 'speechSynthesis' in window;
}

// Singleton instances for easy use
let sttInstance: SpeechRecognitionService | null = null;
let ttsInstance: TextToSpeechService | null = null;

export function getSTTInstance(config?: SpeechRecognitionConfig): SpeechRecognitionService {
  if (!sttInstance) {
    sttInstance = new SpeechRecognitionService(config);
  }
  return sttInstance;
}

export function getTTSInstance(): TextToSpeechService {
  if (!ttsInstance) {
    ttsInstance = new TextToSpeechService();
  }
  return ttsInstance;
}
