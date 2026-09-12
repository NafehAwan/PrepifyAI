"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { TASKS, WEAK, GAUGES } from "@/lib/data";
import { getSubjectMastery, weakSpotsFrom, type SubjectMastery } from "@/lib/analytics";
import { StrokeIcon, PATH } from "../Icon";
import { Mascot, type Mood } from "../Mascot";

type Mastery = Record<string, SubjectMastery>;
type Gauge = { name: string; pct: number; grade: string };
type Weak = { topic: string; subject: string; score: string };

function gaugeColor(pct: number): string {
  return pct >= 75 ? C.sage : pct >= 55 ? C.accent : C.danger;
}

// Predicted-grade gauges. Signed in → real (0 when nothing done); demo mode
// shows the sample figures.
function gaugeRows(mastery: Mastery, authed: boolean): Array<{ name: string; pct: number; grade: string }> {
  return GAUGES.map(([name, demoPct, demoGrade]) => {
    const m = mastery[name];
    return { name, pct: m ? m.pct : authed ? 0 : demoPct, grade: m ? m.grade : authed ? "—" : demoGrade };
  });
}

// Weak spots. Signed in → real attempted-not-passed topics (may be empty);
// demo mode shows the sample list.
function weakRows(mastery: Mastery, authed: boolean): Array<{ topic: string; subject: string; score: string }> {
  const rw = weakSpotsFrom(mastery, 3).map((w) => ({ topic: w.title, subject: `${w.subject} · ${w.chapter}`, score: `${w.scorePct}%` }));
  if (authed) return rw;
  return rw.length > 0 ? rw : WEAK.map(([topic, subject, score]) => ({ topic, subject, score }));
}

export function Home() {
  const { s } = useApp();
  const [mastery, setMastery] = useState<Mastery>({});
  useEffect(() => {
    let active = true;
    getSubjectMastery(s.subs).then((m) => {
      if (active) setMastery(m);
    });
    return () => {
      active = false;
    };
  }, [s.subs]);
  const reviewsDue = s.authed ? weakSpotsFrom(mastery, 99).length : 23;
  const gauges = gaugeRows(mastery, s.authed);
  const weak = weakRows(mastery, s.authed);
  const fresh = s.authed && gauges.every((g) => g.pct === 0); // signed in, nothing done yet
  const greet = pickGreeting({ fresh, reviewsDue, weakCount: weak.length, name: s.userName.split(" ")[0] });
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "Caprasimo", fontSize: 32, lineHeight: 1.1 }}>Assalam-o-Alaikum, {s.userName.split(" ")[0]}</div>
          <div style={{ color: C.muted, marginTop: 4 }}>Class {s.cls.replace(/\D/g, "")} · {s.subs.length} subject{s.subs.length === 1 ? "" : "s"}{s.authed ? "" : " · You're 3 topics ahead of your plan this week."}</div>
        </div>
        <HomeGreeter mood={greet.mood} text={greet.text} />
      </div>
      <BentoHome gauges={gauges} weak={weak} reviewsDue={reviewsDue} fresh={fresh} />
    </>
  );
}

// Prepi greets the student on the dashboard, reacting to their progress and the
// time of day with a short, warm message in a speech bubble.
function pickGreeting({ fresh, reviewsDue, weakCount }: { fresh: boolean; reviewsDue: number; weakCount: number; name: string }): { mood: Mood; text: string } {
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 5) return { mood: "sleepy", text: "Studying late? Do one more topic, then rest — a fresh brain scores better." };
  if (fresh) return { mood: "wave", text: "Salam! Ready to begin? Pick a subject and I'll quiz you once you've read a topic." };
  if (weakCount > 0) return { mood: "thinking", text: `You've got ${weakCount} weak spot${weakCount > 1 ? "s" : ""} to polish. Want to knock one out today?` };
  if (reviewsDue === 0) return { mood: "proud", text: "All caught up — mashallah! Keep the momentum going." };
  return { mood: "happy", text: "Let's learn something today. Tap a subject to get started." };
}

