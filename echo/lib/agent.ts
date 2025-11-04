import { ChatOpenAI } from "@langchain/openai";
import { SYSTEM_PROMPT } from "./prompt";
import { retrieveContext } from "./retriever";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

export async function runAgentChat(history: any[], question: string) {
    const llm = new ChatOpenAI({
        model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
        apiKey: process.env.OPENROUTER_API_KEY,
        temperature: 0.1,
        maxTokens: 1024,
        configuration: {
            baseURL: "https://openrouter.ai/api/v1",
        },
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
