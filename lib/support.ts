"use client";

// Help & Feedback tickets and the admin portal — the browser side of
// supabase/support.sql. Every call is checked in the database: students only
// ever reach their own tickets, and admin calls fail for anyone not in
// app_admins, whatever the UI shows.

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type TicketCategory = "bug" | "suggestion" | "question" | "other";
export type TicketStatus = "open" | "answered" | "closed";

export const TICKET_CATEGORIES: Array<{ id: TicketCategory; label: string; hint: string }> = [
  { id: "bug", label: "🐞 Bug", hint: "Something broken or not working right" },
  { id: "suggestion", label: "💡 Suggestion", hint: "An idea to make Prepify better" },
  { id: "question", label: "❓ Question", hint: "Ask how something works" },
  { id: "other", label: "💬 Other", hint: "Anything else" },
];

export const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Waiting for reply",
  answered: "Replied",
  closed: "Closed",
};

export interface TicketSummary {
  number: number;
  category: TicketCategory;
  title: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  unread: boolean;
  messages: number;
  // Admin list only:
  student?: string;
  preview?: string;
}

export interface TicketMessage {
  isAdmin: boolean;
  isMe: boolean;
  body: string;
  createdAt: string;
}

export interface TicketThread {
  found: true;
  number: number;
  category: TicketCategory;
  title: string;
  status: TicketStatus;
  createdAt: string;
  isMine: boolean;
  viewerIsAdmin: boolean;
  context: Record<string, unknown> | null; // admins only
  student: { name: string; email: string | null } | null; // admins only
  messages: TicketMessage[];
}

const rpc = () => createClient();

// The page and device a ticket was sent from — handy for reproducing bugs.
function deviceContext(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  return {
    page: window.location.pathname,
    userAgent: navigator.userAgent.slice(0, 300),
    screen: `${window.innerWidth}x${window.innerHeight}`,
    online: navigator.onLine,
  };
}

export async function createTicket(category: TicketCategory, title: string, body: string): Promise<{ number: number } | { error: string }> {
  if (!isSupabaseConfigured()) return { error: "Sign in to send feedback." };
  const { data, error } = await rpc().rpc("create_ticket", {
    p_category: category,
    p_title: title,
    p_body: body,
    p_context: deviceContext(),
  });
  if (error) {
    if (/daily ticket limit/i.test(error.message)) return { error: "You've opened a lot of tickets today — reply in an existing one, or try tomorrow." };
    if (/title too short/i.test(error.message)) return { error: "Give it a short title (3+ characters)." };
    if (/message empty/i.test(error.message)) return { error: "Write a message first." };
    return { error: "Couldn't send — check your connection and try again." };
  }
  return { number: Number(data) };
}

export async function listMyTickets(): Promise<TicketSummary[] | null> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await rpc().rpc("my_tickets");
  if (error || !Array.isArray(data)) return null;
  return data as TicketSummary[];
}

export async function countUnreadTickets(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const { data, error } = await rpc().rpc("my_unread_tickets");
  return error ? 0 : Number(data ?? 0);
}

export async function getTicket(number: number): Promise<TicketThread | null | "error"> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await rpc().rpc("ticket_thread", { p_number: number });
  if (error) return "error";
  const t = data as TicketThread | { found: false };
  return t.found ? t : null;
}

export async function replyToTicket(number: number, body: string): Promise<"ok" | "closed" | "limit" | "empty" | "error"> {
  const { data, error } = await rpc().rpc("reply_ticket", { p_number: number, p_body: body });
  if (error) return "error";
  return (["ok", "closed", "limit", "empty"].includes(String(data)) ? data : "error") as "ok" | "closed" | "limit" | "empty" | "error";
}

export async function setTicketStatus(number: number, status: TicketStatus): Promise<boolean> {
  const { data, error } = await rpc().rpc("set_ticket_status", { p_number: number, p_status: status });
  return !error && data === "ok";
}

// ---- Admin -------------------------------------------------------------------

export interface AdminOverview {
  students: number;
  newStudentsWeek: number;
  activeToday: number;
  activeWeek: number;
  testsToday: number;
  testsWeek: number;
  testsTotal: number;
  challengesWeek: number;
  openTickets: number;
  openReports: number;
  questions: number;
}

