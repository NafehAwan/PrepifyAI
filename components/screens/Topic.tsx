"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C, pill, wideTab } from "@/lib/theme";
import { CHAT_SEED } from "@/lib/store";
import { StrokeIcon, FillIcon, PATH } from "../Icon";
import { getTopicContent, toTeachContext, type DBTopicContent, type DBMcq } from "@/lib/curriculum";
import { persistTopicProgress } from "@/lib/supabase/persist";
import { generateQuiz } from "@/lib/ai/generate";
import { MarkdownLite } from "../MarkdownLite";
import type { ChatMsg } from "@/lib/types";

const QUIZ_OPTS = ["2 N", "4 N", "8 N", "16 N"];
const RIGHT = 2;
const CHIPS = ["Give me a worked example", "Explain in Urdu", "What can they ask in the paper?"];

export function Topic() {
  const { s } = useApp();
  if (s.selectedTopicId) return <RealTopic topicId={s.selectedTopicId} />;
  return <DemoTopic />;
}

function DemoTopic() {
  const { s, set, go } = useApp();
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <button onClick={() => go("chapters")} style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 4 }}>← Physics · Ch 5 Rotational and Circular Motion</button>
          <div style={{ fontFamily: "Caprasimo", fontSize: 26 }}>5.3 Centripetal Force</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.accentD, background: C.tint, borderRadius: 999, padding: "7px 14px" }}>In progress · pass the quiz to master</div>
          <div style={{ display: "flex", background: C.sand, borderRadius: 999, padding: 3 }}>
            <button onClick={() => set("topicVar", "A")} style={pill(s.topicVar === "A")}>A · 3 panes</button>
            <button onClick={() => set("topicVar", "B")} style={pill(s.topicVar === "B")}>B · Reading + tabs</button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "stretch", flexWrap: "wrap", minHeight: 560 }}>
        <ReadingPane />
        {s.topicVar === "A" ? <PanesA /> : <PaneB />}
      </div>
    </>
  );
}

function ReadingPane() {
  return (
    <div style={{ flex: 1, minWidth: 400, height: 660, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "16px 22px", borderBottom: "1px solid #ece0c8", display: "flex", alignItems: "center", gap: 10 }}>
        <StrokeIcon d="M4 4a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2z" size={17} stroke={C.accent} width={2.75} />
        <div style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>Textbook · FBISE Physics XI, p. 118</div>
        <button style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, background: C.sand, borderRadius: 999, padding: "6px 13px" }}>Explain simply</button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "24px 26px", fontSize: 15.5, lineHeight: 1.72, color: "#332f2b" }}>
        <p style={{ margin: "0 0 16px" }}>
          When a body moves along a circular path with uniform speed, its direction of motion changes continuously. A change in direction is a change in velocity, so the body is accelerating even though its speed is constant. This acceleration is directed towards the centre of the circle and is called <strong>centripetal acceleration</strong>.
        </p>
        <div style={{ background: C.tint, borderRadius: 18, padding: "18px 22px", margin: "20px 0" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.accentD, marginBottom: 8 }}>Key relation</div>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 22, color: C.ink }}>
            a<sub>c</sub> = v² / r &nbsp;&nbsp;→&nbsp;&nbsp; F<sub>c</sub> = m v² / r = m r ω²
          </div>
        </div>
        <p style={{ margin: "0 0 16px" }}>
          The force needed to produce this acceleration is the <strong>centripetal force</strong>. It is not a new kind of force — it is whatever real force happens to act towards the centre: tension in a string, friction between tyre and road, or gravitational pull on a satellite.
        </p>
        <p style={{ margin: "0 0 16px" }}>
          A common board-exam error is to call the outward &quot;centrifugal force&quot; a real force. It is a fictitious force that appears only when you describe motion from a rotating frame of reference. In every FBISE marking scheme, marks are given for identifying the <em>real</em> inward force.
        </p>
        <div style={{ border: "1.5px dashed #d8c8ab", borderRadius: 18, padding: 26, textAlign: "center", margin: "22px 0", background: "repeating-linear-gradient(45deg,#f5ead8,#f5ead8 8px,#f1e3cb 8px,#f1e3cb 16px)" }}>
          <div style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 12.5, color: C.muted }}>figure 5.7 — car on a banked road, force diagram</div>
        </div>
        <p style={{ margin: "0 0 16px" }}>
          For a car of mass <em>m</em> taking a bend of radius <em>r</em>, the maximum safe speed on a level road is limited by friction: v<sub>max</sub> = √(μ g r). Banking the road provides a horizontal component of the normal reaction, allowing a higher safe speed without relying on friction.
        </p>
        <p style={{ margin: 0 }}>Worked example 5.4 in your textbook applies this to a 1000 kg car on a 50 m bend — work through it before attempting the quiz.</p>
      </div>
      <div style={{ padding: "12px 22px", borderTop: "1px solid #ece0c8", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 7, background: C.sand, borderRadius: 999, overflow: "hidden" }}>
          <div style={{ height: 7, width: "64%", background: C.accent, borderRadius: 999 }} />
        </div>
        <div style={{ fontSize: 12, color: "#9a8d78", fontWeight: 600 }}>64% read</div>
      </div>
    </div>
  );
}

