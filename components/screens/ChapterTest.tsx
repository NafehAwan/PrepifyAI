"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { getChapterTest, type DBChapterTest } from "@/lib/curriculum";
import { persistChapterAttempt, type ChapterReport } from "@/lib/supabase/persist";

const PASS_BAR = 50; // FBISE pass mark

interface Result {
  pct: number;
  passed: boolean;
  correct: number;
  total: number;
  saved: "saved" | "local";
}

// MCQ-only chapter test (new FBISE board pattern). Questions come from the
// chapter's conceptual MCQ bank; auto-marked, 1 mark each, pass at 50%.
export function ChapterTest() {
  const { s, patch, go } = useApp();
  const chapterId = s.testChapterId;

  const [test, setTest] = useState<DBChapterTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<"taking" | "grading" | "results">("taking");
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    if (!chapterId) {
      setLoading(false);
      return;
    }
    getChapterTest(chapterId).then((t) => {
      if (!active) return;
      setTest(t);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [chapterId]);

  const back = () => {
    patch({ testChapterId: null, testChapterTitle: null });
    go("chapters");
  };

  const submit = async () => {
    if (!test || !chapterId) return;
    setPhase("grading");
    const total = test.mcqs.length;
    const correct = test.mcqs.reduce((n, q) => n + (picks[q.id] === q.answer ? 1 : 0), 0);
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = pct >= PASS_BAR;

    const report: ChapterReport = { mcq: { awarded: correct, total }, written: null, pct, passed };
    const ok = await persistChapterAttempt(chapterId, { scorePct: pct, passed, report });

    setResult({ pct, passed, correct, total, saved: ok ? "saved" : "local" });
    setPhase("results");
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  const title = test?.chapterTitle || s.testChapterTitle || "Chapter";

  if (loading) return <Frame title={title} back={back}><div style={{ color: C.muted, fontSize: 14 }}>Loading the chapter test…</div></Frame>;
  if (!test || test.mcqs.length === 0) {
    return (
      <Frame title={title} back={back}>
        <div style={{ maxWidth: 620, background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: "22px 24px", color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
          No MCQs are loaded for this chapter yet. The conceptual MCQ bank will appear here once it&apos;s added.
        </div>
      </Frame>
    );
  }

  if (phase === "results" && result) {
    return <Results title={title} test={test} result={result} picks={picks} onBack={back} onRetake={() => { setPicks({}); setResult(null); setPhase("taking"); }} />;
  }

  const grading = phase === "grading";
  const answered = Object.keys(picks).length;

  return (
    <Frame title={title} back={back}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18, alignItems: "center" }}>
        <Tag>{test.mcqs.length} MCQ</Tag>
        <Tag>1 mark each</Tag>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>{answered}/{test.mcqs.length} answered · pass ≥ {PASS_BAR}%</div>
      </div>

      <div style={{ maxWidth: 900, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px", marginBottom: 16 }}>
        {test.mcqs.map((q, qi) => (
          <div key={q.id} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.45, marginBottom: 10 }}>{qi + 1}. {q.stem}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
              {q.options.map((opt, i) => {
                const picked = picks[q.id] === i;
                return (
                  <button key={i} onClick={() => setPicks((p) => ({ ...p, [q.id]: i }))} style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", borderRadius: 12, padding: "10px 12px", background: picked ? C.tint : C.bg, border: `1.5px solid ${picked ? C.accent : "transparent"}` }}>
                    <div style={{ width: 22, height: 22, flex: "none", borderRadius: 999, background: picked ? C.accent : C.sand, color: picked ? "#fff" : "#5d5648", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11.5 }}>{"ABCD"[i]}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{opt}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: "sticky", bottom: 0, background: C.bg, padding: "14px 0", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={submit} disabled={grading} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "13px 30px", fontSize: 15, opacity: grading ? 0.7 : 1 }}>
          {grading ? "Marking…" : "Submit test"}
        </button>
        <div style={{ fontSize: 12.5, color: C.muted }}>Unanswered questions count as wrong.</div>
      </div>
    </Frame>
  );
}

function Results({ title, test, result, picks, onBack, onRetake }: { title: string; test: DBChapterTest; result: Result; picks: Record<string, number>; onBack: () => void; onRetake: () => void }) {
  const { pct, passed, correct, total, saved } = result;
  return (
    <Frame title={title} back={onBack}>
      <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: passed ? C.sageT : C.tint, borderRadius: 24, padding: "26px 28px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 56, lineHeight: 1, color: passed ? C.sageD : C.accentD }}>{pct}%</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: "Caprasimo", fontSize: 22, marginBottom: 4 }}>{passed ? "Chapter passed" : "Not passed yet"}</div>
            <div style={{ fontSize: 13.5, color: "#5d5648", lineHeight: 1.5 }}>{correct} of {total} correct · pass ≥ {PASS_BAR}%.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <span style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "5px 12px", background: saved === "saved" ? C.sage : C.sand, color: saved === "saved" ? "#fff" : "#8d8069" }}>
              {saved === "saved" ? "✓ Saved to your progress" : "Sign in to save"}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onRetake} style={{ borderRadius: 999, background: "#fff", fontWeight: 700, padding: "10px 18px", fontSize: 13.5 }}>Retake</button>
              <button onClick={onBack} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "10px 18px", fontSize: 13.5 }}>Back to chapters</button>
            </div>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Answer review</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {test.mcqs.map((q, qi) => {
              const pick = picks[q.id];
              const right = pick === q.answer;
              return (
                <div key={q.id} style={{ borderTop: qi === 0 ? "none" : "1px solid #ece0c8", paddingTop: qi === 0 ? 0 : 14 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, flex: 1, lineHeight: 1.4 }}>{qi + 1}. {q.stem}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: right ? C.sageD : C.accentD, background: right ? C.sageT : C.tint, borderRadius: 999, padding: "3px 10px", flex: "none" }}>{right ? "Correct" : "Wrong"}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "#5d5648", marginTop: 6 }}>
                    Correct answer: <strong>{"ABCD"[q.answer]}. {q.options[q.answer]}</strong>
                    {pick !== undefined && !right && <span style={{ color: C.accentD }}> · you chose {"ABCD"[pick]}</span>}
                    {pick === undefined && <span style={{ color: C.muted }}> · you left this blank</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function Frame({ title, back, children }: { title: string; back: () => void; children: React.ReactNode }) {
  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <button onClick={back} style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 4 }}>← Back to chapters</button>
        <div style={{ fontFamily: "Caprasimo", fontSize: 28 }}>{title} · Chapter test</div>
      </div>
      {children}
    </>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11.5, fontWeight: 700, background: C.sageT, color: C.sageD, borderRadius: 999, padding: "5px 12px" }}>{children}</div>;
}
