// Client-side storage for the student's own Groq API key.
//
// The key lives ONLY in this browser's localStorage. It is attached to AI
// requests via the `x-groq-key` header and forwarded straight to Groq; it is
// never written to our database or logged server-side.

import { GROQ_KEY_HEADER } from "./config";

const STORAGE_KEY = "prepify.groqKey";

export function getGroqKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setGroqKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = key.trim();
    if (trimmed) window.localStorage.setItem(STORAGE_KEY, trimmed);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage failures (private mode, quota) — AI just falls back
  }
}

export function clearGroqKey(): void {
  setGroqKey("");
}

// Build the auth header for an AI fetch, given the current key (from state or
// storage). Returns an empty object when there's no key so the route 503s and
// the UI falls back to canned content.
export function groqAuthHeaders(key?: string): Record<string, string> {
  const k = (key ?? getGroqKey()).trim();
  return k ? { [GROQ_KEY_HEADER]: k } : {};
}
