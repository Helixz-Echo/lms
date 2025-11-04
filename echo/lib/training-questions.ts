import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { retrieveContext } from "@/lib/retriever";

const llm = new ChatOpenAI({
    model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
    apiKey: process.env.OPENROUTER_API_KEY,
    temperature: 0.7,
    maxTokens: 1024,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
    },
});

const QUESTION_GENERATOR_PROMPT = `You are a training assessment generator. Based on the provided knowledge base content, generate ONE insightful training question and ask it 
give it like human asked question.

Rules:
- Generate ONLY ONE question based on the context provided
- The question should test understanding of key concepts from the knowledge base
- Make it practical and relevant to real-world application
- Output ONLY the question text, no preamble or formatting
- Keep the question clear and concise (1-2 sentences max)

Context from knowledge base:
{context}

Generate ONE training question:`;

const FEEDBACK_GENERATOR_PROMPT = `You are a professional training feedback provider. Review the user's performance across all questions and answers.

Conversation history:
{history}

Provide comprehensive feedback in the following format:

**SUMMARY:**
[Provide a detailed 3-4 sentence summary of the overall performance. Include what topics were covered, overall understanding level, and general impression.]

**STRENGTHS:**
- [Specific strength with example from their answers]
- [Another strength with concrete evidence]
- [Third strength if demonstrated]
- [Add more if applicable]

**IMPROVEMENTS:**
- [Specific area for improvement with explanation of why]
- [Another improvement area with actionable advice]
- [Third area if needed]
- [Additional areas if identified]

**RECOMMENDATIONS:**
- [Specific recommendation with exact topics or resources to study]
- [Another detailed recommendation for skill development]
- [Third recommendation with practical next steps]
- [More recommendations if helpful]

**DETAILED QUESTION ANALYSIS:**
For each question and answer:
Q[number]: [Brief evaluation of this specific answer - what was good, what could be better, key insights]

Be thorough, encouraging but honest. Provide specific examples from their answers. Make recommendations actionable and detailed.`;

export interface TrainingQuestion {
    id: string;
    question: string;
    context: string[];
}

export async function generateQuestionFromKnowledge(previousQuestions: string[] = []): Promise<TrainingQuestion> {
    // Get random context from knowledge base
    const searchQuery = previousQuestions.length > 0 
        ? `training topic ${Math.random()}` 
        : "training concepts";
    
    const context = await retrieveContext(searchQuery, 3);
    
    const contextText = context.map((c: any) => c.text || c.content).join("\n\n");
    
    const chain = RunnableSequence.from([
        llm,
        new StringOutputParser(),
    ]);

    const prompt = QUESTION_GENERATOR_PROMPT.replace("{context}", contextText);
    const question = await chain.invoke(prompt);

    return {
        id: Date.now().toString(),
        question: question.trim(),
        context: context.map((c: any) => c.text || c.content)
    };
}

export async function generateFinalFeedback(conversationHistory: any[]): Promise<string> {
    const historyText = conversationHistory
        .map(msg => `${msg.role === 'user' ? 'Student' : 'Question'}: ${msg.content}`)
        .join('\n\n');

    const chain = RunnableSequence.from([
        llm,
        new StringOutputParser(),
    ]);

    const prompt = FEEDBACK_GENERATOR_PROMPT.replace("{history}", historyText);
    const feedback = await chain.invoke(prompt);

    return feedback.trim();
}

export async function evaluateAnswer(question: string, userAnswer: string, context: string[]): Promise<{
    evaluation: string;
    isGoodAnswer: boolean;
}> {
    const contextText = context.join("\n\n");
    
    const evaluationPrompt = `You are evaluating a student's answer to a training question.

Question: ${question}

Student's Answer: ${userAnswer}

Reference Context:
${contextText}

Provide:
1. Brief evaluation of the answer (2-3 sentences)
2. Whether the answer demonstrates understanding (yes/no)

Be constructive and encouraging. Format: First the evaluation, then on a new line: "Understanding: yes" or "Understanding: no"`;

    const chain = RunnableSequence.from([
        llm,
        new StringOutputParser(),
    ]);

    const result = await chain.invoke(evaluationPrompt);
    
    const isGoodAnswer = result.toLowerCase().includes("understanding: yes");
    
    return {
        evaluation: result.split('\n').slice(0, -1).join('\n').trim(),
        isGoodAnswer
    };
}
