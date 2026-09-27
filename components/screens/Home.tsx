"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { getSubjectStats, weakestSubjects, type SubjectStats } from "@/lib/analytics";
import { listAllTests, type TestRow } from "@/lib/tests/store";
import { currentUserId } from "@/lib/analytics";
import { Mascot, type Mood } from "../Mascot";
import { useIsMobile } from "@/lib/useIsMobile";

type Stats = Record<string, SubjectStats>;

function scoreColor(pct: number): string {
  return pct >= 75 ? C.sage : pct >= 50 ? C.accent : C.danger;
}

export function Home() {
  const { s } = useApp();
  const [stats, setStats] = useState<Stats>({});
  const [recent, setRecent] = useState<Array<TestRow & { subjectId: string }>>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [st, userId] = await Promise.all([getSubjectStats(s.subs), currentUserId()]);
      if (!active) return;
      setStats(st);
      if (userId) {
        const all = await listAllTests(userId);
        if (active) setRecent(all.filter((t) => t.status === "submitted").slice(0, 5));
      }
    })();
    return () => {
      active = false;
    };
  }, [s.subs]);

  const tested = Object.values(stats).filter((x) => x.avgPct !== null);
  const totalTests = tested.reduce((n, x) => n + x.testsTaken, 0);
  const overall = tested.length ? Math.round(tested.reduce((n, x) => n + (x.avgPct as number), 0) / tested.length) : null;
  const weak = weakestSubjects(stats, 3);
  const fresh = totalTests === 0;
  const greet = pickGreeting({ fresh, overall, weakest: weak[0]?.name });

  // Subject id lookup so a card can jump straight into that subject.
  const idByName = new Map(Object.values(stats).map((x) => [x.name, x.id] as const));

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "Caprasimo", fontSize: 32, lineHeight: 1.1 }}>Assalam-o-Alaikum, {s.userName.split(" ")[0]}</div>
          <div style={{ color: C.muted, marginTop: 4 }}>
            Class {s.cls.replace(/\D/g, "")} · {s.subs.length} subject{s.subs.length === 1 ? "" : "s"}
            {totalTests > 0 ? ` · ${totalTests} test${totalTests === 1 ? "" : "s"} taken` : ""}
          </div>
        </div>
        <HomeGreeter mood={greet.mood} text={greet.text} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, alignItems: "start" }}>
        <StartCard fresh={fresh} />

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Your average</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>
            {overall === null ? "Take a test and it'll show here." : "Across every test you've taken."}
          </div>
          <div style={{ fontFamily: "Caprasimo", fontSize: 44, lineHeight: 1, color: overall === null ? C.muted : scoreColor(overall) }}>
            {overall === null ? "—" : `${overall}%`}
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Needs work</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>
            {weak.length === 0 ? "Nothing yet — take a test in a couple of subjects." : "Your weakest subjects so far."}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {weak.map((w) => (
              <SubjectJump key={w.name} name={w.name} id={w.id} pct={w.avgPct as number} note={`avg over ${w.testsTaken} test${w.testsTaken === 1 ? "" : "s"}`} />
            ))}
          </div>
        </div>

        <div style={{ gridColumn: "span 2", background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Average by subject</div>
            <div style={{ fontSize: 12.5, color: C.muted }}>{fresh ? "Take a test to build these" : "Based on your test scores"}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 14 }}>
            {s.subs.map((name) => {
              const st = stats[name];
              const pct = st?.avgPct ?? 0;
              const color = st?.avgPct === null || st === undefined ? C.sand : scoreColor(pct);
              const dash = `${((2 * Math.PI * 38 * pct) / 100).toFixed(1)} 999`;
              return (
                <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ position: "relative", width: 88, height: 88 }}>
                    <svg width="88" height="88" viewBox="0 0 88 88">
                      <circle cx="44" cy="44" r="38" fill="none" stroke={C.sand} strokeWidth="9" />
                      <circle cx="44" cy="44" r="38" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={dash} transform="rotate(-90 44 44)" />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ fontFamily: "Caprasimo", fontSize: 24, lineHeight: 1, color: st?.avgPct === null ? C.muted : color }}>{st?.grade ?? "—"}</div>
                      <div style={{ fontSize: 11, color: "#9a8d78", fontWeight: 600 }}>{st?.avgPct === null || st === undefined ? "" : `${pct}%`}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, textAlign: "center" }}>{name}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Recent tests</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>
            {recent.length === 0 ? "No tests yet." : "Your last few results."}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recent.map((t) => {
              const pct = t.scorePct ?? 0;
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, background: C.bg, borderRadius: 16, padding: "11px 13px" }}>
                  <div style={{ width: 40, height: 40, flex: "none", borderRadius: 999, background: pct >= 50 ? C.sageT : C.tint, color: pct >= 50 ? C.sageD : C.accentD, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12.5 }}>
                    {pct}%
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: "#9a8d78" }}>
                      {t.correctCount}/{t.questionCount} · {t.remarks}
                    </div>
                  </div>
                </div>
              );
            })}
            {idByName.size === 0 && recent.length === 0 && (
              <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>Sign in to keep a record of every test.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StartCard({ fresh }: { fresh: boolean }) {
  const { go } = useApp();
  return (
    <div style={{ gridColumn: "span 2", background: C.accent, borderRadius: 24, padding: "26px 28px", color: "#fff", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", boxShadow: "0 12px 28px rgba(198,113,57,.25)" }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.85, marginBottom: 6 }}>
          {fresh ? "Start here" : "Keep going"}
        </div>
        <div style={{ fontFamily: "Caprasimo", fontSize: 26, lineHeight: 1.15, marginBottom: 6 }}>
          {fresh ? "Take your first test" : "Take another test"}
        </div>
        <div style={{ opacity: 0.9, fontSize: 14 }}>
          Pick a subject, choose 1 to 30 questions and how hard you want them. Every test is different.
        </div>
      </div>
      <button onClick={() => go("subjects")} style={{ borderRadius: 999, background: "#fff", color: C.accentD, fontWeight: 700, padding: "14px 26px", fontSize: 15, flex: "none" }}>
        My subjects →
      </button>
    </div>
  );
}

function SubjectJump({ name, id, pct, note }: { name: string; id: string; pct: number; note: string }) {
  const { patch, go } = useApp();
  return (
    <button
      onClick={() => {
        patch({ selectedSubjectId: id, selectedSubjectName: name });
        go("subjectTests");
      }}
      style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, background: C.bg, borderRadius: 16, padding: "12px 14px" }}
    >
      <div style={{ width: 36, height: 36, flex: "none", borderRadius: 999, background: C.tint, color: C.accentD, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12.5 }}>
        {pct}%
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 12, color: "#9a8d78" }}>{note}</div>
      </div>
    </button>
  );
}

