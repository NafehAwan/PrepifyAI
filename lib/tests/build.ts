"use client";

// Builds a test from the question bank.
//
// This path deliberately makes NO API call. Questions come from the `questions`
// table (the owner's real FBISE bank plus its pre-written variants, loaded by
// scripts/load-mcq-bank.mjs), so test-taking costs nothing per student and keeps
// working even when the shared Groq key is missing or rate-limited. That is
// what lets one key serve a whole class.
//
// Variety comes from three places, all free at runtime:
//   - question families: each original question has reworded / re-valued
//     variants in the bank, and a test takes at most one member per family;
//   - memory: families the student met in their last few tests are avoided,
//     and when one must come back, a version they haven't seen is preferred;
//   - shuffling: question order and option order are randomised every time.
//
// When the bank cannot fill a request, the fallbacks widen in order of least
// harm: reuse older questions, then widen the difficulty band, and only then
// generate with AI.

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { readCache, retry, timeoutSignal, writeCache } from "@/lib/net";
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

// How many recent tests to remember when avoiding repeats.
const RECENT_TESTS = 5;

export interface BuiltTest {
  mcqs: DBMcq[];
  // How the questions were found, so the UI can be honest when a scope is thin.
  source: "bank" | "bank-relaxed" | "bank-widened" | "topped-up" | "short";
}

export interface SubjectChapter {
  id: string;
  seq: number;
  title: string;
  mcqCount: number; // answerable MCQs, variants included
}

interface QuestionRow {
  id: string;
  stem_md: string;
  options_json: string[] | null;
  answer_key_md: string | null;
  difficulty: number | null;
  family: string | null;
  explanation_md: string | null;
}

// A strict letter → index conversion. An unparseable key is dropped rather than
// defaulted to option A, which would mark a correct student answer wrong.
function answerIndex(letter: string | null): number | null {
  const i = "ABCD".indexOf((letter ?? "").trim().toUpperCase());
  return i < 0 ? null : i;
}

function toMcq(row: QuestionRow): DBMcq | null {
  const answer = answerIndex(row.answer_key_md);
  const options = row.options_json ?? [];
  if (answer === null || options.length !== 4) return null;
  return {
    id: row.id,
    stem: row.stem_md,
    options,
    answer,
    family: row.family,
    ...(row.explanation_md ? { explanation: row.explanation_md } : {}),
  };
}

// A question with no family is its own family.
const familyOf = (q: DBMcq) => q.family || q.id;

// The subject's chapters in book order, with how many answerable MCQs each has,
// for the chapter pickers. Throws if any of its three reads fails — a failed
// count must never be shown as "0 questions" — and retries a slow connection a
// few times first. A good answer is kept on the device for next time.
export async function listSubjectChapters(subjectId: string): Promise<SubjectChapter[]> {
  if (!isSupabaseConfigured()) return [];
  const rows = await retry(async () => {
    const supabase = createClient();
    const signal = timeoutSignal();
    const withSignal = <Q extends { abortSignal: (s: AbortSignal) => Q }>(q: Q): Q => (signal ? q.abortSignal(signal) : q);

    const books = await withSignal(supabase.from("books").select("id").eq("subject_id", subjectId));
    if (books.error) throw new Error(books.error.message);
    const bookIds = ((books.data ?? []) as Array<{ id: string }>).map((b) => b.id);
    if (bookIds.length === 0) throw new Error("no books");

    const chapters = await withSignal(supabase.from("chapters").select("id, seq, title").in("book_id", bookIds).order("seq"));
    if (chapters.error) throw new Error(chapters.error.message);
    const list = (chapters.data ?? []) as Array<{ id: string; seq: number; title: string }>;
    if (list.length === 0) throw new Error("no chapters");

    const counts = await withSignal(
      supabase
        .from("chapter_mcq_counts")
        .select("chapter_id, mcq_count")
        .in(
          "chapter_id",
          list.map((r) => r.id),
        ),
    );
    if (counts.error) throw new Error(counts.error.message);
    const countById = new Map(
      ((counts.data ?? []) as Array<{ chapter_id: string; mcq_count: number }>).map((c) => [c.chapter_id, Number(c.mcq_count)]),
    );
    return list.map((r) => ({ id: r.id, seq: r.seq, title: r.title, mcqCount: countById.get(r.id) ?? 0 }));
  });
  writeCache(`chapters:${subjectId}`, rows);
  return rows;
}

// The last good chapter list for a subject on this device, if any.
export function cachedSubjectChapters(subjectId: string): SubjectChapter[] | null {
  return readCache<SubjectChapter[]>(`chapters:${subjectId}`);
}

// What the student was asked in their last few tests of this subject.
async function recentHistory(userId: string, subjectId: string): Promise<{ ids: Set<string>; families: Set<string> }> {
  const { data } = await createClient()
    .from("tests")
    .select("questions_json")
    .eq("user_id", userId)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false })
    .limit(RECENT_TESTS);

  const ids = new Set<string>();
  const families = new Set<string>();
  for (const row of (data ?? []) as Array<{ questions_json: unknown }>) {
    const asked = Array.isArray(row.questions_json) ? (row.questions_json as DBMcq[]) : [];
    for (const q of asked) {
      if (!q?.id) continue;
      ids.add(q.id);
      families.add(familyOf(q));
    }
  }
  return { ids, families };
}

