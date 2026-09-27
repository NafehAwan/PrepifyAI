import { NextResponse } from "next/server";
import { resolveGroqKey } from "@/lib/ai/config";
import { groqChat } from "@/lib/ai/client";
import { QUIZ_GEN_SYSTEM_PROMPT, quizGenUserMessage, type McqDifficulty } from "@/lib/ai/prompts";

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

const DIFFICULTIES: McqDifficulty[] = ["easy", "medium", "hard", "mixed"];

// Generates fresh MCQs grounded only on the supplied chapter text. This is the
// fallback path only — a normal test is sampled from the `questions` bank and
// costs no API call, which is what lets one shared key serve a whole class.
export async function POST(req: Request) {
  const key = resolveGroqKey(req);
  if (!key) return NextResponse.json({ configured: false }, { status: 503 });

  let body: {
    subject?: string;
    classLevel?: number | string;
    sloList?: string;
    groundTruth?: string;
    count?: number;
    difficulty?: string;
    variant?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.groundTruth || body.groundTruth.trim().length === 0) {
    return NextResponse.json({ error: "No ground truth to generate from" }, { status: 400 });
  }

  const count = Math.min(Math.max(Number(body.count) || 5, 1), 30);
  const difficulty: McqDifficulty = DIFFICULTIES.includes(body.difficulty as McqDifficulty)
    ? (body.difficulty as McqDifficulty)
    : "medium";
  const userMessage = quizGenUserMessage({
    subject: body.subject ?? "Physics",
    classLevel: body.classLevel ?? 9,
    sloList: body.sloList ?? "",
    groundTruth: body.groundTruth,
    count,
    difficulty,
    variant: Number(body.variant) || 1,
  });

  try {
    const { text } = await groqChat({
      key,
      // scale output room with the number of questions
      maxTokens: Math.min(7000, 900 + count * 240),
      // Scenario-heavy bands need more variety; easy recall sets need less drift.
      temperature: difficulty === "easy" ? 0.5 : 0.8,
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
