// lib/callMetrics.ts

export interface Word {
    text: string;
    start: number;      // ms
    end: number;        // ms
    confidence: number; // 0..1
    speaker: string | null;
}

export interface SentimentResult {
    text: string;
    sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    confidence: number;
    start: number;
    end: number;
    speaker: string | null;
}

export interface TranscriptionResultForMetrics {
    text: string | null;
    words: Word[];
    sentiment_analysis_results: SentimentResult[] | null;
}

export interface CallMetrics {
    agent: {
        wpm: number;
        pronunciationScore: number;
        speakingSeconds: number;
        talkRatio: number;
        fillerCount: number;
        transcript: string;
    };
    customer: {
        wpm: number;
        speakingSeconds: number;
        talkRatio: number;
        fillerCount: number;
        transcript: string;
    };
    overall: {
        totalSilenceSeconds: number;
        totalWords: number;
        fullTranscript: string | null;
    };
}

// ------------- helpers -------------

const FILLERS = ["um", "uh", "ah", "erm", "like", "you know"];

function normalizeToken(word: string): string {
    return word.toLowerCase().replace(/[^a-z]/g, "");
}

function isFiller(word: string): boolean {
    return FILLERS.includes(normalizeToken(word));
}

function splitWordsBySpeaker(words: Word[]) {
    const bySpeaker: Record<string, Word[]> = {};
    for (const w of words) {
        const sp = w.speaker || "unknown";
        if (!bySpeaker[sp]) bySpeaker[sp] = [];
        bySpeaker[sp].push(w);
    }
    return bySpeaker;
}

// Speaking window = from first to last word (includes pauses)
function speakingWindowMs(words: Word[]): number {
    if (words.length === 0) return 0;
    const sorted = [...words].sort((a, b) => a.start - b.start);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    return last.end - first.start;
}

// WPM = total words / minutes (using speaking window)
function calculateWpm(words: Word[]): number {
    if (words.length === 0) return 0;
    const totalWords = words.length;
    const timeMs = speakingWindowMs(words);
    const minutes = timeMs / 1000 / 60;
    if (minutes <= 0) return 0;
    return totalWords / minutes;
}

// Pronunciation score = average confidence
function pronunciationScore(words: Word[]): number {
    if (words.length === 0) return 0;
    const sum = words.reduce((acc, w) => acc + (w.confidence ?? 0), 0);
    return sum / words.length;
}

// Count fillers in text
function countFillers(text: string): number {
    const tokens = text.split(/\s+/).filter(Boolean);
    return tokens.filter(isFiller).length;
}

// Total silence between all words
function totalSilenceMs(allWords: Word[]): number {
    if (allWords.length < 2) return 0;
    const sorted = [...allWords].sort((a, b) => a.start - b.start);
    let silence = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i + 1].start - sorted[i].end;
        if (gap > 0) silence += gap;
    }
    return silence;
}

// ------------- main function -------------

export function analyzeCallFromAssembly(
    result: TranscriptionResultForMetrics
): CallMetrics {
    const allWords = result.words || [];
    const bySpeaker = splitWordsBySpeaker(allWords);

    // convention: "A" = agent, "B" = customer
    const agentWords = bySpeaker["A"] || [];
    const customerWords = bySpeaker["B"] || [];

    const agentSpeakingMs = speakingWindowMs(agentWords);
    const customerSpeakingMs = speakingWindowMs(customerWords);
    const totalSpeakingMs = agentSpeakingMs + customerSpeakingMs || 1;

    const agentWpm = calculateWpm(agentWords);
    const customerWpm = calculateWpm(customerWords);

    const agentPron = pronunciationScore(agentWords);

    const agentTranscript = agentWords.map((w) => w.text).join(" ");
    const customerTranscript = customerWords.map((w) => w.text).join(" ");

    const agentFiller = countFillers(agentTranscript);
    const customerFiller = countFillers(customerTranscript);

    const silenceMs = totalSilenceMs(allWords);

    const agentTalkRatio = agentSpeakingMs / totalSpeakingMs;
    const customerTalkRatio = customerSpeakingMs / totalSpeakingMs;

    return {
        agent: {
            wpm: agentWpm,
            pronunciationScore: agentPron,
            speakingSeconds: agentSpeakingMs / 1000,
            talkRatio: agentTalkRatio,
            fillerCount: agentFiller,
            transcript: agentTranscript,
        },
        customer: {
            wpm: customerWpm,
            speakingSeconds: customerSpeakingMs / 1000,
            talkRatio: customerTalkRatio,
            fillerCount: customerFiller,
            transcript: customerTranscript,
        },
        overall: {
            totalSilenceSeconds: silenceMs / 1000,
            totalWords: allWords.length,
            fullTranscript: result.text,
        },
    };
}
