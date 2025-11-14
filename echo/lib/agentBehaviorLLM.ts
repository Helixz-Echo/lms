// lib/agentBehaviorLLM.ts
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
    model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
    apiKey: process.env.OPENROUTER_API_KEY,
    temperature: 0.1,
    maxTokens: 1024,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
    },
});

export interface BehaviorMetrics {
    overallSentimentScore: number;        // -1..+1
    empathyLevel: number;                 // 0..1
    professionalismCourtesy: number;      // 0..1
    conflictDeEscalation: number;         // 0..1
    activeListening: number;              // 0..1
    toneConsistency: number;              // 0..1
    customerSentimentImpact: number;      // -1..+1
    problemSolvingLanguage: number;       // 0..1
    speechPaceClarity: number;            // 0..1
    personalizationVsScript: number;      // 0..1;
    summary: string;                      // overall summary
    perSkillDescriptions: {
        overallSentimentScore: string;
        empathyLevel: string;
        professionalismCourtesy: string;
        conflictDeEscalation: string;
        activeListening: string;
        toneConsistency: string;
        customerSentimentImpact: string;
        problemSolvingLanguage: string;
        speechPaceClarity: string;
        personalizationVsScript: string;
    };
}

// helper
function safeJsonParse<T>(raw: string): T {
    try {
        // Attempt to find the JSON block within the raw string
        const jsonStart = raw.indexOf('{');
        const jsonEnd = raw.lastIndexOf('}');

        if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
            throw new Error("No valid JSON object found in the LLM response.");
        }

        const jsonString = raw.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonString) as T;
    } catch (e) {
        console.error("Failed to parse LLM JSON:", raw);
        // The original error is more descriptive if parsing the substring fails
        if (e instanceof Error && e.message.startsWith("No valid JSON")) {
            throw e;
        }
        throw new Error("LLM returned invalid JSON for behavior metrics");
    }
}

export async function analyzeAgentBehaviorWithLLM(
    agentTranscript: string,
    customerTranscript: string
): Promise<BehaviorMetrics> {
    const system = `
You are a QA evaluator for a customer support call center.
You receive the agent and customer text for one call.
You MUST output JSON ONLY, no extra text, no markdown.
  `.trim();

    const user = `
[AGENT TRANSCRIPT]
${agentTranscript || "(no agent speech provided)"}

[CUSTOMER TRANSCRIPT]
${customerTranscript || "(no customer speech provided)"}

Rate the AGENT on these dimensions:

1. Overall Sentiment Score
   - Agent's overall emotional tone across the call.
   - Output: number in [-1, +1] (negative to positive).

2. Empathy Level
   - Understanding, acknowledgment of feelings, compassionate language.
   - Output: 0..1.

3. Professionalism & Courtesy
   - Polite language, greetings, gratitude, respectful tone.
   - Output: 0..1.

4. Conflict De-escalation Effectiveness
   - Ability to calm tense situations with tone and word choice.
   - Output: 0..1.

5. Active Listening Indicators
   - Acknowledgement, paraphrasing, and relevant responses.
   - Output: 0..1.

6. Tone Consistency
   - Emotional stability and control during the call.
   - Output: 0..1.

7. Customer Sentiment Impact
   - Change in CUSTOMER mood from start to end.
   - Output: -1 (much worse) to +1 (much better).

8. Problem-Solving Language
   - Solution-oriented language vs. dismissive or avoiding responsibility.
   - Output: 0..1.

9. Speech Pace & Clarity
   - Perceived speed, clearness, and pauses from the text context.
   - Output: 0..1.

10. Personalization vs Script Adherence
   - Balancing following protocol and adapting to this specific customer.
   - Output: 0..1.

Then:
- Write a short 2–4 sentence overall summary in simple English.
- For EACH metric, write ONE simple sentence explaining what that score means (no numbers in text).

Return ONLY this JSON:

{
  "overallSentimentScore": number,
  "empathyLevel": number,
  "professionalismCourtesy": number,
  "conflictDeEscalation": number,
  "activeListening": number,
  "toneConsistency": number,
  "customerSentimentImpact": number,
  "problemSolvingLanguage": number,
  "speechPaceClarity": number,
  "personalizationVsScript": number,
  "summary": "string",
  "perSkillDescriptions": {
    "overallSentimentScore": "string",
    "empathyLevel": "string",
    "professionalismCourtesy": "string",
    "conflictDeEscalation": "string",
    "activeListening": "string",
    "toneConsistency": "string",
    "customerSentimentImpact": "string",
    "problemSolvingLanguage": "string",
    "speechPaceClarity": "string",
    "personalizationVsScript": "string"
  }
}
  `.trim();

    const resp = await llm.invoke([
        { role: "system", content: system },
        { role: "user", content: user },
    ]);

    const rawContent =
        typeof resp.content === "string"
            ? resp.content
            : resp.content.map((c: any) => c.text ?? "").join("");

    const parsed = safeJsonParse<BehaviorMetrics>(rawContent);
    return parsed;
}
