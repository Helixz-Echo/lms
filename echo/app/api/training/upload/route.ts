import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { embed } from '@/lib/embeddings';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const sessionId = formData.get('session_id') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!sessionId) {
            return NextResponse.json({ error: 'No session ID provided' }, { status: 400 });
        }

        if (file.type !== 'text/csv') {
            return NextResponse.json({ error: 'Invalid file type. Only CSV files are allowed.' }, { status: 400 });
        }

        // Check if this training session already has documents
        const { data: existingDocuments, error: checkError } = await supabaseAdmin
            .from('training_documents')
            .select('id')
            .eq('session_id', sessionId)
            .limit(1);

        if (checkError) {
            console.error('Error checking existing documents:', checkError);
            return NextResponse.json({ error: 'Failed to check existing data' }, { status: 500 });
        }

        if (existingDocuments && existingDocuments.length > 0) {
            return NextResponse.json(
                { error: 'This training session already has data. Please clear previous data before uploading again.' },
                { status: 409 }
            );
        }

        // Verify the training session exists
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('training_sessions')
            .select('id')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Training session not found' }, { status: 404 });
        }

        const fileText = await file.text();

        // Manual CSV parsing
        const lines = fileText.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) {
            return NextResponse.json({ error: 'Empty CSV file' }, { status: 400 });
        }

        const headers = lines[0].split(',');
        console.log("Parsed Headers:", headers);
        
        const parsedData = lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj: { [key: string]: string }, header, index) => {
                obj[header.trim()] = values[index] ? values[index].trim() : '';
                return obj;
            }, {});
        });
        
        console.log("Parsed Data (first 2 rows):", parsedData.slice(0, 2));

        // Create chunks from CSV data
        const chunks: any[] = [];
        let currentChunk = "";
        let rowStart = 0;

        parsedData.forEach((row: any, i) => {
            const rowText = JSON.stringify(row);
            if (currentChunk.length + rowText.length > 1200) {
                chunks.push({ content: currentChunk, row_start: rowStart, row_end: i });
                currentChunk = "";
                rowStart = i + 1;
            }
            currentChunk += rowText + '\n';
        });

        if (currentChunk) {
            chunks.push({ content: currentChunk, row_start: rowStart, row_end: parsedData.length });
        }

        // Generate embeddings
        const embeddings = await embed(chunks.map(chunk => chunk.content));

        // Create training_document record
        const { data: trainingDocument, error: docError } = await supabaseAdmin
            .from('training_documents')
            .insert([{ 
                session_id: sessionId,
                file_name: file.name, 
                file_size: file.size, 
                mime_type: file.type 
            }])
            .select()
            .single();

        if (docError || !trainingDocument) {
            console.error('Error creating training document:', docError);
            return NextResponse.json({ error: 'Failed to create training document' }, { status: 500 });
        }

        // Prepare training chunk data with training_document_id
        const chunkData = chunks.map((chunk, i) => ({
            training_document_id: trainingDocument.id,
            chunk_index: i,
            content: chunk.content,
            row_start: chunk.row_start,
            row_end: chunk.row_end,
            embedding: embeddings[i],
        }));

        // Insert training chunks
        const { error: insertError } = await supabaseAdmin
            .from('training_chunks')
            .insert(chunkData);

        if (insertError) {
            console.error('Error inserting training chunks:', insertError);
            return NextResponse.json({ error: 'Failed to insert training chunks' }, { status: 500 });
        }

        return NextResponse.json({ 
            message: `File uploaded and processed successfully. ${chunks.length} chunks created for this training session.`,
            chunksCreated: chunks.length
        });
    } catch (error: any) {
        console.error('Error in POST /api/training/upload:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
