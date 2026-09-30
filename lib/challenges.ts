"use client";

// Friend challenges, from the browser's side. Every call goes through a
// security-definer function in supabase/challenges.sql — the challenge tables
// have no RLS policies, so the server decides what each player may see (no
// questions before the clock starts, no answer key until everyone is done).

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { McqDifficulty } from "@/lib/ai/prompts";

export interface ChallengePlayer {
  name: string;
  isMe: boolean;
  isHost: boolean;
  ready: boolean;
  submitted: boolean;
  // Only filled in for the caller, or for everyone once the challenge finishes.
  correct: number | null;
  scorePct: number | null;
  remarks: string | null;
  timeTakenSec: number | null;
}

export interface ChallengeQuestion {
  id: string;
  stem: string;
  options: string[];
}

export type ChallengeStatus = "lobby" | "running" | "finished" | "cancelled";

export interface ChallengeState {
  found: true;
  code: string;
  subjectId: string;
  subjectName: string;
  hostName: string | null;
  isHost: boolean;
  joined: boolean;
  scope: string;
  difficulty: McqDifficulty;
  questionCount: number;
  playerCount: number;
  timeLimitSec: number;
  status: ChallengeStatus;
  serverNow: string;
  startedAt: string | null;
  endsAt: string | null;
  createdAt: string;
  seq: number | null;
  players: ChallengePlayer[];
  questions: ChallengeQuestion[] | null;
  myAnswers: (number | null)[] | null;
  key: number[] | null;
  explanations: (string | null)[] | null;
}

export interface ChallengeCard {
  code: string;
  seq: number | null;
  status: ChallengeStatus;
  scope: string;
  difficulty: McqDifficulty;
  questionCount: number;
  playerCount: number;
  joinedCount: number;
  submitted: boolean;
  correct: number | null;
  scorePct: number | null;
  remarks: string | null;
  rank: number | null;
  createdAt: string;
}

// "Challenge #01", numbered per subject like tests are.
export function challengeTitle(seq: number | null): string {
  return seq ? `Challenge #${String(seq).padStart(2, "0")}` : "Challenge";
}

export function challengeLink(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/c/${code}`;
}

// Accepts a bare code or a pasted link and returns the code.
export function parseChallengeCode(input: string): string | null {
  const m = input.trim().toUpperCase().match(/([A-Z0-9]{6})\/?$/);
  return m ? m[1] : null;
}

export function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function rpcError(message: string | undefined): string {
  if (!message) return "Something went wrong. Check your connection and try again.";
  if (/no questions/i.test(message)) return "Those chapters don't have enough questions yet. Pick others, or use the whole book.";
  if (/not signed in/i.test(message)) return "Sign in first — challenges are saved to your account.";
  return "Something went wrong. Check your connection and try again.";
}

export async function createChallenge(opts: {
  subjectId: string;
  chapterIds: string[];
  scope: string;
  difficulty: McqDifficulty;
  questionCount: number;
  friends: number;
  timeLimitSec: number;
  displayName: string;
}): Promise<{ code: string } | { error: string }> {
  if (!isSupabaseConfigured()) return { error: "Challenges need an account — sign in first." };
  const { data, error } = await createClient().rpc("create_challenge", {
    p_subject_id: opts.subjectId,
    p_chapter_ids: opts.chapterIds,
    p_scope: opts.scope,
    p_difficulty: opts.difficulty,
    p_question_count: opts.questionCount,
    p_friends: opts.friends,
    p_time_limit_sec: opts.timeLimitSec,
    p_display_name: opts.displayName,
  });
  if (error || typeof data !== "string") return { error: rpcError(error?.message) };
  return { code: data };
}

export async function getChallengeState(code: string): Promise<ChallengeState | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await createClient().rpc("challenge_state", { p_code: code });
  if (error) throw new Error(error.message);
  const state = data as (ChallengeState | { found: false }) | null;
  return state && state.found ? state : null;
}

export async function joinChallenge(
  code: string,
  displayName: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { data, error } = await createClient().rpc("join_challenge", { p_code: code, p_display_name: displayName });
  if (error) return { ok: false, reason: "error" };
  return data as { ok: true } | { ok: false; reason: string };
}

export async function setChallengeReady(code: string, ready: boolean): Promise<boolean> {
  const { error } = await createClient().rpc("set_challenge_ready", { p_code: code, p_ready: ready });
  return !error;
}

// The host starts right away with whoever has joined (at least one friend),
// without waiting for empty seats or for everyone to tap Ready.
export async function forceStartChallenge(code: string): Promise<"ok" | "not_host" | "need_friend" | "not_waiting" | "error"> {
  const { data, error } = await createClient().rpc("force_start_challenge", { p_code: code });
  if (error || typeof data !== "string") return "error";
  return data as "ok" | "not_host" | "need_friend" | "not_waiting";
}

export async function leaveChallenge(code: string): Promise<boolean> {
  const { error } = await createClient().rpc("leave_challenge", { p_code: code });
  return !error;
}

export async function submitChallenge(code: string, answers: (number | null)[]): Promise<boolean> {
  const { error } = await createClient().rpc("submit_challenge", { p_code: code, p_answers: answers });
  return !error;
}

export async function listMyChallenges(subjectId: string): Promise<ChallengeCard[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await createClient().rpc("my_challenges", { p_subject_id: subjectId });
  if (error || !Array.isArray(data)) return [];
  return data as ChallengeCard[];
}

// Answers in progress are kept in this browser, so a reload mid-challenge
// doesn't wipe them. Storage can be unavailable (private mode), hence the
// try/catch — losing this only costs the reload convenience.
const draftKey = (code: string) => `prepify:challenge:${code}`;

export function loadDraft(code: string, length: number): (number | null)[] {
  try {
    const raw = window.localStorage.getItem(draftKey(code));
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed) && parsed.length === length) return parsed as (number | null)[];
  } catch {
    /* no storage */
  }
  return new Array(length).fill(null);
}

export function saveDraft(code: string, picks: (number | null)[]): void {
  try {
    window.localStorage.setItem(draftKey(code), JSON.stringify(picks));
  } catch {
    /* no storage */
  }
}

export function clearDraft(code: string): void {
  try {
    window.localStorage.removeItem(draftKey(code));
  } catch {
    /* no storage */
  }
}
