import { NextResponse } from "next/server";
import { resolveGroqKey } from "@/lib/ai/config";
import { groqChat } from "@/lib/ai/client";
import { QUIZ_GEN_SYSTEM_PROMPT, quizGenUserMessage } from "@/lib/ai/prompts";

export const runtime = "nodejs";

interface GenQ {
  stem?: string;
  options?: string[];
  answer?: number;
  slo_code?: string;
  explanation?: string;
}

function parseJson(text: string): { questions?: GenQ[] } {
  let t = text.trim();
  if (t.startsWith("```")) t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(t) as { questions?: GenQ[] };
}

// Generates fresh MCQs grounded only on the supplied topic/chapter text. Uses
// the student's own Groq key. Powers the "Generate AI quiz" action so any
// grounded content can be tested without a pre-seeded question bank.
export async function POST(req: Request) {
  const key = resolveGroqKey(req);
  if (!key) return NextResponse.json({ configured: false }, { status: 503 });

  let body: { subject?: string; classLevel?: number | string; sloList?: string; groundTruth?: string; count?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.groundTruth || body.groundTruth.trim().length === 0) {
    return NextResponse.json({ error: "No ground truth to generate from" }, { status: 400 });
  }

  const count = Math.min(Math.max(Number(body.count) || 5, 1), 10);
  const userMessage = quizGenUserMessage({
    subject: body.subject ?? "Physics",
    classLevel: body.classLevel ?? 9,
    sloList: body.sloList ?? "",
    groundTruth: body.groundTruth,
    count,
  });

  try {
    const { text } = await groqChat({
      key,
      maxTokens: 2500,
      temperature: 0.5,
      jsonMode: true,
      messages: [
        { role: "system", content: QUIZ_GEN_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const parsed = parseJson(text);
    const mcqs = (parsed.questions ?? [])
      // Keep only well-formed 4-option questions with a valid answer index.
      .filter((q) => q.stem && Array.isArray(q.options) && q.options.length === 4 && typeof q.answer === "number" && q.answer >= 0 && q.answer <= 3)
      .map((q, i) => ({
        id: `gen-${i}`,
        stem: q.stem as string,
        options: q.options as string[],
        answer: q.answer as number,
        explanation: q.explanation ?? "",
      }));

    if (mcqs.length === 0) return NextResponse.json({ error: "No usable questions generated" }, { status: 502 });
    return NextResponse.json({ mcqs });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
