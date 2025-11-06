import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/supabase';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { session_id, score } = body;

        if (!session_id || score === undefined) {
            return NextResponse.json({ error: 'Session ID and score are required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('training_sessions')
            .update({ score })
            .eq('id', session_id);

        if (error) {
            console.error('Error updating score:', error);
            return NextResponse.json({ error: 'Failed to update score' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Score updated successfully' });
    } catch (error: any) {
        console.error('Error in POST /api/score:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
