"use client";

// Client-side reads of the curriculum from Supabase (public-read under RLS).
// Since Prepify became an MCQ test maker, only the subject list is read here.
// Everything degrades to null/[] when Supabase isn't configured or a query
// fails, so the UI can fall back to demo content.

import { createClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";
import { readCache, retry, timeoutSignal, writeCache } from "./net";

export interface DBSubject {
  id: string;
  name: string;
}

export interface DBMcq {
  id: string;
  stem: string;
  options: string[];
  answer: number; // index of the correct option
  explanation?: string; // released with the answer once a test is submitted
  // Every reworded / re-valued version of one original question shares a
  // family, so a test never asks two versions of the same thing.
  family?: string | null;
}

// The subject list rarely changes, so it is kept on the device: a returning
// student gets it instantly (refreshed quietly in the background), and a slow
// connection is retried rather than showing an empty list.
let subjectsInFlight: Promise<DBSubject[]> | null = null;

function fetchSubjects(): Promise<DBSubject[]> {
  if (!subjectsInFlight) {
    subjectsInFlight = retry(async () => {
      const q = createClient().from("subjects").select("id, name").order("name");
      const signal = timeoutSignal();
      const { data, error } = await (signal ? q.abortSignal(signal) : q);
      if (error || !data || data.length === 0) throw new Error(error?.message ?? "no subjects");
      return data as DBSubject[];
    })
      .then((rows) => {
        writeCache("subjects", rows);
        return rows;
      })
      .finally(() => {
        subjectsInFlight = null;
      });
  }
  return subjectsInFlight;
}

export async function listSubjects(): Promise<DBSubject[]> {
  if (!isSupabaseConfigured()) return [];
  const cached = readCache<DBSubject[]>("subjects");
  if (cached && cached.length > 0) {
    void fetchSubjects().catch(() => undefined); // keep the copy fresh
    return cached;
  }
  try {
    return await fetchSubjects();
  } catch {
    return [];
  }
}

// A subject's id from its name ("Physics" → uuid), or null when it can't be
// found. Screens use it when they were opened with only the name — a web
// address like /subjects/physics, or a card tapped before the list loaded.
export async function subjectIdByName(name: string): Promise<string | null> {
  const rows = await listSubjects();
  return rows.find((r) => r.name === name)?.id ?? null;
}

export async function subjectNameById(id: string): Promise<string | null> {
  const rows = await listSubjects();
  return rows.find((r) => r.id === id)?.name ?? null;
}
