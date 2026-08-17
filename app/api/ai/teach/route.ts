import { NextResponse } from "next/server";
import { isAiConfigured, PREPIFY_MODEL } from "@/lib/ai/config";
import { createAnthropic } from "@/lib/ai/client";
import { teachSystemPrompt } from "@/lib/ai/prompts";

export const runtime = "nodejs";

interface InMsg {
  role: "me" | "ai";
  text: string;
}

// Grounded tutor pass. Answers the student's question using only the supplied
// ground truth (RAG chunks + SLOs), citing SLO codes.
export async function POST(req: Request) {
  if (!isAiConfigured()) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }

  let body: {
    messages?: InMsg[];
    subject?: string;
    classLevel?: number | string;
    medium?: string;
    level?: string;
    sloList?: string;
    groundTruth?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const system = teachSystemPrompt({
    classLevel: body.classLevel ?? 11,
    subject: body.subject ?? "Physics",
    medium: body.medium ?? "English",
    level: body.level ?? "Developing",
    sloList: body.sloList ?? "",
    groundTruth: body.groundTruth ?? "",
  });

  // Map to Anthropic roles and ensure the conversation starts with a user turn.
  const mapped = (body.messages ?? []).map((m) => ({
    role: (m.role === "me" ? "user" : "assistant") as "user" | "assistant",
    content: m.text,
  }));
  let start = 0;
  while (start < mapped.length && mapped[start].role !== "user") start++;
  const messages = mapped.slice(start);
  if (messages.length === 0) {
    return NextResponse.json({ error: "No user message" }, { status: 400 });
  }

  try {
    const anthropic = createAnthropic();
    const res = await anthropic.messages.create({
      model: PREPIFY_MODEL,
      max_tokens: 4000,
      system,
      output_config: { effort: "low" },
      messages,
    });
    const reply = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    return NextResponse.json({ reply, model: res.model });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
