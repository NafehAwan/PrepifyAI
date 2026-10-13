"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { C, FD, btn3d, card } from "@/lib/theme";
import { getTest, submitTest, type TestDetail } from "@/lib/tests/store";
import { subjectNameById } from "@/lib/curriculum";
import { sfxWin, sfxTryAgain, sfxTap } from "@/lib/sfx";
import { REPORT_REASONS, reportQuestion, type ReportReason } from "@/lib/engagement";
import { Mascot } from "./Mascot";
import { StrokeIcon, PATH } from "./Icon";
import { NumberTicker, fireStars } from "./fx";
import { useIsMobile } from "@/lib/useIsMobile";
import type { DBMcq } from "@/lib/curriculum";

const PASS_BAR = 50; // FBISE pass mark

const ICON = {
  close: "M6 6l12 12M18 6L6 18",
  left: "M15 18l-6-6 6-6",
  right: "M9 6l6 6-6 6",
  flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
  star: "M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
  redo: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5",
};

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

// Takes a test one question at a time, or shows a submitted one read-only.
// Both live here because the answer review is the same view either way.
export function TestRunner({ readOnly }: { readOnly?: boolean }) {
  const { s, patch, go } = useApp();
  const testId = s.activeTestId;
  const isMobile = useIsMobile();

  const [test, setTest] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<(number | null)[]>([]);
  const [cur, setCur] = useState(0);
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
        const start = t && t.answers.length === n ? t.answers : (saved ?? new Array(n).fill(null));
        setPicks(start);
        // Pick up where the student left off: the first unanswered question.
        const firstOpen = start.findIndex((p) => p === null);
        setCur(firstOpen === -1 ? 0 : firstOpen);
        autoSubmitted.current = false;
        setShowResults(!!readOnly || t?.status === "submitted");
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (res.scorePct >= PASS_BAR) {
      sfxWin();
      void fireStars();
    } else sfxTryAgain();
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

  const n = test?.mcqs.length ?? 0;
  const timeUp = left !== null && left <= 0;
  const live = !!test && !showResults && n > 0;

  // Keyboard: A–D or 1–4 picks, arrows move between questions.
  useEffect(() => {
    if (!live) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const k = e.key.toLowerCase();
      const idx = "abcd".indexOf(k) >= 0 ? "abcd".indexOf(k) : "1234".indexOf(k);
      if (idx >= 0 && !timeUp && !submitting) pick(cur, idx);
      else if (e.key === "ArrowRight") setCur((c) => Math.min(n - 1, c + 1));
      else if (e.key === "ArrowLeft") setCur((c) => Math.max(0, c - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, cur, n, timeUp, submitting]);

  if (loading) {
    return (
      <Centered>
        <Mascot mood="thinking" size={90} />
        <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 19, color: C.ink2 }}>Opening your test…</div>
      </Centered>
    );
  }
  if (!test || n === 0) {
    return (
      <Centered>
        <Mascot mood="sad" size={90} />
        <div style={{ fontSize: 16, color: C.ink2, textAlign: "center", maxWidth: 360 }}>Couldn&apos;t open this test. Go back and start a new one.</div>
        <button onClick={back} className="pf-press" style={{ ...btn3d(C.accent, C.accentD), padding: "12px 22px", fontSize: 17 }}>Go back</button>
      </Centered>
    );
  }

  if (showResults) return <Results test={test} picks={picks} onBack={back} late={late} />;

  const answered = picks.filter((p) => p !== null).length;
  const unanswered = n - answered;
  const lowTime = left !== null && left <= 5 * 60 * 1000;
  const q = test.mcqs[cur];
  const last = cur === n - 1;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", paddingBottom: isMobile ? 110 : 120 }}>
      {/* top: leave, progress, clock */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button onClick={back} aria-label={isMock ? "Leave the paper (it keeps running)" : "Leave the test"} style={{ width: 44, height: 44, flex: "none", borderRadius: 14, background: "#fff", boxShadow: "0 3px 0 #D3DAEC", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <StrokeIcon d={ICON.close} size={20} width={3} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 900, color: C.muted, marginBottom: 5 }}>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{test.title} · {test.scope ?? "Whole book"}</span>
            <span style={{ flex: "none", marginLeft: 8 }}>{answered}/{n}</span>
          </div>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={n} aria-valuenow={answered} aria-label="Answered" style={{ height: 16, borderRadius: 999, background: "#fff", boxShadow: "inset 0 0 0 2px #DCE3F2", overflow: "hidden" }}>
            <div style={{ width: `${(answered / n) * 100}%`, height: "100%", borderRadius: 999, background: C.go, boxShadow: "inset 0 -4px 0 rgba(0,0,0,.12)", transition: "width .35s var(--ease-out)" }} />
          </div>
        </div>
        {isMock && left !== null && (
          <div role="timer" aria-live="off" title={timeUp ? "Time's up" : "Time left — hands in automatically at 0:00"} style={{ flex: "none", display: "flex", alignItems: "center", gap: 6, height: 44, padding: "0 12px", borderRadius: 14, background: lowTime ? C.danger : "#fff", color: lowTime ? "#fff" : C.ink, boxShadow: `0 3px 0 ${lowTime ? "#A82328" : "#D3DAEC"}`, fontFamily: FD, fontWeight: 800, fontSize: 19, fontVariantNumeric: "tabular-nums" }}>
            <StrokeIcon d={PATH.clock} size={18} width={2.8} />
            {clock(left)}
          </div>
        )}
      </div>

      {/* jump to any question */}
      <div role="tablist" aria-label="Questions" style={{ display: "flex", gap: 6, overflowX: "auto", padding: "4px 2px 10px", scrollbarWidth: "none" }}>
        {test.mcqs.map((_, i) => {
          const on = i === cur;
          const done = picks[i] !== null;
          return (
            <button
              key={i}
              role="tab"
              aria-selected={on}
              aria-label={`Question ${i + 1}${done ? ", answered" : ""}`}
              onClick={() => setCur(i)}
              style={{ flex: "none", width: 34, height: 34, borderRadius: 11, fontFamily: FD, fontWeight: 800, fontSize: 15, background: done ? C.accent : "#fff", color: done ? "#fff" : C.muted, boxShadow: on ? `0 0 0 3px ${C.go}` : `0 2px 0 ${done ? C.accentD : "#D3DAEC"}` }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Prepi asks */}
      <div key={cur} style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 8 : 14, marginTop: 6, animation: "pf-in .3s var(--ease-out) both" }}>
        <Mascot mood={picks[cur] === null ? "curious" : "happy"} size={isMobile ? 62 : 84} />
        <div style={{ ...card, flex: 1, minWidth: 0, borderRadius: "22px 22px 22px 6px", padding: isMobile ? "14px 16px" : "18px 22px" }}>
          <div style={{ fontSize: 13.5, fontWeight: 900, color: C.accent }}>Question {cur + 1} of {n}</div>
          <div style={{ fontFamily: FD, fontWeight: 700, fontSize: isMobile ? 20 : 23, lineHeight: 1.3, marginTop: 4, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{q.stem}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
        {q.options.map((opt, i) => {
          const picked = picks[cur] === i;
          return (
            <button
              key={i}
              onClick={() => { sfxTap(); pick(cur, i); }}
              disabled={timeUp || submitting}
              aria-pressed={picked}
              className="pf-press"
              style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", borderRadius: 18, padding: "13px 14px", background: picked ? C.accent : "#fff", color: picked ? "#fff" : C.ink, boxShadow: `0 4px 0 ${picked ? C.accentD : "#D3DAEC"}`, fontSize: 17.5, fontWeight: 800 }}
            >
              <span style={{ width: 38, height: 38, flex: "none", borderRadius: 12, background: picked ? "rgba(255,255,255,.22)" : C.sand, color: picked ? "#fff" : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FD, fontWeight: 800, fontSize: 17 }}>
                {"ABCD"[i]}
              </span>
              <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* bottom bar: back / next, and hand in on the last question */}
      <div style={{ position: "fixed", left: isMobile ? 0 : 252, right: 0, bottom: 0, zIndex: 50, background: "rgba(255,255,255,.94)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderTop: `2px solid ${C.sidebarLine}`, padding: "12px 14px calc(14px + env(safe-area-inset-bottom))" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {(submitError || (last && unanswered > 0) || timeUp) && (
            <div role={submitError ? "alert" : undefined} style={{ fontSize: 13.5, fontWeight: 800, color: submitError || timeUp ? "#A82328" : C.goD, marginBottom: 8, textAlign: "center" }}>
              {submitError
                ? "Couldn't submit — check your connection and try again. Your answers are still here."
                : timeUp
                  ? "Time's up — handing in your paper…"
                  : `${unanswered} question${unanswered === 1 ? "" : "s"} still blank — they count as wrong.`}
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setCur((c) => Math.max(0, c - 1))} disabled={cur === 0} aria-label="Previous question" className="pf-press" style={{ width: 58, flex: "none", borderRadius: 16, background: "#fff", boxShadow: "0 4px 0 #D3DAEC", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <StrokeIcon d={ICON.left} size={24} width={3} />
            </button>
            {last ? (
              <button onClick={submit} disabled={submitting || timeUp} className="pf-press" style={{ ...btn3d(C.go, C.goD), flex: 1, padding: "15px", fontSize: 21 }}>
                {submitting ? "Marking…" : isMock ? "Hand in paper" : "Submit test"}
              </button>
            ) : (
              <button onClick={() => setCur((c) => Math.min(n - 1, c + 1))} className="pf-press" style={{ ...btn3d(picks[cur] === null ? C.accent : C.go, picks[cur] === null ? C.accentD : C.goD), flex: 1, padding: "15px", fontSize: 21, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {picks[cur] === null ? "Skip for now" : "Next"}
                <StrokeIcon d={ICON.right} size={22} width={3.2} stroke="#fff" />
              </button>
            )}
            {!last && answered === n && (
              <button onClick={submit} disabled={submitting || timeUp} className="pf-press" style={{ ...btn3d(C.sageD, "#0C5A2B"), flex: "none", padding: "0 16px", fontSize: 17 }}>
                {submitting ? "…" : "Submit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "50vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>{children}</div>;
}

// "Chapter 7 · 25 questions · mixed", or for a mock "Ch 1, 9 · 60 questions · 60 min".
function subtitleFor(test: TestDetail): string {
  const tail = test.kind === "mock" ? (test.timeLimitMin ? `${test.timeLimitMin} min` : "timed") : test.difficulty;
  return `${test.scope ?? "Whole book"} · ${test.mcqs.length} questions · ${tail}`;
}

function starsFor(pct: number): number {
  return pct >= 90 ? 3 : pct >= 75 ? 2 : pct >= PASS_BAR ? 1 : 0;
}

function Results({ test, picks, onBack, late }: { test: TestDetail; picks: (number | null)[]; onBack: () => void; late?: boolean }) {
  const { s, go } = useApp();
  const isMobile = useIsMobile();
  // A read-only review loads its answers from the row rather than local state.
  const answers = useMemo(() => (picks.some((p) => p !== null) ? picks : test.answers), [picks, test.answers]);
  const pct = test.scorePct ?? 0;
  const correct = test.correctCount ?? 0;
  const passed = pct >= PASS_BAR;
  const stars = starsFor(pct);
  const mock = test.kind === "mock";
  const [filter, setFilter] = useState<"all" | "wrong">("all");
  const rows = test.mcqs.map((q, qi) => ({ q, qi })).filter(({ q, qi }) => filter === "all" || answers[qi] !== q.answer);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <button onClick={onBack} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 800, color: C.muted, padding: "4px 2px" }}>
        <StrokeIcon d={ICON.left} size={18} width={3} />
        {mock ? "Mock Exam" : s.selectedSubjectName ?? "Back"}
      </button>

      {(late || test.remarks === "Time ran out") && (
        <div role="alert" style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.5, borderRadius: 16, padding: "13px 16px", background: C.goT, color: "#8A3608" }}>
          This paper reached the server more than two minutes after its time ran out, so it was marked with no answers — the same as handing in a blank sheet. Keep the page open until it hands itself in.
        </div>
      )}

      <div style={{ position: "relative", overflow: "hidden", borderRadius: 28, background: passed ? "linear-gradient(180deg,#7FD3FF,#C9F0FF 70%,#E9FFE6)" : "linear-gradient(180deg,#C9D3EA,#E6EBF6)", padding: isMobile ? "22px 18px 20px" : "28px 30px 24px", boxShadow: `0 4px 0 ${passed ? "#A9D8F2" : "#C3CDE4"}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 14 : 24, flexWrap: "wrap" }}>
          <Mascot mood={passed ? "celebrate" : "sad"} size={isMobile ? 96 : 120} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }} aria-label={`${stars} of 3 stars`}>
              {[0, 1, 2].map((k) => (
                <svg key={k} width={isMobile ? 34 : 40} height={isMobile ? 34 : 40} viewBox="0 0 24 24" style={{ animation: k < stars ? `pf-bounce-in .5s var(--ease-soft) ${0.6 + k * 0.18}s both` : undefined }}>
                  <path d={ICON.star} fill={k < stars ? "#FFC93C" : "rgba(255,255,255,.7)"} stroke={k < stars ? "#D99A00" : "#B5C0DA"} strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              ))}
            </div>
            <div style={{ fontFamily: FD, fontWeight: 800, fontSize: isMobile ? 64 : 78, lineHeight: 0.95, color: passed ? C.sageD : C.danger }}>
              <NumberTicker value={pct} suffix="%" />
            </div>
            <div style={{ fontFamily: FD, fontWeight: 800, fontSize: 24, marginTop: 4 }}>{test.remarks}</div>
            <div style={{ fontSize: 15, color: C.ink2 }}>
              {correct} of {test.mcqs.length} right · {subtitleFor(test)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <button onClick={() => go(mock ? "mockExam" : "newTest")} className="pf-press" style={{ ...btn3d(C.go, C.goD), flex: "1 1 160px", padding: "13px 16px", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <StrokeIcon d={ICON.redo} size={20} width={2.8} stroke="#fff" />
            {mock ? "Another mock" : "Another test"}
          </button>
          <button onClick={() => go("home")} className="pf-press" style={{ ...btn3d("#fff", "#C3CDE4", C.ink), flex: "1 1 160px", padding: "13px 16px", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <StrokeIcon d={ICON.map} size={20} width={2.6} />
            Back to map
          </button>
        </div>
      </div>

      <div style={{ ...card, padding: isMobile ? "16px 14px" : "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22, flex: 1 }}>Answer review</h2>
          <div role="tablist" aria-label="Show" style={{ display: "flex", background: C.sand, borderRadius: 999, padding: 4 }}>
            {(["all", "wrong"] as const).map((f) => (
              <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} style={{ borderRadius: 999, padding: "6px 14px", fontSize: 14, fontWeight: 800, background: filter === f ? C.accent : "transparent", color: filter === f ? "#fff" : C.muted }}>
                {f === "all" ? `All ${test.mcqs.length}` : `Wrong ${test.mcqs.length - correct}`}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {rows.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", color: C.ink2, fontWeight: 700 }}>
              <Mascot mood="proud" size={56} />
              Nothing wrong here. Masha&apos;Allah!
            </div>
          ) : (
            rows.map(({ q, qi }, k) => <ReviewRow key={q.id ?? qi} q={q} index={qi} pick={answers[qi] ?? null} first={k === 0} source="test" />)
          )}
        </div>
      </div>
    </div>
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
    <div style={{ borderTop: first ? "none" : `2px solid ${C.sand}`, paddingTop: first ? 0 : 14 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ width: 32, height: 32, flex: "none", borderRadius: 10, background: right ? C.sageT : C.dangerT, color: right ? C.sageD : "#A82328", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label={right ? "Correct" : "Wrong"}>
          <StrokeIcon d={right ? PATH.check : ICON.close} size={18} width={3.4} />
        </span>
        <div style={{ fontSize: 15.5, fontWeight: 800, flex: 1, lineHeight: 1.4, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
          {index + 1}. {q.stem}
        </div>
      </div>
      <div style={{ marginLeft: 42, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 14.5, background: C.sageT, color: C.sageD, borderRadius: 12, padding: "8px 12px", fontWeight: 800 }}>
          {"ABCD"[q.answer]}. {q.options[q.answer]}
        </div>
        {pick !== null && !right && (
          <div style={{ fontSize: 14.5, background: C.dangerT, color: "#A82328", borderRadius: 12, padding: "8px 12px", fontWeight: 700 }}>
            You chose {"ABCD"[pick]}. {q.options[pick]}
          </div>
        )}
        {pick === null && <div style={{ fontSize: 14, color: C.muted, fontWeight: 700 }}>You left this blank.</div>}
        {q.explanation && <div style={{ fontSize: 14.5, color: C.ink2, lineHeight: 1.55, fontWeight: 600 }}>{q.explanation}</div>}
        {source && q.id && <ReportQuestion q={q} pick={pick} source={source} />}
      </div>
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
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 800, color: C.sageD }}>
        <StrokeIcon d={PATH.check} size={16} width={3} />
        Reported — thanks! We&apos;ll check this question.
      </div>
    );
  }
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 800, color: C.muted, padding: "2px 0" }}>
        <StrokeIcon d={ICON.flag} size={15} width={2.6} />
        Report this question
      </button>
    );
  }
  return (
    <div style={{ background: C.bg, borderRadius: 16, padding: "12px 14px" }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>What&apos;s wrong with it?</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {REPORT_REASONS.map((r) => (
          <button key={r.id} onClick={() => setReason(r.id)} style={{ borderRadius: 999, padding: "7px 13px", fontSize: 13.5, fontWeight: 800, background: reason === r.id ? C.accent : "#fff", color: reason === r.id ? "#fff" : C.ink2, boxShadow: `0 2px 0 ${reason === r.id ? C.accentD : "#D3DAEC"}` }}>
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
        style={{ width: "100%", borderRadius: 12, border: `2px solid ${C.line}`, background: "#fff", padding: "9px 12px", fontSize: 14.5, marginBottom: 8 }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={send} disabled={state === "sending"} className="pf-press" style={{ ...btn3d(C.accent, C.accentD), padding: "8px 16px", fontSize: 15 }}>
          {state === "sending" ? "Sending…" : "Send report"}
        </button>
        <button onClick={() => setOpen(false)} style={{ fontSize: 14, fontWeight: 800, color: C.muted, padding: "8px 6px" }}>
          Cancel
        </button>
        {state === "error" && <span style={{ fontSize: 13.5, fontWeight: 800, color: "#A82328" }}>Couldn&apos;t send — check your connection.</span>}
        {state === "limit" && <span style={{ fontSize: 13.5, fontWeight: 800, color: "#A82328" }}>You&apos;ve sent a lot of reports today — thanks! Try again tomorrow.</span>}
      </div>
    </div>
  );
}
