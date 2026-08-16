"use client";

import { useApp } from "@/lib/store";
import { C, pill } from "@/lib/theme";
import { TASKS, WEAK, GAUGES } from "@/lib/data";
import { StrokeIcon, PATH } from "../Icon";

function gaugeColor(pct: number): string {
  return pct >= 75 ? C.sage : pct >= 55 ? C.accent : C.danger;
}

export function Home() {
  const { s, set } = useApp();
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "Caprasimo", fontSize: 32, lineHeight: 1.1 }}>Assalam-o-Alaikum, Areeba</div>
          <div style={{ color: C.muted, marginTop: 4 }}>Class 11 · Pre-Medical · You&apos;re 3 topics ahead of your plan this week.</div>
        </div>
        <div style={{ display: "flex", background: C.sand, borderRadius: 999, padding: 3 }}>
          <button onClick={() => set("homeVar", "A")} style={pill(s.homeVar === "A")}>A · Bento</button>
          <button onClick={() => set("homeVar", "B")} style={pill(s.homeVar === "B")}>B · Focus rail</button>
        </div>
      </div>
      {s.homeVar === "A" ? <BentoHome /> : <FocusHome />}
    </>
  );
}

function BentoHome() {
  const { go } = useApp();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, alignItems: "start" }}>
      {/* resume */}
      <div style={{ gridColumn: "span 2", background: C.accent, borderRadius: 24, padding: "26px 28px", color: "#fff", display: "flex", alignItems: "center", gap: 24, boxShadow: "0 12px 28px rgba(198,113,57,.25)" }}>
        <div style={{ flex: 1 }}>
          <Kicker light>Continue where you left off</Kicker>
          <div style={{ fontFamily: "Caprasimo", fontSize: 26, lineHeight: 1.15, marginBottom: 6 }}>Physics · Ch 5 — Circular Motion</div>
          <div style={{ opacity: 0.9, fontSize: 14 }}>Topic 5.3 Centripetal Force · you stopped 4 min into the reading</div>
          <div style={{ height: 8, background: "rgba(255,255,255,.28)", borderRadius: 999, marginTop: 16, maxWidth: 340 }}>
            <div style={{ height: 8, width: "38%", background: "#fff", borderRadius: 999 }} />
          </div>
        </div>
        <button onClick={() => go("topic")} style={{ borderRadius: 999, background: "#fff", color: C.accentD, fontWeight: 700, padding: "14px 26px", fontSize: 15, flex: "none" }}>Resume →</button>
      </div>

      {/* reviews */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 999, background: C.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <StrokeIcon d={PATH.refresh} size={18} stroke={C.accent} width={2.75} />
          </div>
          <div>
            <div style={{ fontFamily: "Caprasimo", fontSize: 30, lineHeight: 1 }}>23</div>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginTop: -2 }}>reviews due today</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>Spaced repetition keeps Ch 1–4 from slipping. About 9 minutes.</div>
        <button onClick={() => go("reviews")} style={{ borderRadius: 999, background: C.sand, fontWeight: 700, fontSize: 14, padding: "11px 0", width: "100%" }}>Start review</button>
      </div>

      {/* today's plan */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 22 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Today&apos;s Plan</div>
        <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>3 of 5 done · 38 min left</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {TASKS.map(([title, meta, done]) => (
            <div key={title} style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <Checkbox done={done === 1} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: done ? "#9a8d78" : C.ink, textDecoration: done ? "line-through" : "none" }}>{title}</div>
                <div style={{ fontSize: 12, color: "#9a8d78" }}>{meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* gauges */}
      <div style={{ gridColumn: "span 2", background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Predicted grade by subject</div>
          <div style={{ fontSize: 12.5, color: C.muted }}>Based on 412 answered questions</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {GAUGES.map(([name, pct, grade]) => {
            const color = gaugeColor(pct);
            const dash = `${((2 * Math.PI * 38 * pct) / 100).toFixed(1)} 999`;
            return (
              <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ position: "relative", width: 88, height: 88 }}>
                  <svg width="88" height="88" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r="38" fill="none" stroke={C.sand} strokeWidth="9" />
                    <circle cx="44" cy="44" r="38" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={dash} transform="rotate(-90 44 44)" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontFamily: "Caprasimo", fontSize: 24, lineHeight: 1, color }}>{grade}</div>
                    <div style={{ fontSize: 11, color: "#9a8d78", fontWeight: 600 }}>{pct}%</div>
                  </div>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* weak spots */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 22 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Weak spots</div>
        <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>Fix these three and your predicted average moves up a grade.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {WEAK.map(([topic, subject, score]) => (
            <button key={topic} onClick={() => go("practice")} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, background: C.bg, borderRadius: 16, padding: "12px 14px" }}>
              <div style={{ width: 36, height: 36, flex: "none", borderRadius: 999, background: C.tint, color: C.accentD, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{score}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{topic}</div>
                <div style={{ fontSize: 12, color: "#9a8d78" }}>{subject}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FocusHome() {
  const { go } = useApp();
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 420, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "26px 28px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.accent, marginBottom: 14 }}>Your next 38 minutes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TASKS.map(([title, meta, done, time]) => (
              <div key={title} style={{ display: "flex", alignItems: "center", gap: 14, background: done ? "transparent" : C.bg, borderRadius: 18, padding: "14px 16px" }}>
                <Checkbox done={done === 1} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: done ? "#9a8d78" : C.ink, textDecoration: done ? "line-through" : "none" }}>{title}</div>
                  <div style={{ fontSize: 12.5, color: "#9a8d78" }}>{meta}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: done ? C.sageD : C.accentD, background: done ? C.sageT : C.tint, borderRadius: 999, padding: "5px 12px" }}>{time}</div>
              </div>
            ))}
          </div>
          <button onClick={() => go("topic")} style={{ marginTop: 18, borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "14px 28px", fontSize: 15 }}>Start with Centripetal Force →</button>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "22px 24px" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Predicted grades</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {GAUGES.map(([name, pct, grade]) => {
              const color = gaugeColor(pct);
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 120, fontSize: 14, fontWeight: 600 }}>{name}</div>
                  <div style={{ flex: 1, height: 12, background: C.sand, borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: 12, width: `${pct}%`, background: color, borderRadius: 999 }} />
                  </div>
                  <div style={{ width: 44, textAlign: "right", fontFamily: "Caprasimo", fontSize: 19, color }}>{grade}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ width: 320, flex: "none", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: C.accent, color: "#fff", borderRadius: 24, padding: 22, boxShadow: "0 12px 28px rgba(198,113,57,.25)" }}>
          <Kicker light>Resume</Kicker>
          <div style={{ fontFamily: "Caprasimo", fontSize: 21, lineHeight: 1.2, marginBottom: 12 }}>Ch 5 — Circular Motion</div>
          <button onClick={() => go("topic")} style={{ borderRadius: 999, background: "#fff", color: C.accentD, fontWeight: 700, padding: "11px 22px", fontSize: 14 }}>Continue</button>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 20, textAlign: "center" }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 40, lineHeight: 1, color: C.accent }}>23</div>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, margin: "2px 0 12px" }}>reviews due</div>
          <button onClick={() => go("reviews")} style={{ borderRadius: 999, background: C.sand, fontWeight: 700, fontSize: 14, padding: "10px 0", width: "100%" }}>Review now</button>
        </div>
        <div style={{ background: C.sageT, borderRadius: 24, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.sageD, marginBottom: 10 }}>Weak spots</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {WEAK.map(([topic, , score]) => (
              <button key={topic} onClick={() => go("practice")} style={{ width: "100%", textAlign: "left", fontSize: 13.5, fontWeight: 600, color: "#3f4a2b", display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topic}</span>
                <span style={{ opacity: 0.7 }}>{score}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Checkbox({ done, size = 22 }: { done: boolean; size?: number }) {
  return (
    <div style={{ width: size, height: size, flex: "none", borderRadius: 999, border: `2px solid ${done ? C.sage : "#d8c8ab"}`, background: done ? C.sage : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <StrokeIcon d={PATH.check} size={size * 0.55} stroke={done ? "#fff" : "transparent"} width={3.5} />
    </div>
  );
}

function Kicker({ light, children }: { light?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", opacity: light ? 0.85 : 1, marginBottom: light ? 6 : 8 }}>{children}</div>
  );
}
