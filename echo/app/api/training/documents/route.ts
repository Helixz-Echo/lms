import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const { data: documents, error } = await supabaseAdmin
            .from('training_documents')
            .select(`
                id,
                session_id,
                file_name,
                file_size,
                mime_type,
                created_at,
                training_sessions (
                    id,
                    session_name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching training documents:', error);
            return NextResponse.json({ error: 'Failed to fetch training documents' }, { status: 500 });
        }

        return NextResponse.json({ documents: documents || [] });
    } catch (error: any) {
        console.error('Error in GET /api/training/documents:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