function PanesA() {
  return (
    <>
      <div style={{ width: 340, flex: "1 1 300px", height: 660, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #ece0c8", display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 26, height: 26, borderRadius: 999, background: C.sage, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FillIcon d={PATH.sparkle} size={14} fill="#fff" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>AI Tutor</div>
        </div>
        <TutorBody maxWidth="88%" />
      </div>
      <div style={{ width: 330, flex: "1 1 300px", height: 660, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #ece0c8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Mastery quiz</div>
          <div style={{ fontSize: 12, color: "#9a8d78", fontWeight: 600 }}>3 of 4 correct</div>
        </div>
        <QuizBody />
        <div style={{ padding: "14px 20px", borderTop: "1px solid #ece0c8" }}>
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
            <QuizPip color={C.sage} />
            <QuizPip color={C.sage} />
            <QuizPip color={C.accent} />
            <QuizPip color={C.sand} />
          </div>
          <DrillButton />
        </div>
      </div>
    </>
  );
}

function PaneB() {
  const { s, set } = useApp();
  const onTutor = s.topicTab === "tutor";
  return (
    <div style={{ width: 420, flex: "1 1 360px", height: 660, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: 12, borderBottom: "1px solid #ece0c8" }}>
        <div style={{ display: "flex", background: C.bg, borderRadius: 999, padding: 4 }}>
          <button onClick={() => set("topicTab", "tutor")} style={wideTab(onTutor)}>AI Tutor</button>
          <button onClick={() => set("topicTab", "quiz")} style={wideTab(!onTutor)}>Mastery quiz · 3/4</button>
        </div>
      </div>
      {onTutor ? <TutorBody maxWidth="82%" big /> : <QuizBody big />}
    </div>
  );
}

function TutorBody({ maxWidth, big }: { maxWidth: string; big?: boolean }) {
  const { s, set, ask } = useApp();
  const msgs: ChatMsg[] = s.chat.length ? s.chat : CHAT_SEED;
  return (
    <>
      <div style={{ flex: 1, overflow: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.map(([who, text], i) => {
          const me = who === "me";
          return (
            <div key={i} style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth, background: me ? C.accent : C.bg, color: me ? "#fff" : "#332f2b", borderRadius: me ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: big ? "13px 16px" : "12px 15px", fontSize: big ? 14.5 : 14, lineHeight: 1.55 }}>
              {text}
            </div>
          );
        })}
      </div>
      <div style={{ padding: 12, borderTop: "1px solid #ece0c8" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 9, flexWrap: "wrap" }}>
          {CHIPS.map((c) => (
            <button key={c} onClick={() => ask(c)} style={{ fontSize: 12, fontWeight: 600, color: "#5d5648", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 999, padding: "6px 12px" }}>{c}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: C.bg, borderRadius: 999, padding: "5px 5px 5px 16px" }}>
          <input
            value={s.draft}
            onChange={(e) => set("draft", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ask(s.draft); } }}
            placeholder="Ask about this topic…"
            style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", outline: "none", fontSize: 14, padding: "8px 0" }}
          />
          <button onClick={() => ask(s.draft)} style={{ width: 36, height: 36, flex: "none", borderRadius: 999, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FillIcon d={PATH.send} fill="#fff" />
          </button>
        </div>
      </div>
    </>
  );
}

function QuizBody({ big }: { big?: boolean }) {
  const { s, patch } = useApp();
  return (
    <div style={{ flex: 1, overflow: "auto", padding: big ? 22 : 20 }}>
      <div style={{ fontSize: big ? 16 : 15, fontWeight: 600, lineHeight: 1.45, marginBottom: big ? 18 : 16 }}>
        A 0.5 kg stone is whirled on a 1 m string at 4 m s⁻¹. What is the tension in the string?
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: big ? 10 : 9 }}>
        {QUIZ_OPTS.map((text, i) => {
          const picked = s.quizPick === i;
          const right = i === RIGHT;
          const bg = picked ? (right ? C.sageT : C.tint) : C.bg;
          const bd = picked ? (right ? C.sage : C.accent) : "transparent";
          const keyBg = picked ? (right ? C.sage : C.accent) : C.sand;
          const keyFg = picked ? "#fff" : "#5d5648";
          return (
            <button key={text} onClick={() => patch({ quizPick: i, quizDone: right })} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", borderRadius: big ? 16 : 14, padding: big ? "14px 16px" : "12px 14px", background: bg, border: `1.5px solid ${bd}` }}>
              <div style={{ width: big ? 26 : 24, height: big ? 26 : 24, flex: "none", borderRadius: 999, background: keyBg, color: keyFg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{"ABCD"[i]}</div>
              <div style={{ fontSize: big ? 14.5 : 14, fontWeight: 500, flex: 1 }}>{text}</div>
            </button>
          );
        })}
      </div>
      {s.quizDone && (
        <div style={{ marginTop: big ? 18 : 16, background: C.sageT, borderRadius: 16, padding: big ? 16 : "15px 16px" }}>
          <div style={{ fontWeight: 700, color: C.sageD, fontSize: big ? 14.5 : 14, marginBottom: 5 }}>Correct — F = mv²/r = 0.5 × 16 / 1 = 8 N</div>
          <div style={{ fontSize: big ? 13.5 : 13, color: C.sageD, lineHeight: 1.5 }}>
            {big ? "One more right answer marks 5.3 mastered and unlocks 5.4." : "That's 3 of 4 right. One more and 5.3 is marked mastered, unlocking 5.4 Moment of Inertia."}
          </div>
        </div>
      )}
    </div>
  );
}

function QuizPip({ color }: { color: string }) {
  return <div style={{ height: 6, flex: 1, borderRadius: 999, background: color }} />;
}

function DrillButton() {
  const { go } = useApp();
  return (
    <button onClick={() => go("practice")} style={{ width: "100%", borderRadius: 999, background: C.sand, fontWeight: 700, fontSize: 14, padding: "11px 0" }}>Drill more questions</button>
  );
}

// ---------------------------------------------------------------------------
// Live topic: real content from the DB, a tutor grounded on it, and the real
// SLO-based MCQ quiz.
// ---------------------------------------------------------------------------

function RealTopic({ topicId }: { topicId: string }) {
  const { patch, go } = useApp();
  const [content, setContent] = useState<DBTopicContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [rightTab, setRightTab] = useState<"tutor" | "quiz">("tutor");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTopicContent(topicId).then((c) => {
      if (!active) return;
      setContent(c);
      setLoading(false);
      // Ground the tutor on this topic and start a fresh chat.
      if (c) patch({ teach: toTeachContext(c), chat: [] });
    });
    return () => {
      active = false;
    };
  }, [topicId, patch]);

  const back = () => {
    patch({ selectedTopicId: null, teach: null, chat: [] });
    go("chapters");
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <button onClick={back} style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
            ← {content ? `${content.subjectName} · ${content.chapterTitle}` : "Back to chapters"}
          </button>
          <div style={{ fontFamily: "Caprasimo", fontSize: 26 }}>{content?.title ?? "Loading…"}</div>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.accentD, background: C.tint, borderRadius: 999, padding: "7px 14px" }}>Teach → test · from your textbook</div>
      </div>

      {loading && <div style={{ color: C.muted, fontSize: 14 }}>Loading topic…</div>}
      {!loading && !content && (
        <div style={{ color: C.muted, fontSize: 14 }}>Couldn&apos;t load this topic. <button onClick={back} style={{ color: C.accentD, fontWeight: 600 }}>Go back</button></div>
      )}

      {content && (
        <div style={{ display: "flex", gap: 16, alignItems: "stretch", flexWrap: "wrap", minHeight: 560 }}>
          {/* reading pane */}
          <div style={{ flex: 1, minWidth: 400, height: 660, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #ece0c8", display: "flex", alignItems: "center", gap: 10 }}>
              <StrokeIcon d="M4 4a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2z" size={17} stroke={C.accent} width={2.75} />
              <div style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>Textbook · FBISE {content.subjectName} {content.classLevel}</div>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "22px 26px", fontSize: 15.5, lineHeight: 1.72, color: "#332f2b" }}>
              {content.slos.map((slo) => (
                <div key={slo.code} style={{ marginBottom: 22 }}>
                  <div style={{ display: "inline-block", fontSize: 11.5, fontWeight: 700, color: C.accentD, background: C.tint, borderRadius: 999, padding: "3px 10px", marginBottom: 8 }}>SLO {slo.code}</div>
                  <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 8 }}>{slo.statement}</div>
                  <MarkdownLite md={slo.contentMd} />
                </div>
              ))}
            </div>
          </div>

          {/* right panel */}
          <div style={{ width: 420, flex: "1 1 360px", height: 660, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #ece0c8" }}>
              <div style={{ display: "flex", background: C.bg, borderRadius: 999, padding: 4 }}>
                <button onClick={() => setRightTab("tutor")} style={wideTab(rightTab === "tutor")}>① Learn</button>
                <button onClick={() => setRightTab("quiz")} style={wideTab(rightTab === "quiz")}>② Test</button>
              </div>
            </div>
            {rightTab === "tutor" ? <RealTutor topicTitle={content.title} /> : <QuizPanel content={content} />}
          </div>
        </div>
      )}
    </>
  );
}

function RealTutor({ topicTitle }: { topicTitle: string }) {
  const { s, set, ask } = useApp();
  const msgs = s.chat;
  return (
    <>
      <div style={{ flex: 1, overflow: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.length === 0 && (
          <div style={{ alignSelf: "flex-start", maxWidth: "88%", background: C.bg, color: "#332f2b", borderRadius: "16px 16px 16px 4px", padding: "12px 15px", fontSize: 14, lineHeight: 1.55 }}>
            Salam! Ask me anything about <strong>{topicTitle}</strong> and I&apos;ll answer only from your FBISE textbook, citing the SLO.
          </div>
        )}
        {msgs.map(([who, text], i) => {
          const me = who === "me";
          return (
            <div key={i} style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: "88%", background: me ? C.accent : C.bg, color: me ? "#fff" : "#332f2b", borderRadius: me ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "12px 15px", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
              {text}
            </div>
          );
        })}
      </div>
      <div style={{ padding: 12, borderTop: "1px solid #ece0c8" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 9, flexWrap: "wrap" }}>
          {["Explain simpler", "Give me an example", "What can they ask in the paper?"].map((c) => (
            <button key={c} onClick={() => ask(c)} style={{ fontSize: 12, fontWeight: 600, color: "#5d5648", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 999, padding: "6px 12px" }}>{c}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: C.bg, borderRadius: 999, padding: "5px 5px 5px 16px" }}>
          <input value={s.draft} onChange={(e) => set("draft", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ask(s.draft); } }} placeholder="Ask about this topic…" style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", outline: "none", fontSize: 14, padding: "8px 0" }} />
          <button onClick={() => ask(s.draft)} style={{ width: 36, height: 36, flex: "none", borderRadius: 999, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FillIcon d={PATH.send} fill="#fff" />
          </button>
        </div>
      </div>
    </>
  );
}

// Wraps the quiz with a "Generate AI quiz" control. Fresh questions are created
// on demand from this topic's real text (grounded), so a quiz exists even when
// no bank was pre-seeded, and the student can always get a new set.
function QuizPanel({ content }: { content: DBTopicContent }) {
  const { s } = useApp();
  const [gen, setGen] = useState<DBMcq[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [nonce, setNonce] = useState(0);

  const mcqs = gen ?? content.mcqs;

  const generate = async () => {
    if (!s.teach) return;
    setBusy(true);
    setNote("");
    const q = await generateQuiz(s.teach, 5, s.groqKey);
    setBusy(false);
    if (q) {
      setGen(q);
      setNonce((n) => n + 1);
    } else {
      setNote("Couldn't generate — connect your Groq key in Settings, then try again.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #ece0c8", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, flex: 1, minWidth: 0 }}>
          {gen ? "AI-generated from this topic" : mcqs.length > 0 ? "From your textbook bank" : "No pre-seeded questions"}
        </div>
        <button onClick={generate} disabled={busy} style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "7px 14px", background: C.accent, color: "#fff", opacity: busy ? 0.7 : 1, flex: "none" }}>
          {busy ? "Generating…" : gen || mcqs.length > 0 ? "✨ New AI quiz" : "✨ Generate AI quiz"}
        </button>
      </div>
      {note && <div style={{ margin: "10px 14px 0", fontSize: 12.5, color: C.accentD, background: C.tint, borderRadius: 12, padding: "9px 12px", lineHeight: 1.45 }}>{note}</div>}
      {mcqs.length > 0 ? (
        <RealQuiz key={nonce} topicId={content.id} mcqs={mcqs} />
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13.5, padding: 24, textAlign: "center", lineHeight: 1.5 }}>
          No bank seeded yet — tap <strong>&nbsp;Generate AI quiz&nbsp;</strong> to create one from this topic&apos;s text.
        </div>
      )}
    </div>
  );
}

function RealQuiz({ topicId, mcqs }: { topicId: string; mcqs: DBTopicContent["mcqs"] }) {
  const { patch, go } = useApp();
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "local">("idle");

  const total = mcqs.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = pct >= 70;

  // When the quiz finishes, record the result to the student's account (once).
  useEffect(() => {
    if (!done) return;
    setSave("saving");
    let active = true;
    persistTopicProgress(topicId, { scorePct: pct, passed }).then((ok) => {
      if (active) setSave(ok ? "saved" : "local");
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (mcqs.length === 0) {
    return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 14, padding: 24, textAlign: "center" }}>No quiz questions seeded for this topic yet.</div>;
  }

  const q = mcqs[qi];

  if (done) {
    const backToMap = () => { patch({ selectedTopicId: null, teach: null, chat: [] }); go("chapters"); };
    return (
      <div style={{ flex: 1, overflow: "auto", padding: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 10 }}>
        <div style={{ fontFamily: "Caprasimo", fontSize: 40, color: passed ? C.sage : C.accent }}>{pct}%</div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{correct} of {total} correct</div>
        <div style={{ fontSize: 13.5, color: C.muted, maxWidth: 300, lineHeight: 1.5 }}>
          {passed ? "Passed — you've mastered this topic's SLOs (70% needed)." : "Below the 70% pass bar. Re-read the weak SLOs and try again."}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, borderRadius: 999, padding: "5px 13px", background: save === "saved" ? C.sageT : C.sand, color: save === "saved" ? C.sageD : "#8d8069" }}>
          {save === "saving" && "Saving your progress…"}
          {save === "saved" && "✓ Saved to your progress"}
          {save === "local" && "Sign in to save this to your account"}
          {save === "idle" && " "}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => { setQi(0); setPick(null); setCorrect(0); setDone(false); setSave("idle"); }} style={{ borderRadius: 999, background: C.sand, fontWeight: 700, padding: "11px 22px", fontSize: 14 }}>Retake quiz</button>
          {passed && (
            <button onClick={backToMap} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "11px 22px", fontSize: 14 }}>Back to chapter map →</button>
          )}
        </div>
      </div>
    );
  }

  const choose = (i: number) => {
    if (pick !== null) return;
    setPick(i);
    if (i === q.answer) setCorrect((c) => c + 1);
  };
  const next = () => {
    if (qi + 1 >= total) setDone(true);
    else { setQi(qi + 1); setPick(null); }
  };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
        {mcqs.map((_, i) => (
          <div key={i} style={{ height: 6, flex: 1, borderRadius: 999, background: i < qi ? C.sage : i === qi ? C.accent : C.sand }} />
        ))}
      </div>
      <div style={{ fontSize: 12, color: "#9a8d78", fontWeight: 600, marginBottom: 8 }}>Question {qi + 1} of {total}</div>
      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45, marginBottom: 16 }}>{q.stem}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {q.options.map((opt, i) => {
          const isPicked = pick === i;
          const isAnswer = i === q.answer;
          const reveal = pick !== null;
          const bg = reveal && isAnswer ? C.sageT : isPicked ? C.tint : C.bg;
          const bd = reveal && isAnswer ? C.sage : isPicked ? C.accent : "transparent";
          return (
            <button key={i} onClick={() => choose(i)} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", borderRadius: 14, padding: "12px 14px", background: bg, border: `1.5px solid ${bd}` }}>
              <div style={{ width: 24, height: 24, flex: "none", borderRadius: 999, background: reveal && isAnswer ? C.sage : isPicked ? C.accent : C.sand, color: reveal && isAnswer ? "#fff" : isPicked ? "#fff" : "#5d5648", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{"ABCD"[i]}</div>
              <div style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{opt}</div>
            </button>
          );
        })}
      </div>
      {pick !== null && (
        <div style={{ marginTop: 16, background: pick === q.answer ? C.sageT : C.tint, borderRadius: 16, padding: "13px 16px" }}>
          <div style={{ fontWeight: 700, color: pick === q.answer ? C.sageD : C.accentD, fontSize: 14, marginBottom: 4 }}>
            {pick === q.answer ? "Correct" : `Not quite — the answer is ${"ABCD"[q.answer]}`}
          </div>
          <button onClick={next} style={{ marginTop: 6, borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "9px 20px", fontSize: 13.5 }}>
            {qi + 1 >= total ? "See result" : "Next question →"}
          </button>
        </div>
      )}
    </div>
  );
}
