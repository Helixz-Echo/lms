import { NextRequest, NextResponse } from 'next/server';
import { evaluateAnswer } from '@/lib/training-questions';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { question, userAnswer, context } = body;

        if (!question || !userAnswer || !context) {
            return NextResponse.json({ error: 'Question, user answer, and context are required' }, { status: 400 });
        }

        const result = await evaluateAnswer(question, userAnswer, context);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in POST /api/evaluate:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
