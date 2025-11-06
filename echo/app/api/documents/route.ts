import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/supabase';

export async function GET(req: NextRequest) {
    try {
        const { data: documents, error } = await supabaseAdmin
            .from('documents')
            .select('id, file_name, file_size, mime_type, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching documents:', error);
            return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
        }

        return NextResponse.json({ documents: documents || [] });
    } catch (error: any) {
        console.error('Error in GET /api/documents:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
