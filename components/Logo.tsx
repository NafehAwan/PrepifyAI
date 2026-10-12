// Prepify AI brand mark: a terracotta badge with a white "P" whose bowl holds
// an open book. Vector, so it stays crisp from favicon to hero and in print.
// Colours are the brand constants (kept literal so the mark is self-contained).

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label="Prepify AI" style={{ flex: "none", display: "block" }}>
      <circle cx="32" cy="32" r="32" fill="#C67139" />
      {/* white P: stem + bowl */}
      <rect x="19" y="17" width="8" height="30" rx="4" fill="#fff" />
      <rect x="23" y="17" width="21" height="17" rx="8.5" fill="#fff" />
      {/* open book carved into the bowl (two pages meeting at a white spine) */}
      <path d="M33 21.5c-2.6-1.5-5.4-1.5-8 0v8c2.6-1.5 5.4-1.5 8 0z" fill="#C67139" />
      <path d="M35 21.5c2.6-1.5 5.4-1.5 8 0v8c-2.6-1.5-5.4-1.5-8 0z" fill="#C67139" />
    </svg>
  );
}
