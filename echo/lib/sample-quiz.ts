
import type { Question } from "./types";

export const quiz: Question[] = [
    {
        id: "q1",
        text: "What are the three key principles of effective communication in a sales call?",
        answer_key: "Clarity, brevity, and active listening.",
        rubric: "The user must mention clarity, brevity, and active listening. Synonyms are acceptable if the core meaning is preserved.",
    },
    {
        id: "q2",
        text: "Describe the 'open-ended question' technique and why it is useful.",
        answer_key: "Open-ended questions are questions that cannot be answered with a simple 'yes' or 'no'. They encourage the customer to share more information, which helps the sales assistant understand their needs better.",
        rubric: "The user must define open-ended questions and explain their purpose in gathering information.",
    },
    {
        id: "q3",
        text: "What should you do if a customer raises an objection you don't know how to answer?",
        answer_key: "Acknowledge the objection, inform the customer you will find the answer, and follow up with them promptly.",
        rubric: "The user must mention acknowledging the objection and committing to a follow-up.",
    },
];
