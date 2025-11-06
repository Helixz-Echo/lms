import { NextRequest, NextResponse } from 'next/server';
import { generateFinalFeedback, generateAndSaveAssessmentQuestions } from '@/lib/training-questions';
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action; // 'start', 'next', 'evaluate', 'finish'
    const session_id: string | undefined = body.session_id;

    if (!session_id) {
      return NextResponse.json(
          { error: 'Session ID not provided' },
          { status: 400 },
      );
    }
    
    switch (action) {
      case 'start': {
        const questions = await generateAndSaveAssessmentQuestions(session_id);

        if (!questions || questions.length === 0) {
          return NextResponse.json(
            { error: 'Failed to generate or retrieve assessment questions' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          questions: questions,
          message: "Welcome to your training assessment! I'll ask you a few questions based on the knowledge base. Take your time and answer thoughtfully."
        });
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
          { error: 'Invalid action. Use: start or finish' },
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
