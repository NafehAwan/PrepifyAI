"use client";

import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import type { Screen } from "@/lib/types";

// Honest placeholder for features that aren't wired to real data yet. Shown to
// signed-in users so they never see fabricated stats; the signed-out showcase
// still renders the demo screens.
export function ComingSoon({ title, desc, cta }: { title: string; desc: string; cta?: { label: string; to: Screen } }) {
  const { go } = useApp();
  return (
    <div style={{ maxWidth: 620, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "30px 32px" }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.accentD, marginBottom: 10 }}>In development</div>
      <div style={{ fontFamily: "Caprasimo", fontSize: 24, marginBottom: 8 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 14.5, lineHeight: 1.6 }}>{desc}</div>
      {cta && (
        <button onClick={() => go(cta.to)} style={{ marginTop: 18, borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "11px 22px", fontSize: 14 }}>{cta.label}</button>
      )}
    </div>
  );
}
