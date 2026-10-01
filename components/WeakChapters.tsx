"use client";

// "Practise my weak chapters": how the student is doing in each chapter (from
// every test and challenge), the weak ones first, and a one-tap test made from
// just those chapters.

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { listSubjects } from "@/lib/curriculum";
import { currentUserId } from "@/lib/analytics";
import { buildTest } from "@/lib/tests/build";
import { createTest } from "@/lib/tests/store";
import { listChapterStats, weakChapters, WEAK_BELOW_PCT, WEAK_MIN_ATTEMPTED, type ChapterStat } from "@/lib/engagement";

const PRACTICE_QUESTIONS = 15;
const MAX_CHAPTERS_PER_TEST = 3;

export function WeakChapters() {
  const { patch, go } = useApp();
  const [stats, setStats] = useState<ChapterStat[] | null>(null);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([listChapterStats(), listSubjects()]).then(([st, subjects]) => {
      if (!active) return;
      setStats(st);
      setNames(new Map(subjects.map((x) => [x.id, x.name])));
    });
    return () => {
      active = false;
    };
  }, []);

  // Weak chapters grouped by subject (a test is always one subject).
  const groups = useMemo(() => {
    const out = new Map<string, ChapterStat[]>();
    for (const c of weakChapters(stats ?? [])) out.set(c.subjectId, [...(out.get(c.subjectId) ?? []), c]);
    return [...out.entries()];
  }, [stats]);

  const practise = async (subjectId: string, chapters: ChapterStat[], key: string) => {
    setError(null);
    setBusy(key);
    const userId = await currentUserId();
    const name = names.get(subjectId) ?? "Subject";
    if (!userId) {
      setBusy(null);
      setError("Sign in to practise — that's how your results get saved.");
      return;
    }
    const picked = chapters.slice(0, MAX_CHAPTERS_PER_TEST);
    const built = await buildTest({ userId, subjectId, count: PRACTICE_QUESTIONS, difficulty: "mixed", chapterIds: picked.map((c) => c.chapterId) });
    if (built.mcqs.length === 0) {
      setBusy(null);
      setError("Couldn't build that test — check your connection and try again.");
      return;
    }
    const seqs = picked.map((c) => c.seq).sort((a, b) => a - b);
    const scope = `Weak spots · Ch ${seqs.join(", ")}`;
    const row = await createTest({ userId, subjectId, difficulty: "mixed", mcqs: built.mcqs, scope });
    setBusy(null);
    if (!row) {
      setError("Couldn't start the test — check your connection and try again.");
      return;
    }
    patch({ activeTestId: row.id, selectedSubjectId: subjectId, selectedSubjectName: name });
    go("testRun");
  };

  if (stats === null) return null; // quietly loading; the rest of Progress shows meanwhile

  const judged = stats.filter((c) => c.attempted >= WEAK_MIN_ATTEMPTED);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "22px 24px" }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Weak chapters</div>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>
        From every test and challenge. A chapter shows here once you&apos;ve answered {WEAK_MIN_ATTEMPTED}+ of its questions and
        score under {WEAK_BELOW_PCT}% in it.
      </div>

      {groups.length === 0 ? (
        <div style={{ fontSize: 13.5, color: "#5d5648", lineHeight: 1.6, background: C.sageT, borderRadius: 16, padding: "12px 14px" }}>
          {judged.length === 0
            ? "Not enough answers yet to spot weak chapters — take a few more tests and they'll show up here."
            : "No weak chapters right now — every chapter you've practised is at 60% or more. Nice!"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {groups.map(([subjectId, chapters]) => {
            const name = names.get(subjectId) ?? "Subject";
            const key = `all:${subjectId}`;
            const n = Math.min(chapters.length, MAX_CHAPTERS_PER_TEST);
            return (
              <div key={subjectId}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 160, fontWeight: 700, fontSize: 14 }}>{name}</div>
                  <button
                    onClick={() => practise(subjectId, chapters, key)}
                    disabled={busy !== null}
                    style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "9px 16px", fontSize: 13, opacity: busy && busy !== key ? 0.5 : 1 }}
                  >
                    {busy === key ? "Building…" : `🎯 Practise my weak chapters${n > 1 ? ` (${n})` : ""}`}
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {chapters.map((c) => {
                    const ckey = `one:${c.chapterId}`;
                    const fg = c.pct >= 40 ? C.accentD : C.danger;
                    return (
                      <div key={c.chapterId} style={{ display: "flex", alignItems: "center", gap: 12, background: C.bg, borderRadius: 14, padding: "10px 12px", flexWrap: "wrap" }}>
                        <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                            Ch {c.seq} · {c.title}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                            <div style={{ flex: 1, height: 8, background: C.sand, borderRadius: 999, overflow: "hidden", maxWidth: 220 }}>
                              <div style={{ height: 8, width: `${c.pct}%`, background: fg, borderRadius: 999 }} />
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: fg }}>{c.pct}%</div>
                            <div style={{ fontSize: 12, color: C.muted }}>
                              {c.correct}/{c.attempted} right
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => practise(subjectId, [c], ckey)}
                          disabled={busy !== null}
                          style={{ borderRadius: 999, background: C.card, color: C.accentD, border: `1.5px solid ${C.accent}`, fontWeight: 700, padding: "7px 14px", fontSize: 12.5, opacity: busy && busy !== ckey ? 0.5 : 1, flex: "none" }}
                        >
                          {busy === ckey ? "Building…" : "Practise"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: C.accentD, background: "#fdf1e6", borderRadius: 14, padding: "10px 14px" }}>{error}</div>
      )}
    </div>
  );
}
