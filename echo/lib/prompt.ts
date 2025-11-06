// lib/prompt.ts
import { PromptTemplate } from '@langchain/core/prompts';

// System prompt ensures:
// - First turn (no chat history): greet once + ask EXACTLY ONE question
// - Later turns: end with EXACTLY ONE follow-up question to keep momentum
// - Keep answers tight, use retrieved context when relevant
const systemTemplate = `
You are a friendly training-chat tutor.

Rules:
- Your first message to the user is "Are you ready to start the Dialog Call Assistant Training?".
- Otherwise: Answer concisely (<=5 sentences) and end with EXACTLY ONE short follow-up question.
- Use the retrieved context when relevant. If context is not relevant, ignore it.
- Do not ask multiple questions in a single turn.
- Stay supportive and clear.

Retrieved context (may be empty):
{context}

Conversation so far:
{chat_history}

User: {input}
Assistant:
`.trim();

export const SYSTEM_PROMPT = new PromptTemplate({
    inputVariables: ['chat_history', 'input', 'context'],
    template: systemTemplate,
});
