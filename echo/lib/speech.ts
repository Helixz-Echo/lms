/**
 * Speech Utilities
 * Handles Text-to-Speech (TTS) and Speech-to-Text (STT) functionality
 */

import { trainingConfig } from "./config";

// =============================================================================
// BROWSER SUPPORT DETECTION
// =============================================================================

/**
 * Check if Text-to-Speech is supported
 */
export function isTTSSupported(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * Check if Speech-to-Text is supported
 */
export function isSTTSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Check if all speech features are supported
 */
export function isSpeechSupported(): boolean {
  return isTTSSupported() && isSTTSupported();
}

// =============================================================================
// TEXT-TO-SPEECH (TTS)
// =============================================================================

let currentUtterance: SpeechSynthesisUtterance | null = null;
let availableVoices: SpeechSynthesisVoice[] = [];

/**
 * Load available voices
 */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      availableVoices = voices;
      resolve(voices);
    } else {
      // Voices might load asynchronously
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        availableVoices = voices;
        resolve(voices);
      };
    }
  });
}

/**
 * Get the best voice based on preferences
 */
export function getPreferredVoice(): SpeechSynthesisVoice | null {
  if (availableVoices.length === 0) {
    availableVoices = window.speechSynthesis.getVoices();
  }

  const { voiceNamePreference, lang } = trainingConfig.speech.tts;

  // Try to find preferred voice
  let voice = availableVoices.find(v => 
    v.name.includes(voiceNamePreference) && v.lang.startsWith(lang.split('-')[0])
  );

  // Fallback to any voice matching language
  if (!voice) {
    voice = availableVoices.find(v => v.lang === lang);
  }

  // Fallback to any English voice
  if (!voice) {
    voice = availableVoices.find(v => v.lang.startsWith('en'));
  }

  // Fallback to first available voice
  return voice || availableVoices[0] || null;
}

/**
 * Speak text using Text-to-Speech
 */
export function speak(
  text: string,
  onEnd?: () => void,
  onError?: (error: SpeechSynthesisErrorEvent) => void
): void {
  if (!isTTSSupported()) {
    console.error('Text-to-Speech not supported');
    onError?.(new Event('error') as SpeechSynthesisErrorEvent);
    return;
  }

  // Stop any ongoing speech
  stopSpeaking();

  const { rate, pitch, volume, lang } = trainingConfig.speech.tts;

  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = rate;
  currentUtterance.pitch = pitch;
  currentUtterance.volume = volume;
  currentUtterance.lang = lang;

  // Set voice
  const voice = getPreferredVoice();
  if (voice) {
    currentUtterance.voice = voice;
  }

  // Event handlers
  currentUtterance.onend = () => {
    console.log('Speech finished');
    currentUtterance = null;
    onEnd?.();
  };

  currentUtterance.onerror = (event) => {
    // Silently handle non-critical errors
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      console.warn('Speech error:', event.error);
    }
    currentUtterance = null;
    onError?.(event);
  };

  // Speak
  window.speechSynthesis.speak(currentUtterance);
}

/**
 * Stop current speech
 */
