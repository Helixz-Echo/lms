import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConversationState, Message } from '../types';

interface LiveSessionCallbacks {
  onStateChange: (state: ConversationState) => void;
  // Fix: Remove isFinal from transcription callbacks as it's not provided by the API type.
  onInputTranscription: (text: string) => void;
  // Fix: Remove isFinal from transcription callbacks as it's not provided by the API type.
  onOutputTranscription: (text: string) => void;
  onCompleteTurn: (userText: string, modelText: string) => void;
  onError: (error: Error) => void;
  onSummary: (summary: string) => void; // Added new callback for summary
}

interface Blob {
  data: string;
  mimeType: string;
}

// Global variables to manage audio contexts and session state
let ai: GoogleGenAI | null = null;
let sessionPromise: Promise<Awaited<ReturnType<GoogleGenAI['live']['connect']>>> | null = null;
let inputAudioContext: AudioContext | null = null;
let outputAudioContext: AudioContext | null = null;
let inputNode: GainNode | null = null;
let outputNode: GainNode | null = null;
let scriptProcessor: ScriptProcessorNode | null = null;
let mediaStream: MediaStream | null = null;
let nextStartTime = 0;
const playingAudioSources = new Set<AudioBufferSourceNode>();
let currentInputTranscription = '';
let currentOutputTranscription = '';

// Helper function to decode base64 to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper function to decode raw PCM audio data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Helper function to create a Blob from Float32Array (microphone data)
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: btoa(String.fromCharCode(...new Uint8Array(int16.buffer))), // Base64 encode Uint8Array
    mimeType: 'audio/pcm;rate=16000',
  };
}

// New function to generate a conversation summary
async function generateConversationSummary(messages: Message[]): Promise<string> {
    if (!ai) {
        throw new Error("Gemini AI instance not initialized for summarization.");
    }

    if (messages.length === 0) {
        return "No conversation to summarize.";
    }

    // Construct the conversation text from history
    const conversationText = messages.map(msg => `${msg.sender === 'user' ? 'User' : 'Agent'}: ${msg.text}`).join('\n');

    const prompt = `Please provide a concise summary of the following customer support conversation. Focus on the main issue discussed and any resolution or next steps. If the conversation is in multiple languages, summarize the core points regardless of language:\n\n${conversationText}\n\nSummary:`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // 'gemini-2.5-flash' is suitable for summarization tasks
            contents: prompt,
            config: {
                maxOutputTokens: 500, // Limit summary length
                thinkingConfig: { thinkingBudget: 100 }, // Reserve tokens for thinking
            },
        });
        return response.text?.trim() || "Failed to generate summary: empty response.";
    } catch (error) {
        console.error("Error generating conversation summary:", error);
        return "Failed to generate summary due to an API error.";
    }
}


