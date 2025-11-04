import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SYSTEM_PROMPT } from "./prompt";
import { retrieveContext } from "./retriever";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

export async function runAgentChat(history: any[], question: string) {
    const llm = new ChatGoogleGenerativeAI({
        model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0.1,
        maxOutputTokens: 1024,
    });

    const context = await retrieveContext(question);

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

    return { answer: result };
}
