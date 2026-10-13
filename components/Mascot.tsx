"use client";

// "Prepi" — Prepify's study buddy: a round purple blob with a gold star on its
// antenna, who walks the level map with the student. Drawn as one inline SVG
// (no image download, crisp at any size); each mood changes the eyes, the
// mouth, an arm or a prop, and picks a calm whole-body animation.

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

const ANIM: Record<Mood, string> = {
  idle: "pf-bob",
  happy: "pf-bob",
  celebrate: "pf-celebrate",
  thinking: "pf-bob",
  sad: "pf-droop",
  wave: "pf-bob",
  wink: "pf-bob",
  proud: "pf-hop",
  curious: "pf-bob",
  sleepy: "pf-droop",
  book: "pf-bob",
};

const INK = "#20244A";
const BODY = "#7C5CFF";
const SHADE = "#5A3DDB";
const STAR = "#FFC93C";
const BLUSH = "#FF9AD5";

export function Mascot({ mood = "idle", size = 96, className }: { mood?: Mood; size?: number; className?: string }) {
  return (
    <div className={className} style={{ width: size, height: size, display: "inline-block", lineHeight: 0, flex: "none" }} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 100 100" className={ANIM[mood]} style={{ display: "block", overflow: "visible" }}>
        {/* ground shadow */}
        <ellipse cx="50" cy="95" rx="26" ry="3.5" fill="rgba(32,36,74,.14)" />
        {/* antenna + star */}
        <rect x="48.5" y="14" width="3" height="12" rx="1.5" fill={SHADE} />
        <path d="M50 2.5l3.6 7.3 8 1.2-5.8 5.6 1.4 8-7.2-3.8-7.2 3.8 1.4-8-5.8-5.6 8-1.2z" fill={STAR} stroke="#E0A800" strokeWidth="1" strokeLinejoin="round" />
        {/* arms (behind the body) */}
        {mood === "wave" || mood === "celebrate" ? (
          <>
            <rect x="9" y="38" width="12" height="24" rx="6" fill={BODY} transform="rotate(-35 15 50)" />
            <rect x="79" y="38" width="12" height="24" rx="6" fill={BODY} transform={mood === "celebrate" ? "rotate(35 85 50)" : "rotate(-20 85 60)"} />
          </>
        ) : (
          <>
            <rect x="10" y="56" width="12" height="20" rx="6" fill={SHADE} />
            <rect x="78" y="56" width="12" height="20" rx="6" fill={SHADE} />
          </>
        )}
        {/* body */}
        <rect x="16" y="26" width="68" height="66" rx="32" fill={BODY} />
        <path d="M16 70a34 22 0 0 0 68 0v4a32 18 0 0 1-68 0z" fill={SHADE} opacity=".35" />
        <ellipse cx="38" cy="38" rx="10" ry="5" fill="#fff" opacity=".18" transform="rotate(-20 38 38)" />
        {/* cheeks */}
        {mood !== "sad" && mood !== "sleepy" && (
          <>
            <ellipse cx="28" cy="66" rx="5.5" ry="3.2" fill={BLUSH} opacity=".85" />
            <ellipse cx="72" cy="66" rx="5.5" ry="3.2" fill={BLUSH} opacity=".85" />
          </>
        )}
        <Eyes mood={mood} />
        <Mouth mood={mood} />
        {mood === "thinking" && <path d="M86 26a5 5 0 1 1 7 4.5c-1.5.8-2 1.6-2 3M91 38v.5" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />}
        {mood === "sleepy" && (
          <text x="80" y="26" fontFamily="var(--font-display)" fontWeight="800" fontSize="14" fill={SHADE}>
            z
            <tspan dx="1" dy="-7" fontSize="10">z</tspan>
          </text>
        )}
        {mood === "book" && (
          <g>
            <path d="M28 74l22 5 22-5v16l-22 5-22-5z" fill="#fff" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
            <path d="M50 79v16" stroke={INK} strokeWidth="2.4" />
            <path d="M34 80l11 2.5M34 85l11 2.5M55 82.5l11-2.5M55 87.5l11-2.5" stroke="#C9D3EA" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
        {mood === "proud" && <path d="M76 18l2 4 4.5.6-3.3 3.1.8 4.4-4-2.1-4 2.1.8-4.4-3.3-3.1 4.5-.6z" fill={STAR} />}
      </svg>
    </div>
  );
}

function Eyes({ mood }: { mood: Mood }) {
  // Happy moods squint into smiling arcs; the rest blink now and then.
  if (mood === "happy" || mood === "celebrate" || mood === "proud") {
    return (
      <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M30 54q6-8 12 0" />
        <path d="M58 54q6-8 12 0" />
      </g>
    );
  }
  if (mood === "sleepy") {
    return (
      <g stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M30 54q6 5 12 0" />
        <path d="M58 54q6 5 12 0" />
      </g>
    );
  }
  const pupil = mood === "thinking" ? { dx: 2, dy: -3 } : mood === "curious" ? { dx: 0, dy: 1 } : mood === "sad" ? { dx: 0, dy: 3 } : { dx: 1.5, dy: 1 };
  const big = mood === "curious" ? 1.15 : 1;
  return (
    <g>
      <g className="pf-blink">
        <ellipse cx="36" cy="52" rx={9 * big} ry={10 * big} fill="#fff" />
        <circle cx={36 + pupil.dx} cy={52 + pupil.dy} r="4.8" fill={INK} />
        <circle cx={37.6 + pupil.dx} cy={50 + pupil.dy} r="1.6" fill="#fff" />
      </g>
      {mood === "wink" ? (
        <path d="M58 53q6-6 12 0" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
      ) : (
        <g className="pf-blink">
          <ellipse cx="64" cy="52" rx={9 * big} ry={10 * big} fill="#fff" />
          <circle cx={64 + pupil.dx} cy={52 + pupil.dy} r="4.8" fill={INK} />
          <circle cx={65.6 + pupil.dx} cy={50 + pupil.dy} r="1.6" fill="#fff" />
        </g>
      )}
      {mood === "sad" && (
        <g stroke={INK} strokeWidth="3" strokeLinecap="round">
          <path d="M28 40l10 3" />
          <path d="M72 40l-10 3" />
        </g>
      )}
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case "celebrate":
    case "proud":
      return <path d="M40 68q10 14 20 0z" fill={INK} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />;
    case "sad":
      return <path d="M42 74q8-7 16 0" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
    case "thinking":
      return <path d="M44 72h12" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />;
    case "curious":
      return <ellipse cx="50" cy="71" rx="4" ry="5" fill={INK} />;
    case "sleepy":
      return <ellipse cx="50" cy="71" rx="3.5" ry="2.5" fill={INK} />;
    default:
      return <path d="M42 68q8 8 16 0" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
  }
}
