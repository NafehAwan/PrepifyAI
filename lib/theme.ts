// Prepify colour tokens: the "Level Map" world (sky, grass, gold stars,
// Prepi's purple, and orange for the big play buttons).
// Kept as a flat frozen object so every screen references one source of truth.
// Key names are historical (accent, sage, sand…); the values are what changed.

export const C = {
  accent: "#6C4CF5", // Prepi purple: primary action, selected state (white text 5.3:1)
  accentD: "#4F31D6", // deep purple (text on tint)
  tint: "#EFEAFF", // soft purple wash
  go: "#E85D0C", // orange "play" buttons: Start, Next, Submit (large text only)
  goD: "#B8470A", // the pressed-down edge under an orange button
  goT: "#FFEBDD", // soft orange wash
  sage: "#1FA855", // right answers, passed, done
  sageD: "#137A3C", // deep green (text on sageT)
  sageT: "#DDF7E6", // soft green wash
  gold: "#FFC93C", // stars and finished map stops
  goldD: "#D99A00",
  sky: "#7FD3FF",
  muted: "#5C6185", // secondary text (6:1 on white)
  line: "#DCE3F2", // card border
  sand: "#EEF1FA", // neutral chip / track
  bg: "#EAF6FF", // page background: pale sky
  card: "#FFFFFF", // card surface
  ink: "#20244A", // primary text
  ink2: "#3E4370",
  sidebar: "#FFFFFF",
  sidebarLine: "#E3E8F5",
  topbar: "rgba(255,255,255,.86)",
  danger: "#D93A3F", // low score / wrong (4.5:1 on white)
  dangerT: "#FDE8E8",
} as const;

export type Colors = typeof C;

// The display face (Baloo 2) and the reading face (Nunito), both self-hosted
// in /public/fonts and declared in globals.css.
export const FD = "var(--font-display)";

// A chunky "press-able" button: a solid colour sitting on a darker edge,
// like a game button. Pressing it (globals.css .pf-press) sinks it.
export function btn3d(bg: string, edge: string, color = "#fff"): React.CSSProperties {
  return {
    background: bg,
    color,
    boxShadow: `0 4px 0 ${edge}`,
    borderRadius: 16,
    fontFamily: FD,
    fontWeight: 700,
  };
}

// White card with a soft lifted edge, the map's default surface.
export const card: React.CSSProperties = {
  background: C.card,
  borderRadius: 20,
  boxShadow: "0 4px 0 #D3DAEC",
};

// Pill toggle style used across tab switchers (home layout, language, mode, etc.).
export function pill(on: boolean): React.CSSProperties {
  return {
    borderRadius: 999,
    padding: "7px 15px",
    fontSize: 13,
    fontWeight: 800,
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
    fontSize: 13.5,
    fontWeight: 800,
    background: on ? C.accent : "transparent",
    color: on ? "#fff" : C.muted,
  };
}
