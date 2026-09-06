"use client";

import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { ComingSoon } from "../ComingSoon";

const SECTIONS: ReadonlyArray<readonly [string, number, number, string]> = [
  ["Section A · MCQs", 15, 17, "Fast and accurate — no change needed."],
  ["Section B · Short questions", 28, 38, "Definitions fine, derivations rushed."],
  ["Section C · Long questions", 18, 30, "Structure, not knowledge. Use headings and state the law first."],
];

const MOCK_NEXT: ReadonlyArray<readonly [string, string]> = [
  ["6", "Rewrite Q19 with a proper structure"],
  ["4", "Drill moment of inertia derivations"],
  ["3", "Bernoulli numericals — units slip"],
  ["2", "Revise Doppler effect formulas"],
];

function sectionColor(pct: number): string {
  return pct >= 75 ? C.sage : pct >= 55 ? C.accent : C.danger;
}

export function Mock() {
  const { s } = useApp();
  if (s.authed)
    return (
      <ComingSoon
        title="Mock exams are coming"
        desc="Timed full-paper mocks assembled from your board's pattern, with a live paper map and marks breakdown. We're wiring them to your real question bank — for now, drill a chapter in Practice."
        cta={{ label: "Go to Practice", to: "practice" }}
      />
    );
  if (s.mockRunning) return <MockRunning />;
  if (s.mockDone) return <MockDone />;
  return <MockIntro />;
}

function MockIntro() {
  const { patch } = useApp();
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 26, padding: 32 }}>
        <div style={{ fontFamily: "Caprasimo", fontSize: 28, marginBottom: 6 }}>Physics XI · Full Paper Mock</div>
        <div style={{ color: C.muted, marginBottom: 24 }}>Built from the FBISE 2025 pattern. Sit it in one go — the timer does not pause.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
          <Stat n="90" label="minutes" />
          <Stat n="85" label="total marks" />
          <Stat n="3" label="sections" />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => patch({ mockRunning: true, mockDone: false, mockLeft: 5400 })} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "14px 30px", fontSize: 15 }}>Start paper</button>
          <button onClick={() => patch({ mockRunning: false, mockDone: true })} style={{ borderRadius: 999, background: C.sand, fontWeight: 700, padding: "14px 24px", fontSize: 15 }}>See last result</button>
        </div>
      </div>
    </div>
  );
}

