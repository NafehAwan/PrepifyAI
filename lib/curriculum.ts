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

// ---------------------------------------------------------------------------
// Progress: the student's saved mastery per topic, and the derived per-topic
// state used to render the chapter tree (mastered / current / locked).
// ---------------------------------------------------------------------------

export interface DBTopicProgress {
  status: string; // locked | teaching | tested | completed
  mcqPassed: boolean;
  mcqScore: number | null;
}

// The signed-in student's saved progress for the given topics, keyed by topic id.
// Empty in demo mode or when signed out, so the tree falls back to "not started".
export async function getTopicProgress(topicIds: string[]): Promise<Record<string, DBTopicProgress>> {
  if (!isSupabaseConfigured() || topicIds.length === 0) return {};
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return {};

    const { data } = await supabase
      .from("topic_progress")
      .select("topic_id, status, mcq_passed, mcq_score")
      .eq("user_id", user.id)
      .in("topic_id", topicIds);

    const map: Record<string, DBTopicProgress> = {};
    for (const r of (data ?? []) as Array<{ topic_id: string; status: string; mcq_passed: boolean; mcq_score: number | null }>) {
      map[r.topic_id] = { status: r.status, mcqPassed: r.mcq_passed, mcqScore: r.mcq_score };
    }
    return map;
  } catch {
    return {};
  }
}

export type TopicMastery = "done" | "now" | "open" | "locked";

export interface MasteryResult {
  states: Record<string, TopicMastery>;
  counts: { mastered: number; inProgress: number; notStarted: number };
}

// Derive each topic's tree state from saved progress. In guided mode a topic is
// locked until every topic before it (in chapter → topic order) is passed; in
// free-roam every topic is open. Pure function so the UI can render directly.
export function computeTopicStates(
  chapters: DBChapter[],
  progress: Record<string, DBTopicProgress>,
  guided: boolean,
): MasteryResult {
  const states: Record<string, TopicMastery> = {};
  let mastered = 0;
  let inProgress = 0;
  let notStarted = 0;
  let gate = true; // true while every preceding topic has been passed

  for (const c of chapters) {
    for (const t of c.topics) {
      const p = progress[t.id];
      const passed = !!p?.mcqPassed;
      const attempted = !!p && !passed;
      const unlocked = guided ? gate : true;

      let st: TopicMastery;
      if (passed) {
        st = "done";
        mastered++;
      } else if (!unlocked) {
        st = "locked";
        notStarted++;
      } else if (attempted) {
        st = "now";
        inProgress++;
      } else {
        st = "open";
        notStarted++;
      }
      states[t.id] = st;
      gate = gate && passed;
    }
  }
  return { states, counts: { mastered, inProgress, notStarted } };
}

// ---------------------------------------------------------------------------
// Chapter tests: the full FBISE-style paper (MCQ + short + long) assembled from
// the DB question bank, and the student's saved chapter results.
// ---------------------------------------------------------------------------

export interface DBWrittenQ {
  id: string;
  type: "short" | "long";
  stem: string;
  marks: number;
  markingScheme: string[];
  modelAnswer: string;
  sloCode: string | null;
}

export interface DBChapterTest {
  chapterId: string;
  chapterTitle: string;
  mcqs: DBMcq[];
  written: DBWrittenQ[];
}

// Assemble a chapter's test paper from the question bank: all MCQs (auto-scored)
// plus short/long questions with their marking schemes + model answers.
export async function getChapterTest(chapterId: string): Promise<DBChapterTest | null> {
  if (!isSupabaseConfigured() || !chapterId) return null;
  try {
    const supabase = createClient();

    const { data: ch } = await supabase.from("chapters").select("title").eq("id", chapterId).maybeSingle();
    const chapterTitle = (ch as { title: string } | null)?.title ?? "";

    const { data: qRows } = await supabase
      .from("questions")
      .select("id, type, stem_md, options_json, answer_key_md, marking_scheme_json, marks, slo_id")
      .eq("chapter_id", chapterId);
    const rows = (qRows ?? []) as Array<{
      id: string; type: string; stem_md: string; options_json: string[] | null;
      answer_key_md: string | null; marking_scheme_json: string[] | null; marks: number; slo_id: string | null;
    }>;

    const mcqs: DBMcq[] = rows
      .filter((r) => r.type === "mcq")
      .map((r) => ({ id: r.id, stem: r.stem_md, options: r.options_json ?? [], answer: letterToIndex(r.answer_key_md) }));

    const writtenRows = rows.filter((r) => r.type === "short" || r.type === "long");
    const ids = writtenRows.map((r) => r.id);

    const modelById = new Map<string, string>();
    if (ids.length > 0) {
      const { data: ma } = await supabase.from("model_answers").select("question_id, exemplar_md").in("question_id", ids);
      for (const m of (ma ?? []) as Array<{ question_id: string; exemplar_md: string }>) modelById.set(m.question_id, m.exemplar_md);
    }

    const sloIds = [...new Set(writtenRows.map((r) => r.slo_id).filter((x): x is string => !!x))];
    const codeById = new Map<string, string>();
    if (sloIds.length > 0) {
      const { data: slos } = await supabase.from("slos").select("id, code").in("id", sloIds);
      for (const sl of (slos ?? []) as Array<{ id: string; code: string }>) codeById.set(sl.id, sl.code);
    }

    const written: DBWrittenQ[] = writtenRows
      .map((r) => ({
        id: r.id,
        type: r.type === "long" ? ("long" as const) : ("short" as const),
        stem: r.stem_md,
        marks: r.marks,
        markingScheme: r.marking_scheme_json ?? [],
        modelAnswer: modelById.get(r.id) ?? "",
        sloCode: r.slo_id ? codeById.get(r.slo_id) ?? null : null,
      }))
      .sort((a, b) => (a.type === b.type ? 0 : a.type === "short" ? -1 : 1));

    if (mcqs.length === 0 && written.length === 0) return null;
    return { chapterId, chapterTitle, mcqs, written };
  } catch {
    return null;
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

export interface DBChapterProgress {
  passed: boolean;
  bestPct: number;
}

// The signed-in student's saved chapter-test results, keyed by chapter id.
export async function getChapterProgress(chapterIds: string[]): Promise<Record<string, DBChapterProgress>> {
  if (!isSupabaseConfigured() || chapterIds.length === 0) return {};
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return {};

    const { data } = await supabase
      .from("chapter_progress")
      .select("chapter_id, passed, best_score_pct")
      .eq("user_id", user.id)
      .in("chapter_id", chapterIds);

    const map: Record<string, DBChapterProgress> = {};
    for (const r of (data ?? []) as Array<{ chapter_id: string; passed: boolean; best_score_pct: number | null }>) {
      map[r.chapter_id] = { passed: r.passed, bestPct: Math.round(r.best_score_pct ?? 0) };
    }
    return map;
  } catch {
    return {};
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
