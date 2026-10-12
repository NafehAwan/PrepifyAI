"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { listTests, type TestRow } from "@/lib/tests/store";
import { currentUserId } from "@/lib/analytics";
import { useSelectedSubject } from "@/lib/useSubject";
import { challengeTitle, listMyChallenges, ordinal, type ChallengeCard } from "@/lib/challenges";

// One subject's dashboard: a prominent "New test" button and a card per test
// taken, showing the marks, the percentage and a remark.
export function SubjectTests() {
  const { patch, go } = useApp();
  const { subjectId, subjectName, lookupFailed, retryLookup } = useSelectedSubject();

  const [tests, setTests] = useState<TestRow[]>([]);
  const [challenges, setChallenges] = useState<ChallengeCard[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // Still working out which subject this is (e.g. opened from its web
    // address): keep showing "Loading" rather than a false "No tests yet".
    if (!subjectId) return;
    const userId = await currentUserId();
    if (!userId) {
      setTests([]);
      setLoading(false);
      return;
    }
    const [t, c] = await Promise.all([listTests(userId, subjectId), listMyChallenges(subjectId)]);
    setTests(t);
    setChallenges(c);
    setLoading(false);
  }, [subjectId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    load().catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [load]);

  const openTest = (t: TestRow) => {
    patch({ activeTestId: t.id });
    // An unfinished test resumes rather than opening its (empty) review.
    go(t.status === "submitted" ? "testReview" : "testRun");
  };

  const openChallenge = (c: ChallengeCard) => {
    patch({ activeChallengeCode: c.code });
    go("challengeRoom");
  };

  const submitted = tests.filter((t) => t.status === "submitted");
  const best = submitted.length ? Math.max(...submitted.map((t) => t.scorePct ?? 0)) : null;

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => go("subjects")} style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
          ← All subjects
        </button>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "Caprasimo", fontSize: 30, lineHeight: 1.1 }}>{subjectName}</div>
            <div style={{ color: C.muted, marginTop: 4, fontSize: 14 }}>
              {submitted.length === 0
                ? "No tests yet — start your first one."
                : `${submitted.length} test${submitted.length === 1 ? "" : "s"} taken · best ${best}%`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => go("newChallenge")}
              style={{ borderRadius: 999, background: C.card, color: C.accentD, border: `1.5px solid ${C.accent}`, fontWeight: 700, padding: "13px 22px", fontSize: 15 }}
            >
              ⚔ Challenge friends
            </button>
            <button
              onClick={() => go("newTest")}
              style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "14px 28px", fontSize: 15, boxShadow: "0 10px 24px rgba(198,113,57,.25)" }}
            >
              + New test
            </button>
          </div>
        </div>
      </div>

      {lookupFailed ? (
        <div style={{ maxWidth: 560, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 13.5, fontWeight: 600, color: C.accentD, background: "#fdf1e6", borderRadius: 16, padding: "14px 16px" }}>
          <span style={{ flex: 1, minWidth: 200 }}>Couldn&apos;t load this subject. Check your connection.</span>
          <button onClick={retryLookup} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "8px 16px", fontSize: 13 }}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div style={{ color: C.muted, fontSize: 14 }}>Loading your tests…</div>
      ) : tests.length === 0 ? (
        <div style={{ maxWidth: 560, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Your first {subjectName} test</div>
          <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
            Choose how many questions you want (1 to 30) and how hard they should be. Every test is
            different, and the harder levels are mostly scenario questions — the kind the board paper
            actually asks.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 }}>
          {tests.map((t) => (
            <TestCard key={t.id} test={t} onOpen={() => openTest(t)} />
          ))}
        </div>
      )}

      {!loading && challenges.length > 0 && (
        <>
          <div style={{ fontFamily: "Caprasimo", fontSize: 22, margin: "30px 0 12px" }}>Challenges</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 }}>
            {challenges.map((c) => (
              <ChallengeCardView key={c.code} challenge={c} onOpen={() => openChallenge(c)} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function TestCard({ test, onOpen }: { test: TestRow; onOpen: () => void }) {
  const done = test.status === "submitted";
  const pct = test.scorePct ?? 0;
  const strong = pct >= 75;
  const pass = pct >= 50;
  const fg = !done ? C.muted : strong ? C.sageD : pass ? C.accentD : C.danger;
  const bg = !done ? C.sand : strong ? C.sageT : C.tint;

  return (
    <button
      onClick={onOpen}
      className="pf-lift"
      style={{ textAlign: "left", background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: 20 }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
        <div style={{ fontFamily: "Caprasimo", fontSize: 19 }}>{test.title}</div>
        <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 9px", background: bg, color: fg, textTransform: "capitalize", flex: "none" }}>
          {test.difficulty}
        </span>
      </div>

      {done ? (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
            <div style={{ fontFamily: "Caprasimo", fontSize: 34, lineHeight: 1, color: fg }}>{pct}%</div>
            <div style={{ fontSize: 13.5, color: C.muted, fontWeight: 600 }}>
              {test.correctCount}/{test.questionCount}
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: fg, marginBottom: 10 }}>{test.remarks}</div>
        </>
      ) : (
        <div style={{ fontSize: 13.5, color: C.accentD, fontWeight: 700, marginBottom: 10 }}>
          Not finished — tap to continue
        </div>
      )}

      <div style={{ fontSize: 12, color: "#9a8d78" }}>
        {test.scope ?? "Whole book"} · {test.questionCount} question{test.questionCount === 1 ? "" : "s"} ·{" "}
        {new Date(test.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
      </div>
    </button>
  );
}

function ChallengeCardView({ challenge: c, onOpen }: { challenge: ChallengeCard; onOpen: () => void }) {
  const finished = c.status === "finished";
  const pct = c.scorePct ?? 0;
  const won = finished && c.rank === 1;
  const fg = !finished ? C.muted : won ? C.sageD : pct >= 50 ? C.accentD : C.danger;
  const bg = !finished ? C.sand : won ? C.sageT : C.tint;
  const status =
    c.status === "lobby"
      ? `Waiting for friends · ${c.joinedCount}/${c.playerCount} joined`
      : c.status === "running"
        ? c.submitted
          ? "Waiting for the others to finish"
          : "In progress — tap to continue"
        : null;

  return (
    <button
      onClick={onOpen}
      className="pf-lift"
      style={{ textAlign: "left", background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: 20 }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
        <div style={{ fontFamily: "Caprasimo", fontSize: 19 }}>{challengeTitle(c.seq)}</div>
        <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 9px", background: bg, color: fg, flex: "none" }}>
          {finished && c.rank ? (won ? "🏆 1st" : ordinal(c.rank)) : `${c.playerCount} players`}
        </span>
      </div>

      {finished ? (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
            <div style={{ fontFamily: "Caprasimo", fontSize: 34, lineHeight: 1, color: fg }}>{pct}%</div>
            <div style={{ fontSize: 13.5, color: C.muted, fontWeight: 600 }}>
              {c.correct ?? 0}/{c.questionCount}
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: fg, marginBottom: 10 }}>
            {c.rank ? `${ordinal(c.rank)} of ${c.playerCount}` : ""} · {c.remarks}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13.5, color: C.accentD, fontWeight: 700, marginBottom: 10 }}>{status}</div>
      )}

      <div style={{ fontSize: 12, color: "#9a8d78" }}>
        {c.scope} · {c.questionCount} questions · {c.difficulty} ·{" "}
        {new Date(c.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
      </div>
    </button>
  );
}
