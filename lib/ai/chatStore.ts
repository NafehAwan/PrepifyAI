// Local persistence for "Ask Prepify" chatbot conversations.
//
// Chats live only in the student's browser (localStorage) — same privacy model
// as their Groq key. Each saved chat keeps its messages, a derived title, and
// timestamps so students can start a new chat and return to old ones.

import type { ChatMsg } from "@/lib/types";

export interface ChatSession {
  id: string;
  title: string;
  msgs: ChatMsg[];
  createdAt: number;
  updatedAt: number;
}

const KEY = "prepify_chats";
const MAX_CHATS = 40; // keep storage bounded — drop the oldest beyond this

function canStore(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function newChatId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// A short, human title from the first user message (falls back to "New chat").
export function deriveTitle(msgs: ChatMsg[]): string {
  const firstMe = msgs.find(([who]) => who === "me")?.[1]?.trim();
  if (!firstMe) return "New chat";
  return firstMe.length > 42 ? `${firstMe.slice(0, 42)}…` : firstMe;
}

export function loadChats(): ChatSession[] {
  if (!canStore()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    if (!Array.isArray(parsed)) return [];
    // newest first
    return parsed
      .filter((c) => c && typeof c.id === "string" && Array.isArray(c.msgs))
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  } catch {
    return [];
  }
}

function writeChats(chats: ChatSession[]): void {
  if (!canStore()) return;
  try {
    const trimmed = chats
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, MAX_CHATS);
    window.localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // storage full / disabled — chat still works in-memory this session
  }
}

// Insert or update one chat, returning the full (sorted) list.
export function saveChat(session: ChatSession): ChatSession[] {
  const chats = loadChats().filter((c) => c.id !== session.id);
  chats.push(session);
  writeChats(chats);
  return loadChats();
}

export function deleteChat(id: string): ChatSession[] {
  const chats = loadChats().filter((c) => c.id !== id);
  writeChats(chats);
  return chats;
}
