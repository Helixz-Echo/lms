import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/supabase';

export async function GET(req: NextRequest) {
    try {
        const { data: sessions, error } = await supabaseAdmin
            .from('training_sessions')
            .select('id, session_name, created_at')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching training sessions:', error);
            return NextResponse.json({ error: 'Failed to fetch training sessions' }, { status: 500 });
        }

        return NextResponse.json({ sessions: sessions || [] });
    } catch (error: any) {
        console.error('Error in GET /api/training/sessions:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { session_name } = body;

        if (!session_name || !session_name.trim()) {
            return NextResponse.json({ error: 'Session name is required' }, { status: 400 });
        }

        const { data: session, error } = await supabaseAdmin
            .from('training_sessions')
            .insert([{ session_name: session_name.trim() }])
            .select()
            .single();

        if (error) {
            console.error('Error creating training session:', error);
            return NextResponse.json({ error: 'Failed to create training session' }, { status: 500 });
        }

        return NextResponse.json({ 
            message: 'Training session created successfully',
            session 
        });
    } catch (error: any) {
        console.error('Error in POST /api/training/sessions:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