export async function getAdminOverview(): Promise<AdminOverview | null> {
  const { data, error } = await rpc().rpc("admin_overview");
  return error || !data ? null : (data as AdminOverview);
}

export async function listAdminTickets(status: TicketStatus | "all"): Promise<TicketSummary[] | null> {
  const { data, error } = await rpc().rpc("admin_tickets", { p_status: status });
  return error || !Array.isArray(data) ? null : (data as TicketSummary[]);
}

export type ReportStatus = "open" | "fixed" | "dismissed";

export interface ReportedQuestion {
  questionId: string;
  reports: number;
  subject: string | null;
  chapter: number | null;
  stem: string | null;
  options: string[] | null;
  answerKey: string | null;
  explanation: string | null;
  editable: boolean;
  lastReported: string;
  details: Array<{
    reason: string;
    note: string | null;
    shown: { stem?: string; options?: string[]; markedAnswer?: number; picked?: number | null } | null;
    source: string | null;
    at: string;
    by: string;
  }>;
}

export async function listReportedQuestions(status: ReportStatus | "all"): Promise<ReportedQuestion[] | null> {
  const { data, error } = await rpc().rpc("admin_reports", { p_status: status });
  return error || !Array.isArray(data) ? null : (data as ReportedQuestion[]);
}

export async function setReportStatus(questionId: string, status: ReportStatus): Promise<boolean> {
  const { data, error } = await rpc().rpc("admin_set_report_status", { p_question_id: questionId, p_status: status });
  return !error && data === "ok";
}

export async function updateQuestion(opts: {
  questionId: string;
  stem: string;
  options: string[];
  answerKey: "A" | "B" | "C" | "D";
  explanation: string;
}): Promise<"ok" | "bad_answer" | "bad_options" | "bad_stem" | "not_found" | "error"> {
  const { data, error } = await rpc().rpc("admin_update_question", {
    p_question_id: opts.questionId,
    p_stem: opts.stem,
    p_options: opts.options,
    p_answer_key: opts.answerKey,
    p_explanation: opts.explanation,
  });
  if (error) return "error";
  return data as "ok" | "bad_answer" | "bad_options" | "bad_stem" | "not_found";
}

// ---- Admin: players ------------------------------------------------------------
// supabase/players.sql. Renames, removal and score changes only affect the
// leaderboard and XP; nothing a student did is deleted.

export interface AdminPlayer {
  id: string;
  username: string | null;
  name: string; // what the leaderboard shows (before the 10-character cut)
  customName: string | null; // a name an admin set, if any
  email: string | null;
  joined: string;
  lastActive: string | null;
  papers: number;
  xp: number;
  xpMonth: number;
  hidden: boolean; // the student hid themselves in Settings
  removed: boolean; // an admin took them off the leaderboard
  resetAt: string | null;
  isAdmin: boolean;
  isMe: boolean;
}

export async function listAdminPlayers(query: string): Promise<AdminPlayer[] | null> {
  const { data, error } = await rpc().rpc("admin_players", { p_query: query });
  return error || !Array.isArray(data) ? null : (data as AdminPlayer[]);
}

export async function updateAdminPlayer(userId: string, name: string, removed: boolean): Promise<"ok" | "bad_name" | "not_found" | "error"> {
  const { data, error } = await rpc().rpc("admin_update_player", { p_user: userId, p_name: name, p_removed: removed });
  if (error) return "error";
  return (["ok", "bad_name", "not_found"].includes(String(data)) ? data : "error") as "ok" | "bad_name" | "not_found" | "error";
}

export async function setAdminPlayerXp(userId: string, xp: number): Promise<"ok" | "bad_value" | "not_found" | "error"> {
  const { data, error } = await rpc().rpc("admin_set_xp", { p_user: userId, p_target: xp });
  if (error) return "error";
  return (["ok", "bad_value", "not_found"].includes(String(data)) ? data : "error") as "ok" | "bad_value" | "not_found" | "error";
}

export async function resetAdminPlayerScores(userId: string, on: boolean): Promise<boolean> {
  const { data, error } = await rpc().rpc("admin_reset_scores", { p_user: userId, p_on: on });
  return !error && data === "ok";
}
