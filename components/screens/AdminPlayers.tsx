"use client";

import { useCallback, useEffect, useState } from "react";
import { C, pill } from "@/lib/theme";
import {
  createFakePlayer,
  listAdminPlayers,
  resetAdminPlayerScores,
  setAdminPlayerStats,
  updateAdminPlayer,
  updateFakePlayer,
  type AdminPlayer,
  type FakePlayerInput,
} from "@/lib/support";

const LEADERBOARD_NAME_CHARS = 10; // the leaderboard shows this many

type Filter = "all" | "real" | "fake";

// Admin → Players: every student and every fake player. For a student: their
// details, the name the leaderboard shows, whether they're on it at all, and
// their XP, wins, papers and streak (or a score reset). Fake players are
// made up here and every number is set by hand. Nothing is deleted — every
// change can be undone.
export function AdminPlayers() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [players, setPlayers] = useState<AdminPlayer[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    const list = await listAdminPlayers(search);
    if (list === null) setFailed(true);
    setPlayers(list ?? []);
  }, [search]);

  useEffect(() => {
    setPlayers(null);
    void load();
  }, [load]);

  // Search as you type, after a short pause.
  useEffect(() => {
    const id = window.setTimeout(() => setSearch(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  const shown = (players ?? []).filter((p) => filter === "all" || (filter === "fake") === p.isFake);
  const fakeCount = (players ?? []).filter((p) => p.isFake && !p.removed).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={100}
          placeholder="Search by username, name or email…"
          aria-label="Search players"
          style={{ flex: "1 1 260px", maxWidth: 420, borderRadius: 999, border: "1.5px solid #e0d0b4", background: "#fff", padding: "11px 18px", fontSize: 14 }}
        />
        <div style={{ display: "flex", background: C.sand, borderRadius: 999, padding: 4 }}>
          {(["all", "real", "fake"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={pill(filter === f)}>
              {f === "all" ? "All" : f === "real" ? "Students" : `Fake${fakeCount ? ` (${fakeCount})` : ""}`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "10px 18px", fontSize: 13.5 }}
        >
          {creating ? "Close" : "+ Fake player"}
        </button>
      </div>

      {creating && (
        <FakeEditor
          onSaved={async () => {
            setCreating(false);
            setFilter("all");
            await load();
          }}
        />
      )}

      <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>
        Tap a player to see their details and change their name, XP, wins, papers or streak. Fake players only exist on the
        leaderboard. Nothing is deleted — every change can be undone.
      </div>
      {failed && (
        <div style={{ fontSize: 13.5, color: C.accentD, fontWeight: 600 }}>
          Couldn&apos;t load players. <button onClick={() => void load()} style={{ fontWeight: 700, color: C.accent }}>Try again</button>
        </div>
      )}
      {players === null ? (
        <div style={{ color: C.muted, fontSize: 14 }}>Loading…</div>
      ) : shown.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: "18px 20px", color: C.muted, fontSize: 14 }}>
          {search ? `No players match “${search}”.` : filter === "fake" ? "No fake players yet — make one with “+ Fake player”." : "No players yet."}
        </div>
      ) : (
        shown.map((p) => (
          <PlayerCard key={p.id} p={p} open={openId === p.id} onToggle={() => setOpenId((cur) => (cur === p.id ? null : p.id))} onChanged={load} />
        ))
      )}
    </div>
  );
}

function PlayerCard({ p, open, onToggle, onChanged }: { p: AdminPlayer; open: boolean; onToggle: () => void; onChanged: () => Promise<void> }) {
  return (
    <div style={{ background: p.removed ? C.bg : C.card, border: `1.5px solid ${open ? C.accent : C.line}`, borderRadius: 20, padding: "14px 16px", opacity: p.removed && !open ? 0.75 : 1 }}>
      <button onClick={onToggle} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.name.slice(0, LEADERBOARD_NAME_CHARS)}
            {p.name.length > LEADERBOARD_NAME_CHARS && <span style={{ color: "#b0a793" }}>{p.name.slice(LEADERBOARD_NAME_CHARS)}</span>}
            {p.username && p.username !== p.name && <span style={{ fontWeight: 500, color: C.muted }}> · @{p.username}</span>}
          </div>
          <div style={{ fontSize: 12, color: "#9a8d78", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.isFake ? `made ${fmtDate(p.joined)}` : `${p.email ?? "no email"} · joined ${fmtDate(p.joined)}`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {p.isFake && <Tag tone="accent">Fake</Tag>}
          {p.isMe && <Tag tone="sage">You</Tag>}
          {p.isAdmin && !p.isMe && <Tag tone="sage">Admin</Tag>}
          {p.removed && <Tag tone="accent">Off leaderboard</Tag>}
          {p.hidden && !p.removed && <Tag>Hidden by student</Tag>}
          {p.resetAt && <Tag tone="accent">Scores reset</Tag>}
          {p.customName && <Tag>Renamed</Tag>}
          {p.streakOverride && <Tag>Streak set</Tag>}
        </div>
        <div style={{ textAlign: "right", minWidth: 150 }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 20 }}>{p.xp.toLocaleString()} XP</div>
          <div style={{ fontSize: 11.5, color: C.muted }}>
            {p.xpMonth.toLocaleString()} this month · 🏆 {p.wins} · 📝 {p.papers} · 🔥 {p.streak}
          </div>
        </div>
      </button>
      {open && (p.isFake ? <FakeEditor p={p} onSaved={onChanged} /> : <RealPlayerPanel p={p} onChanged={onChanged} />)}
    </div>
  );
}

// ---- A real student -------------------------------------------------------------

function RealPlayerPanel({ p, onChanged }: { p: AdminPlayer; onChanged: () => Promise<void> }) {
  const [name, setName] = useState(p.customName ?? "");
  const [onBoard, setOnBoard] = useState(!p.removed);
  const [xp, setXp] = useState(String(p.xp));
  const [wins, setWins] = useState(String(p.wins));
  const [papers, setPapers] = useState(String(p.papers));
  const [streak, setStreak] = useState(String(p.streak));
  const [realStreak, setRealStreak] = useState(!p.streakOverride);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (key: string, fn: () => Promise<{ ok: boolean; text: string }>) => {
    setBusy(key);
    setMsg(null);
    const res = await fn();
    setBusy(null);
    setMsg(res);
    if (res.ok) await onChanged();
  };

  const saveName = () =>
    run("name", async () => {
      const res = await updateAdminPlayer(p.id, name, !onBoard);
      return res === "ok" ? { ok: true, text: "Saved." } : { ok: false, text: res === "bad_name" ? "Names can be up to 30 characters." : "Couldn't save — try again." };
    });

  const saveNumbers = () =>
    run("numbers", async () => {
      const n = { xp: toInt(xp), wins: toInt(wins), papers: toInt(papers), streak: realStreak ? -1 : toInt(streak) };
      if (n.xp === null || n.wins === null || n.papers === null || n.streak === null) return { ok: false, text: "Use whole numbers (0 or more)." };
      // Only send what changed, so an unchanged field keeps its exact value.
      const res = await setAdminPlayerStats(p.id, {
        xp: n.xp !== p.xp ? n.xp : null,
        wins: n.wins !== p.wins ? n.wins : null,
        papers: n.papers !== p.papers ? n.papers : null,
        streak: realStreak ? (p.streakOverride ? -1 : null) : n.streak !== p.streak || !p.streakOverride ? n.streak : null,
      });
      return res === "ok" ? { ok: true, text: "Numbers saved." } : { ok: false, text: res === "bad_value" ? "One of the numbers is too big." : "Couldn't save — try again." };
    });

  const reset = (on: boolean) => {
    if (on && !window.confirm(`Reset ${p.name}'s scores to 0? Their tests stay saved, they just stop counting. You can undo this.`)) return;
    void run("reset", async () =>
      (await resetAdminPlayerScores(p.id, on))
        ? { ok: true, text: on ? "Scores reset to 0." : "Reset undone — their old scores count again." }
        : { ok: false, text: "Couldn't update — try again." },
    );
  };

  const ownName = p.username ?? "their own name";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, background: C.bg, borderRadius: 16, padding: "14px 14px", marginTop: 12 }}>
      <Info p={p} />

      <Section title={`Leaderboard name (empty = ${ownName}; the board shows the first ${LEADERBOARD_NAME_CHARS} characters)`}>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder={ownName} aria-label="Leaderboard name" style={{ ...field, flex: "1 1 200px" }} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
          <input type="checkbox" checked={onBoard} onChange={(e) => setOnBoard(e.target.checked)} />
          Show on leaderboard
        </label>
        <button onClick={saveName} disabled={busy !== null} style={{ ...primary, opacity: busy === "name" ? 0.7 : 1 }}>
          {busy === "name" ? "Saving…" : "Save"}
        </button>
      </Section>

      <Section title="Numbers (all time). New tests and games still add on top of what you set.">
        <Num label="XP" value={xp} onChange={setXp} hint={`This month ${p.xpMonth.toLocaleString()}`} />
        <Num label="Wins" value={wins} onChange={setWins} hint={`Real ${p.realWins ?? 0}`} />
        <Num label="Papers" value={papers} onChange={setPapers} hint={`Real ${p.realPapers ?? 0}`} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Num label="Streak" value={realStreak ? String(p.realStreak ?? 0) : streak} onChange={setStreak} disabled={realStreak} hint={`Real ${p.realStreak ?? 0}`} />
          <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: C.muted }}>
            <input
              type="checkbox"
              checked={realStreak}
              onChange={(e) => {
                setRealStreak(e.target.checked);
                if (!e.target.checked) setStreak(String(p.streak));
              }}
            />
            Use real streak
          </label>
        </div>
        <button onClick={saveNumbers} disabled={busy !== null} style={{ ...primary, alignSelf: "flex-start", marginTop: 18, opacity: busy === "numbers" ? 0.7 : 1 }}>
          {busy === "numbers" ? "Saving…" : "Save numbers"}
        </button>
      </Section>

      <Section title="Reset">
        {p.resetAt ? (
          <>
            <button onClick={() => reset(false)} disabled={busy !== null} style={{ borderRadius: 999, background: C.sand, color: "#5d5648", fontWeight: 700, padding: "8px 14px", fontSize: 13 }}>
              Undo score reset
            </button>
            <span style={{ fontSize: 12, color: "#9a8d78" }}>Scores before {fmtDateTime(p.resetAt)} don&apos;t count.</span>
          </>
        ) : (
          <button onClick={() => reset(true)} disabled={busy !== null} style={{ borderRadius: 999, background: "#fdf1e6", color: C.accentD, fontWeight: 700, padding: "8px 14px", fontSize: 13 }}>
            Reset scores to 0
          </button>
        )}
      </Section>

      {msg && <div style={{ fontSize: 12.5, fontWeight: 700, color: msg.ok ? C.sageD : C.accentD }}>{msg.text}</div>}
    </div>
  );
}

