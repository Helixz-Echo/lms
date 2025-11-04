// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runAgentChat } from '@/lib/agent';

type Role = 'user' | 'assistant' | 'system' | 'tool';
export type ChatMessage = {
  role: Role;
  content: string;
  // include anything else your app uses (id, name, tool_call_id, etc.)
};

export const runtime = 'nodejs'; // or 'edge' if your stack requires it

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const history: ChatMessage[] = Array.isArray(body?.history) ? body.history : [];
    const questionRaw: unknown = body?.question;

    const hasQuestion =
        typeof questionRaw === 'string' && questionRaw.trim().length > 0;

    // If there is no user question and this is the very first turn,
    // seed the agent with an instruction to greet + ask ONE short question.
    const effectiveQuestion = hasQuestion
        ? (questionRaw as string).trim()
        : history.length === 0
            ? ''
            : null;

    if (!effectiveQuestion) {
      // Mid-conversation empty POST — nothing to do.
      return NextResponse.json(
          { error: 'No question provided' },
          { status: 400 },
      );
    }

    // Your existing agent call — keep its return shape unchanged for the UI.
    const result = await runAgentChat(history, effectiveQuestion);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('Error in chat route:', err);
    return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
    );
  }
}

// (Optional) CORS preflight if your UI hits this from another origin.
// export async function OPTIONS() {
//   return NextResponse.json({}, { status: 200 });
// }
