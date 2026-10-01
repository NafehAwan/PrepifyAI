import { NextResponse } from "next/server";
import { resolveGroqKey, GROQ_MODEL } from "@/lib/ai/config";
import { GroqError, groqChat } from "@/lib/ai/client";
import { guardAiRoute } from "@/lib/ai/rateLimit";

export const runtime = "nodejs";

const LIMITS = [{ bucket: "ping-min", max: 5, windowSeconds: 60 }];

// Checks the AI key with a tiny request. Powers the Settings "Check it's
// working" / "Test connection" buttons. Signed-in students only.
export async function POST(req: Request) {
  const guard = await guardAiRoute(req, LIMITS, "Too many checks — wait a minute and try again.");
  if (guard instanceof NextResponse) return guard;

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
    console.error("[prepify] ping failed:", err instanceof Error ? err.message : err);
    const status = err instanceof GroqError ? err.status : 0;
    const error =
      status === 401 || status === 403
        ? "Groq didn't accept that key. Double-check it and try again."
        : status === 429
          ? "Groq is rate-limiting this key right now — try again in a minute."
          : "Couldn't reach the AI service. Try again in a moment.";
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }
}
