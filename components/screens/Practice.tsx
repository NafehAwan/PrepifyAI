"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { listSubjects, getChapters, getChapterGrounding, type DBSubject, type DBChapter, type DBMcq } from "@/lib/curriculum";
import { generateQuiz } from "@/lib/ai/generate";

// Real practice: MCQs generated on demand from the chosen chapter's book text.
export function Practice() {
  const { s, go } = useApp();
  const [subjects, setSubjects] = useState<DBSubject[]>([]);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<DBChapter[]>([]);
  const [mcqs, setMcqs] = useState<DBMcq[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let active = true;
    listSubjects().then((rows) => {
      if (active) setSubjects(rows.filter((r) => s.subs.includes(r.name)));
    });
    return () => {
      active = false;
    };
  }, [s.subs]);

  useEffect(() => {
    let active = true;
    if (subjectId) getChapters(subjectId).then((c) => active && setChapters(c));
    else setChapters([]);
    return () => {
      active = false;
    };
  }, [subjectId]);

  const start = async (chapterId: string) => {
    if (!s.groqKey) {
      setNote("Connect your Groq key in Settings to generate practice questions.");
      return;
    }
    setBusy(true);
    setNote("");
    const g = await getChapterGrounding(chapterId);
    if (!g) {
      setBusy(false);
      setNote("This chapter has no book content loaded yet.");
      return;
    }
    const gen = await generateQuiz({ subject: g.subject, classLevel: g.classLevel, medium: "English", level: "Developing", sloList: g.sloList, groundTruth: g.groundTruth }, 5, s.groqKey);
    setBusy(false);
    if (!gen || gen.length === 0) {
      setNote("Couldn't generate questions — please try again.");
      return;
    }
    setMcqs(gen);
  };

  if (mcqs) return <Runner mcqs={mcqs} onDone={() => setMcqs(null)} />;

  // Not signed in / no content → honest empty state.
  if (subjects.length === 0) {
    return (
      <>
        <Head />
        <div style={{ maxWidth: 620, background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: "22px 24px", color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
          Practice draws questions from your enrolled subjects&apos; books. Sign in and pick your subjects, then come back to drill.
          <div style={{ marginTop: 12 }}>
            <button onClick={() => go("subjects")} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "10px 20px", fontSize: 14 }}>Go to My Subjects</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head />
      <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: "20px 22px" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, marginBottom: 10 }}>1 · Pick a subject</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {subjects.map((sub) => {
              const on = subjectId === sub.id;
              return (
                <button key={sub.id} onClick={() => { setSubjectId(sub.id); setNote(""); }} style={{ borderRadius: 999, padding: "9px 16px", fontWeight: 600, fontSize: 14, background: on ? C.accent : "transparent", color: on ? "#fff" : "#5d5648", border: `1.5px solid ${on ? C.accent : "#dfcfb2"}` }}>
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>

        {subjectId && (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: "20px 22px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, marginBottom: 10 }}>2 · Pick a chapter to drill</div>
            {chapters.length === 0 ? (
              <div style={{ fontSize: 13.5, color: C.muted }}>This subject&apos;s book isn&apos;t loaded yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {chapters.map((c) => (
                  <button key={c.id} onClick={() => start(c.id)} disabled={busy} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", borderRadius: 14, padding: "12px 14px", background: C.bg, opacity: busy ? 0.6 : 1 }}>
                    <div style={{ width: 30, height: 30, flex: "none", borderRadius: 999, background: C.tint, color: C.accentD, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{c.seq}</div>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{c.title}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.accentD }}>{busy ? "…" : "Drill →"}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {busy && <div style={{ fontSize: 13.5, color: C.muted }}>Generating questions from the book…</div>}
        {note && <div style={{ fontSize: 13.5, color: C.accentD, background: C.tint, borderRadius: 14, padding: "11px 14px" }}>{note}</div>}
      </div>
    </>
  );
}

function Runner({ mcqs, onDone }: { mcqs: DBMcq[]; onDone: () => void }) {
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const q = mcqs[qi];
  const total = mcqs.length;

  if (done) {
    const pct = Math.round((correct / total) * 100);
    return (
      <>
        <Head />
        <div style={{ maxWidth: 520, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 28, textAlign: "center" }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 44, color: pct >= 70 ? C.sage : C.accent }}>{pct}%</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{correct} of {total} correct</div>
          <button onClick={onDone} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "11px 24px", fontSize: 14 }}>Practice another chapter</button>
        </div>
      </>
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
    <>
      <Head />
      <div style={{ maxWidth: 720, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
        <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
          {mcqs.map((_, i) => (
            <div key={i} style={{ height: 6, flex: 1, borderRadius: 999, background: i < qi ? C.sage : i === qi ? C.accent : C.sand }} />
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#9a8d78", fontWeight: 600, marginBottom: 8 }}>Question {qi + 1} of {total} · from the book</div>
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.45, marginBottom: 16 }}>{q.stem}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {q.options.map((opt, i) => {
            const reveal = pick !== null;
            const isAnswer = i === q.answer;
            const isPicked = pick === i;
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
            <div style={{ fontWeight: 700, color: pick === q.answer ? C.sageD : C.accentD, fontSize: 14, marginBottom: 6 }}>
              {pick === q.answer ? "Correct" : `Not quite — the answer is ${"ABCD"[q.answer]}`}
            </div>
            {q.explanation && (
              <div style={{ fontSize: 13, color: "#4a443c", lineHeight: 1.5, marginBottom: 8 }}>{q.explanation}</div>
            )}
            <button onClick={next} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "9px 20px", fontSize: 13.5 }}>
              {qi + 1 >= total ? "See result" : "Next →"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function Head() {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: "Caprasimo", fontSize: 26 }}>Practice</div>
      <div style={{ color: C.muted, fontSize: 14, marginTop: 2 }}>Drill fresh MCQs generated from your textbook, chapter by chapter.</div>
    </div>
  );
}
