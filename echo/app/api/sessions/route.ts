import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const { data, error } = await supabaseAdmin
            .from('training_sessions')
            .select('*');

        if (error) {
            console.error('Error fetching sessions:', error);
            return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error in GET /api/sessions:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