export async function connectLiveSession(callbacks: LiveSessionCallbacks): Promise<void> {
  callbacks.onStateChange(ConversationState.CONNECTING);
  currentInputTranscription = '';
  currentOutputTranscription = '';

  try {
    ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

    inputAudioContext = new AudioContext({ sampleRate: 16000 });
    outputAudioContext = new AudioContext({ sampleRate: 24000 });
    inputNode = inputAudioContext.createGain();
    outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.debug('Gemini Live session opened.');
          callbacks.onStateChange(ConversationState.LISTENING); // Initially listening

          const source = inputAudioContext!.createMediaStreamSource(mediaStream!);
          scriptProcessor = inputAudioContext!.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise!.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContext!.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          // Fix: Remove 'isFinal' from transcription handling, as it's not present on the API type.
          // State transitions will now be managed by audio playback events and turnComplete.
          if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
            currentOutputTranscription += text;
            callbacks.onOutputTranscription(currentOutputTranscription); // Pass only text
            // State is set to SPEAKING when audio data is received.
          }
          // Fix: Remove 'isFinal' from transcription handling, as it's not present on the API type.
          // State transitions will now be managed by audio playback events and turnComplete.
          if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            currentInputTranscription += text;
            callbacks.onInputTranscription(currentInputTranscription); // Pass only text
            // No explicit state change for input transcription, remains LISTENING or SPEAKING based on model's turn.
          }

          const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;

          // Handle interruption first, as it can stop current speaking
          if (message.serverContent?.interrupted) {
              for (const source of playingAudioSources.values()) {
                  source.stop();
                  playingAudioSources.delete(source);
              }
              nextStartTime = 0;
              // If interrupted, the model stops speaking and goes back to listening
              callbacks.onStateChange(ConversationState.LISTENING);
          }

          if (base64EncodedAudioString) {
            // Model is actively speaking or preparing to speak
            callbacks.onStateChange(ConversationState.SPEAKING);

            nextStartTime = Math.max(nextStartTime, outputAudioContext!.currentTime);
            try {
              const audioBuffer = await decodeAudioData(
                decode(base64EncodedAudioString),
                outputAudioContext!,
                24000,
                1,
              );
              const source = outputAudioContext!.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode!);
              source.addEventListener('ended', () => {
                playingAudioSources.delete(source);
                // If all audio chunks have finished playing and no interruption
                // and no new audio is immediately incoming for this message,
                // assume the model is done speaking for now and transition to LISTENING.
                if (playingAudioSources.size === 0) {
                    callbacks.onStateChange(ConversationState.LISTENING);
                }
              });
              source.start(nextStartTime);
              nextStartTime = nextStartTime + audioBuffer.duration;
              playingAudioSources.add(source);
            } catch (audioError) {
              console.error("Error decoding or playing audio:", audioError);
              callbacks.onError(audioError as Error);
              callbacks.onStateChange(ConversationState.ERROR);
            }
          }

          // Handle turnComplete after processing all other parts of the message.
          // This ensures transcriptions are finalized and stored.
          if (message.serverContent?.turnComplete) {
            callbacks.onCompleteTurn(currentInputTranscription, currentOutputTranscription);
            currentInputTranscription = '';
            currentOutputTranscription = '';
            // If turn is complete and no audio is currently playing, ensure state is LISTENING.
            // This covers cases where the model might not send audio (e.g., just tool calls or silent responses).
            if (playingAudioSources.size === 0) {
                callbacks.onStateChange(ConversationState.LISTENING);
            }
          }
        },
        onerror: (e: ErrorEvent) => {
          console.error('Gemini Live error:', e);
          callbacks.onError(e.error || new Error('Unknown Live API error'));
          callbacks.onStateChange(ConversationState.ERROR);
        },
        onclose: (e: CloseEvent) => {
          console.debug('Gemini Live session closed:', e);
          cleanupAudioResources();
          // State change to IDLE will be handled after summarization in disconnectLiveSession
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: `You are a helpful and friendly call center agent.
        You support customers in Sinhala, English, and Tamil.
        Listen to the user's language and respond in that language or a mix as needed.
        Keep responses concise and directly address the user's query.`,
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
    });

    await sessionPromise;
  } catch (error) {
    console.error('Failed to connect to Gemini Live session:', error);
    callbacks.onError(error as Error);
    callbacks.onStateChange(ConversationState.ERROR);
    cleanupAudioResources();
  }
}

// Fix: Modified disconnectLiveSession to accept callbacks and messages as arguments to correctly update App.tsx's state and generate summary.
export async function disconnectLiveSession(callbacks: LiveSessionCallbacks, messages: Message[]): Promise<void> {
    if (sessionPromise) {
        callbacks.onStateChange(ConversationState.CLOSING);
        try {
            const session = await sessionPromise;
            session.close(); // This will trigger onclose callback
            sessionPromise = null; // Clear sessionPromise immediately after close call

            // After closing the session, generate summary
            callbacks.onStateChange(ConversationState.SUMMARIZING);
            const summary = await generateConversationSummary(messages);
            callbacks.onSummary(summary);

        } catch (error) {
            console.error('Error closing session or generating summary:', error);
            callbacks.onError(error as Error);
        } finally {
            cleanupAudioResources();
            // Moved this to finally block and after summary generation for correct flow
            callbacks.onStateChange(ConversationState.IDLE);
        }
    } else {
        cleanupAudioResources(); // Ensure resources are cleaned up even if sessionPromise is null
        callbacks.onStateChange(ConversationState.IDLE);
        // If there are messages but no active session, still try to summarize them
        if (messages.length > 0) {
            callbacks.onStateChange(ConversationState.SUMMARIZING);
            const summary = await generateConversationSummary(messages);
            callbacks.onSummary(summary);
            callbacks.onStateChange(ConversationState.IDLE);
        }
    }
}

function cleanupAudioResources(): void {
  if (scriptProcessor) {
    scriptProcessor.disconnect();
    scriptProcessor.onaudioprocess = null;
    scriptProcessor = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  if (inputAudioContext) {
    inputAudioContext.close().catch(e => console.error("Error closing input audio context:", e));
    inputAudioContext = null;
  }
  if (outputAudioContext) {
    // Stop all playing sources before closing the context
    for (const source of playingAudioSources.values()) {
        source.stop();
    }
    playingAudioSources.clear();
    outputAudioContext.close().catch(e => console.error("Error closing output audio context:", e));
    outputAudioContext = null;
  }
  inputNode = null;
  outputNode = null;
  nextStartTime = 0;
  currentInputTranscription = '';
  currentOutputTranscription = '';
}