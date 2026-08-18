"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { getChapterTest, type DBChapterTest } from "@/lib/curriculum";
import { persistChapterAttempt, type ChapterReport } from "@/lib/supabase/persist";
import { groqAuthHeaders } from "@/lib/ai/key";
import { MarkdownLite } from "../MarkdownLite";

const PASS_BAR = 50; // FBISE pass mark

interface WrittenGrade {
  awarded: number;
  marks: number;
  feedback: string;
  hits: string[];
  missed: string[];
}

interface Result {
  pct: number;
  passed: boolean;
  mcqAwarded: number;
  mcqTotal: number;
  writtenAwarded: number;
  writtenTotal: number;
  writtenGraded: boolean; // false when scored on MCQ only (no AI key)
  saved: "saved" | "local";
  grades: Record<string, WrittenGrade>;
}

export function ChapterTest() {
  const { s, patch, go } = useApp();
  const chapterId = s.testChapterId;

  const [test, setTest] = useState<DBChapterTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
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

    // MCQ section — auto-scored, 1 mark each.
    const mcqTotal = test.mcqs.length;
    const mcqAwarded = test.mcqs.reduce((n, q) => n + (picks[q.id] === q.answer ? 1 : 0), 0);

    // Written section — graded by the Groq examiner when a key is present.
    const writtenTotal = test.written.reduce((n, q) => n + q.marks, 0);
    const grades: Record<string, WrittenGrade> = {};
    let writtenAwarded = 0;
    let writtenGraded = test.written.length > 0;

    const results = await Promise.all(
      test.written.map(async (q) => {
        try {
          const res = await fetch("/api/ai/grade", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...groqAuthHeaders(s.groqKey) },
            body: JSON.stringify({
              question: q.stem,
              marks: q.marks,
              sloCode: q.sloCode ?? "",
              markingScheme: q.markingScheme,
              modelAnswer: q.modelAnswer,
              studentAnswer: answers[q.id] ?? "",
            }),
          });
          if (!res.ok) return { q, ok: false as const };
          const data = (await res.json()) as { awarded?: number; feedback_md?: string; hits?: string[]; missed?: string[] };
          const awarded = Math.max(0, Math.min(Number(data.awarded) || 0, q.marks));
          return { q, ok: true as const, grade: { awarded, marks: q.marks, feedback: data.feedback_md ?? "", hits: data.hits ?? [], missed: data.missed ?? [] } };
        } catch {
          return { q, ok: false as const };
        }
      }),
    );

    // All-or-nothing: written counts only when every question graded (i.e. a key
    // is configured). Otherwise the paper is scored on its MCQ section.
    if (test.written.length > 0 && results.every((r) => r.ok)) {
      for (const r of results) {
        if (r.ok) {
          grades[r.q.id] = r.grade;
          writtenAwarded += r.grade.awarded;
        }
      }
    } else {
      writtenGraded = false;
    }

    const denom = writtenGraded ? mcqTotal + writtenTotal : mcqTotal;
    const numer = writtenGraded ? mcqAwarded + writtenAwarded : mcqAwarded;
    const pct = denom > 0 ? Math.round((numer / denom) * 100) : 0;
    const passed = pct >= PASS_BAR;

    const report: ChapterReport = {
      mcq: { awarded: mcqAwarded, total: mcqTotal },
      written: writtenGraded ? { awarded: writtenAwarded, total: writtenTotal } : null,
      pct,
      passed,
    };
    const ok = await persistChapterAttempt(chapterId, { scorePct: pct, passed, report });

    setResult({ pct, passed, mcqAwarded, mcqTotal, writtenAwarded, writtenTotal, writtenGraded, saved: ok ? "saved" : "local", grades });
    setPhase("results");
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  const title = test?.chapterTitle || s.testChapterTitle || "Chapter";

  if (loading) return <Frame title={title} back={back}><div style={{ color: C.muted, fontSize: 14 }}>Loading the chapter test…</div></Frame>;
  if (!test) return <Frame title={title} back={back}><div style={{ color: C.muted, fontSize: 14 }}>No test bank seeded for this chapter yet.</div></Frame>;

  if (phase === "results" && result) {
    return <Results title={title} test={test} result={result} answers={answers} onBack={back} onRetake={() => { setPicks({}); setAnswers({}); setResult(null); setPhase("taking"); }} />;
  }

  const grading = phase === "grading";
  const answered = Object.keys(picks).length;

  return (
    <Frame title={title} back={back}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <Tag>{test.mcqs.length} MCQ</Tag>
        <Tag>{test.written.filter((w) => w.type === "short").length} short</Tag>
        <Tag>{test.written.filter((w) => w.type === "long").length} long</Tag>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>{answered}/{test.mcqs.length} MCQ answered · pass ≥ {PASS_BAR}%</div>
      </div>

      {test.mcqs.length > 0 && (
        <Section title="Section A · Multiple choice" subtitle="1 mark each · auto-marked">
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
        </Section>
      )}

      {test.written.length > 0 && (
        <Section title="Section B · Written" subtitle="Marked by the AI examiner when your key is connected — otherwise this section is shown with model answers for self-review.">
          {test.written.map((q, qi) => (
            <div key={q.id} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 8 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.45, flex: 1 }}>{qi + 1}. {q.stem}</div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8d8069", background: C.sand, borderRadius: 999, padding: "3px 10px", flex: "none" }}>{q.marks} mark{q.marks === 1 ? "" : "s"} · {q.type}</div>
              </div>
              <textarea value={answers[q.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} placeholder="Write your answer…" style={{ width: "100%", minHeight: q.type === "long" ? 120 : 76, border: "1.5px solid #e0d0b4", borderRadius: 14, background: "#fff", padding: "12px 14px", fontSize: 14, lineHeight: 1.6, outline: "none", resize: "vertical" }} />
            </div>
          ))}
        </Section>
      )}

      <div style={{ position: "sticky", bottom: 0, background: C.bg, padding: "14px 0", marginTop: 8, display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={submit} disabled={grading} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "13px 30px", fontSize: 15, opacity: grading ? 0.7 : 1 }}>
          {grading ? "Marking your paper…" : "Submit test"}
        </button>
        <div style={{ fontSize: 12.5, color: C.muted }}>Unanswered MCQs count as wrong.</div>
      </div>
    </Frame>
  );
}

