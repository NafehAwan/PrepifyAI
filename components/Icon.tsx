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
