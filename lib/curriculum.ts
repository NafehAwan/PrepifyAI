"use client";

// Client-side reads of the real curriculum from Supabase (public-read under RLS).
// Every function degrades to null/[] when Supabase isn't configured or a query
// fails, so the UI can fall back to demo content.

import { createClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";

export interface DBSubject {
  id: string;
  name: string;
}

export interface DBTopic {
  id: string;
  seq: number;
  title: string;
  estMinutes: number | null;
}

export interface DBChapter {
  id: string;
  seq: number;
  title: string;
  topics: DBTopic[];
}

export interface DBSlo {
  code: string;
  statement: string;
  contentMd: string;
}

export interface DBMcq {
  id: string;
  stem: string;
  options: string[];
  answer: number; // index of the correct option
}

export interface DBTopicContent {
  id: string;
  title: string;
  chapterTitle: string;
  subjectName: string;
  classLevel: number;
  slos: DBSlo[];
  mcqs: DBMcq[];
}

function letterToIndex(letter: string | null): number {
  const i = "ABCD".indexOf((letter ?? "").trim().toUpperCase());
  return i < 0 ? 0 : i;
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

// Chapters (with their topics) for a subject's book, ordered by sequence.
export async function getChapters(subjectId: string): Promise<DBChapter[]> {
  if (!isSupabaseConfigured() || !subjectId) return [];
  try {
    const supabase = createClient();
    const { data: books } = await supabase.from("books").select("id").eq("subject_id", subjectId);
    const bookIds = (books ?? []).map((b) => (b as { id: string }).id);
    if (bookIds.length === 0) return [];

    const { data: chapterRows } = await supabase
      .from("chapters")
      .select("id, seq, title")
      .in("book_id", bookIds)
      .order("seq");
    const chapters = (chapterRows ?? []) as Array<{ id: string; seq: number; title: string }>;
    if (chapters.length === 0) return [];

    const { data: topicRows } = await supabase
      .from("topics")
      .select("id, chapter_id, seq, title, est_minutes")
      .in("chapter_id", chapters.map((c) => c.id))
      .order("seq");
    const topics = (topicRows ?? []) as Array<{ id: string; chapter_id: string; seq: number; title: string; est_minutes: number | null }>;

    return chapters.map((c) => ({
      id: c.id,
      seq: c.seq,
      title: c.title,
      topics: topics
        .filter((t) => t.chapter_id === c.id)
        .map((t) => ({ id: t.id, seq: t.seq, title: t.title, estMinutes: t.est_minutes })),
    }));
  } catch {
    return [];
  }
}

// Full teaching + testing payload for one topic: SLOs with their content chunks,
// plus the topic's MCQ bank.
export async function getTopicContent(topicId: string): Promise<DBTopicContent | null> {
  if (!isSupabaseConfigured() || !topicId) return null;
  try {
    const supabase = createClient();

    const { data: topic } = await supabase
      .from("topics")
      .select("id, title, chapter_id")
      .eq("id", topicId)
      .maybeSingle();
    if (!topic) return null;
    const t = topic as { id: string; title: string; chapter_id: string };

    const { data: chapter } = await supabase
      .from("chapters")
      .select("title, book_id")
      .eq("id", t.chapter_id)
      .maybeSingle();
    const ch = (chapter ?? { title: "", book_id: "" }) as { title: string; book_id: string };

    let subjectName = "";
    let classLevel = 9;
    if (ch.book_id) {
      const { data: book } = await supabase
        .from("books")
        .select("class_level, subject_id")
        .eq("id", ch.book_id)
        .maybeSingle();
      const b = book as { class_level: number; subject_id: string } | null;
      if (b) {
        classLevel = b.class_level;
        const { data: subj } = await supabase.from("subjects").select("name").eq("id", b.subject_id).maybeSingle();
        subjectName = (subj as { name: string } | null)?.name ?? "";
      }
    }

    const { data: sloRows } = await supabase
      .from("slos")
      .select("id, code, statement")
      .eq("topic_id", topicId)
      .order("code");
    const slos = (sloRows ?? []) as Array<{ id: string; code: string; statement: string }>;
    const sloIds = slos.map((s) => s.id);

    const chunkBySlo = new Map<string, string>();
    let mcqs: DBMcq[] = [];
    if (sloIds.length > 0) {
      const { data: chunkRows } = await supabase
        .from("content_chunks")
        .select("slo_id, content_md, seq")
        .in("slo_id", sloIds)
        .order("seq");
      for (const row of (chunkRows ?? []) as Array<{ slo_id: string; content_md: string }>) {
        chunkBySlo.set(row.slo_id, (chunkBySlo.get(row.slo_id) ?? "") + row.content_md + "\n");
      }

      const { data: mcqRows } = await supabase
        .from("questions")
        .select("id, stem_md, options_json, answer_key_md")
        .eq("type", "mcq")
        .in("slo_id", sloIds);
      mcqs = ((mcqRows ?? []) as Array<{ id: string; stem_md: string; options_json: string[] | null; answer_key_md: string | null }>).map((q) => ({
        id: q.id,
        stem: q.stem_md,
        options: q.options_json ?? [],
        answer: letterToIndex(q.answer_key_md),
      }));
    }

    return {
      id: t.id,
      title: t.title,
      chapterTitle: ch.title,
      subjectName,
      classLevel,
      slos: slos.map((s) => ({ code: s.code, statement: s.statement, contentMd: (chunkBySlo.get(s.id) ?? "").trim() })),
      mcqs,
    };
  } catch {
    return null;
  }
}

// Build the RAG ground-truth string + SLO list the tutor route expects.
export function toTeachContext(content: DBTopicContent) {
  const groundTruth = content.slos
    .map((s) => `(SLO ${s.code}) ${s.statement}\n${s.contentMd}`)
    .join("\n\n");
  const sloList = content.slos.map((s) => `${s.code} ${s.statement}`).join("; ");
  return {
    subject: content.subjectName || "Physics",
    classLevel: content.classLevel,
    medium: "English",
    level: "Developing",
    sloList,
    groundTruth,
  };
}
