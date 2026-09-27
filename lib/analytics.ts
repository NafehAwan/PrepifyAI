"use client";

// Dashboard analytics, derived from the student's submitted tests.
//
// This used to read `topic_progress` and compute topic mastery, which made
// sense when Prepify taught the textbook. Now that a test is the only thing a
// student does, every number here comes from the `tests` table instead.
//
// Everything is gated on being signed in with Supabase configured, so the demo
// build keeps rendering its sample figures.

import { createClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";
import { listSubjects } from "./curriculum";
import { listAllTests, type TestRow } from "./tests/store";

export interface SubjectStats {
  id: string;
  name: string;
  testsTaken: number;
  bestPct: number | null;
  lastPct: number | null;
  avgPct: number | null;
  grade: string;
}

// FBISE-style bands: map a score percentage to a predicted grade.
export function pctToGrade(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  if (pct >= 40) return "E";
  return "F";
}

export async function currentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const {
      data: { user },
    } = await createClient().auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// Per-subject test results for the signed-in student, keyed by subject name.
// Returns {} when signed out so the UI keeps its demo data. A subject the
// student has not tested yet still appears, with zero tests.
export async function getSubjectStats(enrolled: string[]): Promise<Record<string, SubjectStats>> {
  const userId = await currentUserId();
  if (!userId) return {};

  const subjects = await listSubjects();
  const wanted = subjects.filter((s) => enrolled.length === 0 || enrolled.includes(s.name));
  const tests = await listAllTests(userId);

  const bySubject = new Map<string, TestRow[]>();
  for (const t of tests) {
    if (t.scorePct === null) continue; // still in progress
    const list = bySubject.get(t.subjectId) ?? [];
    list.push(t);
    bySubject.set(t.subjectId, list);
  }

  const out: Record<string, SubjectStats> = {};
  for (const subj of wanted) {
    const done = bySubject.get(subj.id) ?? [];
    const scores = done.map((t) => t.scorePct as number);
    const best = scores.length ? Math.max(...scores) : null;
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    out[subj.name] = {
      id: subj.id,
      name: subj.name,
      testsTaken: done.length,
      bestPct: best,
      // listAllTests is newest-first, so the first entry is the latest result.
      lastPct: scores.length ? scores[0] : null,
      avgPct: avg,
      grade: avg === null ? "—" : pctToGrade(avg),
    };
  }
  return out;
}

// The subjects most in need of work: tested at least once, weakest average
// first. Subjects never tested are left out — there is nothing to say about them.
export function weakestSubjects(stats: Record<string, SubjectStats>, limit = 3): SubjectStats[] {
  return Object.values(stats)
    .filter((s) => s.avgPct !== null)
    .sort((a, b) => (a.avgPct as number) - (b.avgPct as number))
    .slice(0, limit);
}
