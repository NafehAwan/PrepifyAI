// Tiny sound-effects engine for Prepify — think Duolingo's little chimes.
//
// Sounds are *synthesized* with the Web Audio API (no audio files to ship, no
// licensing worries, a few hundred bytes of code). Each effect is a short
// sequence of oscillator "notes". Playback is a no-op on the server, when the
// browser has no Web Audio, or when the student has muted sounds.

import { useSyncExternalStore } from "react";

const MUTE_KEY = "prepify_muted";

let ctx: AudioContext | null = null;
const listeners = new Set<() => void>();

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    // Browsers start the context suspended until a user gesture — resume it.
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// ---- mute preference (persisted, subscribable for the Settings toggle) ----

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // ignore storage failures — mute just won't persist
  }
  listeners.forEach((l) => l());
}

// React hook: current mute state, kept in sync across components.
export function useMuted(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    isMuted,
    () => false,
  );
}

// ---- synthesis ----

interface Note {
  freq: number;
  start: number; // seconds from now
  dur: number;
  type?: OscillatorType;
  gain?: number;
}

function play(notes: Note[]): void {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  for (const n of notes) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = n.type ?? "sine";
    osc.frequency.value = n.freq;
    const t0 = now + n.start;
    const peak = n.gain ?? 0.16;
    // quick attack, smooth exponential release — soft, non-jarring
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + n.dur + 0.02);
  }
}

// Note frequencies (equal temperament) we reuse below.
const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0, C6: 1046.5, E6: 1318.5, G4: 392.0, E4: 329.63, A3: 220.0, F3: 174.61 };

// A light tap/click — button presses, chips.
export function sfxTap(): void {
  play([{ freq: N.A5, start: 0, dur: 0.08, type: "triangle", gain: 0.08 }]);
}

// Right answer — a bright two-note lift.
export function sfxCorrect(): void {
  play([
    { freq: N.E5, start: 0, dur: 0.12, type: "triangle", gain: 0.15 },
    { freq: N.A5, start: 0.09, dur: 0.16, type: "triangle", gain: 0.15 },
  ]);
}

// Wrong answer — a soft, low "aw" (kept gentle, never harsh).
export function sfxWrong(): void {
  play([
    { freq: N.E4, start: 0, dur: 0.16, type: "sine", gain: 0.14 },
    { freq: N.A3, start: 0.11, dur: 0.2, type: "sine", gain: 0.14 },
  ]);
}

// Passed a quiz/chapter — a happy little rising fanfare.
export function sfxWin(): void {
  play([
    { freq: N.C5, start: 0, dur: 0.13, type: "triangle", gain: 0.16 },
    { freq: N.E5, start: 0.1, dur: 0.13, type: "triangle", gain: 0.16 },
    { freq: N.G5, start: 0.2, dur: 0.13, type: "triangle", gain: 0.16 },
    { freq: N.C6, start: 0.3, dur: 0.26, type: "triangle", gain: 0.18 },
  ]);
}

// Didn't pass — a gentle, encouraging two-note dip (not a "fail" buzzer).
export function sfxTryAgain(): void {
  play([
    { freq: N.G4, start: 0, dur: 0.16, type: "sine", gain: 0.14 },
    { freq: N.E4, start: 0.13, dur: 0.22, type: "sine", gain: 0.14 },
  ]);
}

// Something unlocked / celebration sparkle.
export function sfxUnlock(): void {
  play([
    { freq: N.G5, start: 0, dur: 0.1, type: "triangle", gain: 0.14 },
    { freq: N.C6, start: 0.08, dur: 0.1, type: "triangle", gain: 0.14 },
    { freq: N.E6, start: 0.16, dur: 0.22, type: "triangle", gain: 0.16 },
  ]);
}
