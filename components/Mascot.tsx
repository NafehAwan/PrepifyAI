"use client";

import { C } from "@/lib/theme";

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
  | "sleepy";

// "Prepi" — Prepify's cute study-buddy owl. A friendly little mascot that
// shows feelings and reacts to how the student is doing. Pure inline SVG so it
// scales crisply and ships with zero image assets. Every mood has its own eyes,
// brow, beak and body animation.
export function Mascot({ mood = "idle", size = 96, className }: { mood?: Mood; size?: number; className?: string }) {
  // Whole-body animation per mood.
  const wrapAnim: Record<Mood, string> = {
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
  };
  const canBlink = mood === "idle" || mood === "happy" || mood === "curious";

  // Where the pupils look, per mood.
  const pupil = {
    idle: { dx: 0, dy: 0 },
    happy: { dx: 0, dy: -1 },
    celebrate: { dx: 0, dy: -1.5 },
    thinking: { dx: 2.5, dy: -2 },
    sad: { dx: 0, dy: 2 },
    wave: { dx: 0, dy: -1 },
    wink: { dx: 0, dy: -1 },
    proud: { dx: 0, dy: -1 },
    curious: { dx: -2.5, dy: -1 },
    sleepy: { dx: 0, dy: 1 },
  }[mood];

  const arcEyes = mood === "happy" || mood === "proud";
  const closedEyes = mood === "sleepy";
  const cheeks = mood === "happy" || mood === "celebrate" || mood === "proud" || mood === "wink";

  return (
    <div className={className} style={{ width: size, height: size, display: "inline-block", lineHeight: 0 }} aria-hidden>
      <svg viewBox="0 0 100 100" width={size} height={size} className={wrapAnim[mood]} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="prepi-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d98a52" />
            <stop offset="1" stopColor={C.accent} />
          </linearGradient>
        </defs>

        {/* sparkles for celebrate / proud */}
        {(mood === "celebrate" || mood === "proud") && (
          <g fill={C.sage}>
            <path className="pf-sparkle" d="M16 20l1.6 3.4L21 25l-3.4 1.6L16 30l-1.6-3.4L11 25l3.4-1.6z" />
            <path className="pf-sparkle" style={{ animationDelay: ".4s" }} d="M86 30l1.3 2.7L90 34l-2.7 1.3L86 38l-1.3-2.7L82 34l2.7-1.3z" />
            <circle className="pf-sparkle" style={{ animationDelay: ".7s" }} cx="80" cy="16" r="2" />
            <circle className="pf-sparkle" style={{ animationDelay: ".2s" }} cx="22" cy="42" r="1.8" />
          </g>
        )}

        {/* zzz for sleepy */}
        {mood === "sleepy" && (
          <g fill={C.accentD} fontFamily="system-ui" fontWeight={700}>
            <text className="pf-sparkle" x="74" y="24" fontSize="10">z</text>
            <text className="pf-sparkle" style={{ animationDelay: ".5s" }} x="82" y="16" fontSize="13">Z</text>
          </g>
        )}

        {/* thinking bubble */}
        {mood === "thinking" && (
          <g fill={C.accentD} opacity=".85">
            <circle className="pf-sparkle" cx="76" cy="30" r="2.4" />
            <circle className="pf-sparkle" style={{ animationDelay: ".3s" }} cx="83" cy="23" r="3.2" />
          </g>
        )}

        {/* ear tufts */}
        <path d="M30 20 Q34 6 42 16 Z" fill={C.accentD} />
        <path d="M70 20 Q66 6 58 16 Z" fill={C.accentD} />

        {/* feet */}
        <g>
          <path d="M40 90 l-4 6 M40 90 l0 7 M40 90 l4 6" stroke="#d98a2f" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M60 90 l-4 6 M60 90 l0 7 M60 90 l4 6" stroke="#d98a2f" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </g>

        {/* body */}
        <ellipse cx="50" cy="56" rx="34" ry="36" fill="url(#prepi-body)" />

        {/* wings — the right wing waves for the wave mood */}
        <path d="M18 52 q-4 16 6 26 q-8 -10 -6 -26z" fill={C.accentD} opacity=".55" />
        <path
          className={mood === "wave" ? "pf-wing-wave" : undefined}
          d={mood === "wave" ? "M82 50 q10 -6 6 -20 q6 14 -6 24z" : "M82 52 q4 16 -6 26 q8 -10 6 -26z"}
          fill={C.accentD}
          opacity=".55"
        />

        {/* belly */}
        <ellipse cx="50" cy="64" rx="21" ry="23" fill={C.tint} />

        {/* eyes */}
        <g className={canBlink ? "pf-blink" : undefined} style={{ transformOrigin: "50px 46px" }}>
          <circle cx="38" cy="46" r="13" fill="#fff8ef" stroke={C.accentD} strokeWidth="2" />
          <circle cx="62" cy="46" r="13" fill="#fff8ef" stroke={C.accentD} strokeWidth="2" />
          {arcEyes ? (
            <g stroke={C.ink} strokeWidth="3" strokeLinecap="round" fill="none">
              <path d="M31 47 q7 -8 14 0" />
              <path d="M55 47 q7 -8 14 0" />
            </g>
          ) : closedEyes ? (
            <g stroke={C.ink} strokeWidth="3" strokeLinecap="round" fill="none">
              <path d="M31 47 q7 6 14 0" />
              <path d="M55 47 q7 6 14 0" />
            </g>
          ) : (
            <g fill={C.ink}>
              {/* left eye */}
              <circle cx={38 + pupil.dx} cy={46 + pupil.dy} r="5.4" />
              <circle cx={36 + pupil.dx} cy={44 + pupil.dy} r="1.7" fill="#fff" />
              {/* right eye — a wink closes it */}
              {mood === "wink" ? (
                <path d="M55 47 q7 -8 14 0" stroke={C.ink} strokeWidth="3" strokeLinecap="round" fill="none" />
              ) : (
                <>
                  <circle cx={62 + pupil.dx} cy={46 + pupil.dy} r="5.4" />
                  <circle cx={60 + pupil.dx} cy={44 + pupil.dy} r="1.7" fill="#fff" />
                </>
              )}
            </g>
          )}
        </g>

        {/* eyebrows convey feeling */}
        {(mood === "thinking" || mood === "curious") && (
          <path d="M30 31 q8 -4 16 -1" stroke={C.accentD} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        )}
        {mood === "proud" && (
          <g stroke={C.accentD} strokeWidth="2.6" strokeLinecap="round" fill="none">
            <path d="M31 34 q7 -3 13 -1" />
            <path d="M69 34 q-7 -3 -13 -1" />
          </g>
        )}
        {mood === "sad" && (
          <g stroke={C.accentD} strokeWidth="2.6" strokeLinecap="round" fill="none">
            <path d="M31 33 q7 3 13 6" />
            <path d="M69 33 q-7 3 -13 6" />
          </g>
        )}

        {/* beak */}
        {mood === "celebrate" ? (
          <ellipse cx="50" cy="60" rx="5" ry="6" fill="#e8a63d" stroke={C.accentD} strokeWidth="1.4" />
        ) : (
          <path d="M50 57 l6 5 l-6 5 l-6 -5 z" fill="#e8a63d" stroke={C.accentD} strokeWidth="1.2" />
        )}

        {/* cheeks for warm moods */}
        {cheeks && (
          <g fill={C.danger} opacity=".28">
            <circle cx="27" cy="60" r="4.5" />
            <circle cx="73" cy="60" r="4.5" />
          </g>
        )}
      </svg>
    </div>
  );
}
