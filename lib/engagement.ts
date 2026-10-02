"use client";

// Question reports, per-chapter results, XP/streaks and the leaderboard —
// the browser side of supabase/engagement.sql. Everything is worked out in the
// database from submitted tests and finished challenges.

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// ---- Reports ----------------------------------------------------------------

export type ReportReason = "wrong_answer" | "typo" | "unclear" | "other";

export const REPORT_REASONS: Array<{ id: ReportReason; label: string }> = [
  { id: "wrong_answer", label: "Wrong answer" },
  { id: "typo", label: "Typo / mistake" },
  { id: "unclear", label: "Unclear question" },
  { id: "other", label: "Something else" },
];

export async function reportQuestion(opts: {
  questionId: string;
  reason: ReportReason;
  note: string;
  // Exactly what the student saw — options are shuffled per test.
  shown: { stem: string; options: string[]; markedAnswer: number; picked: number | null };
  source: "test" | "challenge";
}): Promise<"ok" | "limit" | "error"> {
  if (!isSupabaseConfigured()) return "error";
  const { data, error } = await createClient().rpc("report_question", {
    p_question_id: opts.questionId,
    p_reason: opts.reason,
    p_note: opts.note,
    p_shown: opts.shown,
    p_source: opts.source,
  });
  if (error) return "error";
  return data === "ok" ? "ok" : data === "limit" ? "limit" : "error";
}

// ---- Weak chapters ----------------------------------------------------------

export interface ChapterStat {
  subjectId: string;
  chapterId: string;
  seq: number;
  title: string;
  attempted: number;
  correct: number;
  pct: number;
}

// A chapter counts as weak once there's enough to judge (5+ questions answered)
// and the score is under 60%.
export const WEAK_MIN_ATTEMPTED = 5;
export const WEAK_BELOW_PCT = 60;

export async function listChapterStats(): Promise<ChapterStat[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await createClient().rpc("my_chapter_stats");
  if (error || !Array.isArray(data)) return [];
  return (data as Array<{ subject_id: string; chapter_id: string; seq: number; title: string; attempted: number; correct: number }>).map((r) => ({
    subjectId: r.subject_id,
    chapterId: r.chapter_id,
    seq: r.seq,
    title: r.title,
    attempted: r.attempted,
    correct: r.correct,
    pct: r.attempted > 0 ? Math.round((r.correct / r.attempted) * 100) : 0,
  }));
}

// Weakest first; only chapters with enough answers to judge.
export function weakChapters(stats: ChapterStat[]): ChapterStat[] {
  return stats
    .filter((c) => c.attempted >= WEAK_MIN_ATTEMPTED && c.pct < WEAK_BELOW_PCT)
    .sort((a, b) => a.pct - b.pct || b.attempted - a.attempted);
}

// ---- XP, streaks, leaderboard -------------------------------------------------

export interface MyStats {
  streak: number;
  xpWeek: number;
  xpTotal: number;
  wins: number;
}

export async function getMyStats(): Promise<MyStats | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await createClient().rpc("my_stats");
  if (error || !data) return null;
  return data as MyStats;
}

export interface LeaderRow {
  rank: number;
  name: string;
  xp: number;
  wins: number;
  papers: number;
  streak: number;
  isMe: boolean;
}

export interface Leaderboard {
  period: LeaderboardPeriod;
  rows: LeaderRow[];
  me: { rank: number | null; name: string; xp: number; wins: number; papers: number; streak: number; hidden: boolean; removed?: boolean };
}

// All time is the default view; Monthly counts from the 1st (Pakistan time).
export type LeaderboardPeriod = "all" | "month";

export async function getLeaderboard(period: LeaderboardPeriod): Promise<Leaderboard | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await createClient().rpc("leaderboard", { p_period: period });
  if (error || !data) return null;
  return data as Leaderboard;
}

export async function setHiddenFromLeaderboard(hidden: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase.from("profiles").update({ hide_from_leaderboard: hidden }).eq("id", user.id);
  return !error;
}
