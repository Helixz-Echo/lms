import { supabaseAdmin } from './supabase';
import { embed } from './embeddings';

export async function retrieveContext(query: string, k: number = 6) {
    const queryEmbedding = await embed([query]);

    const { data, error } = await supabaseAdmin.rpc('match_chunks', {
        query_embedding: queryEmbedding[0],
        match_count: k,
        similarity_threshold: 0.1, // Add a threshold
    });

    if (error) {
        console.error('Error retrieving context:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        text: item.content,
        similarity: item.similarity,
        file_name: item.file_name,
        row_start: item.row_start,
        row_end: item.row_end,
        chunk_index: item.chunk_index,
    }));
}
