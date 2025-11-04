// lib/state.supabase.ts
import { supabaseAdmin } from "@/lib/supabase";
import type { Question } from "@/lib/types";

export type SessionState = {
    id: string;
    track_id: string;
    question_idx: number; // 0-based
    score: number;
    attempts: number;
    total: number;
};

/** Create a new session for the given track slug and return the first question. */
export async function createSession(
    track_slug = "default"
): Promise<{ session: SessionState; firstQ: Question }> {
    // 1) Find track
    const { data: track, error: te } = await supabaseAdmin
        .from("quiz_tracks")
        .select("id, slug, title")
        .eq("slug", track_slug)
        .maybeSingle();
    if (te) throw te;
    if (!track) throw new Error(`Track not found: ${track_slug}`);

    // 2) Load ordered questions
    const { data: qs, error: qe } = await supabaseAdmin
        .from("quiz_questions")
        .select("id, text, answer_key, rubric, idx")
        .eq("track_id", track.id)
        .order("idx", { ascending: true });
    if (qe) throw qe;
    if (!qs?.length) throw new Error(`No questions in track: ${track_slug}`);

    // 3) Create session
    const total = qs.length;
    const { data: sess, error: se } = await supabaseAdmin
        .from("quiz_sessions")
        .insert({ track_id: track.id, total })
        .select("id, track_id, question_idx, score, attempts, total")
        .single();
    if (se) throw se;

    return { session: sess as SessionState, firstQ: mapQ(qs[0]) };
}

/** Fetch session state (or null if not found). */
export async function getSession(sessionId: string): Promise<SessionState | null> {
    const { data, error } = await supabaseAdmin
        .from("quiz_sessions")
        .select("id, track_id, question_idx, score, attempts, total")
        .eq("id", sessionId)
        .maybeSingle();
    if (error) throw error;
    return (data as SessionState) ?? null;
}

/** Patch session state fields. */
export async function setSession(sessionId: string, patch: Partial<SessionState>) {
    const { error } = await supabaseAdmin
        .from("quiz_sessions")
        .update(patch)
        .eq("id", sessionId);
    if (error) throw error;
}

/** Get the current question (by index) for a track. */
export async function getQuestionByIdx(
    track_id: string,
    idx: number
): Promise<Question | null> {
    const { data, error } = await supabaseAdmin
        .from("quiz_questions")
        .select("id, text, answer_key, rubric, idx")
        .eq("track_id", track_id)
        .eq("idx", idx)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapQ(data);
}

/** Get the next question (idx+1). */
export async function getNextQuestion(
    track_id: string,
    idx: number
): Promise<Question | null> {
    return getQuestionByIdx(track_id, idx + 1);
}

/** Normalize DB row → Question type. */
function mapQ(row: any): Question {
    return {
        id: row.id,
        text: row.text,
        answer_key: row.answer_key,
        rubric:
            typeof row.rubric === "string"
                ? row.rubric
                : JSON.stringify(row.rubric || {}),
    };
}
