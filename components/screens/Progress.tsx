"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { SUBJECTS } from "@/lib/data";
import { getSubjectMastery, weakSpotsFrom, pctToGrade, type SubjectMastery } from "@/lib/analytics";

const LEGEND: ReadonlyArray<readonly [string, string]> = [
  ["Mastered", C.sage],
  ["In progress", C.accent],
  ["Shaky", "#e0b48c"],
  ["Not started", "#e3d5bb"],
];

const WEAK_LIST: ReadonlyArray<readonly [string, string, string, number, number]> = [
  ["Centripetal & centrifugal confusion", "Physics · Ch 5", "31%", 31, 9],
  ["Balancing redox equations", "Chemistry · Ch 3", "38%", 38, 8],
  ["Integration by substitution", "Maths · Ch 9", "42%", 42, 8],
  ["Mendelian dihybrid crosses", "Biology · Ch 16", "48%", 48, 6],
  ["Essay structure — argumentative", "English · Paper B", "51%", 51, 5],
  ["Bernoulli numericals", "Physics · Ch 6", "55%", 55, 4],
];

// Deterministic coverage cells, matching the prototype's seeded LCG so the
// heat-map looks identical between renders.
function coverageCells(name: string, pct: number): string[] {
  const n = 54;
  let seed = name.length * 7 + pct;
  return Array.from({ length: n }, () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const r = seed % 100;
    return r < pct - 12 ? C.sage : r < pct + 8 ? C.accent : r < pct + 22 ? "#e0b48c" : "#e3d5bb";
  });
}

// Real coverage cells for a seeded subject: one square per topic, coloured by
// mastery state (mastered / in progress / shaky / not started).
function realCells(m: SubjectMastery): string[] {
  return m.topics.map((t) => {
    if (t.state === "done") return C.sage;
    if (t.state === "now") return t.score !== null && t.score < 50 ? "#e0b48c" : C.accent;
    return "#e3d5bb";
  });
}

