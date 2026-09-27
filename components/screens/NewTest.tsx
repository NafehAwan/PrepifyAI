"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { buildTest, listSubjectChapters, scopeLabel, type SubjectChapter } from "@/lib/tests/build";
import { createTest, listTests, titleForSeq } from "@/lib/tests/store";
import { currentUserId } from "@/lib/analytics";
import type { McqDifficulty } from "@/lib/ai/prompts";

const PRESETS = [5, 10, 15, 20, 25, 30];

const LEVELS: Array<{ id: McqDifficulty; label: string; blurb: string }> = [
  { id: "easy", label: "Easy", blurb: "Direct recall — definitions, units, one-step facts." },
  { id: "medium", label: "Medium", blurb: "A mix, leaning on understanding. Some scenarios." },
  { id: "hard", label: "Hard", blurb: "Mostly scenario questions, like the board paper." },
  { id: "mixed", label: "Mixed", blurb: "Everything jumbled together — closest to a real paper." },
];

// Set up a test: which chapters (or the whole book), how many questions (1-30)
// and how hard. The name is generated and shown read-only, because a test the
// student can rename stops being a reliable record of their progress.
export function NewTest() {
  const { s, patch, go } = useApp();
  const subjectId = s.selectedSubjectId;
  const subjectName = s.selectedSubjectName ?? "Subject";

  const [count, setCount] = useState(15);
  const [difficulty, setDifficulty] = useState<McqDifficulty>("mixed");
  const [nextSeq, setNextSeq] = useState<number | null>(null);
  const [chapters, setChapters] = useState<SubjectChapter[]>([]);
  // Empty = whole book.
  const [picked, setPicked] = useState<string[]>([]);
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
    if (subjectId) {
      listSubjectChapters(subjectId).then((c) => {
        if (active) setChapters(c);
      });
    }
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

    const built = await buildTest({ userId, subjectId, count, difficulty, chapterIds: picked, aiKey: s.groqKey });
    if (built.mcqs.length === 0) {
      setBuilding(false);
      setError(
        picked.length > 0
          ? "Those chapters don't have questions loaded yet. Pick others, or use the whole book."
          : `There are no ${subjectName} questions loaded yet. Try another subject for now.`,
      );
      return;
    }

    const scope = scopeLabel(chapters.filter((c) => picked.includes(c.id)), chapters.length);
    const row = await createTest({ userId, subjectId, difficulty, mcqs: built.mcqs, scope });
    setBuilding(false);
    if (!row) {
      setError("Couldn't start the test. Check your connection and try again.");
      return;
    }
    patch({ activeTestId: row.id });
    go("testRun");
  };

  const toggleChapter = (id: string) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const scopeChapters = picked.length > 0 ? chapters.filter((c) => picked.includes(c.id)) : chapters;
  const available = scopeChapters.reduce((n, c) => n + c.mcqCount, 0);
  const thin = chapters.length > 0 && available < count;

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
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Which chapters?</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>
            The whole book, or pick one or more chapters to focus on.
          </div>

          <button
            onClick={() => setPicked([])}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", borderRadius: 14, padding: "12px 14px", marginBottom: 10, background: picked.length === 0 ? C.tint : C.bg, border: `1.5px solid ${picked.length === 0 ? C.accent : "transparent"}` }}
          >
            <Check on={picked.length === 0} />
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: picked.length === 0 ? C.accentD : C.ink }}>Whole book</div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
              {chapters.reduce((n, c) => n + c.mcqCount, 0)} questions
            </div>
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 340, overflowY: "auto" }}>
            {chapters.map((c) => {
              const on = picked.includes(c.id);
              const empty = c.mcqCount === 0;
              return (
                <button
                  key={c.id}
                  onClick={() => !empty && toggleChapter(c.id)}
                  disabled={empty}
                  style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", borderRadius: 12, padding: "10px 12px", background: on ? C.tint : "transparent", border: `1.5px solid ${on ? C.accent : C.line}`, opacity: empty ? 0.45 : 1 }}
                >
                  <Check on={on} />
                  <div style={{ width: 28, flex: "none", fontSize: 12.5, fontWeight: 700, color: C.muted }}>{c.seq}</div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, flex: "none" }}>
                    {empty ? "coming soon" : c.mcqCount}
                  </div>
                </button>
              );
            })}
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

        {thin && !error && (
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, borderRadius: 16, padding: "12px 16px", background: C.sand, color: "#6d6250" }}>
            {available === 0
              ? "No questions are loaded for this choice yet."
              : `Only ${available} question${available === 1 ? "" : "s"} available here, so the test will have ${available}. Add more chapters for a longer test.`}
          </div>
        )}

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
            {count} question{count === 1 ? "" : "s"} · {difficulty} ·{" "}
            {scopeLabel(chapters.filter((c) => picked.includes(c.id)), chapters.length)}
          </div>
        </div>
      </div>
    </>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <div style={{ width: 20, height: 20, flex: "none", borderRadius: 6, border: `2px solid ${on ? C.accent : "#d8c8ab"}`, background: on ? C.accent : "transparent", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
      {on ? "✓" : ""}
    </div>
  );
}
