"use client";

// Client helper that asks the AI to generate a fresh MCQ set grounded on a
// topic's real content. Returns null when there's no key / generation fails, so
// callers fall back to the seeded bank.

import { groqAuthHeaders } from "./key";
import type { DBMcq } from "../curriculum";
import type { TeachContext } from "../types";

export async function generateQuiz(teach: TeachContext, count: number, key: string): Promise<DBMcq[] | null> {
  try {
    const res = await fetch("/api/ai/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...groqAuthHeaders(key) },
      body: JSON.stringify({
        subject: teach.subject,
        classLevel: teach.classLevel,
        sloList: teach.sloList,
        groundTruth: teach.groundTruth,
        count,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { mcqs?: DBMcq[] };
    return data.mcqs && data.mcqs.length > 0 ? data.mcqs : null;
  } catch {
    return null;
  }
}
