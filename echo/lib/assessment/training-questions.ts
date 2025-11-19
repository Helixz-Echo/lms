import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { retrieveContext } from "@/lib/ai/retriever";
import { supabaseAdmin } from "@/lib/database/supabase";

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

const ANSWER_FEEDBACK_PROMPT = `
You are an encouraging AI training assistant evaluating a student's short answer.

Question:
"{question}"

User's Answer:
"{userAnswer}"

Reference Knowledge (for correct answer):
"{contextText}"

Provide a short, conversational response (3–5 sentences max):
- Naturally assess how accurate or complete the answer is.
- If correct → praise and briefly add one helpful detail or insight.
- If partially correct → acknowledge what’s right, gently clarify the missing piece.
- If incorrect → gently correct and give a brief accurate explanation.
- Always conclude with a friendly transition like:
  "Let's move on to the next question!" or a similar motivating sentence.
- Keep tone warm, natural, and easy to read.
- No bullet points, no markdown, just plain text.
`;

export interface TrainingQuestion {
    id: string;
    question: string;
    context: string[];
}

export interface FeedbackResponse {
    feedback: string;
}

export async function generateQuestionFromKnowledge(
    session_id: string,
    previousQuestions: string[] = [],
    language: string = "English"
): Promise<TrainingQuestion> {
    const { data: randomChunk, error: randomChunkError } = await supabaseAdmin.rpc('get_random_chunk', { p_session_id: session_id });

    let searchQuery = "training concepts";
    if (!randomChunkError && randomChunk && randomChunk.length > 0) {
        searchQuery = randomChunk[0].content;
    }

    const context = await retrieveContext(session_id, searchQuery, 3);
    const contextText = context.map((c: any) => c.text || c.content).join("\n\n");

    const previousQuestionsText = previousQuestions.length > 0 ? previousQuestions.join("\n") : "None";
    const prompt = QUESTION_GENERATOR_PROMPT
        .replace("{context}", contextText)
        .replace("{previous_questions}", previousQuestionsText) +
        `\n\nRespond in ${language}.`;

    const chain = RunnableSequence.from([llm, new StringOutputParser()]);
    const question = await chain.invoke(prompt);

    return {
        id: Date.now().toString(),
        question: question.trim(),
        context: context.map((c: any) => c.text || c.content)
    };
}


export async function generateAndSaveAssessmentQuestions(
    session_id: string,
    numberOfQuestions: number = 10,
    language: string = "English"
): Promise<any[]> {

     const { data: existingQuestions, error: existingError } = await supabaseAdmin
        .from('training_assessment_questions')
        .select('*')
        .eq('session_id', session_id)
        .eq('language', language);

    if (existingError) throw existingError;

    if (existingQuestions && existingQuestions.length > 0) {
        return existingQuestions;
    }

    const generatedQuestions: TrainingQuestion[] = [];

    for (let i = 0; i < numberOfQuestions; i++) {
        const newQuestion = await generateQuestionFromKnowledge(
            session_id,
            generatedQuestions.map(q => q.question),
            language
        );
        generatedQuestions.push(newQuestion);
    }

    const questionsToInsert = generatedQuestions.map(q => ({
        session_id: session_id,
        question_text: q.question,
        language: language
    }));

    const { data, error } = await supabaseAdmin
        .from('training_assessment_questions')
        .insert(questionsToInsert)
        .select();

    if (error || !data) throw error || new Error("Failed to save multilingual questions");

    return data;
}

export async function generateFinalFeedback(
    conversationHistory: any[],
    language: string = "English"
): Promise<string> {
    const historyText = conversationHistory
        .map(msg => `${msg.role === 'user' ? 'Student' : 'Question'}: ${msg.content}`)
        .join('\n\n');

    const prompt = FEEDBACK_GENERATOR_PROMPT.replace("{history}", historyText) +
        `\n\nRespond in ${language}.`;

    const chain = RunnableSequence.from([llm, new StringOutputParser()]);
    const feedback = await chain.invoke(prompt);

    return feedback.trim();
}


export async function generateAnswerFeedback(
    question: string,
    userAnswer: string,
    session_id: string,
    language: string = "English"
): Promise<FeedbackResponse> {
    try {
        const context = await retrieveContext(session_id, question, 3);
        const contextText = context.map((c: any) => c.text || c.content).join("\n\n");

        const prompt = ANSWER_FEEDBACK_PROMPT
            .replace("{question}", question)
            .replace("{userAnswer}", userAnswer)
            .replace("{contextText}", contextText) +
            `\n\nRespond in ${language}.`;

        const chain = RunnableSequence.from([llm, new StringOutputParser()]);
        const feedback = await chain.invoke(prompt);
        return { feedback: feedback.trim() };
    } catch (error) {
        console.error("Error generating feedback:", error);
        return { feedback: "Thanks for your answer! Let's move on to the next one." };
    }
}
