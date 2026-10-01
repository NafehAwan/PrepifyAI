"use client";

// Reads the `tests` table and starts/submits tests through the database
// functions in supabase/security.sql. Owner-only RLS means the browser client
// can only ever see the signed-in student's own rows (and can't write them at
// all), so no query here filters on user_id for safety — it does so to keep the
// indexes useful.

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
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
  scope: string | null; // "Whole book", "Chapter 7", "Ch 2, 5"
  createdAt: string;
  submittedAt: string | null;
}

export interface TestDetail extends TestRow {
  subjectId: string;
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
  scope: string | null;
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
    scope: r.scope ?? null,
    createdAt: r.created_at,
    submittedAt: r.submitted_at,
  };
}

const CARD_COLUMNS =
  "id, seq, title, difficulty, question_count, correct_count, score_pct, remarks, status, scope, created_at, submitted_at";

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
    .select(`${CARD_COLUMNS}, subject_id, questions_json, answers_json`)
    .eq("id", testId)
    .maybeSingle();
  if (!data) return null;
  const raw = data as RawTest & { subject_id: string };
  return {
    ...toRow(raw),
    subjectId: raw.subject_id,
    // Before submitting, questions carry no answer (the key is on the server).
    mcqs: Array.isArray(raw.questions_json)
      ? (raw.questions_json as DBMcq[]).map((q) => ({ ...q, answer: typeof q.answer === "number" ? q.answer : -1 }))
      : [],
    answers: Array.isArray(raw.answers_json) ? (raw.answers_json as (number | null)[]) : [],
  };
}

// Builds and saves a new test on the server (supabase/security.sql:
// create_test). The questions arrive without their answers; the key stays in
// the database until the test is submitted, so it can't be read mid-test.
export type StartTestResult =
  | { id: string; questionCount: number; requested: number }
  | { error: "empty" | "limit" | "failed" };

export async function startTest(opts: {
  subjectId: string;
  difficulty: McqDifficulty;
  count: number;
  // Restrict to these chapters. Empty or omitted means the whole book.
  chapterIds?: string[];
  scope?: string;
}): Promise<StartTestResult> {
  if (!isSupabaseConfigured()) return { error: "failed" };
  const { data, error } = await createClient().rpc("create_test", {
    p_subject_id: opts.subjectId,
    p_chapter_ids: opts.chapterIds && opts.chapterIds.length > 0 ? opts.chapterIds : null,
    p_difficulty: opts.difficulty,
    p_count: Math.min(Math.max(Math.round(opts.count), 1), 30),
    p_scope: opts.scope ?? "Whole book",
  });
  if (error) {
    if (/no questions available|no chapters/i.test(error.message)) return { error: "empty" };
    if (/daily test limit/i.test(error.message)) return { error: "limit" };
    return { error: "failed" };
  }
  const r = data as { id?: string; questionCount?: number; requested?: number } | null;
  if (!r?.id) return { error: "failed" };
  return { id: r.id, questionCount: Number(r.questionCount ?? 0), requested: Number(r.requested ?? opts.count) };
}

export interface SubmitResult {
  correctCount: number;
  scorePct: number;
  remarks: string;
}

// Marks a submission on the server against the hidden key (submit_test).
// Unanswered questions count as wrong, matching how the board marks a paper.
// Submitting twice returns the first result.
export async function submitTest(testId: string, answers: (number | null)[]): Promise<SubmitResult | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await createClient().rpc("submit_test", { p_test_id: testId, p_answers: answers });
  if (error || !data) return null;
  const r = data as { correctCount: number; scorePct: number; remarks: string };
  return { correctCount: Number(r.correctCount), scorePct: Number(r.scorePct), remarks: String(r.remarks) };
}
