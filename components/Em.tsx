import { C, DISPLAY } from "@/lib/theme";

// The signature emphasis in a headline: one italic phrase in orange.
// "Your <Em>subjects</Em>", "Mock <Em>Exam</Em>".
export function Em({ children }: { children: React.ReactNode }) {
  return <em style={{ color: C.accent, fontStyle: "italic" }}>{children}</em>;
}

// The small orange uppercase label that sits above a headline.
export function Eyebrow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ color: C.accent, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, ...style }}>
      {children}
    </div>
  );
}

// A screen's headline: orange eyebrow, then a Playfair title whose last
// phrase is the italic orange <Em>.
export function PageTitle({ eyebrow, lead, em, sub }: { eyebrow?: string; lead?: string; em: string; sub?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 400, fontSize: "clamp(28px, 3.4vw, 40px)", lineHeight: 1.12, letterSpacing: "-0.02em", color: C.ink }}>
        {lead ? `${lead} ` : ""}
        <Em>{em}</Em>
      </h1>
      {sub && <div style={{ color: C.body, fontSize: 15.5, lineHeight: 1.6, marginTop: 8, maxWidth: 620 }}>{sub}</div>}
    </div>
  );
}
