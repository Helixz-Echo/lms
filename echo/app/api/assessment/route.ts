import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionFromKnowledge, generateFinalFeedback, evaluateAnswer } from '@/lib/training-questions';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action; // 'start', 'next', 'evaluate', 'finish'
    
    switch (action) {
      case 'start': {
        // Start a new assessment session - generate first question
        const question = await generateQuestionFromKnowledge();
        return NextResponse.json({
          question: question.question,
          questionId: question.id,
          message: "Welcome to your training assessment! I'll ask you a few questions based on the knowledge base. Take your time and answer thoughtfully."
        });
      }
      
      case 'next': {
        // Generate next question
        const previousQuestions = body.previousQuestions || [];
        const question = await generateQuestionFromKnowledge(previousQuestions);
        return NextResponse.json({
          question: question.question,
          questionId: question.id
        });
      }
      
      case 'evaluate': {
        // Evaluate user's answer
        const { question, answer, context } = body;
        if (!question || !answer) {
          return NextResponse.json(
            { error: 'Question and answer are required' },
            { status: 400 }
          );
        }
        
        const evaluation = await evaluateAnswer(question, answer, context || []);
        return NextResponse.json(evaluation);
      }
      
      case 'finish': {
        // Generate final feedback
        const history = body.history || [];
        if (history.length === 0) {
          return NextResponse.json(
            { error: 'No conversation history provided' },
            { status: 400 }
          );
        }
        
        const feedback = await generateFinalFeedback(history);
        return NextResponse.json({
          feedback,
          message: "Assessment Complete! Here's your feedback:"
        });
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, next, evaluate, or finish' },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('Error in assessment route:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
