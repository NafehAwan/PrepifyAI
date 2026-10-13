// Generic stroke-path icon, matching the prototype's inline <svg> usage.

export function StrokeIcon({
  d,
  size = 19,
  stroke = "currentColor",
  width = 2.4,
  style,
}: {
  d: string;
  size?: number;
  stroke?: string;
  width?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <path d={d} />
    </svg>
  );
}

export function FillIcon({
  d,
  size = 16,
  fill = "currentColor",
  style,
}: {
  d: string;
  size?: number;
  fill?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="none" style={style}>
      <path d={d} />
    </svg>
  );
}

// Frequently-reused paths.
export const PATH = {
  check: "M20 6 9 17l-5-5",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  dot: "M12 8v8",
  chevronDown: "m6 9 6 6 6-6",
  flame: "M12 2c3 4 6 6 6 10a6 6 0 0 1-12 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 1-6 2-9z",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2",
  phone: "M7 2h10v20H7zM11 18h2",
  refresh: "M4 9a5 5 0 0 1 5-5h11M20 15a5 5 0 0 1-5 5H4M17 1l3 3-3 3M7 17l-3 3 3 3",
  send: "m3 3 18 9-18 9 4-9z",
  sparkle: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",
  book: "M4 4a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2z",
} as const;

// Drawn icons for spots that used to borrow emoji (🔥 🏆 ⚔ …), so every
// icon shares one stroke and weight.
const GLYPHS = {
  check: { d: "M20 6 9 17l-5-5", fill: false },
  x: { d: "M6 6l12 12M18 6L6 18", fill: false },
  flame: { d: PATH.flame, fill: true },
  bolt: { d: PATH.bolt, fill: true },
  trophy: { d: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4", fill: false },
  swords: { d: "M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2", fill: false },
  logout: { d: "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H4", fill: false },
  pencil: { d: "M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z", fill: false },
  target: { d: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10M13 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0", fill: false },
  paper: { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5", fill: false },
  plus: { d: "M12 5v14M5 12h14", fill: false },
} as const;

export function Glyph({ name, size = 16, color = "currentColor", style }: { name: keyof typeof GLYPHS; size?: number; color?: string; style?: React.CSSProperties }) {
  const g = GLYPHS[name];
  return g.fill ? (
    <FillIcon d={g.d} size={size} fill={color} style={{ verticalAlign: "-0.15em", flex: "none", ...style }} />
  ) : (
    <StrokeIcon d={g.d} size={size} stroke={color} width={2.8} style={{ verticalAlign: "-0.15em", flex: "none", ...style }} />
  );
}

// 1st / 2nd / 3rd as gold, silver and bronze coins.
export function Medal({ rank, size = 28 }: { rank: 1 | 2 | 3; size?: number }) {
  const [bg, edge] = rank === 1 ? ["#FFC93C", "#D99A00"] : rank === 2 ? ["#D7DDEA", "#A9B2C8"] : ["#F0A36A", "#C27235"];
  return (
    <span aria-label={`Rank ${rank}`} style={{ width: size, height: size, borderRadius: 999, background: bg, boxShadow: `0 3px 0 ${edge}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: size * 0.55, color: "#20244A" }}>
      {rank}
    </span>
  );
}