function HomeGreeter({ mood, text }: { mood: Mood; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: "100%" }}>
      <div style={{ position: "relative", background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "11px 15px", maxWidth: 250, fontSize: 13.5, lineHeight: 1.5, color: "#4a443c", boxShadow: "0 6px 18px rgba(90,62,30,.08)", animation: "pf-pop .5s var(--ease-soft) both" }}>
        {text}
        <div style={{ position: "absolute", right: -7, top: "50%", transform: "translateY(-50%) rotate(45deg)", width: 13, height: 13, background: C.card, borderRight: `1px solid ${C.line}`, borderTop: `1px solid ${C.line}` }} />
      </div>
      <Mascot mood={mood} size={92} className="pf-lift" />
    </div>
  );
}

function BentoHome({ gauges, weak, reviewsDue, fresh }: { gauges: Gauge[]; weak: Weak[]; reviewsDue: number; fresh: boolean }) {
  const { s, go } = useApp();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, alignItems: "start" }}>
      {/* resume */}
      <div style={{ gridColumn: "span 2", background: C.accent, borderRadius: 24, padding: "26px 28px", color: "#fff", display: "flex", alignItems: "center", gap: 24, boxShadow: "0 12px 28px rgba(198,113,57,.25)" }}>
        <div style={{ flex: 1 }}>
          <Kicker light>{fresh ? "Start learning" : "Continue where you left off"}</Kicker>
          <div style={{ fontFamily: "Caprasimo", fontSize: 26, lineHeight: 1.15, marginBottom: 6 }}>{fresh ? "Open your first subject" : "Physics · Ch 5 — Circular Motion"}</div>
          <div style={{ opacity: 0.9, fontSize: 14 }}>{fresh ? "Pick a subject, read the topic, then take the quiz to master it." : "Topic 5.3 Centripetal Force · you stopped 4 min into the reading"}</div>
          {!fresh && (
            <div style={{ height: 8, background: "rgba(255,255,255,.28)", borderRadius: 999, marginTop: 16, maxWidth: 340 }}>
              <div style={{ height: 8, width: "38%", background: "#fff", borderRadius: 999 }} />
            </div>
          )}
        </div>
        <button onClick={() => go(fresh ? "subjects" : "topic")} style={{ borderRadius: 999, background: "#fff", color: C.accentD, fontWeight: 700, padding: "14px 26px", fontSize: 15, flex: "none" }}>{fresh ? "Browse subjects →" : "Resume →"}</button>
      </div>

      {/* reviews */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 999, background: C.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <StrokeIcon d={PATH.refresh} size={18} stroke={C.accent} width={2.75} />
          </div>
          <div>
            <div style={{ fontFamily: "Caprasimo", fontSize: 30, lineHeight: 1 }}>{reviewsDue}</div>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginTop: -2 }}>reviews due today</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45 }}>{reviewsDue === 0 ? "You're all caught up — nothing to revisit right now." : "Topics you haven't mastered yet — revisit before they slip."}</div>
        <button onClick={() => go("reviews")} style={{ borderRadius: 999, background: C.sand, fontWeight: 700, fontSize: 14, padding: "11px 0", width: "100%" }}>Start review</button>
      </div>

      {/* today's plan */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 22 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Today&apos;s Plan</div>
        {s.authed ? (
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginTop: 6 }}>Your daily plan is coming soon. For now, open a subject and work through its topics in order.</div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* gauges */}
      <div style={{ gridColumn: "span 2", background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Predicted grade by subject</div>
          <div style={{ fontSize: 12.5, color: C.muted }}>{fresh ? "Pass topic quizzes to build these" : "Based on your quiz results"}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {gauges.map(({ name, pct, grade }) => {
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
        <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>{weak.length === 0 ? "No weak spots yet — take a topic quiz and they'll show up here." : "Fix these and your predicted average moves up a grade."}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {weak.map(({ topic, subject, score }) => (
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
