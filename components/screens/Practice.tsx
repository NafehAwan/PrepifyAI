"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { C, pill } from "@/lib/theme";
import { DEMO_GRADE, type GradeResult } from "@/lib/ai/context";

const FB_GOOD = [
  "Correctly described what the passenger experiences during the turn.",
  "Recognised that the passenger continues moving while the car changes direction — that is the inertia idea, just unnamed.",
];

const FB_MISS: ReadonlyArray<readonly [string, string]> = [
  ["1 mark", "Name Newton’s first law / inertia explicitly."],
  ["1 mark", "Identify the real inward force — friction between tyres and road — as centripetal."],
  ["½ mark", "State that centrifugal force is fictitious, seen only in a rotating frame. You asserted it as real."],
];

const FB_KEYS: ReadonlyArray<readonly [string, 0 | 1]> = [
  ["inertia", 0], ["Newton’s first law", 0], ["centripetal force", 0], ["fictitious", 0], ["straight line", 1], ["friction", 1],
];

const ANNOTATED: ReadonlyArray<readonly [string, string, string, 0 | 1]> = [
  ["The passenger feels pushed outwards because of centrifugal force acting away from the centre.", "Centrifugal force is fictitious — say so, or you lose the justification mark.", "0", 0],
  ["The car turns but the passenger keeps going straight.", "This is inertia / Newton’s first law. Correct idea — name the law to bank the mark.", "+1", 1],
  ["So he moves outwards and hits the door.", "Right observation. Add that the door then supplies the inward force.", "+1", 1],
  ["(no mention of the real inward force)", "Missing: friction between tyres and road is the actual centripetal force.", "0", 0],
];

export function Practice() {
  const { s, set } = useApp();
  const [ai, setAi] = useState<GradeResult | null>(null);
  const [busy, setBusy] = useState(false);

  // Send the typed answer to the brutally-honest examiner. Falls back to the
  // static demo feedback when the AI backend isn't configured or errors.
  const submit = async () => {
    setBusy(true);
    let result: GradeResult | null = null;
    try {
      const res = await fetch("/api/ai/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: DEMO_GRADE.question,
          marks: DEMO_GRADE.marks,
          sloCode: DEMO_GRADE.sloCode,
          markingScheme: DEMO_GRADE.markingScheme,
          modelAnswer: DEMO_GRADE.modelAnswer,
          studentAnswer: s.pAnswer,
        }),
      });
      if (res.ok) result = (await res.json()) as GradeResult;
    } catch {
      // fall through to the static demo feedback
    }
    setAi(result);
    set("pShow", true);
    setBusy(false);
  };
  const submitLabel = busy ? "Marking…" : s.pShow ? "Re-mark" : "Submit for AI marking";

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: "Caprasimo", fontSize: 26 }}>Physics · Ch 5 drill</div>
          <div style={{ color: C.muted, fontSize: 14, marginTop: 2 }}>Question 4 of 12 · mixed MCQ, short and long · past papers 2018–2025</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>Feedback layout</div>
          <div style={{ display: "flex", background: C.sand, borderRadius: 999, padding: 3 }}>
            <button onClick={() => set("fbVar", "A")} style={pill(s.fbVar === "A")}>A · Side by side</button>
            <button onClick={() => set("fbVar", "B")} style={pill(s.fbVar === "B")}>B · Annotated</button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, maxWidth: 1100 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} style={{ height: 7, flex: 1, borderRadius: 999, background: i < 3 ? C.sage : i === 3 ? C.accent : C.sand }} />
        ))}
      </div>

      <div style={{ maxWidth: 1100, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "26px 28px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, background: C.sageT, color: C.sageD, borderRadius: 999, padding: "5px 12px" }}>LONG QUESTION · 5 MARKS</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, background: C.sand, color: "#5d5648", borderRadius: 999, padding: "5px 12px" }}>FBISE 2023 · Q17(b)</div>
        </div>
        <div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.5, marginBottom: 20 }}>
          Explain why a passenger in a car taking a sharp turn feels pushed outwards. Is any outward force acting on the passenger? Justify with reference to Newton&apos;s laws.
        </div>
        <textarea value={s.pAnswer} onChange={(e) => set("pAnswer", e.target.value)} placeholder="Write your answer as you would in the exam…" style={{ width: "100%", minHeight: 120, border: "1.5px solid #e0d0b4", borderRadius: 18, background: "#fff", padding: "16px 18px", fontSize: 15, lineHeight: 1.6, outline: "none", resize: "vertical" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
          <button onClick={submit} disabled={busy} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "13px 28px", fontSize: 15, opacity: busy ? 0.7 : 1 }}>{submitLabel}</button>
          <button style={{ borderRadius: 999, background: C.sand, fontWeight: 700, padding: "13px 22px", fontSize: 14 }}>Hint</button>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12.5, color: "#9a8d78" }}>Answer in Urdu is accepted — feedback follows your language setting.</div>
        </div>
      </div>

      {s.pShow &&
        (ai ? (
          <RealFeedback ai={ai} answer={s.pAnswer} onNext={() => { setAi(null); set("pShow", false); set("pAnswer", ""); }} />
        ) : s.fbVar === "A" ? (
          <FeedbackA />
        ) : (
          <FeedbackB />
        ))}
    </>
  );
}

