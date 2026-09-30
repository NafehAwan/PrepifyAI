"use client";

// One friend challenge from start to finish. The server's challenge_state is
// the single source of truth; this screen polls it and shows whichever phase
// the challenge is in:
//
//   not joined → preview + Join      lobby → invite link, seats, Ready
//   countdown  → 5-4-3-2-1           running → questions against the shared clock
//   submitted  → waiting for friends finished → leaderboard + answer review
//
// The clock is the server's: startedAt/endsAt come from the database and the
// local clock is corrected by the offset between our time and the server's, so
// a phone with the wrong time still gets the same minutes as everyone else.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import {
  challengeLink,
  challengeTitle,
  clearDraft,
  forceStartChallenge,
  formatClock,
  getChallengeState,
  joinChallenge,
  leaveChallenge,
  loadDraft,
  ordinal,
  saveDraft,
  setChallengeReady,
  submitChallenge,
  type ChallengePlayer,
  type ChallengeState,
} from "@/lib/challenges";
import { sfxTryAgain, sfxWin } from "@/lib/sfx";
import { Mascot } from "./Mascot";
import { ReviewRow } from "./TestRunner";
import type { DBMcq } from "@/lib/curriculum";

const JOIN_ERRORS: Record<string, string> = {
  full: "This challenge is already full.",
  running: "This challenge has already started.",
  finished: "This challenge has already finished.",
  cancelled: "The host cancelled this challenge.",
  not_found: "That challenge doesn't exist. Check the link.",
  error: "Couldn't join. Check your connection and try again.",
};

