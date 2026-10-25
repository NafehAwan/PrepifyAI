"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { currentUserId } from "@/lib/analytics";
import { getMockPool, listMocks, startMock, MOCK_MAX_QUESTIONS, type MockChapter, type TestRow } from "@/lib/tests/store";
import { Check, ChipRow, OptionCard } from "../TestOptions";

const COUNT_PRESETS = [10, 20, 30, 40, 50, 60];
const TIME_PRESETS = [15, 20, 30, 45, 60, 75, 90, 120];
// About a minute per MCQ, like the board paper, rounded to a preset.
const suggestedMinutes = (count: number) => TIME_PRESETS.find((m) => m >= count) ?? 120;

// A timed mock exam the student sets up: which chapters, how many MCQs (up to
// 60) and how long. Questions come only from the mock pool (supabase/mock.sql),
// so only the chapters that have pool questions are offered. Below the set-up,
// the student's past mocks.
export function MockExam() {
  const { s, patch, go } = useApp();

  const [pool, setPool] = useState<MockChapter[]>([]);
  const [poolState, setPoolState] = useState<"loading" | "ready" | "error">("loading");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]); // empty = every mock chapter
  const [count, setCount] = useState(30);
  const [minutes, setMinutes] = useState(30);
  const [timeTouched, setTimeTouched] = useState(false);
  const [mocks, setMocks] = useState<TestRow[]>([]);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    setPoolState("loading");
    getMockPool()
      .then((p) => {
        if (!active) return;
        setPool(p);
        // Open on the subject the student last picked, when it has mock questions.
        const preferred = p.find((c) => c.subjectId === s.selectedSubjectId)?.subjectId;
        setSubjectId((cur) => cur ?? preferred ?? p[0]?.subjectId ?? null);
        setPoolState("ready");
      })
      .catch(() => active && setPoolState("error"));
    return () => {
      active = false;
    };
  }, [attempt]);

  const loadMocks = useCallback(async () => {
    if (!subjectId) return;
    const userId = await currentUserId();
    setMocks(userId ? await listMocks(userId, subjectId) : []);
  }, [subjectId]);

  useEffect(() => {
    void loadMocks().catch(() => setMocks([]));
  }, [loadMocks]);

  // Keeps "12 min left" on unfinished mocks current.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const subjects = useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of pool) seen.set(c.subjectId, c.subjectName);
    return [...seen].map(([id, name]) => ({ id, name }));
  }, [pool]);
  const chapters = pool.filter((c) => c.subjectId === subjectId);
  const subjectName = subjects.find((x) => x.id === subjectId)?.name ?? "";
  const scope = picked.length > 0 ? chapters.filter((c) => picked.includes(c.chapterId)) : chapters;
  const available = scope.reduce((n, c) => n + c.mcqCount, 0);
  const maxCount = Math.max(1, Math.min(MOCK_MAX_QUESTIONS, available || MOCK_MAX_QUESTIONS));
  const effectiveCount = Math.min(count, maxCount);

  const changeCount = (n: number) => {
    setCount(n);
    if (!timeTouched) setMinutes(suggestedMinutes(n));
  };
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const start = async () => {
    setError(null);
    if (!subjectId) return;
    setBuilding(true);
    const userId = await currentUserId();
    if (!userId) {
      setBuilding(false);
      setError("Sign in to take a mock — that's how your results get saved.");
      return;
    }
    const res = await startMock({ subjectId, chapterIds: picked, count: effectiveCount, minutes });
    setBuilding(false);
    if ("error" in res) {
      setError(
        res.error === "empty"
          ? "Those chapters don't have mock questions yet. Pick others."
          : res.error === "limit"
            ? "You've started a lot of papers today — finish one, or try again tomorrow."
            : "Couldn't start the mock. Check your connection and try again.",
      );
      return;
    }
    patch({ activeTestId: res.id, activeTestKind: "mock", selectedSubjectId: subjectId, selectedSubjectName: subjectName || null });
    go("testRun");
  };

  const open = (t: TestRow) => {
    patch({ activeTestId: t.id, activeTestKind: "mock" });
    go(t.status === "submitted" ? "testReview" : "testRun");
  };

  const done = mocks.filter((m) => m.status === "submitted");
  const best = done.length ? Math.max(...done.map((m) => m.scorePct ?? 0)) : null;

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, lineHeight: 1.1 }}>Mock Exam</div>
        <div style={{ color: C.muted, marginTop: 4, fontSize: 14, maxWidth: 640, lineHeight: 1.5 }}>
          A timed paper you set up yourself — pick the chapters, how many MCQs and how long. The clock starts when you press
          start, and the paper hands itself in when time runs out.
        </div>
      </div>

      <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 16 }}>
        {poolState !== "ready" ? (
          <OptionCard title="Which chapters?" hint="Loading the chapters you can take a mock in.">
            {poolState === "loading" ? (
              <div style={{ fontSize: 13.5, color: C.muted, fontWeight: 600, padding: "10px 2px" }}>Loading chapters…</div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 13.5, fontWeight: 600, color: C.accentD, background: "#FFEBDD", borderRadius: 14, padding: "12px 14px" }}>
                <span style={{ flex: 1, minWidth: 180 }}>Couldn&apos;t load the chapters. Check your connection.</span>
                <button onClick={() => setAttempt((n) => n + 1)} style={{ borderRadius: 16, background: C.accent, color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, boxShadow: "0 4px 0 #4F31D6", padding: "8px 16px", fontSize: 15 }}>
                  Try again
                </button>
              </div>
            )}
          </OptionCard>
        ) : chapters.length === 0 ? (
          <OptionCard title="No mock exams yet" hint="Mock questions haven't been added yet. Check back soon.">
            <div />
          </OptionCard>
        ) : (
          <>
            {subjects.length > 1 && (
              <OptionCard title="Subject" hint="Mock exams are available for these subjects.">
                <ChipRow
                  options={subjects.map((x) => x.id)}
                  value={subjectId ?? ""}
                  onChange={(id) => {
                    setSubjectId(id);
                    setPicked([]);
                  }}
                  label={(id) => subjects.find((x) => x.id === id)?.name ?? ""}
                />
              </OptionCard>
            )}

            <OptionCard title={`${subjectName} chapters`} hint="All of them, or pick the ones you want in this paper.">
              <button
                onClick={() => setPicked([])}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", borderRadius: 14, padding: "12px 14px", marginBottom: 10, background: picked.length === 0 ? C.tint : C.bg, border: `1.5px solid ${picked.length === 0 ? C.accent : "transparent"}` }}
              >
                <Check on={picked.length === 0} />
                <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: picked.length === 0 ? C.accentD : C.ink }}>All mock chapters</div>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{chapters.reduce((n, c) => n + c.mcqCount, 0)} questions</div>
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {chapters.map((c) => {
                  const on = picked.includes(c.chapterId);
                  return (
                    <button
                      key={c.chapterId}
                      onClick={() => toggle(c.chapterId)}
                      style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", borderRadius: 12, padding: "10px 12px", background: on ? C.tint : "transparent", border: `1.5px solid ${on ? C.accent : C.line}` }}
                    >
                      <Check on={on} />
                      <div style={{ width: 28, flex: "none", fontSize: 12.5, fontWeight: 700, color: C.muted }}>{c.seq}</div>
                      <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600 }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, flex: "none" }}>{c.mcqCount}</div>
                    </button>
                  );
                })}
              </div>
            </OptionCard>

            <OptionCard title="How many MCQs?" hint={`Up to ${maxCount} from ${picked.length === 0 ? "these chapters" : "the chapters you picked"}.`}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {COUNT_PRESETS.filter((n) => n <= maxCount).map((n) => (
                  <button
                    key={n}
                    onClick={() => changeCount(n)}
                    style={{ borderRadius: 999, padding: "10px 20px", fontSize: 14.5, fontWeight: 700, background: effectiveCount === n ? C.accent : C.bg, color: effectiveCount === n ? "#fff" : "#3E4370", border: `1.5px solid ${effectiveCount === n ? C.accent : C.line}` }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <input
                  type="range"
                  min={1}
                  max={maxCount}
                  value={effectiveCount}
                  onChange={(e) => changeCount(Number(e.target.value))}
                  aria-label="Number of MCQs"
                  style={{ flex: 1, accentColor: C.accent }}
                />
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, minWidth: 44, textAlign: "right", color: C.accentD }}>{effectiveCount}</div>
              </div>
            </OptionCard>

            <OptionCard title="How long?" hint={`About a minute per MCQ is board pace — ${suggestedMinutes(effectiveCount)} min for ${effectiveCount}.`}>
              <ChipRow
                options={TIME_PRESETS}
                value={minutes}
                onChange={(m) => {
                  setMinutes(m);
                  setTimeTouched(true);
                }}
                label={(m) => (m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} hr` : `${Math.floor(m / 60)} hr ${m % 60}`)}
              />
            </OptionCard>

            {error && (
              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, borderRadius: 16, padding: "13px 16px", background: "#FFEBDD", color: C.accentD }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <button
                onClick={start}
                disabled={building}
                style={{ borderRadius: 16, background: C.accent, color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, boxShadow: "0 4px 0 #4F31D6", padding: "14px 32px", fontSize: 17.5, opacity: building ? 0.7 : 1 }}
              >
                {building ? "Building your paper…" : "Start the clock →"}
              </button>
              <div style={{ fontSize: 12.5, color: C.muted }}>
                {effectiveCount} MCQs · {minutes} min · {picked.length === 0 ? "all mock chapters" : `${picked.length} chapter${picked.length === 1 ? "" : "s"}`}
              </div>
            </div>
          </>
        )}

        {mocks.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 21 }}>Your mocks</div>
              <div style={{ fontSize: 13, color: C.muted }}>
                {done.length} done{best !== null ? ` · best ${best}%` : ""}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
              {mocks.map((m) => {
                const submitted = m.status === "submitted";
                const msLeft = m.deadline ? new Date(m.deadline).getTime() - now : 0;
                const pct = m.scorePct ?? 0;
                return (
                  <button
                    key={m.id}
                    onClick={() => open(m)}
                    style={{ textAlign: "left", background: C.card, border: `1px solid ${submitted ? C.line : C.accent}`, borderRadius: 18, padding: "14px 16px" }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, flex: 1 }}>{m.title}</div>
                      {submitted && <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: pct >= 50 ? C.sageD : C.accentD }}>{pct}%</div>}
                    </div>
                    <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>
                      {m.scope ?? "Mock"} · {m.questionCount} MCQs{m.timeLimitMin ? ` · ${m.timeLimitMin} min` : ""}
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 6, color: submitted ? "#3E4370" : C.accentD }}>
                      {submitted
                        ? `${m.correctCount ?? 0}/${m.questionCount} · ${m.remarks ?? ""}`
                        : msLeft > 0
                          ? `In progress · ${Math.ceil(msLeft / 60000)} min left — resume`
                          : "Time's up — open to hand it in"}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#646A92", marginTop: 4 }}>
                      {new Date(m.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
