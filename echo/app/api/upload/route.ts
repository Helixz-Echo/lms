import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { embed } from '@/lib/embeddings';

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'text/csv') {
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const fileText = await file.text();

    const { data: document } = await supabaseAdmin
        .from('documents')
        .insert([{ file_name: file.name, file_size: file.size, mime_type: file.type }])
        .select()
        .single();

    if (!document) {
        return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    }

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

    const embeddings = await embed(chunks.map(chunk => chunk.content));

    const chunkData = chunks.map((chunk, i) => ({
        document_id: document.id,
        chunk_index: i,
        content: chunk.content,
        row_start: chunk.row_start,
        row_end: chunk.row_end,
        embedding: embeddings[i],
    }));

    const { error } = await supabaseAdmin.from('chunks').insert(chunkData);

    if (error) {
        console.error('Error inserting chunks:', error);
        return NextResponse.json({ error: 'Failed to insert chunks' }, { status: 500 });
    }

    return NextResponse.json({ message: 'File uploaded and processed successfully' });
}
