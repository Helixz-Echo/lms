import { NextRequest, NextResponse } from 'next/server';
import { generateFinalFeedback, generateAndSaveAssessmentQuestions, generateAnswerFeedback } from '@/lib/assessment/training-questions';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action; // 'start', 'next', 'evaluate', 'finish'
    const session_id: string | undefined = body.session_id;
    const language: string | undefined = body.language;

    if (!session_id) {
      return NextResponse.json(
        { error: 'Session ID not provided' },
        { status: 400 },
      );
    }

    console.log(language);
    

    switch (action) {
      case 'start': {
        const questions = await generateAndSaveAssessmentQuestions(session_id,10, language);

        if (!questions || questions.length === 0) {
          return NextResponse.json(
            { error: 'Failed to generate or retrieve assessment questions' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          questions: questions,
          message: language === 'Sinhala'
            ? "ඔබේ පුහුණු ඇගැයුමට සාදරයෙන් පිළිගනිමු! ..."
            : language === 'Tamil'
              ? "உங்கள் பயிற்சி மதிப்பீட்டிற்கு வரவேற்கிறோம்! ..."
              : "Welcome to your training assessment! I'll ask you a few questions based on the knowledge base. Take your time and answer thoughtfully."
        });
      }

      case 'answer-feedback': {
        const { question, userAnswer } = body;
        if (!question || !userAnswer) {
          return NextResponse.json(
            { error: 'Question and answer are required for feedback.' },
            { status: 400 }
          );
        }
        const feedback = await generateAnswerFeedback(question, userAnswer, session_id, language);
        return NextResponse.json({
          feedback: feedback.feedback,
          message: "Assessment Complete! Here's your feedback:"
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

        const feedback = await generateFinalFeedback(history, language);
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
