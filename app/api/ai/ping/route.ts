import { NextResponse } from "next/server";
import { resolveGroqKey, GROQ_MODEL } from "@/lib/ai/config";
import { groqChat } from "@/lib/ai/client";

export const runtime = "nodejs";

// Validates a student's Groq key with a tiny request. Powers the Settings
// "Test connection" button so users get instant confirmation their key works.
export async function POST(req: Request) {
  const key = resolveGroqKey(req);
  if (!key) {
    return NextResponse.json({ ok: false, error: "No API key provided." }, { status: 400 });
  }
  try {
    const { model } = await groqChat({
      key,
      maxTokens: 5,
      temperature: 0,
      messages: [{ role: "user", content: "Reply with the single word: OK" }],
    });
    return NextResponse.json({ ok: true, model: model || GROQ_MODEL });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
