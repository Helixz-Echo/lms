export type Question = {
    id: string;
    text: string;
    answer_key: string;
    rubric?: string; // JSON string or plain text instructions for acceptance
};

export type GraderResult = {
    verdict: "correct" | "incorrect" | "partial";
    reasons?: string;
    next_hint?: string;
    citations?: { id: string; text: string }[];
};