import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentExecutor, createReactAgent } from "@langchain/classic/agents";
import { SYSTEM_PROMPT } from "./prompt";
import { DynamicTool } from "@langchain/core/tools";
import { retrieveContext } from "./retriever";

export async function runAgentChat(history: any[], question: string) {
    const llm = new ChatGoogleGenerativeAI({
        model: process.env.GEMINI_MODEL || "gemini-pro",
        apiKey: process.env.GEMINI_API_KEY,
        stop: ["\nObservation:"],
    });

    const retrieveContextTool = new DynamicTool({
        name: "retrieve_context",
        description: "Retrieves context from the uploaded CSV files.",
        func: async (input: any) => {
            const { query, k } = JSON.parse(input);
            const results = await retrieveContext(query, k);
            return JSON.stringify(results);
        },
    });

    const tools = [retrieveContextTool];

    const agent = await createReactAgent({
        llm,
        tools,
        prompt: SYSTEM_PROMPT,
    });

    const agentExecutor = new AgentExecutor({
        agent,
        tools,
    });

    const result = await agentExecutor.invoke({
        input: question,
        chat_history: history,
    });

    return { answer: result.output };
}