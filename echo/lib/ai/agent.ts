import { ChatOpenAI } from "@langchain/openai";
import { SYSTEM_PROMPT } from "@/lib/prompts/chat-prompt";
import { retrieveContext } from "./retriever";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { supabaseAdmin } from "@/lib/database/supabase";

export async function runAgentChat(session_id: string, history: any[], question: string) {
    const llm = new ChatOpenAI({
        model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
        apiKey: process.env.OPENROUTER_API_KEY,
        temperature: 0.1,
        maxTokens: 1024,
        configuration: {
            baseURL: "https://openrouter.ai/api/v1",
        },
    });

    try {
        const context = await retrieveContext(session_id, question);

        const chain = RunnableSequence.from([
            SYSTEM_PROMPT,
            llm,
            new StringOutputParser(),
        ]);

        const result = await chain.invoke({
            input: question,
            chat_history: history,
            context: JSON.stringify(context),
        });

        // Save user question
        await supabaseAdmin.from("chat_messages").insert({
            session_id: session_id,
            role: "user",
            content: question,
        });

        // Save assistant answer
        await supabaseAdmin.from("chat_messages").insert({
            session_id: session_id,
            role: "assistant",
            content: result,
        });

        return { answer: result };
    } catch (error) {
        console.error("Error in runAgentChat:", error);
        throw error;
    }
}