function MockRunning() {
  const { s, patch } = useApp();
  const mm = Math.floor(s.mockLeft / 60);
  const ss = s.mockLeft % 60;
  const clock = `${mm}:${ss < 10 ? "0" + ss : ss}`;
  const pct = Math.round((1 - s.mockLeft / 5400) * 100);
  const timerColor = s.mockLeft < 600 ? C.danger : C.ink;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: "14px 22px", marginBottom: 16, position: "sticky", top: 66, zIndex: 10 }}>
        <div style={{ fontFamily: "Caprasimo", fontSize: 30, color: timerColor, minWidth: 120 }}>{clock}</div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 8, background: C.sand, borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: 8, width: `${pct}%`, background: C.accent, borderRadius: 999 }} />
          </div>
          <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600, marginTop: 6 }}>Question 14 of 42 · Section B (short questions)</div>
        </div>
        <button onClick={() => patch({ mockRunning: false, mockDone: true })} style={{ borderRadius: 999, background: C.sand, fontWeight: 700, padding: "11px 20px", fontSize: 14 }}>Submit paper</button>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 380, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 28 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".07em", color: C.accentD, marginBottom: 12 }}>SECTION B · Q14 · 3 MARKS</div>
          <div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.5, marginBottom: 20 }}>Define moment of inertia. On what factors does the moment of inertia of a rigid body depend?</div>
          <textarea placeholder="Write your answer…" style={{ width: "100%", minHeight: 180, border: "1.5px solid #e0d0b4", borderRadius: 18, background: "#fff", padding: "16px 18px", fontSize: 15, lineHeight: 1.6, outline: "none", resize: "vertical" }} />
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button style={{ borderRadius: 999, background: C.sand, fontWeight: 700, padding: "12px 22px", fontSize: 14 }}>← Previous</button>
            <button style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "12px 26px", fontSize: 14 }}>Next →</button>
            <div style={{ flex: 1 }} />
            <button style={{ borderRadius: 999, background: "transparent", border: "1.5px solid #e0d0b4", fontWeight: 700, padding: "12px 20px", fontSize: 14, color: C.muted }}>Flag for review</button>
          </div>
        </div>
        <div style={{ width: 230, flex: "none", background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Paper map</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6 }}>
            {Array.from({ length: 42 }, (_, i) => {
              const n = i + 1;
              const done = n < 14;
              const cur = n === 14;
              return (
                <div key={n} style={{ aspectRatio: "1", borderRadius: 8, background: cur ? C.accent : done ? C.sageT : C.bg, color: cur ? "#fff" : done ? C.sageD : "#b3a58c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{n}</div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
            <div>■ answered 13</div>
            <div>■ current 1</div>
            <div>■ untouched 28</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockDone() {
  const { go } = useApp();
  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 26, padding: 30, marginBottom: 16, display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 150, height: 150, flex: "none" }}>
          <svg width="150" height="150" viewBox="0 0 150 150">
            <circle cx="75" cy="75" r="64" fill="none" stroke={C.sand} strokeWidth="14" />
            <circle cx="75" cy="75" r="64" fill="none" stroke={C.accent} strokeWidth="14" strokeLinecap="round" strokeDasharray="281 999" transform="rotate(-90 75 75)" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "Caprasimo", fontSize: 38, lineHeight: 1, color: C.accentD }}>61</div>
            <div style={{ fontSize: 12, color: "#9a8d78", fontWeight: 600 }}>of 85 marks</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 30, lineHeight: 1.15, marginBottom: 6 }}>That&apos;s a B+ — up two grades since June</div>
          <div style={{ color: C.muted, fontSize: 15, marginBottom: 18, maxWidth: 520 }}>72% overall. You lost most marks in Section C long answers, where structure rather than knowledge was the problem. Fix that and an A is realistic before the boards.</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Pill bg={C.sageT} fg={C.sageD}>Predicted grade · B+</Pill>
            <Pill bg={C.tint} fg={C.accentD}>+9 marks vs last mock</Pill>
            <Pill bg={C.sand} fg="#5d5648">Finished 6 min early</Pill>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Section breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {SECTIONS.map(([name, got, max, note]) => {
              const pct = Math.round((got / max) * 100);
              const color = sectionColor(pct);
              return (
                <div key={name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                    <span>{name}</span>
                    <span style={{ color }}>{got} / {max}</span>
                  </div>
                  <div style={{ height: 10, background: C.sand, borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: 10, width: `${pct}%`, background: color, borderRadius: 999 }} />
                  </div>
                  <div style={{ fontSize: 12.5, color: "#9a8d78", marginTop: 5 }}>{note}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>What to do next</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>Added to your study plan automatically.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {MOCK_NEXT.map(([marks, text]) => (
              <div key={text} style={{ display: "flex", gap: 12, alignItems: "center", background: C.bg, borderRadius: 16, padding: "13px 15px" }}>
                <div style={{ width: 32, height: 32, flex: "none", borderRadius: 999, background: C.tint, color: C.accentD, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{marks}</div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{text}</div>
              </div>
            ))}
          </div>
          <button onClick={() => go("plan")} style={{ width: "100%", marginTop: 16, borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "12px 0", fontSize: 14 }}>Open study plan</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div style={{ background: C.bg, borderRadius: 18, padding: "16px 18px" }}>
      <div style={{ fontFamily: "Caprasimo", fontSize: 26 }}>{n}</div>
      <div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function Pill({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
  return <div style={{ background: bg, color: fg, borderRadius: 999, padding: "9px 18px", fontWeight: 700, fontSize: 14 }}>{children}</div>;
}
