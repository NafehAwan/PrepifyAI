"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { C, DISPLAY, SHADOW } from "@/lib/theme";
import { getTest, submitTest, type TestDetail } from "@/lib/tests/store";
import { subjectNameById } from "@/lib/curriculum";
import { sfxWin, sfxTryAgain } from "@/lib/sfx";
import { REPORT_REASONS, reportQuestion, type ReportReason } from "@/lib/engagement";
import { Mascot } from "./Mascot";
import type { DBMcq } from "@/lib/curriculum";

const PASS_BAR = 50; // FBISE pass mark

// A mock's picks are kept on the device as they're made, so a refresh or a
// dropped connection mid-paper doesn't lose them.
const pickKey = (id: string) => `prepify:mock-picks:${id}`;
function loadPicks(id: string, n: number): (number | null)[] | null {
  try {
    const v = JSON.parse(localStorage.getItem(pickKey(id)) ?? "null");
    return Array.isArray(v) && v.length === n ? v.map((x) => (typeof x === "number" && x >= 0 && x <= 3 ? x : null)) : null;
  } catch {
    return null;
  }
}
function savePicks(id: string, picks: (number | null)[]) {
  try {
    localStorage.setItem(pickKey(id), JSON.stringify(picks));
  } catch {
    // storage blocked: the paper still works, it just won't survive a refresh
  }
}
function clearPicks(id: string) {
  try {
    localStorage.removeItem(pickKey(id));
  } catch {
    // ignore
  }
}
const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};

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
  const [submitError, setSubmitError] = useState(false);
  const [showResults, setShowResults] = useState(!!readOnly);
  const [late, setLate] = useState(false);
  // Mocks only: milliseconds left on the clock, ticking once a second.
  const [left, setLeft] = useState<number | null>(null);
  const autoSubmitted = useRef(false);

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
        if (t && s.activeTestKind !== t.kind) patch({ activeTestKind: t.kind });
        // Opened straight from its address (/tests/…): learn which subject it
        // belongs to, so "back" returns to that subject.
        if (t && s.selectedSubjectId !== t.subjectId) {
          void subjectNameById(t.subjectId).then((name) => {
            if (active && name) patch({ selectedSubjectId: t.subjectId, selectedSubjectName: name });
          });
        }
        const n = t?.mcqs.length ?? 0;
        const saved = t && t.kind === "mock" && t.status !== "submitted" ? loadPicks(t.id, n) : null;
        setPicks(t && t.answers.length === n ? t.answers : (saved ?? new Array(n).fill(null)));
        autoSubmitted.current = false;
        setShowResults(!!readOnly || t?.status === "submitted");
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [testId, readOnly]);

  const isMock = test?.kind === "mock";
  const back = () => {
    patch({ activeTestId: null });
    go(isMock ? "mockExam" : "subjectTests");
  };

  const pick = (qi: number, i: number) =>
    setPicks((p) => {
      const next = p.map((v, k) => (k === qi ? i : v));
      if (test?.kind === "mock") savePicks(test.id, next);
      return next;
    });

  const submit = useCallback(async () => {
    if (!test) return;
    setSubmitting(true);
    const res = await submitTest(test.id, picks);
    if (!res) {
      setSubmitting(false);
      setSubmitError(true);
      return;
    }
    setSubmitError(false);
    if (test.kind === "mock") clearPicks(test.id);
    setLate(res.late);
    // The answers and explanations are only released once the test is marked.
    const marked = await getTest(test.id).catch(() => null);
    setSubmitting(false);
    setTest({ ...(marked ?? test), correctCount: res.correctCount, scorePct: res.scorePct, remarks: res.remarks, status: "submitted" });
    if (marked && res.late) setPicks(marked.answers);
    setShowResults(true);
    (res.scorePct >= PASS_BAR ? sfxWin : sfxTryAgain)();
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [test, picks]);

  // The mock clock. The deadline is the server's; when it runs out the paper
  // is handed in automatically with whatever has been answered.
  const deadline = test?.kind === "mock" && test.status !== "submitted" && !showResults ? test.deadline : null;
  useEffect(() => {
    if (!deadline) {
      setLeft(null);
      return;
    }
    const end = new Date(deadline).getTime();
    const tick = () => setLeft(end - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadline]);
  useEffect(() => {
    if (left !== null && left <= 0 && !autoSubmitted.current && !submitting) {
      autoSubmitted.current = true;
      void submit();
    }
  }, [left, submitting, submit]);

  if (loading) return <Frame title="Test" back={back}><div style={{ color: C.muted, fontSize: 14 }}>Loading…</div></Frame>;
  if (!test || test.mcqs.length === 0) {
    return (
      <Frame title="Test" back={back}>
        <div style={{ maxWidth: 560, background: C.card, border: `0.5px solid ${C.line}`, borderRadius: 20, padding: "22px 24px", color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
          Couldn&apos;t open this test. Go back and start a new one.
        </div>
      </Frame>
    );
  }

  if (showResults) return <Results test={test} picks={picks} onBack={back} late={late} />;

  const answered = picks.filter((p) => p !== null).length;
  const timeUp = left !== null && left <= 0;
  const lowTime = left !== null && left <= 5 * 60 * 1000;

  return (
    <Frame title={test.title} back={back} subtitle={subtitleFor(test)} backLabel={isMock ? "Mock Exam" : undefined}>
      {isMock && left !== null ? (
        <div
          role="timer"
          aria-live="off"
          style={{ position: "sticky", top: 68, zIndex: 5, maxWidth: 900, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: lowTime ? "#FBF0E7" : C.card, border: `1.5px solid ${lowTime ? C.accent : C.line}`, borderRadius: 18, padding: "10px 16px", marginBottom: 16, boxShadow: "0 6px 18px -12px rgba(0,0,0,.35)" }}
        >
          <div style={{ fontFamily: DISPLAY, fontSize: 26, lineHeight: 1, color: lowTime ? C.accentD : C.ink, fontVariantNumeric: "tabular-nums", minWidth: 78 }}>
            {clock(left)}
          </div>
          <div style={{ fontSize: 12.5, color: lowTime ? C.accentD : C.muted, fontWeight: 600, flex: 1, minWidth: 140 }}>
            {timeUp ? "Time's up — handing in your paper…" : lowTime ? "Less than 5 minutes left" : "left · hands in automatically at 0:00"}
          </div>
          <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>
            {answered}/{test.mcqs.length} answered
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18, alignItems: "center" }}>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>
            {answered}/{test.mcqs.length} answered · pass ≥ {PASS_BAR}%
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, background: C.card, border: `0.5px solid ${C.line}`, borderRadius: 20, padding: "24px 26px", marginBottom: 16 }}>
        {test.mcqs.map((q, qi) => (
          <div key={q.id ?? qi} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.45, marginBottom: 10, whiteSpace: "pre-line" }}>
              {qi + 1}. {q.stem}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
              {q.options.map((opt, i) => {
                const picked = picks[qi] === i;
                return (
                  <button
                    key={i}
                    onClick={() => pick(qi, i)}
                    disabled={timeUp || submitting}
                    style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", borderRadius: 12, padding: "10px 12px", background: picked ? C.tint : C.bg, border: `1.5px solid ${picked ? C.accent : "transparent"}` }}
                  >
                    <div style={{ width: 22, height: 22, flex: "none", borderRadius: 999, background: picked ? C.accent : C.sand, color: picked ? "#fff" : "#4A4A42", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 11.5 }}>
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
          style={{ borderRadius: 14, background: C.accent, color: "#fff", boxShadow: SHADOW.cta, fontWeight: 600, padding: "13px 30px", fontSize: 15, opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? "Marking…" : isMock ? "Hand in paper" : "Submit test"}
        </button>
        <div style={{ fontSize: 12.5, color: submitError ? C.accentD : C.muted, fontWeight: submitError ? 600 : 400 }}>
          {submitError ? "Couldn't submit — check your connection and try again. Your answers are still here." : "Unanswered questions count as wrong."}
        </div>
      </div>
    </Frame>
  );
}

// "Chapter 7 · 25 questions · mixed", or for a mock "Ch 1, 9 · 60 questions · 60 min".
function subtitleFor(test: TestDetail): string {
  const tail = test.kind === "mock" ? (test.timeLimitMin ? `${test.timeLimitMin} min` : "timed") : test.difficulty;
  return `${test.scope ?? "Whole book"} · ${test.mcqs.length} questions · ${tail}`;
}

function Results({ test, picks, onBack, late }: { test: TestDetail; picks: (number | null)[]; onBack: () => void; late?: boolean }) {
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
    <Frame title={test.title} back={onBack} subtitle={subtitleFor(test)} backLabel={test.kind === "mock" ? "Mock Exam" : undefined}>
      <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 16 }}>
        {(late || test.remarks === "Time ran out") && (
          <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, borderRadius: 16, padding: "13px 16px", background: "#FBF0E7", color: C.accentD }}>
            This paper reached the server more than two minutes after its time ran out, so it was marked with no answers — the same as
            handing in a blank sheet. Keep the page open until it hands itself in.
          </div>
        )}
        <div style={{ background: passed ? C.sageT : C.tint, borderRadius: 20, padding: "26px 28px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <Mascot mood={passed ? "celebrate" : "sad"} size={84} />
          <div style={{ fontFamily: DISPLAY, fontSize: 56, lineHeight: 1, color: passed ? C.sageD : C.accentD }}>{pct}%</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, marginBottom: 4 }}>{test.remarks}</div>
            <div style={{ fontSize: 13.5, color: "#4A4A42", lineHeight: 1.5 }}>
              {correct} of {test.mcqs.length} correct · pass ≥ {PASS_BAR}%.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => go(test.kind === "mock" ? "mockExam" : "newTest")} style={{ borderRadius: 999, background: "#fff", fontWeight: 600, padding: "10px 18px", fontSize: 13.5 }}>
              {test.kind === "mock" ? "Another mock" : "Another test"}
            </button>
            <button onClick={onBack} style={{ borderRadius: 14, background: C.accent, color: "#fff", boxShadow: SHADOW.cta, fontWeight: 600, padding: "10px 18px", fontSize: 13.5 }}>
              Back
            </button>
          </div>
        </div>

        <div style={{ background: C.card, border: `0.5px solid ${C.line}`, borderRadius: 20, padding: "24px 26px" }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Answer review</div>
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
    <div style={{ borderTop: first ? "none" : "0.5px solid #EEEDEA", paddingTop: first ? 0 : 14 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
        <div style={{ fontSize: 14, fontWeight: 600, flex: 1, lineHeight: 1.4, whiteSpace: "pre-line" }}>
          {index + 1}. {q.stem}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: right ? C.sageD : C.accentD, background: right ? C.sageT : C.tint, borderRadius: 999, padding: "3px 10px", flex: "none" }}>
          {right ? "Correct" : "Wrong"}
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#4A4A42", marginTop: 6 }}>
        Correct answer:{" "}
        <strong>
          {"ABCD"[q.answer]}. {q.options[q.answer]}
        </strong>
        {pick !== null && !right && <span style={{ color: C.accentD }}> · you chose {"ABCD"[pick]}</span>}
        {pick === null && <span style={{ color: C.muted }}> · you left this blank</span>}
      </div>
      {q.explanation && <div style={{ fontSize: 12.5, color: "#8A8A80", lineHeight: 1.5, marginTop: 4 }}>{q.explanation}</div>}
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
    return <div style={{ fontSize: 12, fontWeight: 600, color: C.sageD, marginTop: 6 }}>✓ Reported — thanks! We&apos;ll check this question.</div>;
  }
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginTop: 6, padding: "2px 0" }}>
        ⚑ Report this question
      </button>
    );
  }
  return (
    <div style={{ marginTop: 8, background: C.bg, borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>What&apos;s wrong with it?</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {REPORT_REASONS.map((r) => (
          <button
            key={r.id}
            onClick={() => setReason(r.id)}
            style={{ borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, background: reason === r.id ? C.ink : C.card, color: reason === r.id ? "#fff" : "#4A4A42", border: `1.5px solid ${reason === r.id ? C.ink : C.line}` }}
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
        style={{ width: "100%", borderRadius: 10, border: `1px solid ${C.lineStrong}`, background: "#fff", padding: "8px 12px", fontSize: 13, marginBottom: 8 }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={send} disabled={state === "sending"} style={{ borderRadius: 14, background: C.accent, color: "#fff", boxShadow: SHADOW.cta, fontWeight: 600, padding: "7px 16px", fontSize: 12.5, opacity: state === "sending" ? 0.7 : 1 }}>
          {state === "sending" ? "Sending…" : "Send report"}
        </button>
        <button onClick={() => setOpen(false)} style={{ fontSize: 12.5, fontWeight: 600, color: C.muted, padding: "7px 6px" }}>
          Cancel
        </button>
        {state === "error" && <span style={{ fontSize: 12, fontWeight: 600, color: C.accentD }}>Couldn&apos;t send — check your connection.</span>}
        {state === "limit" && <span style={{ fontSize: 12, fontWeight: 600, color: C.accentD }}>You&apos;ve sent a lot of reports today — thanks! Try again tomorrow.</span>}
      </div>
    </div>
  );
}

function Frame({ title, subtitle, back, children, backLabel }: { title: string; subtitle?: string; back: () => void; children: React.ReactNode; backLabel?: string }) {
  const { s } = useApp();
  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <button onClick={back} style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
          ← {backLabel ?? s.selectedSubjectName ?? "Back"}
        </button>
        <div style={{ fontFamily: DISPLAY, fontSize: "clamp(28px, 3.4vw, 40px)", lineHeight: 1.12, letterSpacing: "-0.02em" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13.5, color: C.muted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </>
  );
}
