"use client";

// Small helpers for reads that must survive a slow or flaky connection:
// retry with backoff, a time limit per attempt, and a copy kept on the device
// so a screen can show the last good answer instantly while it refreshes.

// Runs `fn` until it succeeds, waiting a little longer between each try
// (800 ms, 1.6 s, …). Rethrows the last error if every try fails.
export async function retry<T>(fn: () => Promise<T>, tries = 3, baseMs = 800): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, baseMs * 2 ** i));
    }
  }
  throw last;
}

// An AbortSignal that fires after `ms`, so one stalled request can't leave a
// screen stuck on "Loading…" forever. Undefined where the browser lacks it.
export function timeoutSignal(ms = 12_000): AbortSignal | undefined {
  return typeof AbortSignal !== "undefined" && "timeout" in AbortSignal ? AbortSignal.timeout(ms) : undefined;
}

// Device cache: memory first, then localStorage (which can be unavailable —
// private mode, full storage — hence the try/catch; losing it only costs speed).
const memory = new Map<string, unknown>();
const PREFIX = "prepify:cache:";

export function readCache<T>(key: string): T | null {
  if (memory.has(key)) return memory.get(key) as T;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const value = JSON.parse(raw) as T;
    memory.set(key, value);
    return value;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T): void {
  memory.set(key, value);
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}
