// Prepify brand mark: a purple rounded tile with a chunky white "P" and Prepi's
// gold antenna star. Vector, so it stays crisp from favicon to hero.
// Colours are the brand constants (kept literal so the mark is self-contained).

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label="Prepify" style={{ flex: "none", display: "block" }}>
      <rect x="2" y="6" width="56" height="56" rx="18" fill="#4F31D6" />
      <rect x="2" y="2" width="56" height="56" rx="18" fill="#6C4CF5" />
      {/* P: stem + bowl with a counter */}
      <path d="M20 15h14a11 11 0 0 1 0 22h-6v8a4 4 0 0 1-8 0z" fill="#fff" />
      <path d="M28 22h5.5a4 4 0 0 1 0 8H28z" fill="#6C4CF5" />
      <path d="M52 2.5l2.4 4.9 5.4.8-3.9 3.8.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.9-3.8 5.4-.8z" fill="#FFC93C" stroke="#E0A800" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: size, letterSpacing: "-.01em", lineHeight: 1, color: "#20244A" }}>
      Prepify
    </span>
  );
}
