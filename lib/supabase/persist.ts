"use client";

import { createClient } from "./client";
import { isSupabaseConfigured } from "./config";
import { CLASS_TO_LEVEL, toDbMode } from "@/lib/mappings";
import type { AppState } from "@/lib/types";

// These run from the browser and rely on RLS (owner-only) to keep writes safe.
// All are no-ops when Supabase isn't configured, so the demo is unaffected.

export async function persistProfile(s: AppState): Promise<void> {
  if (!s.supabaseConfigured) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").upsert({
    id: user.id,
    class_level: CLASS_TO_LEVEL[s.cls] ?? null,
    exam_date: s.examDate,
    mode: toDbMode(s.mode),
    medium: s.lang === "UR" ? "urdu" : "english",
    locale: s.lang === "UR" ? "ur" : "en",
  });
}

export async function persistEnrollments(s: AppState): Promise<void> {
  if (!s.supabaseConfigured) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Resolve the selected subject names to seeded subject ids, then make the
  // user's enrolments match the current selection.
  const { data: subjects } = await supabase.from("subjects").select("id, name").in("name", s.subs);
  const rows = (subjects ?? []).map((r) => ({ user_id: user.id, subject_id: (r as { id: string }).id }));

  await supabase.from("enrollments").delete().eq("user_id", user.id);
  if (rows.length > 0) await supabase.from("enrollments").insert(rows);
}

// Records the outcome of a topic's mastery quiz. Returns true when the result
// was saved to the user's account, false when it stayed local (demo mode or not
// signed in) — the caller uses that to tell the student whether it persisted.
export async function persistTopicProgress(
  topicId: string,
  result: { scorePct: number; passed: boolean },
): Promise<boolean> {
  if (!isSupabaseConfigured() || !topicId) return false;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // Bump the attempt counter off the current value (no RPC needed).
  const { data: existing } = await supabase
    .from("topic_progress")
    .select("attempts")
    .eq("user_id", user.id)
    .eq("topic_id", topicId)
    .maybeSingle();
  const attempts = ((existing as { attempts: number } | null)?.attempts ?? 0) + 1;

  const now = new Date().toISOString();
  const { error } = await supabase.from("topic_progress").upsert(
    {
      user_id: user.id,
      topic_id: topicId,
      status: result.passed ? "completed" : "tested",
      mcq_score: result.scorePct,
      mcq_passed: result.passed,
      attempts,
      taught_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,topic_id" },
  );
  return !error;
}
