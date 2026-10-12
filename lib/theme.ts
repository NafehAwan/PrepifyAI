// Prepify AI colour tokens — the warm "board year" palette from the design prototype.
// Kept as a flat frozen object so every screen references one source of truth.

export const C = {
  accent: "#c67139", // primary orange
  accentD: "#8f4a20", // deep orange (text on tint)
  tint: "#f6e1d0", // soft orange wash
  sage: "#7a8a5e", // mastery green
  sageD: "#4f5c36", // deep green (text on sageT)
  sageT: "#e6ead9", // soft green wash
  muted: "#7a6f5d", // muted brown text
  line: "#e6d7bb", // card border
  sand: "#ebddc5", // neutral chip / track
  bg: "#f5ead8", // page background
  card: "#fdf7ea", // card surface
  ink: "#201e1d", // primary text
  sidebar: "#efe2ca",
  sidebarLine: "#e2d2b6",
  topbar: "#faf1e0",
  danger: "#b0603a", // low-score red-orange
} as const;

export type Colors = typeof C;

// Pill toggle style used across tab switchers (home layout, language, mode, etc.).
export function pill(on: boolean): React.CSSProperties {
  return {
    borderRadius: 999,
    padding: "7px 15px",
    fontSize: 12.5,
    fontWeight: 700,
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
    fontWeight: 700,
    background: on ? C.accent : "transparent",
    color: on ? "#fff" : C.muted,
  };
}
