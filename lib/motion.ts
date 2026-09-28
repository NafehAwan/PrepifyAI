// "Reduce animations" preference — a guaranteed escape hatch for students on
// slower machines, independent of the OS-level prefers-reduced-motion setting
// (which we also honour in globals.css).
//
// Same shape as the mute preference in lib/sfx.ts: persisted in localStorage,
// subscribable so the Settings toggle re-renders.

import { useSyncExternalStore } from "react";

const KEY = "prepify_reduce_motion";
const listeners = new Set<() => void>();

export function isReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setReducedMotion(on: boolean): void {
  try {
    window.localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // ignore storage failures — the preference just won't persist
  }
  applyReducedMotion(on);
  listeners.forEach((l) => l());
}

// Stamps the root element so globals.css can clamp every animation/transition.
export function applyReducedMotion(on: boolean): void {
  if (typeof document === "undefined") return;
  if (on) document.documentElement.dataset.reduceMotion = "1";
  else delete document.documentElement.dataset.reduceMotion;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    isReducedMotion,
    () => false,
  );
}
