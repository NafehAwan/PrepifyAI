import { NextResponse } from "next/server";
import { resolveGroqKey } from "@/lib/ai/config";
import { groqChat, type GroqMessage } from "@/lib/ai/client";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { callerId, checkRateLimit } from "@/lib/ai/rateLimit";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// The shared key's rate limit is per key, so one student can't be allowed to
// spend it all. Generous enough that normal use never notices.
const MESSAGES_PER_MINUTE = 12;

interface InMsg {
  role: "me" | "ai";
  text: string;
}

// General "Ask Prepify" study assistant — a friendly helper for anything the
// student doesn't understand. Runs on the shared server key.
export async function POST(req: Request) {
  const key = resolveGroqKey(req);
  if (!key) return NextResponse.json({ configured: false }, { status: 503 });

  let userId: string | null = null;
  if (isSupabaseConfigured()) {
    const {
      data: { user },
    } = await createClient().auth.getUser();
    userId = user?.id ?? null;
  }
  const limit = checkRateLimit(callerId(req, userId), MESSAGES_PER_MINUTE);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `Prepi is catching up with everyone right now — try again in ${limit.retryAfterSeconds}s.`,
        rateLimited: true,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: { messages?: InMsg[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const turns: GroqMessage[] = (body.messages ?? [])
    .filter((m) => m.text?.trim())
    .slice(-12) // keep the last few turns for context
    .map((m) => ({ role: m.role === "me" ? "user" : "assistant", content: m.text }));
  if (turns.length === 0 || turns[0].role !== "user") {
    // ensure the conversation starts on a user turn
    while (turns.length && turns[0].role !== "user") turns.shift();
  }
  if (turns.length === 0) return NextResponse.json({ error: "No message" }, { status: 400 });

  try {
    const { text, model } = await groqChat({
      key,
      maxTokens: 1200,
      temperature: 0.6,
      messages: [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...turns],
    });
    return NextResponse.json({ reply: text, model });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