// Live examiner feedback rendered from the /api/ai/grade result.
function RealFeedback({ ai, answer, onNext }: { ai: GradeResult; answer: string; onNext: () => void }) {
  return (
    <div style={{ maxWidth: 1100, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 16, alignItems: "start", animation: "pf-in .3s ease" }}>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Your answer</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, background: C.tint, borderRadius: 999, padding: "6px 15px" }}>
            <span style={{ fontFamily: "Caprasimo", fontSize: 20, color: C.accentD }}>{ai.awarded}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.accentD }}>/ {ai.outOf} marks</span>
          </div>
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.65, color: "#4a443c", background: C.bg, borderRadius: 16, padding: "16px 18px", marginBottom: 18 }}>
          {answer.trim() || "(left blank)"}
        </div>
        {ai.hits.length > 0 && (
          <>
            <Label color={C.sageD}>What you got right</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {ai.hits.map((text) => (
                <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, lineHeight: 1.5 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7a8a5e" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginTop: 3 }}><path d="M20 6 9 17l-5-5" /></svg>
                  <div>{text}</div>
                </div>
              ))}
            </div>
          </>
        )}
        {ai.missed.length > 0 && (
          <>
            <Label color={C.accentD}>Marks you missed</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {ai.missed.map((text) => (
                <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, lineHeight: 1.5 }}>
                  <div style={{ width: 16, height: 16, flex: "none", borderRadius: 999, border: "2.5px solid #c67139", marginTop: 2 }} />
                  <div>{text}</div>
                </div>
              ))}
            </div>
          </>
        )}
        {ai.keyword_gaps.length > 0 && (
          <>
            <Label color={C.muted}>Keywords the examiner looked for</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {ai.keyword_gaps.map((text) => (
                <div key={text} style={{ fontSize: 12.5, fontWeight: 600, borderRadius: 999, padding: "5px 12px", background: C.tint, color: C.accentD }}>✕ {text}</div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ background: C.sageT, borderRadius: 24, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#3f4a2b" }}>Examiner&apos;s verdict</div>
          <div style={{ background: C.sage, color: "#fff", borderRadius: 999, padding: "6px 15px", fontSize: 13, fontWeight: 700 }}>{ai.slo_code || DEMO_GRADE.sloCode}</div>
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.7, color: "#3a4327", marginBottom: 16 }}>{ai.feedback_md}</div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#3f4a2b", marginBottom: 8 }}>Model full-marks answer</div>
        <div style={{ fontSize: 14, lineHeight: 1.65, color: "#3a4327" }}>{DEMO_GRADE.modelAnswer}</div>
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #d3dbc1", display: "flex", gap: 10 }}>
          <button onClick={onNext} style={{ borderRadius: 999, background: C.sageD, color: "#fff", fontWeight: 700, padding: "12px 24px", fontSize: 14 }}>Next question →</button>
        </div>
      </div>
    </div>
  );
}

function KeywordChips() {
  return (
    <>
      {FB_KEYS.map(([text, got]) => (
        <div key={text} style={{ fontSize: 12.5, fontWeight: 600, borderRadius: 999, padding: "5px 12px", background: got ? C.sageT : C.tint, color: got ? C.sageD : C.accentD }}>
          {got ? text : "✕ " + text}
        </div>
      ))}
    </>
  );
}

function FeedbackA() {
  const { set } = useApp();
  return (
    <div style={{ maxWidth: 1100, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 16, alignItems: "start", animation: "pf-in .3s ease" }}>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Your answer</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, background: C.tint, borderRadius: 999, padding: "6px 15px" }}>
            <span style={{ fontFamily: "Caprasimo", fontSize: 20, color: C.accentD }}>3</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.accentD }}>/ 5 marks</span>
          </div>
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.65, color: "#4a443c", background: C.bg, borderRadius: 16, padding: "16px 18px", marginBottom: 18 }}>
          The passenger feels pushed outwards because of centrifugal force acting away from the centre. The car turns but the passenger keeps going straight. So he moves outwards and hits the door.
        </div>
        <Label color={C.sageD}>What you got right</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {FB_GOOD.map((text) => (
            <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, lineHeight: 1.5 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7a8a5e" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginTop: 3 }}><path d="M20 6 9 17l-5-5" /></svg>
              <div>{text}</div>
            </div>
          ))}
        </div>
        <Label color={C.accentD}>Marks you missed</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {FB_MISS.map(([marks, text]) => (
            <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, lineHeight: 1.5 }}>
              <div style={{ width: 16, height: 16, flex: "none", borderRadius: 999, border: "2.5px solid #c67139", marginTop: 2 }} />
              <div><strong>{marks}</strong> · {text}</div>
            </div>
          ))}
        </div>
        <Label color={C.muted}>Keywords the examiner looks for</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          <KeywordChips />
        </div>
      </div>

      <div style={{ background: C.sageT, borderRadius: 24, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#3f4a2b" }}>Model full-marks answer</div>
          <div style={{ background: C.sage, color: "#fff", borderRadius: 999, padding: "6px 15px", fontSize: 13, fontWeight: 700 }}>5 / 5</div>
        </div>
        <ModelAnswer />
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #d3dbc1", display: "flex", gap: 10 }}>
          <button onClick={() => set("pShow", false)} style={{ borderRadius: 999, background: C.sageD, color: "#fff", fontWeight: 700, padding: "12px 24px", fontSize: 14 }}>Next question →</button>
          <button style={{ borderRadius: 999, background: "rgba(255,255,255,.6)", color: "#3f4a2b", fontWeight: 700, padding: "12px 20px", fontSize: 14 }}>Add to reviews</button>
        </div>
      </div>
    </div>
  );
}