export function ChallengeRoom() {
  const { s, patch, go } = useApp();
  const code = s.activeChallengeCode;

  const [state, setState] = useState<ChallengeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [offset, setOffset] = useState(0); // serverTime − localTime, ms
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!code) return;
    try {
      const next = await getChallengeState(code);
      setMissing(!next);
      setState(next);
      if (next) setOffset(Date.parse(next.serverNow) - Date.now());
    } catch {
      // A failed poll just waits for the next one.
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    setLoading(true);
    setState(null);
    void refresh();
  }, [refresh]);

  // Keep the subject in the store so "back" lands on the right subject.
  useEffect(() => {
    if (state && s.selectedSubjectId !== state.subjectId) {
      patch({ selectedSubjectId: state.subjectId, selectedSubjectName: state.subjectName });
    }
  }, [state, s.selectedSubjectId, patch]);

  const serverNow = now + offset;
  const startsAt = state?.startedAt ? Date.parse(state.startedAt) : null;
  const endsAt = state?.endsAt ? Date.parse(state.endsAt) : null;
  const me = state?.players.find((p) => p.isMe) ?? null;

  const phase: Phase = !state
    ? "none"
    : state.status === "cancelled"
      ? "cancelled"
      : !state.joined
        ? "preview"
        : state.status === "lobby"
          ? "lobby"
          : state.status === "finished"
            ? "finished"
            : startsAt !== null && serverNow < startsAt
              ? "countdown"
              : me?.submitted
                ? "waiting"
                : "playing";

  // Poll: fast in the lobby so "1/2 ready" feels live, slower mid-test.
  useEffect(() => {
    if (!code || phase === "finished" || phase === "cancelled") return;
    const every = phase === "lobby" || phase === "preview" ? 2000 : phase === "waiting" ? 3000 : 6000;
    const id = window.setInterval(() => void refresh(), every);
    return () => window.clearInterval(id);
  }, [code, phase, refresh]);

  // A ticking clock only while there is a countdown or timer to show.
  useEffect(() => {
    if (phase !== "countdown" && phase !== "playing") return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [phase]);

  // The countdown ends by time, not by a poll — fetch the questions right away.
  useEffect(() => {
    if (phase === "playing" && state && !state.questions) void refresh();
  }, [phase, state, refresh]);

  // One sound when the results land.
  const played = useRef(false);
  useEffect(() => {
    if (phase !== "finished" || !state || played.current) return;
    played.current = true;
    const mine = rankPlayers(state.players).find((r) => r.player.isMe);
    (mine?.rank === 1 ? sfxWin : sfxTryAgain)();
  }, [phase, state]);

  const back = () => {
    patch({ activeChallengeCode: null });
    go(state || s.selectedSubjectId ? "subjectTests" : "subjects");
  };

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setNotice(null);
    await fn();
    await refresh();
    setBusy(false);
  };

  if (!code) {
    return (
      <Frame title="Challenge" onBack={back}>
        <Panel>No challenge open. Start one from a subject, or open the link a friend sent you.</Panel>
      </Frame>
    );
  }
  if (loading && !state) return <Frame title="Challenge" onBack={back}><div style={{ color: C.muted, fontSize: 14 }}>Loading…</div></Frame>;
  if (missing || !state) {
    return (
      <Frame title="Challenge" onBack={back}>
        <Panel>That challenge doesn&apos;t exist. Check the link, or ask your friend to send it again.</Panel>
      </Frame>
    );
  }

  const title = state.seq ? challengeTitle(state.seq) : `${state.subjectName} challenge`;
  const subtitle = `${state.subjectName} · ${state.scope} · ${state.questionCount} questions · ${Math.round(state.timeLimitSec / 60)} min · ${state.difficulty}`;

  if (phase === "cancelled") {
    return (
      <Frame title={title} subtitle={subtitle} onBack={back}>
        <Panel>{state.isHost ? "You cancelled this challenge." : `${state.hostName ?? "The host"} cancelled this challenge.`}</Panel>
      </Frame>
    );
  }

  if (phase === "preview") {
    const reason = state.status !== "lobby" ? JOIN_ERRORS[state.status] : state.players.length >= state.playerCount ? JOIN_ERRORS.full : null;
    return (
      <Frame title={`${state.hostName ?? "A friend"} challenged you!`} subtitle={subtitle} onBack={back}>
        <div style={{ maxWidth: 560, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Mascot mood="thinking" size={72} />
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#5d5648" }}>
              Same questions, same clock. {state.players.length}/{state.playerCount} players have joined — the
              challenge starts once everyone is in and ready.
            </div>
          </div>
          {reason ? (
            <Note>{reason}</Note>
          ) : (
            <button
              onClick={() =>
                act(async () => {
                  const res = await joinChallenge(state.code, s.userName);
                  if (!res.ok) setNotice(JOIN_ERRORS[res.reason] ?? JOIN_ERRORS.error);
                })
              }
              disabled={busy}
              style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}
            >
              {busy ? "Joining…" : "Join challenge"}
            </button>
          )}
          {notice && <Note>{notice}</Note>}
        </div>
      </Frame>
    );
  }

  if (phase === "lobby") {
    return (
      <Frame title={title} subtitle={subtitle} onBack={back}>
        <Lobby state={state} me={me} busy={busy} notice={notice} act={act} onLeft={back} />
      </Frame>
    );
  }

  if (phase === "countdown" && startsAt !== null) {
    const left = Math.max(1, Math.ceil((startsAt - serverNow) / 1000));
    return (
      <Frame title={title} subtitle={subtitle} onBack={back}>
        <div style={{ maxWidth: 560, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "40px 26px", textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.muted, marginBottom: 8 }}>Everyone&apos;s ready — get set!</div>
          <div style={{ fontFamily: "Caprasimo", fontSize: 96, lineHeight: 1, color: C.accent }}>{left}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>
            You&apos;ll have {Math.round(state.timeLimitSec / 60)} minutes. The chatbot is off until you finish.
          </div>
        </div>
      </Frame>
    );
  }

  if (phase === "playing") {
    if (!state.questions || endsAt === null) {
      return <Frame title={title} subtitle={subtitle} onBack={back}><div style={{ color: C.muted, fontSize: 14 }}>Loading questions…</div></Frame>;
    }
    return (
      <Frame title={title} subtitle={subtitle} onBack={back}>
        <Play state={state} remainingMs={endsAt - serverNow} onSubmitted={refresh} />
      </Frame>
    );
  }

  if (phase === "waiting") {
    const done = state.players.filter((p) => p.submitted).length;
    return (
      <Frame title={title} subtitle={subtitle} onBack={back}>
        <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.sageT, borderRadius: 24, padding: "24px 26px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <Mascot mood="thinking" size={72} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontFamily: "Caprasimo", fontSize: 22, marginBottom: 4 }}>Your paper is in</div>
              <div style={{ fontSize: 14, color: "#5d5648" }}>
                {me?.correct ?? 0}/{state.questionCount} correct · {me?.scorePct ?? 0}%. Waiting for the others —{" "}
                {done}/{state.playerCount} finished. Results appear when everyone is done or time runs out.
              </div>
            </div>
          </div>
          <Seats state={state} show="submitted" />
        </div>
      </Frame>
    );
  }

  return (
    <Frame title={title} subtitle={subtitle} onBack={back}>
      <Results state={state} />
    </Frame>
  );
}

type Phase = "none" | "cancelled" | "preview" | "lobby" | "countdown" | "playing" | "waiting" | "finished";

