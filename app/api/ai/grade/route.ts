import { NextResponse } from "next/server";
import { isAiConfigured, PREPIFY_MODEL } from "@/lib/ai/config";
import { createAnthropic } from "@/lib/ai/client";
import { GRADE_SYSTEM_PROMPT, gradeUserMessage } from "@/lib/ai/prompts";
import type { GradeResult } from "@/lib/ai/context";

export const runtime = "nodejs";

const GRADE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    awarded: { type: "number" },
    outOf: { type: "number" },
    hits: { type: "array", items: { type: "string" } },
    missed: { type: "array", items: { type: "string" } },
    keyword_gaps: { type: "array", items: { type: "string" } },
    feedback_md: { type: "string" },
    slo_code: { type: "string" },
  },
  required: ["awarded", "outOf", "hits", "missed", "keyword_gaps", "feedback_md", "slo_code"],
} as const;

// Brutally-honest examiner. Grades a written answer point-by-point against the
// marking scheme and returns structured JSON.
export async function POST(req: Request) {
  if (!isAiConfigured()) {
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
    const anthropic = createAnthropic();
    const res = await anthropic.messages.create({
      model: PREPIFY_MODEL,
      max_tokens: 4000,
      system: GRADE_SYSTEM_PROMPT,
      // Guarantee valid, parseable JSON in the shape the UI expects.
      output_config: { format: { type: "json_schema", schema: GRADE_SCHEMA }, effort: "medium" },
      messages: [{ role: "user", content: userMessage }],
    } as Parameters<typeof anthropic.messages.create>[0]);

    const text = (res as { content: Array<{ type: string; text?: string }> }).content
      .map((b) => (b.type === "text" ? b.text ?? "" : ""))
      .join("")
      .trim();

    const parsed = JSON.parse(text) as GradeResult;
    // Never let the model award more than the paper allows.
    parsed.outOf = marks;
    parsed.awarded = Math.max(0, Math.min(parsed.awarded, marks));
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
