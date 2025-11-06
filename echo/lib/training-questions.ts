import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { retrieveContext } from "@/lib/retriever";
import { supabaseAdmin } from "./supabase";

const llm = new ChatOpenAI({
    model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
    apiKey: process.env.OPENROUTER_API_KEY,
    temperature: 0.7,
    maxTokens: 1024,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
    },
});

const QUESTION_GENERATOR_PROMPT = `You are a training assessment generator. Based on the provided knowledge base content, generate ONE insightful and DIVERSE training question.

Rules:
- Generate ONLY ONE question based on the context provided.
- The question should test understanding of key concepts from the knowledge base.
- Make it practical and relevant to real-world application.
- Output ONLY the question text, no preamble or formatting.
- Keep the question clear and concise (1-2 sentences max).
- **CRITICAL:** The generated question MUST be different from the questions in the "Previous Questions" list.

Context from knowledge base:
{context}

Previous Questions:
{previous_questions}

Generate ONE new, unique training question:`;

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

export async function generateQuestionFromKnowledge(session_id: string, previousQuestions: string[] = []): Promise<TrainingQuestion> {
    // Get a random chunk to use as a seed for the search query
    const { data: randomChunk, error: randomChunkError } = await supabaseAdmin.rpc('get_random_chunk', { p_session_id: session_id });

    if (randomChunkError || !randomChunk || randomChunk.length === 0) {
        console.error("Error getting random chunk:", randomChunkError);
        // Fallback to a generic query if a random chunk can't be retrieved
        const searchQuery = previousQuestions.length > 0 
            ? `training topic ${Math.random()}` 
            : "training concepts";
        const context = await retrieveContext(session_id, searchQuery, 3);
        const contextText = context.map((c: any) => c.text || c.content).join("\n\n");
        const chain = RunnableSequence.from([
            llm,
            new StringOutputParser(),
        ]);
        const previousQuestionsText = previousQuestions.length > 0 ? previousQuestions.join("\n") : "None";
        const prompt = QUESTION_GENERATOR_PROMPT
            .replace("{context}", contextText)
            .replace("{previous_questions}", previousQuestionsText);
        const question = await chain.invoke(prompt);
        return {
            id: Date.now().toString(),
            question: question.trim(),
            context: context.map((c: any) => c.text || c.content)
        };
    }

    const searchQuery = randomChunk[0].content;
    
    const context = await retrieveContext(session_id, searchQuery, 3);
    
    const contextText = context.map((c: any) => c.text || c.content).join("\n\n");
    
    const chain = RunnableSequence.from([
        llm,
        new StringOutputParser(),
    ]);

    const previousQuestionsText = previousQuestions.length > 0 ? previousQuestions.join("\n") : "None";
    const prompt = QUESTION_GENERATOR_PROMPT
        .replace("{context}", contextText)
        .replace("{previous_questions}", previousQuestionsText);
    const question = await chain.invoke(prompt);

    return {
        id: Date.now().toString(),
        question: question.trim(),
        context: context.map((c: any) => c.text || c.content)
    };
}

export async function generateAndSaveAssessmentQuestions(session_id: string, numberOfQuestions: number = 10): Promise<any[]> {
    // First, check if questions already exist for this session
    const { data: existingQuestions, error: existingError } = await supabaseAdmin
        .from('training_assessment_questions')
        .select('*')
        .eq('session_id', session_id);

    if (existingError) {
        console.error("Error checking for existing questions:", existingError);
        throw existingError;
    }

    if (existingQuestions && existingQuestions.length > 0) {
        console.log("Retrieved existing questions:", existingQuestions);
        return existingQuestions;
    }

    // If no questions exist, generate and save them
    const generatedQuestions: TrainingQuestion[] = [];
    for (let i = 0; i < numberOfQuestions; i++) {
        const newQuestion = await generateQuestionFromKnowledge(session_id, generatedQuestions.map(q => q.question));
        generatedQuestions.push(newQuestion);
    }

    const questionsToInsert = generatedQuestions.map(q => ({ session_id: session_id, question_text: q.question }));

    const { data, error } = await supabaseAdmin.from('training_assessment_questions').insert(questionsToInsert).select();

    if (error || !data) {
        console.error("Error saving questions to DB:", error);
        throw error || new Error('Failed to save questions');
    }

    console.log("Generated and saved new questions:", data);
    return data;
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
    
    const evaluationPrompt = `You are evaluating a student's answer to a training question.\n\nQuestion: ${question}\n\nStudent's Answer: ${userAnswer}\n\nReference Context:\n${contextText}\n\nProvide:\n1. Brief evaluation of the answer (2-3 sentences)\n2. Whether the answer demonstrates understanding (yes/no)\n\nBe constructive and encouraging. Format: First the evaluation, then on a new line: "Understanding: yes" or "Understanding: no"`;

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