/**
 * Application Configuration
 */

export const trainingConfig = {
  speech: {
    // Text-to-Speech settings
    tts: {
      rate: 1.0,           // Speed: 0.1 to 10
      pitch: 1.0,          // Pitch: 0 to 2
      volume: 1.0,         // Volume: 0 to 1
      lang: 'en-US',       // Language
      voiceNamePreference: 'Google', // Preferred voice name substring
    },
    
    // Speech-to-Text settings
    stt: {
      continuous: false,   // Keep listening after pause
      interimResults: true, // Show results while speaking
      maxAlternatives: 1,  // Number of alternative transcripts
      lang: 'en-US',       // Language
    },
    
    // Feature toggles
    enableTextToSpeech: true,
    enableSpeechToText: true,
    autoStartListening: true, // Auto-start mic after question
  },
};
