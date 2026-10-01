"use client";

// The chapter lists behind the test pickers, and the label a test card shows
// for what it covered.
//
// Tests themselves are built on the server by create_test
// (supabase/security.sql), straight from the `questions` bank — no API call,
// and the browser never sees an answer before submitting. Variety comes from
// question families (at most one version of a question per test), memory (the
// student's last five tests of the subject are avoided), and shuffling of both
// questions and options.

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { readCache, retry, timeoutSignal, writeCache } from "@/lib/net";

export interface SubjectChapter {
  id: string;
  seq: number;
  title: string;
  mcqCount: number; // answerable MCQs, variants included
}

// The subject's chapters in book order, with how many answerable MCQs each has,
// for the chapter pickers. Throws if any of its three reads fails — a failed
// count must never be shown as "0 questions" — and retries a slow connection a
// few times first. A good answer is kept on the device for next time.
export async function listSubjectChapters(subjectId: string): Promise<SubjectChapter[]> {
  if (!isSupabaseConfigured()) return [];
  const rows = await retry(async () => {
    const supabase = createClient();
    const signal = timeoutSignal();
    const withSignal = <Q extends { abortSignal: (s: AbortSignal) => Q }>(q: Q): Q => (signal ? q.abortSignal(signal) : q);

    const books = await withSignal(supabase.from("books").select("id").eq("subject_id", subjectId));
    if (books.error) throw new Error(books.error.message);
    const bookIds = ((books.data ?? []) as Array<{ id: string }>).map((b) => b.id);
    if (bookIds.length === 0) throw new Error("no books");

    const chapters = await withSignal(supabase.from("chapters").select("id, seq, title").in("book_id", bookIds).order("seq"));
    if (chapters.error) throw new Error(chapters.error.message);
    const list = (chapters.data ?? []) as Array<{ id: string; seq: number; title: string }>;
    if (list.length === 0) throw new Error("no chapters");

    const counts = await withSignal(
      supabase.rpc("chapter_question_counts", { p_chapter_ids: list.map((r) => r.id) }),
    );
    if (counts.error) throw new Error(counts.error.message);
    const countById = new Map(
      ((counts.data ?? []) as Array<{ chapter_id: string; mcq_count: number }>).map((c) => [c.chapter_id, Number(c.mcq_count)]),
    );
    return list.map((r) => ({ id: r.id, seq: r.seq, title: r.title, mcqCount: countById.get(r.id) ?? 0 }));
  });
  writeCache(`chapters:${subjectId}`, rows);
  return rows;
}

// The last good chapter list for a subject on this device, if any.
export function cachedSubjectChapters(subjectId: string): SubjectChapter[] | null {
  return readCache<SubjectChapter[]>(`chapters:${subjectId}`);
}

// The short label a test card shows for what the test covered.
export function scopeLabel(chapters: Array<{ seq: number }>, totalChapters: number): string {
  if (chapters.length === 0 || chapters.length === totalChapters) return "Whole book";
  const seqs = chapters.map((c) => c.seq).sort((a, b) => a - b);
  if (seqs.length === 1) return `Chapter ${seqs[0]}`;
  if (seqs.length <= 4) return `Ch ${seqs.join(", ")}`;
  return `${seqs.length} chapters`;
}
