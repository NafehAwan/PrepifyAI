"use client";

import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { ComingSoon } from "../ComingSoon";

export function Reviews() {
  const { s } = useApp();
  if (s.authed)
    return (
      <ComingSoon
        title="Spaced-repetition reviews are coming"
        desc="Topics you've studied will resurface here on a spaced schedule so they don't slip before the boards. We're wiring the review queue to your real progress — for now, retake a topic quiz to refresh a weak area."
        cta={{ label: "Go to My Subjects", to: "subjects" }}
      />
    );
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 8, background: C.sand, borderRadius: 999, overflow: "hidden" }}>
          <div style={{ height: 8, width: "26%", background: C.sage, borderRadius: 999 }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>6 / 23</div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 26, padding: "36px 34px", textAlign: "center", minHeight: 300, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.accentD, marginBottom: 16 }}>Chemistry · Ch 3 · last seen 10 days ago</div>
        <div style={{ fontFamily: "Caprasimo", fontSize: 28, lineHeight: 1.25, marginBottom: 22 }}>What is the oxidation number of chromium in K₂Cr₂O₇?</div>
        <div style={{ fontSize: 15, color: C.muted }}>Say it out loud, then reveal.</div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button style={{ flex: 1, borderRadius: 999, background: C.sand, fontWeight: 700, padding: "14px 0", fontSize: 15 }}>Reveal answer</button>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button style={{ flex: 1, borderRadius: 999, background: C.tint, color: C.accentD, fontWeight: 700, padding: "13px 0", fontSize: 14 }}>Again · tomorrow</button>
        <button style={{ flex: 1, borderRadius: 999, background: C.sand, color: "#5d5648", fontWeight: 700, padding: "13px 0", fontSize: 14 }}>Hard · 3 days</button>
        <button style={{ flex: 1, borderRadius: 999, background: C.sageT, color: C.sageD, fontWeight: 700, padding: "13px 0", fontSize: 14 }}>Good · 10 days</button>
        <button style={{ flex: 1, borderRadius: 999, background: C.sage, color: "#fff", fontWeight: 700, padding: "13px 0", fontSize: 14 }}>Easy · 25 days</button>
      </div>
    </div>
  );
}