function Lobby({
  state,
  me,
  busy,
  notice,
  act,
  onLeft,
}: {
  state: ChallengeState;
  me: ChallengePlayer | null;
  busy: boolean;
  notice: string | null;
  act: (fn: () => Promise<unknown>) => Promise<void>;
  onLeft: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [forceMsg, setForceMsg] = useState<string | null>(null);
  const link = challengeLink(state.code);
  const joined = state.players.length;
  const ready = state.players.filter((p) => p.ready).length;
  const everyoneReady = joined === state.playerCount && ready === state.playerCount;
  const message = `${me?.name ?? "I"} challenged you to a ${state.subjectName} test on Prepify! Join here: ${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", link);
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: "Prepify challenge", text: message, url: link });
    } catch {
      /* dismissed */
    }
  };
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "22px 24px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Invite your friends</div>
        <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>
          Send them this link. They sign in, tap Join, then Ready. Code: <strong style={{ letterSpacing: 2, color: C.ink }}>{state.code}</strong>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 240px", minWidth: 0, background: C.bg, borderRadius: 12, padding: "11px 14px", fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {link}
          </div>
          <button onClick={copy} style={secondaryBtn}>{copied ? "Copied ✓" : "Copy link"}</button>
          <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" style={{ ...secondaryBtn, background: "#dcefd9", color: "#2f5d2a", textDecoration: "none" }}>
            WhatsApp
          </a>
          {canShare && <button onClick={share} style={secondaryBtn}>Share…</button>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="Joined" value={`${joined}/${state.playerCount}`} />
        <Stat label="Ready" value={`${ready}/${state.playerCount}`} strong={ready === state.playerCount} />
      </div>

      <Seats state={state} show="ready" />

      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
        {joined < state.playerCount
          ? `Waiting for ${state.playerCount - joined} more friend${state.playerCount - joined === 1 ? "" : "s"} to join.`
          : ready < state.playerCount
            ? "Everyone's here — it starts the moment the last person taps Ready."
            : "Starting…"}
      </div>

      {notice && <Note>{notice}</Note>}
      {forceMsg && <Note>{forceMsg}</Note>}

      {/* The host needn't wait for every seat or every Ready: once at least one
          friend is in, they can start with whoever is here. */}
      {state.isHost && !everyoneReady && (
        <div style={{ background: C.card, border: `1.5px dashed ${C.accent}`, borderRadius: 20, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, fontSize: 13, color: "#5d5648", lineHeight: 1.5 }}>
            <strong>Don&apos;t want to wait?</strong>{" "}
            {joined >= 2
              ? `Start now with the ${joined} player${joined === 1 ? "" : "s"} who ${joined === 1 ? "is" : "are"} here — empty seats are dropped.`
              : "Force start unlocks as soon as one friend joins."}
          </div>
          <button
            onClick={async () => {
              if (!window.confirm(`Start now with ${joined} players? Nobody else can join after this.`)) return;
              setForceMsg(null);
              await act(async () => {
                const res = await forceStartChallenge(state.code);
                if (res === "need_friend") setForceMsg("At least one friend has to join first.");
                else if (res !== "ok" && res !== "not_waiting") setForceMsg("Couldn't start — check your connection and try again.");
              });
            }}
            disabled={busy || joined < 2}
            style={{ borderRadius: 999, background: joined >= 2 ? C.accentD : C.sand, color: joined >= 2 ? "#fff" : C.muted, fontWeight: 700, padding: "11px 20px", fontSize: 14, opacity: busy ? 0.7 : 1, flex: "none" }}
          >
            ⚡ Force start
          </button>
        </div>
      )}
      {!state.isHost && joined >= 2 && !everyoneReady && (
        <div style={{ fontSize: 12.5, color: C.muted }}>The host can also start early with whoever has joined.</div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => act(() => setChallengeReady(state.code, !me?.ready))}
          disabled={busy}
          style={{ ...primaryBtn, background: me?.ready ? C.sage : C.accent, opacity: busy ? 0.7 : 1 }}
        >
          {me?.ready ? "Ready ✓  (tap to undo)" : "I'm ready"}
        </button>
        <button
          onClick={async () => {
            const sure = window.confirm(state.isHost ? "Cancel this challenge for everyone?" : "Leave this challenge?");
            if (!sure) return;
            await act(() => leaveChallenge(state.code));
            onLeft();
          }}
          disabled={busy}
          style={{ fontSize: 13.5, fontWeight: 700, color: C.muted, padding: "12px 14px" }}
        >
          {state.isHost ? "Cancel challenge" : "Leave"}
        </button>
      </div>
    </div>
  );
}

// Every seat: joined players with their status, then empty seats.
function Seats({ state, show }: { state: ChallengeState; show: "ready" | "submitted" }) {
  const empty = Math.max(0, state.playerCount - state.players.length);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "10px 12px" }}>
      {state.players.map((p, i) => {
        const on = show === "ready" ? p.ready : p.submitted;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
            <Avatar name={p.name} />
            <div style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 14 }}>
              {p.name}
              {p.isMe && <span style={{ color: C.muted, fontWeight: 600 }}> (you)</span>}
              {p.isHost && <span style={{ fontSize: 11, fontWeight: 700, color: C.accentD, background: C.tint, borderRadius: 999, padding: "2px 8px", marginLeft: 8 }}>host</span>}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "4px 11px", background: on ? C.sageT : C.sand, color: on ? C.sageD : C.muted }}>
              {show === "ready" ? (on ? "Ready" : "Not ready") : on ? "Finished" : "Answering…"}
            </span>
          </div>
        );
      })}
      {Array.from({ length: empty }, (_, i) => (
        <div key={`e${i}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderTop: `1px solid ${C.line}` }}>
          <div style={{ width: 34, height: 34, flex: "none", borderRadius: 999, border: `2px dashed ${C.line}` }} />
          <div style={{ flex: 1, fontSize: 13.5, color: C.muted, fontWeight: 600 }}>Waiting for a friend…</div>
        </div>
      ))}
    </div>
  );
}

