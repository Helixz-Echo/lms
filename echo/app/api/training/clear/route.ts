import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { session_id } = body;

        if (!session_id) {
            return NextResponse.json({ error: 'No session ID provided' }, { status: 400 });
        }

        // Verify the training session exists
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('training_sessions')
            .select('id, session_name')
            .eq('id', session_id)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Training session not found' }, { status: 404 });
        }

        // Delete all training documents (and chunks via cascade) for this session
        const { error: deleteError } = await supabaseAdmin
            .from('training_documents')
            .delete()
            .eq('session_id', session_id);

        if (deleteError) {
            console.error('Error deleting training documents:', deleteError);
            return NextResponse.json({ error: 'Failed to delete training data' }, { status: 500 });
        }

        return NextResponse.json({ 
            message: `All previous data for training session "${session.session_name}" has been cleared successfully.`
        });
    } catch (error: any) {
        console.error('Error in POST /api/training/clear:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