// Everything known about a student, read-only.
function Info({ p }: { p: AdminPlayer }) {
  const rows: Array<[string, string]> = [
    ["Username", p.username ? `@${p.username}` : "—"],
    ["Email", p.email ?? "—"],
    ["Signs in with", p.provider === "google" ? "Google" : p.provider === "email" ? "Username / email + password" : (p.provider ?? "—")],
    ["Joined", fmtDate(p.joined)],
    ["Last sign-in", p.lastSignIn ? fmtDateTime(p.lastSignIn) : "—"],
    ["Last test or challenge", p.lastActive ? fmtDateTime(p.lastActive) : "—"],
    ["Class", p.classLevel ? `Class ${p.classLevel}${p.track ? ` · ${p.track}` : ""}` : "—"],
    ["Medium", p.medium ?? "—"],
    ["Exam date", p.examDate ? fmtDate(p.examDate) : "—"],
    ["Subjects", p.subjects && p.subjects.length > 0 ? p.subjects.join(", ") : "—"],
    ["Tests taken", String(p.tests ?? 0)],
    ["Average / best score", p.avgScore != null ? `${p.avgScore}% / ${p.bestScore != null ? Math.round(Number(p.bestScore)) : "—"}%` : "—"],
    ["Challenges played", String(p.challenges ?? 0)],
    ["Help tickets", String(p.tickets ?? 0)],
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: "6px 16px", background: C.card, borderRadius: 14, padding: "12px 14px" }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ fontSize: 12.5, lineHeight: 1.45, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{k}</div>
          <div style={{ wordBreak: "break-word" }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

// ---- A fake player (new, or editing one) --------------------------------------------

function FakeEditor({ p, onSaved }: { p?: AdminPlayer; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(p?.name ?? "");
  const [xp, setXp] = useState(String(p?.xp ?? 0));
  const [xpMonth, setXpMonth] = useState(String(p?.xpMonth ?? 0));
  const [wins, setWins] = useState(String(p?.wins ?? 0));
  const [papers, setPapers] = useState(String(p?.papers ?? 0));
  const [streak, setStreak] = useState(String(p?.streak ?? 0));
  const [active, setActive] = useState(p ? !p.removed : true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async () => {
    setMsg(null);
    const input: FakePlayerInput = {
      name: name.trim(),
      xp: toInt(xp) ?? -1,
      xpMonth: toInt(xpMonth) ?? -1,
      wins: toInt(wins) ?? -1,
      papers: toInt(papers) ?? -1,
      streak: toInt(streak) ?? -1,
    };
    if (!input.name) return setMsg({ ok: false, text: "Give them a name." });
    if ([input.xp, input.xpMonth, input.wins, input.papers, input.streak].some((n) => n < 0)) return setMsg({ ok: false, text: "Use whole numbers (0 or more)." });
    if (input.xpMonth > input.xp) return setMsg({ ok: false, text: "This month's XP can't be more than their all-time XP." });
    setBusy(true);
    let error: string | null = null;
    if (p) {
      const res = await updateFakePlayer(p.id, input, active);
      if (res !== "ok") error = res;
    } else {
      const res = await createFakePlayer(input);
      if ("error" in res) error = res.error;
    }
    setBusy(false);
    if (error) {
      setMsg({
        ok: false,
        text:
          error === "bad_name" ? "Names are 1-30 characters." : error === "bad_value" ? "One of the numbers is too big." : error === "limit" ? "That's 200 fake players — turn some off first." : "Couldn't save — try again.",
      });
      return;
    }
    setMsg({ ok: true, text: p ? "Saved." : "Fake player made." });
    await onSaved();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, background: p ? C.bg : C.card, border: p ? "none" : `1.5px solid ${C.accent}`, borderRadius: 16, padding: "14px 14px", marginTop: p ? 12 : 0 }}>
      {!p && <div style={{ fontWeight: 700, fontSize: 15 }}>New fake player</div>}
      <Section title={`Name (the board shows the first ${LEADERBOARD_NAME_CHARS} characters)`}>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="e.g. Hamza Ali" aria-label="Fake player name" style={{ ...field, flex: "1 1 200px" }} />
        {p && (
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Show on leaderboard
          </label>
        )}
      </Section>
      <Section title="Numbers">
        <Num label="XP (all time)" value={xp} onChange={setXp} />
        <Num label="XP this month" value={xpMonth} onChange={setXpMonth} />
        <Num label="Wins" value={wins} onChange={setWins} />
        <Num label="Papers" value={papers} onChange={setPapers} />
        <Num label="Streak" value={streak} onChange={setStreak} />
      </Section>
      <div style={{ fontSize: 12, color: "#9a8d78" }}>
        “XP this month” shows on the Monthly board until the month ends — then it&apos;s 0 until you set it again.
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={save} disabled={busy} style={{ ...primary, opacity: busy ? 0.7 : 1 }}>
          {busy ? "Saving…" : p ? "Save" : "Make fake player"}
        </button>
        {msg && <div style={{ fontSize: 12.5, fontWeight: 700, color: msg.ok ? C.sageD : C.accentD }}>{msg.text}</div>}
      </div>
    </div>
  );
}

// ---- Small pieces ---------------------------------------------------------------------

const field: React.CSSProperties = { borderRadius: 10, border: "1.5px solid #e0d0b4", background: "#fff", padding: "8px 12px", fontSize: 13.5, fontFamily: "inherit" };
const primary: React.CSSProperties = { borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "8px 16px", fontSize: 13 };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{title}</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>{children}</div>
    </div>
  );
}

function Num({ label, value, onChange, hint, disabled }: { label: string; value: string; onChange: (v: string) => void; hint?: string; disabled?: boolean }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11.5, fontWeight: 700, color: C.muted }}>
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        inputMode="numeric"
        maxLength={7}
        disabled={disabled}
        style={{ ...field, width: 110, opacity: disabled ? 0.6 : 1 }}
      />
      {hint && <span style={{ fontWeight: 500, color: "#9a8d78" }}>{hint}</span>}
    </label>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: "accent" | "sage" }) {
  const style = tone === "accent" ? { background: C.tint, color: C.accentD } : tone === "sage" ? { background: C.sageT, color: C.sageD } : { background: C.sand, color: "#6d6250" };
  return <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 9px", ...style }}>{children}</span>;
}

// A whole number from 0 up, or null if the box isn't one.
function toInt(v: string): number | null {
  if (!/^\d+$/.test(v.trim())) return null;
  const n = Number(v);
  return Number.isSafeInteger(n) ? n : null;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
