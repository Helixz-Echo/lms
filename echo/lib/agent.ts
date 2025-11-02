import { retrieveContext } from "./retriever";

export async function runAgentChat(history: any[], question: string) {
    const results = await retrieveContext(question, 4); // Retrieve top 4 relevant chunks
    return { answer: JSON.stringify(results, null, 2) };
}