function Results({ title, test, result, answers, onBack, onRetake }: { title: string; test: DBChapterTest; result: Result; answers: Record<string, string>; onBack: () => void; onRetake: () => void }) {
  const { pct, passed, mcqAwarded, mcqTotal, writtenAwarded, writtenTotal, writtenGraded, saved, grades } = result;
  return (
    <Frame title={title} back={onBack}>
      <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: passed ? C.sageT : C.tint, borderRadius: 24, padding: "26px 28px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 56, lineHeight: 1, color: passed ? C.sageD : C.accentD }}>{pct}%</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: "Caprasimo", fontSize: 22, marginBottom: 4 }}>{passed ? "Chapter passed" : "Not passed yet"}</div>
            <div style={{ fontSize: 13.5, color: "#5d5648", lineHeight: 1.5 }}>
              MCQ {mcqAwarded}/{mcqTotal}
              {writtenGraded ? ` · Written ${writtenAwarded}/${writtenTotal}` : " · written section shown for self-review (connect your AI key to auto-mark it)"} · pass ≥ {PASS_BAR}%.
            </div>
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

        {test.written.length > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Written section review</div>
            <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 16 }}>Your answer, the examiner&apos;s marks, and the model answer for every question.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {test.written.map((q, qi) => {
                const g = grades[q.id];
                return (
                  <div key={q.id} style={{ borderTop: qi === 0 ? "none" : "1px solid #ece0c8", paddingTop: qi === 0 ? 0 : 16 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 8 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600, flex: 1 }}>{qi + 1}. {q.stem}</div>
                      {g ? (
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: g.awarded >= q.marks ? C.sageD : C.accentD, background: g.awarded >= q.marks ? C.sageT : C.tint, borderRadius: 999, padding: "3px 11px", flex: "none" }}>{g.awarded}/{q.marks}</div>
                      ) : (
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8d8069", background: C.sand, borderRadius: 999, padding: "3px 10px", flex: "none" }}>{q.marks} marks</div>
                      )}
                    </div>
                    <ReviewLabel>Your answer</ReviewLabel>
                    <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#4a443c", background: C.bg, borderRadius: 12, padding: "11px 13px", marginBottom: 10 }}>{(answers[q.id] ?? "").trim() || "(left blank)"}</div>
                    {g && g.feedback && (
                      <>
                        <ReviewLabel>Examiner</ReviewLabel>
                        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#4a443c", marginBottom: 10 }}>{g.feedback}</div>
                      </>
                    )}
                    <ReviewLabel>Model answer</ReviewLabel>
                    <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#3a4327", background: C.sageT, borderRadius: 12, padding: "12px 14px" }}>
                      <MarkdownLite md={q.modelAnswer || "—"} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 900, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px", marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 18, lineHeight: 1.5 }}>{subtitle}</div>
      {children}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11.5, fontWeight: 700, background: C.sageT, color: C.sageD, borderRadius: 999, padding: "5px 12px" }}>{children}</div>;
}

function ReviewLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.muted, marginBottom: 5 }}>{children}</div>;
}
