"use client";

// Client helper for the MCQ generation route.
//
// This is the last-resort top-up only: a normal test is sampled from the
// `questions` bank and costs no API call. It is reached when a subject's bank
// cannot fill the requested number of questions AND the chapter has real
// textbook content to ground the generation on. Returns null on any failure, so
// the caller simply serves a shorter test rather than an error.

import { groqAuthHeaders } from "./key";
import type { ChapterGrounding, DBMcq } from "../curriculum";
import type { McqDifficulty } from "./prompts";

export async function generateQuiz(
  grounding: ChapterGrounding,
  count: number,
  key: string,
  opts?: { difficulty?: McqDifficulty },
): Promise<DBMcq[] | null> {
  try {
    const res = await fetch("/api/ai/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...groqAuthHeaders(key) },
      body: JSON.stringify({
        subject: grounding.subject,
        classLevel: grounding.classLevel,
        sloList: grounding.sloList,
        groundTruth: grounding.groundTruth,
        count,
        difficulty: opts?.difficulty ?? "medium",
        // a fresh random variant each call → different questions every time
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
