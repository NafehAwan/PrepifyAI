// Prepify AI design tokens. The look follows niyyah/design.md: warm off-white
// paper, one warm-orange accent, hairline borders, soft low shadows, Playfair
// Display headlines with an italic orange phrase, DM Sans for everything else.
// Kept as a flat frozen object so every screen references one source of truth.

export const C = {
  accent: "#E8854A", // the one accent: buttons, eyebrows, the italic phrase, active states
  accentD: "#C56A35", // deeper orange: text on an orange tint, hover
  tint: "#FBF0E7", // orange wash (orange at ~8% on paper)
  tintLine: "#E8854A38", // hairline that goes with the orange wash
  sage: "#3CB89A", // teal: good / passed / verified
  sageD: "#1A8A50", // deep teal: text on sageT
  sageT: "#EAF6F1", // teal wash
  coral: "#D4607A", // gradient partner for orange, and low scores
  gold: "#C8A84E", // stars, streaks
  goldD: "#8A7234",
  goldLine: "#C8A84E38", // hairline that goes with gold / cream surfaces
  purple: "#7B6BAE",
  muted: "#8A8A80", // meta and secondary text
  body: "#4A4A42", // paragraph text
  faint: "#B0B0A4",
  line: "#E6E5DE", // hairline borders
  lineSoft: "#EEEDEA",
  lineStrong: "#D4D3CB", // input and ghost-button borders
  sand: "#F1F0EB", // recessed chip / track
  bg: "#F9F8F4", // page
  cream: "#FAF8F0", // alternate surface
  card: "#FFFFFF", // cards
  ink: "#1A1A18", // headings and primary text
  sidebar: "#FAF8F0",
  sidebarLine: "#E6E5DE",
  topbar: "rgba(249, 248, 244, 0.92)",
  danger: "#D4607A",
} as const;

export type Colors = typeof C;

// Each subject's own jewel tone, for its icon square (like Niyyah's topic tiles).
export const SUBJECT_COLOR: Record<string, string> = {
  Physics: C.accent,
  Chemistry: C.sage,
  Maths: C.purple,
  "Computer Science": C.coral,
  English: C.goldD,
};
export const subjectColor = (name: string) => SUBJECT_COLOR[name] ?? C.accent;

// Headlines: Playfair Display at weight 400 with tight tracking. Emphasis is an
// italic phrase in orange (see components/Em.tsx), never bold.
export const DISPLAY = "'Playfair Display', Georgia, serif";

export const SHADOW = {
  s1: "0 1px 3px #0000000A",
  s2: "0 2px 8px #0000000A",
  s3: "0 4px 14px #0000000F", // card hover
  cta: "0 4px 20px #E8854A59", // the orange glow under a primary button
  phone: "0 0 0 6px #F1F0EB, 0 40px 80px #0000001A, 0 8px 24px #0000000D",
} as const;

// Primary call-to-action button: orange, 14px corners, orange glow.
export function cta(extra?: React.CSSProperties): React.CSSProperties {
  return {
    borderRadius: 14,
    background: C.accent,
    color: "#fff",
    fontWeight: 600,
    boxShadow: SHADOW.cta,
    ...extra,
  };
}

// Pill toggle style used across tab switchers (home layout, language, mode, etc.).
export function pill(on: boolean): React.CSSProperties {
  return {
    borderRadius: 999,
    padding: "7px 15px",
    fontSize: 12.5,
    fontWeight: 600,
    background: on ? C.accent : "transparent",
    color: on ? "#fff" : C.muted,
  };
}

// Full-width segmented tab (topic workspace / mobile tabs).
export function wideTab(on: boolean): React.CSSProperties {
  return {
    flex: 1,
    borderRadius: 999,
    padding: "9px 0",
    fontSize: 13,
    fontWeight: 600,
    background: on ? C.ink : "transparent",
    color: on ? "#fff" : C.muted,
  };
}
