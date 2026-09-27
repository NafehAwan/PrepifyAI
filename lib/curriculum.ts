"use client";

// Client-side reads of the curriculum from Supabase (public-read under RLS).
// Since Prepify became an MCQ test maker, only two things are read from here:
// the subject list, and a chapter's SLO text for the last-resort AI top-up.
// Everything degrades to null/[] when Supabase isn't configured or a query
// fails, so the UI can fall back to demo content.

import { createClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";

export interface DBSubject {
  id: string;
  name: string;
}

export interface DBMcq {
  id: string;
  stem: string;
  options: string[];
  answer: number; // index of the correct option
  explanation?: string; // present on AI-generated questions
}

export async function listSubjects(): Promise<DBSubject[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createClient();
    const { data } = await supabase.from("subjects").select("id, name").order("name");
    return (data ?? []) as DBSubject[];
  } catch {
    return [];
  }
}

// Combined grounding for a whole chapter (all its topics' SLO text), so the AI
// can generate a fresh test from the book. Null when the chapter has no content.
export interface ChapterGrounding {
  subject: string;
  classLevel: number;
  sloList: string;
  groundTruth: string;
}

export async function getChapterGrounding(chapterId: string): Promise<ChapterGrounding | null> {
  if (!isSupabaseConfigured() || !chapterId) return null;
  try {
    const supabase = createClient();

    const { data: chapter } = await supabase.from("chapters").select("book_id").eq("id", chapterId).maybeSingle();
    const bookId = (chapter as { book_id: string } | null)?.book_id;
    let subject = "";
    let classLevel = 9;
    if (bookId) {
      const { data: book } = await supabase.from("books").select("class_level, subject_id").eq("id", bookId).maybeSingle();
      const b = book as { class_level: number; subject_id: string } | null;
      if (b) {
        classLevel = b.class_level;
        const { data: subj } = await supabase.from("subjects").select("name").eq("id", b.subject_id).maybeSingle();
        subject = (subj as { name: string } | null)?.name ?? "";
      }
    }

    const { data: topicRows } = await supabase.from("topics").select("id").eq("chapter_id", chapterId);
    const topicIds = (topicRows ?? []).map((t) => (t as { id: string }).id);
    if (topicIds.length === 0) return null;

    const { data: sloRows } = await supabase.from("slos").select("id, code, statement").in("topic_id", topicIds).order("code");
    const slos = (sloRows ?? []) as Array<{ id: string; code: string; statement: string }>;
    if (slos.length === 0) return null;

    const { data: chunkRows } = await supabase.from("content_chunks").select("slo_id, content_md, seq").in("slo_id", slos.map((s) => s.id)).order("seq");
    const bySlo = new Map<string, string>();
    for (const c of (chunkRows ?? []) as Array<{ slo_id: string; content_md: string }>) {
      bySlo.set(c.slo_id, (bySlo.get(c.slo_id) ?? "") + c.content_md + "\n");
    }

    const groundTruth = slos.map((s) => `(SLO ${s.code}) ${s.statement}\n${(bySlo.get(s.id) ?? "").trim()}`).join("\n\n");
    const sloList = slos.map((s) => `${s.code} ${s.statement}`).join("; ");
    if (groundTruth.trim().length < 40) return null;
    return { subject: subject || "Physics", classLevel, sloList, groundTruth };
  } catch {
    return null;
  }
}