function FeedbackB() {
  const { set } = useApp();
  return (
    <div style={{ maxWidth: 1100, animation: "pf-in .3s ease" }}>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "26px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <div style={{ width: 78, height: 78, flex: "none", position: "relative" }}>
            <svg width="78" height="78" viewBox="0 0 78 78">
              <circle cx="39" cy="39" r="33" fill="none" stroke={C.sand} strokeWidth="9" />
              <circle cx="39" cy="39" r="33" fill="none" stroke={C.accent} strokeWidth="9" strokeLinecap="round" strokeDasharray="124 999" transform="rotate(-90 39 39)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Caprasimo", fontSize: 22, color: C.accentD }}>3/5</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Caprasimo", fontSize: 22, marginBottom: 3 }}>Good instinct, incomplete physics</div>
            <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.5 }}>You described the effect correctly but named the wrong cause. Two marks are sitting in the words <em>inertia</em> and <em>fictitious</em>.</div>
          </div>
          <button onClick={() => set("pShow", false)} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "12px 24px", fontSize: 14, flex: "none" }}>Next question →</button>
        </div>

        <Label color={C.muted}>Your answer, marked line by line</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24 }}>
          {ANNOTATED.map(([text, note, mark, ok]) => (
            <div key={text} style={{ display: "flex", borderRadius: 16, overflow: "hidden", border: `1px solid ${ok ? "#dbe2cc" : "#f0d9c2"}` }}>
              <div style={{ width: 5, flex: "none", background: ok ? C.sage : C.accent }} />
              <div style={{ flex: 1, padding: "13px 16px", background: ok ? "#f2f5ea" : "#fdf1e6" }}>
                <div style={{ fontSize: 14.5, lineHeight: 1.55, marginBottom: 6 }}>{text}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: ok ? C.sageD : C.accentD }}>{note}</div>
              </div>
              <div style={{ flex: "none", padding: "13px 16px", fontSize: 12.5, fontWeight: 700, color: ok ? C.sageD : C.accentD, alignSelf: "center" }}>{mark}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 24, alignItems: "center" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, marginRight: 4 }}>Keywords:</div>
          <KeywordChips />
        </div>

        <div style={{ background: C.sageT, borderRadius: 20, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#3f4a2b" }}>Model full-marks answer</div>
            <div style={{ background: C.sage, color: "#fff", borderRadius: 999, padding: "5px 14px", fontSize: 12.5, fontWeight: 700 }}>5 / 5</div>
          </div>
          <div style={{ fontSize: 14.5, lineHeight: 1.7, color: "#3a4327" }}>
            No real outward force acts. By Newton&apos;s first law the passenger continues in a <strong>straight line</strong> due to <strong>inertia</strong>, while the car is turned by a real <strong>centripetal force</strong> (tyre friction) towards the centre. The passenger presses on the door, and the door supplies the inward force that carries them round the bend. The apparent outward push is a <strong>fictitious force</strong> seen only in the car&apos;s rotating frame.
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelAnswer() {
  return (
    <div style={{ fontSize: 14.5, lineHeight: 1.7, color: "#3a4327" }}>
      <p style={{ margin: "0 0 12px" }}>No real outward force acts on the passenger. By Newton&apos;s first law, the passenger&apos;s body tends to continue moving in a <strong>straight line</strong> because of its <strong>inertia</strong>.</p>
      <p style={{ margin: "0 0 12px" }}>The car, however, is being turned by a real <strong>centripetal force</strong> — the friction between the tyres and the road — directed towards the centre of the turn.</p>
      <p style={{ margin: "0 0 12px" }}>Relative to the turning car, the passenger therefore appears to move outwards and presses against the door. The door then supplies the inward force that makes the passenger follow the circular path.</p>
      <p style={{ margin: 0 }}>The apparent outward &quot;centrifugal force&quot; is a <strong>fictitious force</strong>, observed only in the rotating (non-inertial) frame of the car.</p>
    </div>
  );
}

function Label({ color, children }: { color: string; children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color, marginBottom: 9 }}>{children}</div>;
}
