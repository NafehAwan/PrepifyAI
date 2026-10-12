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
  kind: "test" | "mock";
  timeLimitMin: number | null; // mocks only
  deadline: string | null; // mocks only: when the clock runs out (server time)
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
  kind?: string | null;
  time_limit_min?: number | null;
  deadline?: string | null;
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
    kind: r.kind === "mock" ? "mock" : "test",
    timeLimitMin: r.time_limit_min ?? null,
    deadline: r.deadline ?? null,
  };
}

const CARD_COLUMNS =
  "id, seq, title, difficulty, question_count, correct_count, score_pct, remarks, status, scope, created_at, submitted_at, kind, time_limit_min, deadline";

// The test name is generated, never typed: "Test #01" numbered per subject.
export function titleForSeq(seq: number): string {
  return `Test #${String(seq).padStart(2, "0")}`;
}

// A subject's tests (not its mock exams, which have their own screen).
export async function listTests(userId: string, subjectId: string): Promise<TestRow[]> {
  return listByKind(userId, subjectId, "test");
}

// A subject's mock exams, newest first.
export async function listMocks(userId: string, subjectId: string): Promise<TestRow[]> {
  return listByKind(userId, subjectId, "mock");
}

async function listByKind(userId: string, subjectId: string, kind: "test" | "mock"): Promise<TestRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await createClient()
    .from("tests")
    .select(CARD_COLUMNS)
    .eq("user_id", userId)
    .eq("subject_id", subjectId)
    .eq("kind", kind)
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
  // A mock handed in well after its deadline: marked with no answers.
  late: boolean;
}

// Marks a submission on the server against the hidden key (submit_test).
// Unanswered questions count as wrong, matching how the board marks a paper.
// Submitting twice returns the first result.
export async function submitTest(testId: string, answers: (number | null)[]): Promise<SubmitResult | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await createClient().rpc("submit_test", { p_test_id: testId, p_answers: answers });
  if (error || !data) return null;
  const r = data as { correctCount: number; scorePct: number; remarks: string; late?: boolean };
  return { correctCount: Number(r.correctCount), scorePct: Number(r.scorePct), remarks: String(r.remarks), late: r.late === true };
}

// --- Mock exams (supabase/mock.sql) ---------------------------------------

// Mock exams draw only on the mock pool. Each chapter that has pool questions,
// with how many different questions it can ask.
export interface MockChapter {
  subjectId: string;
  subjectName: string;
  chapterId: string;
  seq: number;
  title: string;
  mcqCount: number;
}

export const MOCK_MAX_QUESTIONS = 60;

export async function getMockPool(): Promise<MockChapter[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await createClient().rpc("mock_pool");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<{ subject_id: string; subject_name: string; chapter_id: string; seq: number; title: string; mcq_count: number }>).map(
    (r) => ({ subjectId: r.subject_id, subjectName: r.subject_name, chapterId: r.chapter_id, seq: r.seq, title: r.title, mcqCount: Number(r.mcq_count) }),
  );
}

// Builds a timed mock on the server. The clock starts now; the server keeps
// the deadline and won't accept answers sent long after it.
export async function startMock(opts: {
  subjectId: string;
  chapterIds: string[]; // empty = every mock chapter
  count: number;
  minutes: number;
}): Promise<StartTestResult> {
  if (!isSupabaseConfigured()) return { error: "failed" };
  const { data, error } = await createClient().rpc("create_mock", {
    p_subject_id: opts.subjectId,
    p_chapter_ids: opts.chapterIds.length > 0 ? opts.chapterIds : null,
    p_count: Math.min(Math.max(Math.round(opts.count), 1), MOCK_MAX_QUESTIONS),
    p_minutes: Math.min(Math.max(Math.round(opts.minutes), 5), 180),
  });
  if (error) {
    if (/no questions available/i.test(error.message)) return { error: "empty" };
    if (/daily test limit/i.test(error.message)) return { error: "limit" };
    return { error: "failed" };
  }
  const r = data as { id?: string; questionCount?: number; requested?: number } | null;
  if (!r?.id) return { error: "failed" };
  return { id: r.id, questionCount: Number(r.questionCount ?? 0), requested: Number(r.requested ?? opts.count) };
}
