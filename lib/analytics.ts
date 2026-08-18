"use client";

// Real analytics derived from the student's saved topic mastery. Everything is
// gated on being signed in with Supabase configured: getSubjectMastery returns
// {} otherwise, so the dashboard screens fall back to their demo numbers.

import { createClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";
import {
  listSubjects,
  getChapters,
  getTopicProgress,
  computeTopicStates,
  type TopicMastery,
} from "./curriculum";

export interface TopicCell {
  id: string;
  title: string;
  chapter: string;
  state: TopicMastery; // done | now | open (locked never occurs here — analytics ignore gating)
  score: number | null; // last mcq score %
}

export interface SubjectMastery {
  id: string;
  name: string;
  total: number;
  mastered: number;
  inProgress: number;
  pct: number; // mastery % = mastered / total
  grade: string; // predicted grade from pct
  topics: TopicCell[];
}

export interface WeakSpot {
  topicId: string;
  title: string;
  subject: string;
  chapter: string;
  scorePct: number;
}

// FBISE-style bands: map a mastery/score percentage to a predicted grade.
export function pctToGrade(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  if (pct >= 40) return "E";
  return "F";
}

async function currentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// Per-subject mastery for the signed-in student, keyed by subject name. Only
// includes subjects that have seeded topics; returns {} when signed out so the
// UI keeps demo data.
export async function getSubjectMastery(enrolled: string[]): Promise<Record<string, SubjectMastery>> {
  if (!(await currentUserId())) return {};

  const subjects = await listSubjects();
  const wanted = subjects.filter((s) => enrolled.length === 0 || enrolled.includes(s.name));

  const out: Record<string, SubjectMastery> = {};
  for (const subj of wanted) {
    const chapters = await getChapters(subj.id);
    const topicIds = chapters.flatMap((c) => c.topics.map((t) => t.id));
    if (topicIds.length === 0) continue; // not seeded → leave it on demo data

    const progress = await getTopicProgress(topicIds);
    const { states, counts } = computeTopicStates(chapters, progress, false);

    const topics: TopicCell[] = [];
    for (const c of chapters) {
      for (const t of c.topics) {
        topics.push({
          id: t.id,
          title: t.title,
          chapter: c.title,
          state: states[t.id] ?? "open",
          score: progress[t.id]?.mcqScore ?? null,
        });
      }
    }

    const pct = Math.round((counts.mastered / topicIds.length) * 100);
    out[subj.name] = {
      id: subj.id,
      name: subj.name,
      total: topicIds.length,
      mastered: counts.mastered,
      inProgress: counts.inProgress,
      pct,
      grade: pctToGrade(pct),
      topics,
    };
  }
  return out;
}

// Attempted-but-not-passed topics across the signed-in student's subjects,
// ranked by score (weakest first) — the real "weak spots" list.
export function weakSpotsFrom(mastery: Record<string, SubjectMastery>, limit = 6): WeakSpot[] {
  const spots: WeakSpot[] = [];
  for (const m of Object.values(mastery)) {
    for (const t of m.topics) {
      if (t.state === "now" && t.score !== null) {
        spots.push({ topicId: t.id, title: t.title, subject: m.name, chapter: t.chapter, scorePct: Math.round(t.score) });
      }
    }
  }
  spots.sort((a, b) => a.scorePct - b.scorePct);
  return spots.slice(0, limit);
}
