"use client";

// Reads and writes the `tests` table. Owner-only RLS means the browser client
// can only ever see the signed-in student's own rows, so no query here filters
// on user_id for safety — it does so to keep the indexes useful.

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { remarkFor } from "./build";
import type { DBMcq } from "@/lib/curriculum";
import type { McqDifficulty } from "@/lib/ai/prompts";

export interface TestRow {
  id: string;
  seq: number;
  title: string;
  difficulty: McqDifficulty;
  questionCount: number;
  correctCount: number | null;
  scorePct: number | null;
  remarks: string | null;
  status: string;
  createdAt: string;
  submittedAt: string | null;
}

export interface TestDetail extends TestRow {
  mcqs: DBMcq[];
  answers: (number | null)[];
}

interface RawTest {
  id: string;
  seq: number;
  title: string;
  difficulty: string;
  question_count: number;
  correct_count: number | null;
  score_pct: number | null;
  remarks: string | null;
  status: string;
  created_at: string;
  submitted_at: string | null;
  questions_json?: unknown;
  answers_json?: unknown;
}

function toRow(r: RawTest): TestRow {
  return {
    id: r.id,
    seq: r.seq,
    title: r.title,
    difficulty: r.difficulty as McqDifficulty,
    questionCount: r.question_count,
    correctCount: r.correct_count,
    scorePct: r.score_pct === null ? null : Number(r.score_pct),
    remarks: r.remarks,
    status: r.status,
    createdAt: r.created_at,
    submittedAt: r.submitted_at,
  };
}

const CARD_COLUMNS =
  "id, seq, title, difficulty, question_count, correct_count, score_pct, remarks, status, created_at, submitted_at";

// The test name is generated, never typed: "Test #01" numbered per subject.
export function titleForSeq(seq: number): string {
  return `Test #${String(seq).padStart(2, "0")}`;
}

export async function listTests(userId: string, subjectId: string): Promise<TestRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await createClient()
    .from("tests")
    .select(CARD_COLUMNS)
    .eq("user_id", userId)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as RawTest[]).map(toRow);
}

// Every test the student has taken, newest first — powers Home and Progress.
export async function listAllTests(userId: string): Promise<Array<TestRow & { subjectId: string }>> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await createClient()
    .from("tests")
    .select(`${CARD_COLUMNS}, subject_id`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as Array<RawTest & { subject_id: string }>).map((r) => ({
    ...toRow(r),
    subjectId: r.subject_id,
  }));
}

export async function getTest(testId: string): Promise<TestDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await createClient()
    .from("tests")
    .select(`${CARD_COLUMNS}, questions_json, answers_json`)
    .eq("id", testId)
    .maybeSingle();
  if (!data) return null;
  const raw = data as RawTest;
  return {
    ...toRow(raw),
    mcqs: Array.isArray(raw.questions_json) ? (raw.questions_json as DBMcq[]) : [],
    answers: Array.isArray(raw.answers_json) ? (raw.answers_json as (number | null)[]) : [],
  };
}

// Creates the row for a freshly built test. `seq` is one past the student's
// highest for this subject; a unique (user_id, subject_id, seq) constraint means
// two tabs racing produce a duplicate-key error rather than two "Test #03"s, so
// the insert is retried with the next number.
export async function createTest(opts: {
  userId: string;
  subjectId: string;
  difficulty: McqDifficulty;
  mcqs: DBMcq[];
}): Promise<TestRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();

  const { data: last } = await supabase
    .from("tests")
    .select("seq")
    .eq("user_id", opts.userId)
    .eq("subject_id", opts.subjectId)
    .order("seq", { ascending: false })
    .limit(1);
  let seq = (((last ?? []) as Array<{ seq: number }>)[0]?.seq ?? 0) + 1;

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from("tests")
      .insert({
        user_id: opts.userId,
        subject_id: opts.subjectId,
        seq,
        title: titleForSeq(seq),
        difficulty: opts.difficulty,
        question_count: opts.mcqs.length,
        questions_json: opts.mcqs,
        status: "in_progress",
      })
      .select(CARD_COLUMNS)
      .maybeSingle();

    if (!error && data) return toRow(data as RawTest);
    // 23505 = unique violation: another tab took this number.
    if (error?.code !== "23505") return null;
    seq++;
  }
  return null;
}

export interface SubmitResult {
  correctCount: number;
  scorePct: number;
  remarks: string;
}

// Grades and stores a submission. Unanswered questions count as wrong, matching
// how the board marks a paper.
export async function submitTest(
  testId: string,
  mcqs: DBMcq[],
  answers: (number | null)[],
): Promise<SubmitResult | null> {
  const correctCount = mcqs.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
  const scorePct = mcqs.length === 0 ? 0 : Math.round((correctCount / mcqs.length) * 100);
  const remarks = remarkFor(scorePct);

  if (isSupabaseConfigured()) {
    const { error } = await createClient()
      .from("tests")
      .update({
        answers_json: answers,
        correct_count: correctCount,
        score_pct: scorePct,
        remarks,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", testId);
    if (error) return null;
  }
  return { correctCount, scorePct, remarks };
}
