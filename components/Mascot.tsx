"use client";

// "Prepi" — Prepify's cute study-buddy owl mascot (custom artwork).
// Each mood is a hand-made illustration in /public/mascot; the component picks
// the right one and wraps it in a gentle CSS animation so it feels alive.
// Ships as transparent PNGs so Prepi floats cleanly on any surface.

export type Mood =
  | "idle"
  | "happy"
  | "celebrate"
  | "thinking"
  | "sad"
  | "wave"
  | "wink"
  | "proud"
  | "curious"
  | "sleepy"
  | "book";

// Whole-body animation per mood.
const ANIM: Record<Mood, string> = {
  idle: "pf-bob",
  happy: "pf-bob",
  celebrate: "pf-celebrate",
  thinking: "pf-tilt",
  sad: "pf-droop",
  wave: "pf-sway",
  wink: "pf-bob",
  proud: "pf-hop",
  curious: "pf-tilt",
  sleepy: "pf-bob",
  book: "pf-bob",
};

export function Mascot({ mood = "idle", size = 96, className }: { mood?: Mood; size?: number; className?: string }) {
  return (
    <div className={className} style={{ width: size, height: size, display: "inline-block", lineHeight: 0 }} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/mascot/prepi-${mood}.png`}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className={ANIM[mood]}
        style={{ width: size, height: size, objectFit: "contain", display: "block" }}
      />
    </div>
  );
}
