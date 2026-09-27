"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { buildTest } from "@/lib/tests/build";
import { createTest, titleForSeq } from "@/lib/tests/store";
import { currentUserId } from "@/lib/analytics";
import { listTests } from "@/lib/tests/store";
import type { McqDifficulty } from "@/lib/ai/prompts";

const PRESETS = [5, 10, 15, 20, 25, 30];

const LEVELS: Array<{ id: McqDifficulty; label: string; blurb: string }> = [
  { id: "easy", label: "Easy", blurb: "Direct recall — definitions, units, one-step facts." },
  { id: "medium", label: "Medium", blurb: "A mix, leaning on understanding. Some scenarios." },
  { id: "hard", label: "Hard", blurb: "Mostly scenario questions, like the board paper." },
  { id: "mixed", label: "Mixed", blurb: "Everything jumbled together — closest to a real paper." },
];

// Set up a test: how many questions (1-30) and how hard. The name is generated
// and shown read-only, because a test the student can rename stops being a
// reliable record of their progress.
export function NewTest() {
  const { s, patch, go } = useApp();
  const subjectId = s.selectedSubjectId;
  const subjectName = s.selectedSubjectName ?? "Subject";

  const [count, setCount] = useState(15);
  const [difficulty, setDifficulty] = useState<McqDifficulty>("mixed");
  const [nextSeq, setNextSeq] = useState<number | null>(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show the name this test will get, so it is never a surprise.
  useEffect(() => {
    let active = true;
    (async () => {
      const userId = await currentUserId();
      if (!userId || !subjectId) {
        if (active) setNextSeq(1);
        return;
      }
      const taken = await listTests(userId, subjectId);
      if (active) setNextSeq(taken.reduce((max, t) => Math.max(max, t.seq), 0) + 1);
    })();
    return () => {
      active = false;
    };
  }, [subjectId]);

  const start = async () => {
    setError(null);
    if (!subjectId) {
      setError("This subject isn't set up yet. Go back and pick another one.");
      return;
    }
    setBuilding(true);
    const userId = await currentUserId();
    if (!userId) {
      setBuilding(false);
      setError("Sign in to take a test — that's how your results get saved.");
      return;
    }

    const built = await buildTest({ userId, subjectId, count, difficulty, aiKey: s.groqKey });
    if (built.mcqs.length === 0) {
      setBuilding(false);
      setError(`There are no ${subjectName} questions loaded yet. Try another subject for now.`);
      return;
    }

    const row = await createTest({ userId, subjectId, difficulty, mcqs: built.mcqs });
    setBuilding(false);
    if (!row) {
      setError("Couldn't start the test. Check your connection and try again.");
      return;
    }
    patch({ activeTestId: row.id });
    go("testRun");
  };

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => go("subjectTests")} style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
          ← {subjectName}
        </button>
        <div style={{ fontFamily: "Caprasimo", fontSize: 30, lineHeight: 1.1 }}>New {subjectName} test</div>
      </div>

      <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Auto-generated name, deliberately read-only. */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600, marginBottom: 2 }}>Test name</div>
            <div style={{ fontFamily: "Caprasimo", fontSize: 22 }}>{titleForSeq(nextSeq ?? 1)}</div>
          </div>
          <div style={{ fontSize: 12, color: "#9a8d78", maxWidth: 200, lineHeight: 1.45, textAlign: "right" }}>
            Named automatically so your results stay in order.
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: "20px 22px" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>How many questions?</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>Anywhere from 1 to 30.</div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {PRESETS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                style={{ borderRadius: 999, padding: "10px 20px", fontSize: 14.5, fontWeight: 700, background: count === n ? C.accent : C.bg, color: count === n ? "#fff" : "#5d5648", border: `1.5px solid ${count === n ? C.accent : C.line}` }}
              >
                {n}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <input
              type="range"
              min={1}
              max={30}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              aria-label="Number of questions"
              style={{ flex: 1, accentColor: C.accent }}
            />
            <div style={{ fontFamily: "Caprasimo", fontSize: 26, minWidth: 44, textAlign: "right", color: C.accentD }}>{count}</div>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: "20px 22px" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>How hard?</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>Easy all the way to hard.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
            {LEVELS.map((l) => {
              const on = difficulty === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => setDifficulty(l.id)}
                  style={{ textAlign: "left", borderRadius: 16, padding: "13px 15px", background: on ? C.tint : C.bg, border: `1.5px solid ${on ? C.accent : "transparent"}` }}
                >
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: on ? C.accentD : C.ink, marginBottom: 3 }}>{l.label}</div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>{l.blurb}</div>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, borderRadius: 16, padding: "13px 16px", background: "#fdf1e6", color: C.accentD }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button
            onClick={start}
            disabled={building}
            style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "14px 32px", fontSize: 15, opacity: building ? 0.7 : 1 }}
          >
            {building ? "Building your test…" : "Start test →"}
          </button>
          <div style={{ fontSize: 12.5, color: C.muted }}>
            {count} question{count === 1 ? "" : "s"} · {difficulty}
          </div>
        </div>
      </div>
    </>
  );
}
