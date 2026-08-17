"use client";

import { createClient } from "./client";
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
