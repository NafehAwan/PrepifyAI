"use client";

import { useApp } from "@/lib/store";
import { C, pill } from "@/lib/theme";
import { buildDiagnostic } from "@/lib/data";
import { persistEnrollments, persistProfile } from "@/lib/supabase/persist";

const CLASSES: ReadonlyArray<readonly [string, string]> = [
  ["9th", "Matric part I"],
  ["10th", "Matric part II"],
  ["11th", "Intermediate part I"],
  ["12th", "Intermediate part II"],
];

const ALL_SUBJECTS = [
  "Physics", "Chemistry", "Biology", "Maths", "Computer Science", "English", "Urdu", "Islamiyat", "Pak Studies",
];

const STEP_LABELS = ["Class", "Subjects", "Exam date", "Placement"];
const LAST = STEP_LABELS.length; // 4

export function Onboarding() {
  const { s, set, patch, go, daysLeft } = useApp();
  const isA = s.obVar === "A";
  const isB = s.obVar === "B";
  const pct = Math.round(((s.ob - 1) / STEP_LABELS.length) * 100);

  const diag = buildDiagnostic(s.subs);
  const q = diag[s.dq];
  const dqOpen = s.ob === LAST && s.dq < diag.length;
  const dqDone = s.ob === LAST && s.dq >= diag.length;

  const finish = () => {
    // Persist the collected profile + subject choices (no-op in demo mode).
    void persistProfile(s);
    void persistEnrollments(s);
    go("home");
  };
  const back = () => set("ob", Math.max(1, s.ob - 1));
  const next = () => {
    if (s.ob === LAST) finish();
    else set("ob", s.ob + 1);
  };
  const advanceDq = () => set("dq", s.dq + 1);

  const backLabel = s.ob === 1 ? "" : "← Back";
  const nextDisabled = s.ob === 2 && s.subs.length === 0;
  const nextLabel = s.ob === LAST ? (s.dq >= diag.length ? "Go to my dashboard →" : "Skip diagnostic") : "Continue →";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo />
          <div style={{ fontFamily: "Caprasimo", fontSize: 20, letterSpacing: ".2px" }}>Prepify AI</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Onboarding layout</div>
          <div style={{ display: "flex", background: C.sand, borderRadius: 999, padding: 3 }}>
            <button onClick={() => set("obVar", "A")} style={pill(isA)}>A · Focused</button>
            <button onClick={() => set("obVar", "B")} style={pill(isB)}>B · Split</button>
          </div>
          <button onClick={finish} style={{ borderRadius: 999, padding: "8px 16px", background: C.sand, fontWeight: 600, fontSize: 13 }}>
            Skip to app
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "8px 32px 48px" }}>
        <div style={{ width: "100%", maxWidth: 1040, display: "flex", gap: 36 }}>
          {isB && (
            <div style={{ width: 290, flex: "none", paddingTop: 18 }}>
              <div style={{ fontFamily: "Caprasimo", fontSize: 34, lineHeight: 1.08, marginBottom: 10 }}>
                Let&apos;s set up<br />your board year.
              </div>
              <div style={{ color: C.muted, fontSize: 14, marginBottom: 28, maxWidth: 250 }}>
                Four quick steps. We&apos;ll pull the exact FBISE textbooks for your subjects and build a plan around your paper date.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {STEP_LABELS.map((label, i) => {
                  const n = i + 1;
                  const done = n < s.ob;
                  const cur = n === s.ob;
                  return (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 14, background: cur ? C.card : "transparent" }}>
                      <div style={{ width: 26, height: 26, flex: "none", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: done ? C.sage : cur ? C.accent : C.sand, color: done || cur ? "#fff" : "#9a8d78" }}>
                        {n}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: cur ? C.ink : C.muted }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
            {isA && (
              <div style={{ width: "100%", maxWidth: 640, margin: "12px 0 26px" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {STEP_LABELS.map((label, i) => (
                    <div key={label} style={{ height: 6, flex: 1, borderRadius: 999, background: i + 1 <= s.ob ? C.accent : C.sand }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, fontWeight: 600 }}>
                  <div>Step {s.ob} of {STEP_LABELS.length} · {STEP_LABELS[s.ob - 1]}</div>
                  <div>{pct}% done</div>
                </div>
              </div>
            )}

            <div style={{ width: "100%", maxWidth: 660, background: C.card, border: `1px solid ${C.line}`, borderRadius: 26, padding: "34px 34px 28px", boxShadow: "0 10px 30px rgba(90,62,30,.07)", animation: "pf-in .3s ease" }}>
              {s.ob === 1 && (
                <>
                  <H>Which class are you in?</H>
                  <Sub>We load the exact FBISE textbooks and past papers for that year.</Sub>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                    {CLASSES.map(([name, sub]) => {
                      const on = s.cls === name;
                      return (
                        <button key={name} onClick={() => set("cls", name)} style={{ textAlign: "left", borderRadius: 18, padding: "18px 20px", background: on ? C.tint : C.bg, border: `2px solid ${on ? C.accent : "transparent"}` }}>
                          <div style={{ fontFamily: "Caprasimo", fontSize: 22, color: on ? C.accentD : C.ink }}>{name}</div>
                          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {s.ob === 2 && (
                <>
                  <H>Choose your subjects</H>
                  <Sub>
                    Pick everything you&apos;re sitting this year — tap to add or remove.{" "}
                    <span style={{ color: C.accentD, fontWeight: 600 }}>{s.subs.length} selected.</span>
                  </Sub>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 22 }}>
                    {ALL_SUBJECTS.map((name) => {
                      const on = s.subs.includes(name);
                      return (
                        <button
                          key={name}
                          onClick={() => patch({ subs: on ? s.subs.filter((x) => x !== name) : [...s.subs, name] })}
                          style={{ borderRadius: 999, padding: "10px 16px", fontWeight: 600, fontSize: 14, background: on ? C.accent : "transparent", color: on ? "#fff" : "#5d5648", border: `1.5px solid ${on ? C.accent : "#dfcfb2"}` }}
                        >
                          {on ? "✓ " : "+ "}{name}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", background: C.sageT, borderRadius: 16, padding: "14px 16px" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f5c36" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginTop: 1 }}>
                      <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
                    </svg>
                    <div style={{ fontSize: 13.5, color: C.sageD, lineHeight: 1.45 }}>
                      For each subject Prepify fetches the full FBISE textbook, chapter by chapter, plus the last 8 years of board papers — so the tutor answers from <em>your</em> book, not the internet.
                    </div>
                  </div>
                </>
              )}

              {s.ob === 3 && (
                <>
                  <H>When is your first paper?</H>
                  <Sub>Everything — daily plan, revision spacing, mock timing — works backwards from this date.</Sub>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 20 }}>
                    <input type="date" value={s.examDate} onChange={(e) => set("examDate", e.target.value)} style={{ flex: 1, borderRadius: 999, border: "1.5px solid #e0d0b4", background: "#fff", padding: "14px 20px", fontSize: 16, fontWeight: 600, color: C.ink }} />
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{ flex: 1, background: C.tint, borderRadius: 18, padding: "18px 20px" }}>
                      <div style={{ fontFamily: "Caprasimo", fontSize: 36, color: C.accentD, lineHeight: 1 }}>{daysLeft}</div>
                      <div style={{ fontSize: 13, color: C.accentD, fontWeight: 600 }}>days to prepare</div>
                    </div>
                    <div style={{ flex: 1, background: C.sageT, borderRadius: 18, padding: "18px 20px" }}>
                      <div style={{ fontFamily: "Caprasimo", fontSize: 36, color: C.sageD, lineHeight: 1 }}>42<span style={{ fontSize: 20 }}>min</span></div>
                      <div style={{ fontSize: 13, color: C.sageD, fontWeight: 600 }}>suggested daily study</div>
                    </div>
                  </div>
                </>
              )}

              {s.ob === LAST && (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontFamily: "Caprasimo", fontSize: 30, lineHeight: 1.15 }}>Quick placement check</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.accentD, background: C.tint, borderRadius: 999, padding: "6px 14px" }}>
                      {Math.min(s.dq + 1, diag.length)} of {diag.length}
                    </div>
                  </div>
                  <Sub>No grade, no pressure. A few questions from your chosen subjects so we know where to start you.</Sub>
                  {dqOpen && q && (
                    <>
                      <div style={{ background: C.bg, borderRadius: 18, padding: "20px 22px", marginBottom: 18 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8 }}>{q.subject}</div>
                        <div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.4 }}>{q.stem}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {q.options.map((text, i) => (
                          <button key={text} onClick={advanceDq} style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", borderRadius: 16, padding: "14px 18px", background: C.bg, border: "1.5px solid transparent" }}>
                            <div style={{ width: 28, height: 28, flex: "none", borderRadius: 999, background: C.sand, color: "#5d5648", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{"ABCD"[i]}</div>
                            <div style={{ fontWeight: 500 }}>{text}</div>
                          </button>
                        ))}
                      </div>
                      <button onClick={advanceDq} style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: C.muted }}>Not covered yet — skip</button>
                    </>
                  )}
                  {dqDone && (
                    <div style={{ textAlign: "center", padding: "14px 0 4px" }}>
                      <div style={{ width: 96, height: 96, margin: "0 auto 18px", borderRadius: 999, background: C.sageT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#4f5c36" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      </div>
                      <div style={{ fontFamily: "Caprasimo", fontSize: 28, marginBottom: 6 }}>You&apos;re all set</div>
                      <div style={{ color: C.muted, maxWidth: 440, margin: "0 auto 22px" }}>
                        We&apos;ll start you at a comfortable level in each subject and adjust the difficulty as you go. Your plan begins with your weakest topics.
                      </div>
                      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                        {s.subs.slice(0, 6).map((name) => (
                          <div key={name} style={{ background: C.sageT, color: C.sageD, borderRadius: 999, padding: "8px 16px", fontWeight: 600, fontSize: 13 }}>{name}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: "1px solid #ece0c8" }}>
                <button onClick={back} style={{ fontWeight: 600, color: C.muted, padding: "10px 4px", fontSize: 14 }}>{backLabel}</button>
                <button onClick={next} disabled={nextDisabled} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "13px 30px", fontSize: 15, boxShadow: "0 6px 16px rgba(198,113,57,.3)", opacity: nextDisabled ? 0.5 : 1 }}>{nextLabel}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div style={{ width: 34, height: 34, borderRadius: 999, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "Caprasimo", fontSize: 18 }}>P</div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: "Caprasimo", fontSize: 30, lineHeight: 1.15, marginBottom: 6 }}>{children}</div>;
}

function Sub({ children }: { children: React.ReactNode }) {
  return <div style={{ color: C.muted, marginBottom: 24 }}>{children}</div>;
}
