// lib/database/tracks.ts
import { supabaseAdmin } from "@/lib/database/supabase";

export async function ensureDefaultTrack() {
    // Check if default track already exists
    const { data: existing, error: e1 } = await supabaseAdmin
        .from("quiz_tracks")
        .select("id")
        .eq("slug", "default")
        .maybeSingle();

    if (e1) throw e1;
    if (existing) return; // nothing to do

    // Create track
    const { data: track, error: e2 } = await supabaseAdmin
        .from("quiz_tracks")
        .insert({ slug: "default", title: "Default Training" })
        .select("id")
        .single();
    if (e2) throw e2;

    const tid = track.id;

    // Seed questions
    const { error: e3 } = await supabaseAdmin.from("quiz_questions").insert([
        {
            track_id: tid,
            idx: 0,
            text: "What does RAG stand for in LLM systems?",
            answer_key: "Retrieval-Augmented Generation",
            rubric: { accept: ["retrieval augmented generation"] },
        },
        {
            track_id: tid,
            idx: 1,
            text: "Name one benefit of using a vector database in RAG.",
            answer_key: "semantic retrieval",
            rubric: {
                accept: [
                    "semantic search",
                    "similarity search",
                    "dense retrieval",
                    "scalable retrieval",
                ],
            },
        },
        {
            track_id: tid,
            idx: 2,
            text: "Where should session state (score, idx) live?",
            answer_key: "server-side store such as Redis or DB",
            rubric: { accept: ["redis", "postgres", "database", "server"] },
        },
    ]);

    if (e3) throw e3;
}
