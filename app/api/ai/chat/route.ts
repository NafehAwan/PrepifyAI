import { NextResponse } from "next/server";
import { resolveGroqKey } from "@/lib/ai/config";
import { GroqError, groqChat, type GroqMessage } from "@/lib/ai/client";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { guardAiRoute, readJsonBody } from "@/lib/ai/rateLimit";

export const runtime = "nodejs";

// The shared key's rate limit is per key, so one student can't be allowed to
// spend it all. Generous enough that normal use never notices.
const LIMITS = [
  { bucket: "chat-min", max: 12, windowSeconds: 60 },
  { bucket: "chat-day", max: 200, windowSeconds: 86_400 },
];

const MAX_BODY_BYTES = 64_000;
const MAX_TURNS = 12; // the last few turns are enough context
const MAX_CHARS_PER_TURN = 4_000;

interface InMsg {
  role?: unknown;
  text?: unknown;
}

// General "Ask Prepify" study assistant — a friendly helper for anything the
// student doesn't understand. Signed-in students only; runs on the shared
// server key.
export async function POST(req: Request) {
  const guard = await guardAiRoute(req, LIMITS, "Prepi is catching up with everyone right now — try again in a minute.");
  if (guard instanceof NextResponse) return guard;

  const key = resolveGroqKey(req);
  if (!key) return NextResponse.json({ configured: false }, { status: 503 });

  // The chatbot is off while the student is in a running friend challenge —
  // checked here as well as hidden in the UI, so another tab doesn't help.
  if (guard.supabase) {
    const { data: busy } = await guard.supabase.rpc("in_active_challenge");
    if (busy === true) {
      return NextResponse.json(
        { error: "Prepi is switched off during a challenge. Finish your answers first — good luck!" },
        { status: 423 },
      );
    }
  }

  const body = await readJsonBody<{ messages?: unknown }>(req, MAX_BODY_BYTES);
  if (!body || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "That message couldn't be read — try a shorter one." }, { status: 400 });
  }

  // Only well-formed turns, trimmed to size; anything else is dropped.
  const turns: GroqMessage[] = (body.messages as InMsg[])
    .filter((m) => (m?.role === "me" || m?.role === "ai") && typeof m.text === "string" && m.text.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({
      role: m.role === "me" ? "user" : "assistant",
      content: (m.text as string).slice(0, MAX_CHARS_PER_TURN),
    }));
  // The conversation must start on a user turn.
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (turns.length === 0) return NextResponse.json({ error: "Type a question first." }, { status: 400 });

  try {
    const { text } = await groqChat({
      key,
      maxTokens: 1200,
      temperature: 0.6,
      messages: [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...turns],
    });
    return NextResponse.json({ reply: text });
  } catch (err) {
    // The details go to the server log, never to the browser.
    console.error("[prepify] chat failed:", err instanceof Error ? err.message : err);
    const status = err instanceof GroqError ? err.status : 0;
    const error =
      status === 429
        ? "Prepi is very busy right now — try again in a minute."
        : status === 401 || status === 403
          ? "The AI key isn't working. If you added your own key in Settings, check it."
          : "Prepi couldn't answer just now — try again in a moment.";
    return NextResponse.json({ error }, { status: status === 429 ? 429 : 502 });
  }
}
