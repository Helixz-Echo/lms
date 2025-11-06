/**
 * Speech recognition and synthesis custom hook
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  speak, 
  startListening, 
  stopListening,
  speakAndListen,
  stopSpeaking,
  isSpeaking as checkSpeaking,
  isSTTSupported,
  isTTSSupported,
  cleanup,
} from '@/lib/speech';
import type { SpeechRecognitionCallbacks } from '@/types';

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  useEffect(() => {
    // Check browser support
    setSttSupported(isSTTSupported());
    setTtsSupported(isTTSSupported());

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, []);

  const speakText = useCallback(async (text: string, onEnd?: () => void) => {
    if (!ttsEnabled || !ttsSupported) {
      onEnd?.();
      return;
    }

    setIsSpeaking(true);
    await speak(text, () => {
      setIsSpeaking(false);
      onEnd?.();
    });
  }, [ttsEnabled, ttsSupported]);

  const startSTT = useCallback((
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onEndCallback?: () => void
  ) => {
    if (!sttSupported) return;

    setIsListening(true);
    startListening({
      onResult: (result) => {
        onTranscript(result.transcript, result.isFinal);
      },
      onEnd: () => {
        setIsListening(false);
        onEndCallback?.();
      },
      onError: (error) => {
        setIsListening(false);
        console.error('STT Error:', error);
      },
    });
  }, [sttSupported]);

  const stopSTT = useCallback(() => {
    stopListening();
    setIsListening(false);
  }, []);

  const speakAndStartListening = useCallback(async (
    text: string,
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onEndCallback?: () => void
  ) => {
    if (!ttsEnabled || !ttsSupported || !sttSupported) {
      onEndCallback?.();
      return;
    }

    setIsSpeaking(true);
    await speakAndListen(text, {
      onResult: (result) => {
        if (result.isFinal) {
          setIsListening(true);
        }
        onTranscript(result.transcript, result.isFinal);
      },
      onEnd: () => {
        setIsListening(false);
        setIsSpeaking(false);
        onEndCallback?.();
      },
      onError: (error) => {
        setIsListening(false);
        setIsSpeaking(false);
        console.error('Speech Error:', error);
      },
    });
  }, [ttsEnabled, ttsSupported, sttSupported]);

  const stopAllSpeech = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  return {
    // State
    isListening,
    isSpeaking,
    sttSupported,
    ttsSupported,
    ttsEnabled,
    setTtsEnabled,
    
    // Methods
    speak: speakText,
    startListening: startSTT,
    stopListening: stopSTT,
    speakAndListen: speakAndStartListening,
    stopSpeaking: stopAllSpeech,
    checkSpeaking,
  };
}