// Prepi greets the student, reacting to their results and the time of day.
function pickGreeting({ fresh, overall, weakest }: { fresh: boolean; overall: number | null; weakest?: string }): { mood: Mood; text: string } {
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 5) return { mood: "sleepy", text: "Studying late? Do one short test, then rest — a fresh brain scores better." };
  if (fresh) return { mood: "wave", text: "Salam! Pick a subject and I'll set you a test. Start with 10 questions if you're not sure." };
  if (overall !== null && overall >= 80) return { mood: "proud", text: `${overall}% average — mashallah. Try the hard level and see how you go.` };
  if (weakest) return { mood: "thinking", text: `${weakest} is your weakest right now. Want to do a short one on it?` };
  return { mood: "happy", text: "Ready for another test? Even 10 questions helps." };
}

function HomeGreeter({ mood, text }: { mood: Mood; text: string }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 12, maxWidth: "100%" }}>
      <div style={{ position: "relative", background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "11px 15px", maxWidth: isMobile ? 200 : 250, fontSize: isMobile ? 12.5 : 13.5, lineHeight: 1.5, color: "#4a443c", boxShadow: "0 6px 18px rgba(90,62,30,.08)", animation: "pf-pop .5s var(--ease-soft) both" }}>
        {text}
        <div style={{ position: "absolute", right: -7, top: "50%", transform: "translateY(-50%) rotate(45deg)", width: 13, height: 13, background: C.card, borderRight: `1px solid ${C.line}`, borderTop: `1px solid ${C.line}` }} />
      </div>
      {/* No .pf-lift here — a transform transition on the wrapper fighting the
          mascot's own transform animation caused layer thrash on hover. */}
      <Mascot mood={mood} size={isMobile ? 68 : 92} />
    </div>
  );
}
