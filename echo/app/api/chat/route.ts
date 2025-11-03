import { NextRequest, NextResponse } from 'next/server';
import { runAgentChat } from '@/lib/agent';

export async function POST(req: NextRequest) {
  const { history, question } = await req.json();

  if (!question) {
    return NextResponse.json({ error: 'No question provided' }, { status: 400 });
  }

  try {
    const result = await runAgentChat(history || [], question);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