function Play({ state, remainingMs, onSubmitted }: { state: ChallengeState; remainingMs: number; onSubmitted: () => Promise<void> }) {
  const questions = state.questions ?? [];
  const [picks, setPicks] = useState<(number | null)[]>(() => loadDraft(state.code, questions.length));
  const [submitting, setSubmitting] = useState(false);
  const sent = useRef(false);
  const lastTry = useRef(0);

  useEffect(() => saveDraft(state.code, picks), [state.code, picks]);

  const submit = useCallback(async () => {
    // One submission in flight, and after a failure wait a few seconds before
    // the timer's automatic retry.
    if (sent.current || Date.now() - lastTry.current < 3000) return;
    sent.current = true;
    lastTry.current = Date.now();
    setSubmitting(true);
    const ok = await submitChallenge(state.code, picks);
    if (ok) clearDraft(state.code);
    else sent.current = false; // let a retry (or the timer) try again
    setSubmitting(false);
    await onSubmitted();
  }, [state.code, picks, onSubmitted]);

  // Time's up: hand the paper in automatically.
  useEffect(() => {
    if (remainingMs <= 0) void submit();
  }, [remainingMs, submit]);

  const answered = picks.filter((p) => p !== null).length;
  const low = remainingMs < 60_000;

  return (
    <>
      <div style={{ position: "sticky", top: 62, zIndex: 10, background: C.bg, padding: "8px 0 12px", marginBottom: 6 }}>
        <div style={{ maxWidth: 900, display: "flex", alignItems: "center", gap: 14, background: low ? C.tint : C.card, border: `1.5px solid ${low ? C.accent : C.line}`, borderRadius: 18, padding: "10px 16px" }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 26, color: low ? C.accentD : C.ink, minWidth: 74 }}>{formatClock(remainingMs / 1000)}</div>
          <div style={{ flex: 1, fontSize: 13, color: C.muted, fontWeight: 600 }}>
            {answered}/{questions.length} answered · submits automatically at 0:00
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px", marginBottom: 16 }}>
        {questions.map((q, qi) => (
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
                    disabled={submitting}
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
          onClick={() => {
            const blank = questions.length - answered;
            if (blank > 0 && !window.confirm(`${blank} question${blank === 1 ? " is" : "s are"} unanswered and will count as wrong. Submit anyway?`)) return;
            void submit();
          }}
          disabled={submitting}
          style={{ ...primaryBtn, opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? "Submitting…" : "Submit answers"}
        </button>
        <div style={{ fontSize: 12.5, color: C.muted }}>Unanswered questions count as wrong. Finishing faster breaks a tie.</div>
      </div>
    </>
  );
}

interface Ranked {
  player: ChallengePlayer;
  rank: number;
}

// More correct first, then faster. Exact ties share a rank.
function rankPlayers(players: ChallengePlayer[]): Ranked[] {
  const sorted = [...players].sort(
    (a, b) => (b.correct ?? 0) - (a.correct ?? 0) || (a.timeTakenSec ?? 1e9) - (b.timeTakenSec ?? 1e9),
  );
  const out: Ranked[] = [];
  sorted.forEach((p, i) => {
    const prev = out[i - 1];
    const tie = prev && (prev.player.correct ?? 0) === (p.correct ?? 0) && (prev.player.timeTakenSec ?? 1e9) === (p.timeTakenSec ?? 1e9);
    out.push({ player: p, rank: tie ? prev.rank : i + 1 });
  });
  return out;
}

function Results({ state }: { state: ChallengeState }) {
  const { go } = useApp();
  const ranked = useMemo(() => rankPlayers(state.players), [state.players]);
  const mine = ranked.find((r) => r.player.isMe);
  const winners = ranked.filter((r) => r.rank === 1).map((r) => (r.player.isMe ? "You" : r.player.name));
  const won = mine?.rank === 1;

  const review: DBMcq[] = useMemo(
    () =>
      (state.questions ?? []).map((q, i) => ({
        id: q.id,
        stem: q.stem,
        options: q.options,
        answer: state.key?.[i] ?? 0,
        ...(state.explanations?.[i] ? { explanation: state.explanations[i] as string } : {}),
      })),
    [state.questions, state.key, state.explanations],
  );
  const answers = state.myAnswers ?? [];

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: won ? C.sageT : C.tint, borderRadius: 24, padding: "26px 28px", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
        <Mascot mood={won ? "celebrate" : "sad"} size={84} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 26, marginBottom: 4 }}>
            {won ? (winners.length > 1 ? "It's a tie for first!" : "You won! 🏆") : `${winners.join(" & ")} won`}
          </div>
          <div style={{ fontSize: 14, color: "#5d5648" }}>
            {mine ? `You came ${ordinal(mine.rank)} of ${ranked.length} · ${mine.player.correct ?? 0}/${state.questionCount} correct · ${mine.player.scorePct ?? 0}% · ${mine.player.remarks ?? ""}` : ""}
          </div>
        </div>
        <button onClick={() => go("newChallenge")} style={{ borderRadius: 999, background: "#fff", fontWeight: 700, padding: "10px 18px", fontSize: 13.5 }}>
          Rematch
        </button>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "18px 20px", overflowX: "auto" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Leaderboard</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 440 }}>
          <thead>
            <tr style={{ color: C.muted, textAlign: "left" }}>
              {["#", "Player", "Marks", "%", "Time", "Remarks"].map((h) => (
                <th key={h} style={{ padding: "6px 8px", fontWeight: 700, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map(({ player: p, rank }, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${C.line}`, background: p.isMe ? C.tint : "transparent" }}>
                <td style={{ padding: "10px 8px", fontFamily: "Caprasimo", fontSize: 17, color: rank === 1 ? C.accent : C.muted }}>{rank === 1 ? "🏆" : rank}</td>
                <td style={{ padding: "10px 8px", fontWeight: 700 }}>{p.name}{p.isMe ? " (you)" : ""}</td>
                <td style={{ padding: "10px 8px", fontWeight: 700 }}>{p.correct ?? 0}/{state.questionCount}</td>
                <td style={{ padding: "10px 8px" }}>{p.scorePct ?? 0}%</td>
                <td style={{ padding: "10px 8px" }}>{p.submitted ? formatClock(p.timeTakenSec ?? 0) : "—"}</td>
                <td style={{ padding: "10px 8px", color: C.muted }}>{p.remarks ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {review.length > 0 && state.key && (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Your answers</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {review.map((q, qi) => (
              <ReviewRow key={q.id ?? qi} q={q} index={qi} pick={typeof answers[qi] === "number" ? answers[qi] : null} first={qi === 0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Frame({ title, subtitle, onBack, children }: { title: string; subtitle?: string; onBack: () => void; children: React.ReactNode }) {
  const { s } = useApp();
  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <button onClick={onBack} style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
          ← {s.selectedSubjectName ?? "Back"}
        </button>
        <div style={{ fontFamily: "Caprasimo", fontSize: 28, lineHeight: 1.15 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13.5, color: C.muted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 560, background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: "22px 24px", color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, borderRadius: 16, padding: "12px 16px", background: "#fdf1e6", color: C.accentD }}>
      {children}
    </div>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ background: strong ? C.sageT : C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "12px 18px", minWidth: 120 }}>
      <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: "Caprasimo", fontSize: 26, color: strong ? C.sageD : C.ink }}>{value}</div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div style={{ width: 34, height: 34, flex: "none", borderRadius: 999, background: C.sage, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
      {(name.trim()[0] ?? "?").toUpperCase()}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  borderRadius: 999,
  background: C.accent,
  color: "#fff",
  fontWeight: 700,
  padding: "13px 28px",
  fontSize: 15,
};

const secondaryBtn: React.CSSProperties = {
  borderRadius: 999,
  background: C.sand,
  color: "#5d5648",
  fontWeight: 700,
  padding: "10px 16px",
  fontSize: 13.5,
  flex: "none",
};
