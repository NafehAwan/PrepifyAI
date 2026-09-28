"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { listSubjectChapters, scopeLabel, type SubjectChapter } from "@/lib/tests/build";
import { createChallenge } from "@/lib/challenges";
import type { McqDifficulty } from "@/lib/ai/prompts";
import { ChapterPicker, ChipRow, CountPicker, DifficultyPicker, OptionCard } from "../TestOptions";

const FRIENDS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const MINUTES = [5, 10, 15, 20, 30, 45, 60] as const;

// Set up a challenge: chapters, question count and difficulty as for a normal
// test, plus how many friends and a time limit everyone shares. Creating it
// picks the questions on the server and opens the lobby with the invite link.
export function NewChallenge() {
  const { s, patch, go } = useApp();
  const subjectId = s.selectedSubjectId;
  const subjectName = s.selectedSubjectName ?? "Subject";

  const [chapters, setChapters] = useState<SubjectChapter[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [count, setCount] = useState(15);
  const [difficulty, setDifficulty] = useState<McqDifficulty>("mixed");
  const [friends, setFriends] = useState<number>(1);
  const [minutes, setMinutes] = useState<number>(15);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (subjectId) listSubjectChapters(subjectId).then((c) => active && setChapters(c));
    return () => {
      active = false;
    };
  }, [subjectId]);

  const scope = scopeLabel(chapters.filter((c) => picked.includes(c.id)), chapters.length);
  const scopeChapters = picked.length > 0 ? chapters.filter((c) => picked.includes(c.id)) : chapters;
  const available = scopeChapters.reduce((n, c) => n + c.mcqCount, 0);

  const create = async () => {
    setError(null);
    if (!subjectId) {
      setError("This subject isn't set up yet. Go back and pick another one.");
      return;
    }
    setCreating(true);
    const res = await createChallenge({
      subjectId,
      chapterIds: picked,
      scope,
      difficulty,
      questionCount: count,
      friends,
      timeLimitSec: minutes * 60,
      displayName: s.userName,
    });
    setCreating(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    patch({ activeChallengeCode: res.code });
    go("challengeRoom");
  };

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => go("subjectTests")} style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
          ← {subjectName}
        </button>
        <div style={{ fontFamily: "Caprasimo", fontSize: 30, lineHeight: 1.1 }}>Challenge friends</div>
        <div style={{ color: C.muted, marginTop: 4, fontSize: 14, maxWidth: 620 }}>
          Everyone gets the same {subjectName} questions and the same clock. You&apos;ll get a link to send — the
          challenge starts when every friend has joined and tapped Ready.
        </div>
      </div>

      <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 16 }}>
        <ChapterPicker chapters={chapters} picked={picked} onChange={setPicked} />

        <OptionCard title="How many friends?" hint="Not counting you. The challenge waits until all of them are in.">
          <ChipRow options={FRIENDS} value={friends} onChange={setFriends} label={(n) => String(n)} />
        </OptionCard>

        <CountPicker count={count} onChange={setCount} />
        <DifficultyPicker difficulty={difficulty} onChange={setDifficulty} />

        <OptionCard title="Time limit" hint="Everyone gets exactly this long. When it runs out, answers are submitted automatically.">
          <ChipRow options={MINUTES} value={minutes} onChange={setMinutes} label={(m) => `${m} min`} />
        </OptionCard>

        {chapters.length > 0 && available < count && !error && (
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, borderRadius: 16, padding: "12px 16px", background: C.sand, color: "#6d6250" }}>
            {available === 0
              ? "No questions are loaded for this choice yet."
              : `Only ${available} question${available === 1 ? "" : "s"} available here, so the challenge will have ${available}.`}
          </div>
        )}

        {error && (
          <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, borderRadius: 16, padding: "13px 16px", background: "#fdf1e6", color: C.accentD }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button
            onClick={create}
            disabled={creating}
            style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "14px 32px", fontSize: 15, opacity: creating ? 0.7 : 1 }}
          >
            {creating ? "Setting it up…" : "Create challenge →"}
          </button>
          <div style={{ fontSize: 12.5, color: C.muted }}>
            {friends + 1} players · {count} questions · {minutes} min · {difficulty} · {scope}
          </div>
        </div>
      </div>
    </>
  );
}