// Picks up to `count` questions, at most one per family, preferring in order:
// families the student hasn't met recently, then an unseen version of a family
// they have met, then anything. Returned already shuffled (questions and options).
function pickByFamily(pool: DBMcq[], count: number, recent: { ids: Set<string>; families: Set<string> }): DBMcq[] {
  const byFamily = new Map<string, DBMcq[]>();
  for (const q of pool) {
    const f = familyOf(q);
    const list = byFamily.get(f) ?? [];
    list.push(q);
    byFamily.set(f, list);
  }

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const tiers: DBMcq[][] = [[], [], []];
  for (const [family, members] of shuffle([...byFamily])) {
    const unseen = members.filter((m) => !recent.ids.has(m.id));
    if (!recent.families.has(family)) {
      tiers[0].push(shuffle(members)[0]);
    } else if (unseen.length > 0) {
      tiers[1].push(shuffle(unseen)[0]); // a different wording of a familiar question
    } else {
      tiers[2].push(shuffle(members)[0]);
    }
  }

  const picked = [...tiers[0], ...tiers[1], ...tiers[2]].slice(0, count);
  return shuffleMcqs(picked);
}

const distinctFamilies = (pool: DBMcq[]) => new Set(pool.map(familyOf)).size;

export async function buildTest(opts: {
  userId: string;
  subjectId: string;
  count: number;
  difficulty: McqDifficulty;
  // Restrict to these chapters. Empty or omitted means the whole book.
  chapterIds?: string[];
  // Only used by the last-resort AI top-up; omit and the top-up is skipped.
  aiKey?: string;
}): Promise<BuiltTest> {
  const count = Math.min(Math.max(Math.round(opts.count), 1), 30);
  if (!isSupabaseConfigured()) return { mcqs: [], source: "short" };

  let chapterIds = opts.chapterIds ?? [];
  if (chapterIds.length === 0) {
    const all = cachedSubjectChapters(opts.subjectId) ?? (await listSubjectChapters(opts.subjectId).catch(() => []));
    chapterIds = all.map((c) => c.id);
  }
  if (chapterIds.length === 0) return { mcqs: [], source: "short" };

  const supabase = createClient();
  const [lo, hi] = BANDS[opts.difficulty];

  const inBand = async (min: number, max: number): Promise<DBMcq[]> => {
    const { data } = await supabase
      .from("questions")
      .select("id, stem_md, options_json, answer_key_md, difficulty, family, explanation_md")
      .in("chapter_id", chapterIds)
      .eq("type", "mcq")
      .gte("difficulty", min)
      .lte("difficulty", max);
    return ((data ?? []) as QuestionRow[]).map(toMcq).filter((q): q is DBMcq => q !== null);
  };

  const banded = await inBand(lo, hi);
  const recent = await recentHistory(opts.userId, opts.subjectId);

  // 1. The normal path: enough distinct in-band families the student hasn't
  //    just met.
  const freshFamilies = new Set(banded.filter((q) => !recent.families.has(familyOf(q))).map(familyOf));
  if (freshFamilies.size >= count) return { mcqs: pickByFamily(banded, count, recent), source: "bank" };

  // 2. Let familiar families back in — preferring versions not yet seen.
  if (distinctFamilies(banded) >= count) return { mcqs: pickByFamily(banded, count, recent), source: "bank-relaxed" };

  // 3. Widen to the whole difficulty range — better a slightly off-band
  //    question from the real bank than a generated one.
  const all = await inBand(1, 5);
  if (distinctFamilies(all) >= count) {
    // Keep in-band questions first so the widening only fills the gap.
    const bandedIds = new Set(banded.map((q) => q.id));
    const inBandPick = pickByFamily(banded, count, recent);
    const used = new Set(inBandPick.map(familyOf));
    const rest = pickByFamily(
      all.filter((q) => !bandedIds.has(q.id) && !used.has(familyOf(q))),
      count - inBandPick.length,
      recent,
    );
    return { mcqs: shuffleMcqs([...inBandPick, ...rest]), source: "bank-widened" };
  }

  // 4. Last resort: generate the shortfall from real textbook content. Only
  //    possible for a chapter that has content_chunks seeded.
  const have = pickByFamily(all, count, recent);
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

// The short label a test card shows for what the test covered.
export function scopeLabel(chapters: Array<{ seq: number }>, totalChapters: number): string {
  if (chapters.length === 0 || chapters.length === totalChapters) return "Whole book";
  const seqs = chapters.map((c) => c.seq).sort((a, b) => a - b);
  if (seqs.length === 1) return `Chapter ${seqs[0]}`;
  if (seqs.length <= 4) return `Ch ${seqs.join(", ")}`;
  return `${seqs.length} chapters`;
}