export function Progress() {
  const { s, go } = useApp();
  const [mastery, setMastery] = useState<Record<string, SubjectMastery>>({});
  useEffect(() => {
    let active = true;
    getSubjectMastery(s.subs).then((m) => {
      if (active) setMastery(m);
    });
    return () => {
      active = false;
    };
  }, [s.subs]);

  // Blend real mastery over the demo baseline so the aggregate + heat-map stay
  // populated for subjects that aren't seeded yet.
  const realWeak = weakSpotsFrom(mastery);
  const aggPcts = SUBJECTS.map(([name, demoPct]) => mastery[name]?.pct ?? demoPct);
  const aggPct = Math.round(aggPcts.reduce((a, b) => a + b, 0) / aggPcts.length);
  const aggGrade = pctToGrade(aggPct);
  const aggMarks = Math.round((aggPct / 100) * 1100);

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6, gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Syllabus coverage map</div>
            <div style={{ fontSize: 12.5, color: C.muted }}>Every learning outcome in your 9 subjects · 486 total</div>
          </div>
          <div style={{ display: "flex", gap: 14, margin: "12px 0 20px", flexWrap: "wrap" }}>
            {LEGEND.map(([label, bg]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: C.muted, fontWeight: 600 }}>
                <span style={{ width: 12, height: 12, borderRadius: 4, background: bg, display: "inline-block" }} />
                {label}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SUBJECTS.map(([name, demoPct, demoGrade]) => {
              const m = mastery[name];
              const pct = m ? m.pct : demoPct;
              const grade = m ? m.grade : demoGrade;
              const cells = m ? realCells(m) : coverageCells(name, demoPct);
              const fg = pct >= 75 ? C.sageD : C.accentD;
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 124, flex: "none", fontSize: 13.5, fontWeight: 600 }}>{name}{m && <span style={{ fontSize: 10.5, color: C.sageD, fontWeight: 700, marginLeft: 6 }}>LIVE</span>}</div>
                  <div style={{ flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(15px,1fr))", gap: 4 }}>
                    {cells.map((bg, i) => (
                      <div key={i} style={{ aspectRatio: "1", maxWidth: 15, borderRadius: 4, background: bg }} />
                    ))}
                  </div>
                  <div style={{ width: 38, flex: "none", textAlign: "right", fontFamily: "Caprasimo", fontSize: 17, color: fg }}>{grade}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Weakest areas to fix</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 16 }}>
            {realWeak.length > 0 ? "Topics you attempted but haven't passed — weakest first." : "Ranked by marks at risk in the real paper."}
          </div>
          {realWeak.length === 0 && Object.keys(mastery).length > 0 && (
            <div style={{ fontSize: 13, color: C.sageD, background: C.sageT, borderRadius: 14, padding: "12px 14px", marginBottom: 12 }}>
              No failed topics in your live subjects — keep it up.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {(realWeak.length > 0
              ? realWeak.map((w) => ({ topic: w.title, sub: `${w.subject} · ${w.chapter}`, score: `${w.scorePct}%`, pct: w.scorePct }))
              : WEAK_LIST.map(([topic, subject, score, pct, risk]) => ({ topic, sub: `${subject} · ${risk} marks at risk`, score, pct }))
            ).map(({ topic, sub, score, pct }) => (
              <button key={topic} onClick={() => go("practice")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: C.bg, borderRadius: 16, padding: "13px 16px", textAlign: "left" }}>
                <div style={{ width: 40, flex: "none", fontFamily: "Caprasimo", fontSize: 18, color: C.accentD }}>{score}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{topic}</div>
                  <div style={{ fontSize: 12.5, color: "#9a8d78" }}>{sub}</div>
                </div>
                <div style={{ width: 140, flex: "none", height: 8, background: C.sand, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: 8, width: `${pct}%`, background: C.accent, borderRadius: 999 }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.accentD, flex: "none" }}>Drill →</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ width: 300, flex: "none", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: C.accent, color: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 12px 28px rgba(198,113,57,.25)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.85, marginBottom: 8 }}>Predicted aggregate</div>
          <div style={{ fontFamily: "Caprasimo", fontSize: 52, lineHeight: 1 }}>{aggGrade}</div>
          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>{aggMarks} / 1100 · {aggPct}%</div>
          <div style={{ height: 8, background: "rgba(255,255,255,.28)", borderRadius: 999, marginTop: 16 }}>
            <div style={{ height: 8, width: `${aggPct}%`, background: "#fff", borderRadius: 999 }} />
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 10 }}>
            {Object.keys(mastery).length > 0 ? "Updates live as you pass topic mastery quizzes." : "Sign in and pass quizzes to track this for real."}
          </div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Predicted grades</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {SUBJECTS.map(([name, demoPct, demoGrade]) => {
              const m = mastery[name];
              const pct = m ? m.pct : demoPct;
              const grade = m ? m.grade : demoGrade;
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13.5, fontWeight: 600 }}>
                  <span>{name}{m && <span style={{ fontSize: 10, color: C.sageD, fontWeight: 700, marginLeft: 6 }}>LIVE</span>}</span>
                  <span style={{ fontFamily: "Caprasimo", fontSize: 17, color: pct >= 75 ? C.sageD : C.accentD }}>{grade}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ background: C.sageT, borderRadius: 24, padding: 22 }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 32, color: C.sageD, lineHeight: 1 }}>17</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.sageD, marginTop: 2 }}>day streak · Level 12</div>
          <div style={{ fontSize: 13, color: "#5d6b46", lineHeight: 1.5, marginTop: 10 }}>Longest streak yet. 160 XP to Level 13.</div>
          <div style={{ height: 8, background: "rgba(255,255,255,.6)", borderRadius: 999, marginTop: 12 }}>
            <div style={{ height: 8, width: "78%", background: C.sage, borderRadius: 999 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
