"use client";

// Client helper that asks the AI to generate a fresh MCQ set grounded on a
// topic's real content. Returns null when there's no key / generation fails, so
// callers fall back to the seeded bank.

import { groqAuthHeaders } from "./key";
import type { DBMcq } from "../curriculum";
import type { TeachContext } from "../types";
import type { McqDifficulty } from "./prompts";

export async function generateQuiz(
  teach: TeachContext,
  count: number,
  key: string,
  opts?: { difficulty?: McqDifficulty },
): Promise<DBMcq[] | null> {
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
        difficulty: opts?.difficulty ?? "medium",
        // a fresh random variant each call → different questions on every retake
        variant: Math.floor(Math.random() * 1e6),
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { mcqs?: DBMcq[] };
    return data.mcqs && data.mcqs.length > 0 ? data.mcqs : null;
  } catch {
    return null;
  }
}
