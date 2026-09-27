"use client";

// Builds a subject test from the question bank.
//
// This path deliberately makes NO API call. Questions come from the `questions`
// table (the owner's real FBISE bank, loaded by scripts/load-mcq-bank.mjs), so
// test-taking costs nothing per student and keeps working even when the shared
// Groq key is missing or rate-limited. That is what lets one key serve a class.
//
// When the bank cannot fill a request, the fallbacks widen in order of least
// harm: reuse questions from older tests, then widen the difficulty band, and
// only then generate with AI.

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { shuffleMcqs } from "@/lib/quizUtil";
import { getChapterGrounding, type DBMcq } from "@/lib/curriculum";
import { generateQuiz } from "@/lib/ai/generate";
import type { McqDifficulty } from "@/lib/ai/prompts";

// The `questions.difficulty` column is 1..5. The bank loader writes easy=1,
// medium=3, hard=5, so a band is a range rather than an exact value.
const BANDS: Record<McqDifficulty, [number, number]> = {
  easy: [1, 2],
  medium: [2, 4],
  hard: [4, 5],
  mixed: [1, 5],
};

// How many recent tests to avoid repeating questions from.
const RECENT_TESTS = 5;

export interface BuiltTest {
  mcqs: DBMcq[];
  // How the questions were found, so the UI can be honest when a subject is thin.
  source: "bank" | "bank-relaxed" | "bank-widened" | "topped-up" | "short";
}

interface QuestionRow {
  id: string;
  stem_md: string;
  options_json: string[] | null;
  answer_key_md: string | null;
  difficulty: number | null;
}

// A strict letter → index conversion. lib/curriculum.ts's letterToIndex()
// silently returns 0 for anything unparseable, which would mark a student wrong
// on a correct answer; here an unusable row is dropped instead.
function answerIndex(letter: string | null): number | null {
  const i = "ABCD".indexOf((letter ?? "").trim().toUpperCase());
  return i < 0 ? null : i;
}

function toMcq(row: QuestionRow): DBMcq | null {
  const answer = answerIndex(row.answer_key_md);
  const options = row.options_json ?? [];
  if (answer === null || options.length !== 4) return null;
  return { id: row.id, stem: row.stem_md, options, answer };
}

// Every chapter id belonging to a subject. Tests are subject-wide, so the whole
// book is in scope regardless of what the student has studied.
async function chapterIdsForSubject(subjectId: string): Promise<string[]> {
  const supabase = createClient();
  const { data: books } = await supabase.from("books").select("id").eq("subject_id", subjectId);
  const bookIds = ((books ?? []) as Array<{ id: string }>).map((b) => b.id);
  if (bookIds.length === 0) return [];
  const { data: chapters } = await supabase.from("chapters").select("id").in("book_id", bookIds);
  return ((chapters ?? []) as Array<{ id: string }>).map((c) => c.id);
}

// Question ids the student has already been asked in their last few tests.
async function recentlyAskedIds(userId: string, subjectId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("tests")
    .select("questions_json")
    .eq("user_id", userId)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false })
    .limit(RECENT_TESTS);

  const seen = new Set<string>();
  for (const row of (data ?? []) as Array<{ questions_json: unknown }>) {
    const asked = Array.isArray(row.questions_json) ? (row.questions_json as DBMcq[]) : [];
    for (const q of asked) if (q?.id) seen.add(q.id);
  }
  return seen;
}

function sample(pool: DBMcq[], count: number): DBMcq[] {
  // shuffleMcqs randomises question order AND option order (remapping the
  // answer index), so two tests drawing the same question still look different.
  return shuffleMcqs(pool).slice(0, count);
}

export async function buildTest(opts: {
  userId: string;
  subjectId: string;
  count: number;
  difficulty: McqDifficulty;
  // Only used by the last-resort AI top-up; omit and the top-up is skipped.
  aiKey?: string;
}): Promise<BuiltTest> {
  const count = Math.min(Math.max(Math.round(opts.count), 1), 30);
  if (!isSupabaseConfigured()) return { mcqs: [], source: "short" };

  const chapterIds = await chapterIdsForSubject(opts.subjectId);
  if (chapterIds.length === 0) return { mcqs: [], source: "short" };

  const supabase = createClient();
  const [lo, hi] = BANDS[opts.difficulty];

  const inBand = async (min: number, max: number): Promise<DBMcq[]> => {
    const { data } = await supabase
      .from("questions")
      .select("id, stem_md, options_json, answer_key_md, difficulty")
      .in("chapter_id", chapterIds)
      .eq("type", "mcq")
      .gte("difficulty", min)
      .lte("difficulty", max);
    return ((data ?? []) as QuestionRow[]).map(toMcq).filter((q): q is DBMcq => q !== null);
  };

  const banded = await inBand(lo, hi);
  const recent = await recentlyAskedIds(opts.userId, opts.subjectId);

  // 1. The normal path: in-band questions the student hasn't just seen.
  const fresh = banded.filter((q) => !recent.has(q.id));
  if (fresh.length >= count) return { mcqs: sample(fresh, count), source: "bank" };

  // 2. Allow repeats from older tests before giving up on the band.
  if (banded.length >= count) return { mcqs: sample(banded, count), source: "bank-relaxed" };

  // 3. Widen to the whole difficulty range — better a slightly off-band
  //    question from the real bank than a generated one.
  const all = await inBand(1, 5);
  if (all.length >= count) {
    const preferred = [...banded, ...all.filter((q) => !banded.some((b) => b.id === q.id))];
    return { mcqs: sample(preferred, count), source: "bank-widened" };
  }

  // 4. Last resort: generate the shortfall from real textbook content. Only
  //    possible for a chapter that has content_chunks seeded, which is why the
  //    banks exist in the first place.
  const have = sample(all, Math.min(count, all.length));
  const shortfall = count - have.length;
  if (shortfall > 0) {
    const topUp = await generateShortfall(chapterIds, shortfall, opts.difficulty, opts.aiKey);
    if (topUp.length > 0) return { mcqs: shuffleMcqs([...have, ...topUp]), source: "topped-up" };
  }
  return { mcqs: have, source: "short" };
}

// Asks the model for the missing questions, grounded on a chapter that actually
// has textbook text. Returns [] whenever that isn't possible — a shorter test is
// always better than an ungrounded one.
async function generateShortfall(
  chapterIds: string[],
  shortfall: number,
  difficulty: McqDifficulty,
  aiKey?: string,
): Promise<DBMcq[]> {
  for (const chapterId of chapterIds) {
    const grounding = await getChapterGrounding(chapterId);
    if (!grounding) continue;
    const generated = await generateQuiz(grounding, shortfall, aiKey ?? "", { difficulty });
    if (generated && generated.length > 0) return generated;
    break; // the route is reachable but unhelpful — don't hammer it per chapter
  }
  return [];
}

// Score → the remark shown on a test card.
export function remarkFor(scorePct: number): string {
  if (scorePct >= 90) return "Excellent";
  if (scorePct >= 75) return "Very good";
  if (scorePct >= 60) return "Good";
  if (scorePct >= 50) return "Passed — revise weak areas";
  return "Needs work";
}
