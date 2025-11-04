import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { Question, GraderResult } from "@/lib/types";
import { retrieveContext } from "@/lib/retriever"; // your existing retriever over Supabase

const graderModel = new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.1,
    maxOutputTokens: 512,
});

const GRADER_SYSTEM =
    `You are a strict but fair grader for a sales/call-assistant training quiz.\n` +
    `Given: question, answer_key, rubric, user_answer, optional retrieved_snippets.\n` +
    `Decide verdict: correct | partial | incorrect.\n` +
    `Give one short reason and an actionable next_hint if not correct.\n` +
    `OUTPUT ONLY valid JSON: {"verdict":"...","reasons":"...","next_hint":"..."}`;

export async function gradeAnswer({ question, userText }: { question: Question; userText: string }): Promise<GraderResult> {
    // Pull KB snippets to ground hints (non-fatal if retriever fails)
    let snippets: { id: string; text: string }[] = [];
    try {
        const ctx = await retrieveContext(question.text, 4);
        snippets = ctx?.map((c: any) => ({ id: c.id || c.chunk_id || "doc", text: c.text || c.content })) || [];
    } catch {}

    const chain = RunnableSequence.from<any, string>([
        async () => ({ role: "system", content: GRADER_SYSTEM }),
        graderModel,
        new StringOutputParser(),
    ]);

    const payload = {
        question: question.text,
        answer_key: question.answer_key,
        rubric: question.rubric || "",
        user_answer: userText,
        retrieved_snippets: snippets,
    };

    let parsed: GraderResult = { verdict: "incorrect", reasons: "", next_hint: "" };
    try {
        const raw = await chain.invoke({ input: JSON.stringify(payload) });
        parsed = JSON.parse(raw) as GraderResult;
    } catch {
        parsed = { verdict: "incorrect", reasons: "Could not parse model output.", next_hint: "Focus on the key term(s)." };
    }

    parsed.citations = snippets;
    return parsed;
}