export function stopSpeaking(): void {
  if (isTTSSupported()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

/**
 * Pause current speech
 */
export function pauseSpeaking(): void {
  if (isTTSSupported() && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }
}

/**
 * Resume paused speech
 */
export function resumeSpeaking(): void {
  if (isTTSSupported() && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
  return isTTSSupported() && window.speechSynthesis.speaking;
}

/**
 * Check if speech is paused
 */
export function isPaused(): boolean {
  return isTTSSupported() && window.speechSynthesis.paused;
}

// =============================================================================
// SPEECH-TO-TEXT (STT)
// =============================================================================

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

let recognition: any = null;

/**
 * Create Speech Recognition instance
 */
function createRecognition(): any {
  if (!isSTTSupported()) {
    throw new Error('Speech Recognition not supported');
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return new SpeechRecognition();
}

/**
 * Start listening for speech
 */
export function startListening(callbacks: SpeechRecognitionCallbacks): void {
  if (!isSTTSupported()) {
    console.error('Speech Recognition not supported');
    callbacks.onError?.('not-supported');
    return;
  }

  // Stop any existing recognition
  stopListening();

  recognition = createRecognition();

  const { continuous, interimResults, maxAlternatives, lang } = trainingConfig.speech.stt;

  recognition.continuous = continuous;
  recognition.interimResults = interimResults;
  recognition.maxAlternatives = maxAlternatives;
  recognition.lang = lang;

  recognition.onstart = () => {
    console.log('Speech recognition started');
    callbacks.onStart?.();
  };

  recognition.onresult = (event: any) => {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript;
    const confidence = result[0].confidence;
    const isFinal = result.isFinal;

    callbacks.onResult({
      transcript,
      confidence,
      isFinal,
    });
  };

  recognition.onerror = (event: any) => {
    // Silently handle non-critical errors
    const nonCriticalErrors = ['no-speech', 'aborted', 'audio-capture'];
    
    if (!nonCriticalErrors.includes(event.error)) {
      console.error('Speech recognition error:', event.error);
    } else {
      console.info('Speech recognition info:', event.error);
    }
    
    callbacks.onError?.(event.error);
  };

  recognition.onend = () => {
    console.log('Speech recognition ended');
    recognition = null;
    callbacks.onEnd?.();
  };

  recognition.start();
}

/**
 * Stop listening
 */
export function stopListening(): void {
  if (recognition) {
    try {
      recognition.stop();
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
    recognition = null;
  }
}

/**
 * Check if currently listening
 */
export function isListening(): boolean {
  return recognition !== null;
}

// =============================================================================
// COMBINED HELPERS
// =============================================================================

/**
 * Speak question and auto-start listening when done
 */
export function speakAndListen(
  questionText: string,
  speechCallbacks: SpeechRecognitionCallbacks
): void {
  if (!trainingConfig.speech.enableTextToSpeech) {
    // If TTS disabled, just start listening
    if (trainingConfig.speech.enableSpeechToText) {
      startListening(speechCallbacks);
    }
    return;
  }

  speak(
    questionText,
    () => {
      // When speech ends, auto-start listening if enabled
      if (trainingConfig.speech.autoStartListening && trainingConfig.speech.enableSpeechToText) {
        // Small delay to prevent confusion
        setTimeout(() => {
          startListening(speechCallbacks);
        }, 500);
      }
    },
    (error) => {
      console.error('TTS error:', error);
      // On error, still try to start listening
      if (trainingConfig.speech.enableSpeechToText) {
        startListening(speechCallbacks);
      }
    }
  );
}

/**
 * Clean up all speech resources
 */
export function cleanup(): void {
  stopSpeaking();
  stopListening();
}

// =============================================================================
// LEGACY COMPATIBILITY (for existing code)
// =============================================================================

export function isSpeechRecognitionSupported(): boolean {
  return isSTTSupported();
}

export function isTextToSpeechSupported(): boolean {
  return isTTSSupported();
}

// Legacy class-based interfaces (kept for backward compatibility)
export class SpeechRecognitionService {
  start(onResult: any, onError: any) {
    startListening({
      onResult: (result) => onResult(result),
      onError: (error) => onError(error),
    });
  }

  stop() {
    stopListening();
  }

  isActive(): boolean {
    return isListening();
  }
}

export class TextToSpeechService {
  speak(text: string, options: any) {
    speak(text, options.onEnd, options.onError);
  }

  stop() {
    stopSpeaking();
  }

  isActive(): boolean {
    return isSpeaking();
  }

  getVoices() {
    return availableVoices;
  }
}

let sttInstance: SpeechRecognitionService | null = null;
let ttsInstance: TextToSpeechService | null = null;

export function getSTTInstance(): SpeechRecognitionService {
  if (!sttInstance) {
    sttInstance = new SpeechRecognitionService();
  }
  return sttInstance;
}

export function getTTSInstance(): TextToSpeechService {
  if (!ttsInstance) {
    ttsInstance = new TextToSpeechService();
  }
  return ttsInstance;
}

