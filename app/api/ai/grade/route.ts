import { NextResponse } from "next/server";
import { resolveGroqKey } from "@/lib/ai/config";
import { groqChat } from "@/lib/ai/client";
import { GRADE_SYSTEM_PROMPT, gradeUserMessage } from "@/lib/ai/prompts";
import type { GradeResult } from "@/lib/ai/context";

export const runtime = "nodejs";

// Strip a ```json … ``` fence if the model wraps its JSON, then parse.
function parseJson(text: string): GradeResult {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return JSON.parse(t) as GradeResult;
}

// Brutally-honest examiner. Grades a written answer point-by-point against the
// marking scheme and returns structured JSON. Uses the student's own Groq key.
export async function POST(req: Request) {
  const key = resolveGroqKey(req);
  if (!key) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }

  let body: {
    question?: string;
    marks?: number;
    sloCode?: string;
    markingScheme?: string[];
    modelAnswer?: string;
    studentAnswer?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const marks = body.marks ?? 5;
  const userMessage = gradeUserMessage({
    question: body.question ?? "",
    marks,
    sloCode: body.sloCode ?? "",
    markingScheme: body.markingScheme ?? [],
    modelAnswer: body.modelAnswer ?? "",
    studentAnswer: body.studentAnswer ?? "",
  });

  try {
    const { text } = await groqChat({
      key,
      maxTokens: 1500,
      temperature: 0.1,
      // Guarantee valid, parseable JSON in the shape the UI expects.
      jsonMode: true,
      messages: [
        { role: "system", content: GRADE_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const parsed = parseJson(text);
    // Never let the model award more than the paper allows.
    parsed.outOf = marks;
    parsed.awarded = Math.max(0, Math.min(Number(parsed.awarded) || 0, marks));
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
