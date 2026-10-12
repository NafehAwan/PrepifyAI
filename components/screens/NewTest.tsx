"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { scopeLabel } from "@/lib/tests/build";
import { listTests, startTest, titleForSeq } from "@/lib/tests/store";
import { currentUserId } from "@/lib/analytics";
import type { McqDifficulty } from "@/lib/ai/prompts";
import { ChapterPicker, CountPicker, DifficultyPicker } from "../TestOptions";
import { useSelectedSubject, useSubjectChapters } from "@/lib/useSubject";

// Set up a test: which chapters (or the whole book), how many questions (1-30)
// and how hard. The name is generated and shown read-only, because a test the
// student can rename stops being a reliable record of their progress.
export function NewTest() {
  const { patch, go } = useApp();
  const { subjectId, subjectName, lookupFailed, retryLookup } = useSelectedSubject();
  const { chapters, status: chaptersStatus, retry: retryChapters } = useSubjectChapters(subjectId);

  const [count, setCount] = useState(15);
  const [difficulty, setDifficulty] = useState<McqDifficulty>("mixed");
  const [nextSeq, setNextSeq] = useState<number | null>(null);
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
    return () => {
      active = false;
    };
  }, [subjectId]);

  const start = async () => {
    setError(null);
    if (!subjectId) {
      setError("Still loading this subject — give it a second and try again.");
      return;
    }
    setBuilding(true);
    const userId = await currentUserId();
    if (!userId) {
      setBuilding(false);
      setError("Sign in to take a test — that's how your results get saved.");
      return;
    }

    const scope = scopeLabel(chapters.filter((c) => picked.includes(c.id)), chapters.length);
    const res = await startTest({ subjectId, count, difficulty, chapterIds: picked, scope });
    setBuilding(false);
    if ("error" in res) {
      setError(
        res.error === "empty"
          ? picked.length > 0
            ? "Those chapters don't have questions loaded yet. Pick others, or use the whole book."
            : `There are no ${subjectName} questions loaded yet. Try another subject for now.`
          : res.error === "limit"
            ? "You've started a lot of tests today — finish one you've already started, or try again tomorrow."
            : "Couldn't start the test. Check your connection and try again.",
      );
      return;
    }
    patch({ activeTestId: res.id });
    go("testRun");
  };

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

        <ChapterPicker chapters={chapters} picked={picked} onChange={setPicked} status={lookupFailed ? "error" : chaptersStatus} onRetry={lookupFailed ? retryLookup : retryChapters} />
        <CountPicker count={count} onChange={setCount} />
        <DifficultyPicker difficulty={difficulty} onChange={setDifficulty} />

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
