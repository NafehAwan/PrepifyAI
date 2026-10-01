"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { getTest, submitTest, type TestDetail } from "@/lib/tests/store";
import { subjectNameById } from "@/lib/curriculum";
import { sfxWin, sfxTryAgain } from "@/lib/sfx";
import { REPORT_REASONS, reportQuestion, type ReportReason } from "@/lib/engagement";
import { Mascot } from "./Mascot";
import type { DBMcq } from "@/lib/curriculum";

const PASS_BAR = 50; // FBISE pass mark

// Takes a test, or shows a submitted one read-only. Both live here because the
// answer review is the same view either way — the only difference is whether
// there is still a submit button.
export function TestRunner({ readOnly }: { readOnly?: boolean }) {
  const { s, patch, go } = useApp();
  const testId = s.activeTestId;

  const [test, setTest] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<(number | null)[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(!!readOnly);

  useEffect(() => {
    let active = true;
    if (!testId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getTest(testId)
      .then((t) => {
        if (!active) return;
        setTest(t);
        // Opened straight from its address (/tests/…): learn which subject it
        // belongs to, so "back" returns to that subject.
        if (t && s.selectedSubjectId !== t.subjectId) {
          void subjectNameById(t.subjectId).then((name) => {
            if (active && name) patch({ selectedSubjectId: t.subjectId, selectedSubjectName: name });
          });
        }
        setPicks(t && t.answers.length === t.mcqs.length ? t.answers : new Array(t?.mcqs.length ?? 0).fill(null));
        setShowResults(!!readOnly || t?.status === "submitted");
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [testId, readOnly]);

  const back = () => {
    patch({ activeTestId: null });
    go("subjectTests");
  };

  const submit = async () => {
    if (!test) return;
    setSubmitting(true);
    const res = await submitTest(test.id, test.mcqs, picks);
    setSubmitting(false);
    if (!res) return;
    setTest({ ...test, ...{ correctCount: res.correctCount, scorePct: res.scorePct, remarks: res.remarks, status: "submitted" } });
    setShowResults(true);
    (res.scorePct >= PASS_BAR ? sfxWin : sfxTryAgain)();
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  if (loading) return <Frame title="Test" back={back}><div style={{ color: C.muted, fontSize: 14 }}>Loading…</div></Frame>;
  if (!test || test.mcqs.length === 0) {
    return (
      <Frame title="Test" back={back}>
        <div style={{ maxWidth: 560, background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: "22px 24px", color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
          Couldn&apos;t open this test. Go back and start a new one.
        </div>
      </Frame>
    );
  }

  if (showResults) return <Results test={test} picks={picks} onBack={back} />;

  const answered = picks.filter((p) => p !== null).length;

  return (
    <Frame title={test.title} back={back} subtitle={`${test.scope ?? "Whole book"} · ${test.mcqs.length} questions · ${test.difficulty}`}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18, alignItems: "center" }}>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>
          {answered}/{test.mcqs.length} answered · pass ≥ {PASS_BAR}%
        </div>
      </div>

      <div style={{ maxWidth: 900, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px", marginBottom: 16 }}>
        {test.mcqs.map((q, qi) => (
          <div key={q.id ?? qi} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.45, marginBottom: 10 }}>
              {qi + 1}. {q.stem}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
              {q.options.map((opt, i) => {
                const picked = picks[qi] === i;
                return (
                  <button
                    key={i}
                    onClick={() => setPicks((p) => p.map((v, k) => (k === qi ? i : v)))}
                    style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", borderRadius: 12, padding: "10px 12px", background: picked ? C.tint : C.bg, border: `1.5px solid ${picked ? C.accent : "transparent"}` }}
                  >
                    <div style={{ width: 22, height: 22, flex: "none", borderRadius: 999, background: picked ? C.accent : C.sand, color: picked ? "#fff" : "#5d5648", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11.5 }}>
                      {"ABCD"[i]}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{opt}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: "sticky", bottom: 0, background: C.bg, padding: "14px 0", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button
          onClick={submit}
          disabled={submitting}
          style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "13px 30px", fontSize: 15, opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? "Marking…" : "Submit test"}
        </button>
        <div style={{ fontSize: 12.5, color: C.muted }}>Unanswered questions count as wrong.</div>
      </div>
    </Frame>
  );
}

function Results({ test, picks, onBack }: { test: TestDetail; picks: (number | null)[]; onBack: () => void }) {
  const { go } = useApp();
  // A read-only review loads its answers from the row rather than local state.
  const answers = useMemo(
    () => (picks.some((p) => p !== null) ? picks : test.answers),
    [picks, test.answers],
  );
  const pct = test.scorePct ?? 0;
  const correct = test.correctCount ?? 0;
  const passed = pct >= PASS_BAR;

  return (
    <Frame title={test.title} back={onBack} subtitle={`${test.scope ?? "Whole book"} · ${test.mcqs.length} questions · ${test.difficulty}`}>
      <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: passed ? C.sageT : C.tint, borderRadius: 24, padding: "26px 28px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <Mascot mood={passed ? "celebrate" : "sad"} size={84} />
          <div style={{ fontFamily: "Caprasimo", fontSize: 56, lineHeight: 1, color: passed ? C.sageD : C.accentD }}>{pct}%</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: "Caprasimo", fontSize: 22, marginBottom: 4 }}>{test.remarks}</div>
            <div style={{ fontSize: 13.5, color: "#5d5648", lineHeight: 1.5 }}>
              {correct} of {test.mcqs.length} correct · pass ≥ {PASS_BAR}%.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => go("newTest")} style={{ borderRadius: 999, background: "#fff", fontWeight: 700, padding: "10px 18px", fontSize: 13.5 }}>
              Another test
            </button>
            <button onClick={onBack} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "10px 18px", fontSize: 13.5 }}>
              Back
            </button>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Answer review</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {test.mcqs.map((q, qi) => (
              <ReviewRow key={q.id ?? qi} q={q} index={qi} pick={answers[qi] ?? null} first={qi === 0} source="test" />
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

export function ReviewRow({
  q,
  index,
  pick,
  first,
  source,
}: {
  q: DBMcq;
  index: number;
  pick: number | null;
  first: boolean;
  // Where the review is shown; enables the Report button.
  source?: "test" | "challenge";
}) {
  const right = pick === q.answer;
  return (
    <div style={{ borderTop: first ? "none" : "1px solid #ece0c8", paddingTop: first ? 0 : 14 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
        <div style={{ fontSize: 14, fontWeight: 600, flex: 1, lineHeight: 1.4 }}>
          {index + 1}. {q.stem}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: right ? C.sageD : C.accentD, background: right ? C.sageT : C.tint, borderRadius: 999, padding: "3px 10px", flex: "none" }}>
          {right ? "Correct" : "Wrong"}
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#5d5648", marginTop: 6 }}>
        Correct answer:{" "}
        <strong>
          {"ABCD"[q.answer]}. {q.options[q.answer]}
        </strong>
        {pick !== null && !right && <span style={{ color: C.accentD }}> · you chose {"ABCD"[pick]}</span>}
        {pick === null && <span style={{ color: C.muted }}> · you left this blank</span>}
      </div>
      {q.explanation && <div style={{ fontSize: 12.5, color: "#7a6f5d", lineHeight: 1.5, marginTop: 4 }}>{q.explanation}</div>}
      {source && q.id && <ReportQuestion q={q} pick={pick} source={source} />}
    </div>
  );
}

// "Report" under a reviewed question: a student who thinks the answer key is
// wrong (or spots a typo) can flag it in two taps. What they saw is sent with
// the report, because options are shuffled differently in every test.
function ReportQuestion({ q, pick, source }: { q: DBMcq; pick: number | null; source: "test" | "challenge" }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("wrong_answer");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "limit">("idle");

  const send = async () => {
    setState("sending");
    const res = await reportQuestion({
      questionId: q.id,
      reason,
      note,
      shown: { stem: q.stem, options: q.options, markedAnswer: q.answer, picked: pick },
      source,
    });
    setState(res === "ok" ? "sent" : res);
  };

  if (state === "sent") {
    return <div style={{ fontSize: 12, fontWeight: 700, color: C.sageD, marginTop: 6 }}>✓ Reported — thanks! We&apos;ll check this question.</div>;
  }
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginTop: 6, padding: "2px 0" }}>
        ⚑ Report this question
      </button>
    );
  }
  return (
    <div style={{ marginTop: 8, background: C.bg, borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>What&apos;s wrong with it?</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {REPORT_REASONS.map((r) => (
          <button
            key={r.id}
            onClick={() => setReason(r.id)}
            style={{ borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, background: reason === r.id ? C.accent : C.card, color: reason === r.id ? "#fff" : "#5d5648", border: `1.5px solid ${reason === r.id ? C.accent : C.line}` }}
          >
            {r.label}
          </button>
        ))}
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        placeholder={reason === "wrong_answer" ? "Optional: what should the answer be, and why?" : "Optional: tell us more"}
        aria-label="Details"
        style={{ width: "100%", borderRadius: 10, border: `1.5px solid ${C.line}`, background: "#fff", padding: "8px 12px", fontSize: 13, marginBottom: 8 }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={send} disabled={state === "sending"} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "7px 16px", fontSize: 12.5, opacity: state === "sending" ? 0.7 : 1 }}>
          {state === "sending" ? "Sending…" : "Send report"}
        </button>
        <button onClick={() => setOpen(false)} style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, padding: "7px 6px" }}>
          Cancel
        </button>
        {state === "error" && <span style={{ fontSize: 12, fontWeight: 700, color: C.accentD }}>Couldn&apos;t send — check your connection.</span>}
        {state === "limit" && <span style={{ fontSize: 12, fontWeight: 700, color: C.accentD }}>You&apos;ve sent a lot of reports today — thanks! Try again tomorrow.</span>}
      </div>
    </div>
  );
}

function Frame({ title, subtitle, back, children }: { title: string; subtitle?: string; back: () => void; children: React.ReactNode }) {
  const { s } = useApp();
  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <button onClick={back} style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
          ← {s.selectedSubjectName ?? "Back"}
        </button>
        <div style={{ fontFamily: "Caprasimo", fontSize: 28 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13.5, color: C.muted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </>
  );
}
