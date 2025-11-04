// File: `lib/chat.ts`
export type ChatMessage = { role: "user" | "assistant"; content: string; ts?: string };

export async function postChat(history: ChatMessage[], question: string) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history, question }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `HTTP ${res.status}`);
  }

  return res.json();
}