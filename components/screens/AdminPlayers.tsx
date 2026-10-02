"use client";

import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/theme";
import {
  listAdminPlayers,
  resetAdminPlayerScores,
  setAdminPlayerXp,
  updateAdminPlayer,
  type AdminPlayer,
} from "@/lib/support";

const LEADERBOARD_NAME_CHARS = 10; // the leaderboard shows this many

// Admin → Players: every student with their XP, and per player: the name the
// leaderboard shows, whether they're on it at all, their all-time XP, and a
// score reset. For alts and anyone gaming the board. Nothing is deleted — a
// reset or removal can always be undone.
export function AdminPlayers() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<AdminPlayer[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        maxLength={100}
        placeholder="Search by username, name or email…"
        aria-label="Search players"
        style={{ borderRadius: 999, border: "1.5px solid #e0d0b4", background: "#fff", padding: "11px 18px", fontSize: 14, maxWidth: 420 }}
      />
      <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>
        Rename a player, take them off the leaderboard, set their XP or reset their scores. Their tests stay saved — every change
        here can be undone.
      </div>
      {failed && (
        <div style={{ fontSize: 13.5, color: C.accentD, fontWeight: 600 }}>
          Couldn&apos;t load players. <button onClick={() => void load()} style={{ fontWeight: 700, color: C.accent }}>Try again</button>
        </div>
      )}
      {players === null ? (
        <div style={{ color: C.muted, fontSize: 14 }}>Loading…</div>
      ) : players.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: "18px 20px", color: C.muted, fontSize: 14 }}>
          {search ? `No players match “${search}”.` : "No players yet."}
        </div>
      ) : (
        players.map((p) => (
          <PlayerCard
            key={p.id}
            p={p}
            open={openId === p.id}
            onToggle={() => setOpenId((cur) => (cur === p.id ? null : p.id))}
            onChanged={load}
          />
        ))
      )}
    </div>
  );
}

function PlayerCard({ p, open, onToggle, onChanged }: { p: AdminPlayer; open: boolean; onToggle: () => void; onChanged: () => Promise<void> }) {
  const shown = p.name.slice(0, LEADERBOARD_NAME_CHARS);
  return (
    <div style={{ background: C.card, border: `1.5px solid ${open ? C.accent : C.line}`, borderRadius: 20, padding: "14px 16px" }}>
      <button onClick={onToggle} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {shown}
            {p.name.length > LEADERBOARD_NAME_CHARS && <span style={{ color: "#b0a793" }}>{p.name.slice(LEADERBOARD_NAME_CHARS)}</span>}
            {p.username && p.username !== p.name && <span style={{ fontWeight: 500, color: C.muted }}> · @{p.username}</span>}
          </div>
          <div style={{ fontSize: 12, color: "#9a8d78", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.email ?? "no email"} · joined {new Date(p.joined).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            {p.lastActive ? ` · last test ${new Date(p.lastActive).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {p.isMe && <Tag tone="sage">You</Tag>}
          {p.isAdmin && !p.isMe && <Tag tone="sage">Admin</Tag>}
          {p.removed && <Tag tone="accent">Off leaderboard</Tag>}
          {p.hidden && !p.removed && <Tag>Hidden by student</Tag>}
          {p.resetAt && <Tag tone="accent">Scores reset</Tag>}
          {p.customName && <Tag>Renamed</Tag>}
        </div>
        <div style={{ textAlign: "right", minWidth: 120 }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 20 }}>{p.xp.toLocaleString()} XP</div>
          <div style={{ fontSize: 11.5, color: C.muted }}>
            {p.xpMonth.toLocaleString()} this month · {p.papers} paper{p.papers === 1 ? "" : "s"}
          </div>
        </div>
      </button>
      {open && <PlayerEditor p={p} onChanged={onChanged} />}
    </div>
  );
}

function PlayerEditor({ p, onChanged }: { p: AdminPlayer; onChanged: () => Promise<void> }) {
  const [name, setName] = useState(p.customName ?? "");
  const [onBoard, setOnBoard] = useState(!p.removed);
  const [xp, setXp] = useState(String(p.xp));
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
      return res === "ok"
        ? { ok: true, text: "Saved." }
        : { ok: false, text: res === "bad_name" ? "Names can be up to 30 characters." : "Couldn't save — try again." };
    });

  const saveXp = () =>
    run("xp", async () => {
      const n = Number(xp);
      if (!Number.isInteger(n) || n < 0 || n > 1_000_000) return { ok: false, text: "XP must be a whole number from 0 to 1,000,000." };
      const res = await setAdminPlayerXp(p.id, n);
      return res === "ok" ? { ok: true, text: `XP set to ${n.toLocaleString()}.` } : { ok: false, text: "Couldn't change XP — try again." };
    });

  const reset = (on: boolean) => {
    if (on && !window.confirm(`Reset ${p.name}'s scores to 0? Their tests stay saved, they just stop counting. You can undo this.`)) return;
    void run("reset", async () =>
      (await resetAdminPlayerScores(p.id, on))
        ? { ok: true, text: on ? "Scores reset to 0." : "Reset undone — their old scores count again." }
        : { ok: false, text: "Couldn't update — try again." },
    );
  };

  const field: React.CSSProperties = { borderRadius: 10, border: "1.5px solid #e0d0b4", background: "#fff", padding: "8px 12px", fontSize: 13.5, fontFamily: "inherit" };
  const primary: React.CSSProperties = { borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "8px 16px", fontSize: 13 };
  const ownName = p.username ?? "their own name";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, background: C.bg, borderRadius: 16, padding: "14px 14px", marginTop: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: C.muted }} htmlFor={`name-${p.id}`}>
          Leaderboard name (empty = {ownName}; the board shows the first {LEADERBOARD_NAME_CHARS} characters)
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input id={`name-${p.id}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder={ownName} style={{ ...field, flex: "1 1 200px" }} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
            <input type="checkbox" checked={onBoard} onChange={(e) => setOnBoard(e.target.checked)} />
            Show on leaderboard
          </label>
          <button onClick={saveName} disabled={busy !== null} style={{ ...primary, opacity: busy === "name" ? 0.7 : 1 }}>
            {busy === "name" ? "Saving…" : "Save"}
          </button>
        </div>
        {name.trim().length > LEADERBOARD_NAME_CHARS && (
          <div style={{ fontSize: 12, color: "#9a8d78" }}>Shows as “{name.trim().slice(0, LEADERBOARD_NAME_CHARS)}”.</div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: C.muted }} htmlFor={`xp-${p.id}`}>
          All-time XP (now {p.xp.toLocaleString()}) — the change is dated today, so it counts towards this month too
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input id={`xp-${p.id}`} value={xp} onChange={(e) => setXp(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" maxLength={7} style={{ ...field, width: 140 }} />
          <button onClick={saveXp} disabled={busy !== null} style={{ ...primary, opacity: busy === "xp" ? 0.7 : 1 }}>
            {busy === "xp" ? "Saving…" : "Set XP"}
          </button>
          {p.resetAt ? (
            <button onClick={() => reset(false)} disabled={busy !== null} style={{ borderRadius: 999, background: C.sand, color: "#5d5648", fontWeight: 700, padding: "8px 14px", fontSize: 13 }}>
              Undo score reset
            </button>
          ) : (
            <button onClick={() => reset(true)} disabled={busy !== null} style={{ borderRadius: 999, background: "#fdf1e6", color: C.accentD, fontWeight: 700, padding: "8px 14px", fontSize: 13 }}>
              Reset scores to 0
            </button>
          )}
        </div>
        {p.resetAt && (
          <div style={{ fontSize: 12, color: "#9a8d78" }}>
            Scores before {new Date(p.resetAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} don&apos;t count.
          </div>
        )}
      </div>

      {msg && <div style={{ fontSize: 12.5, fontWeight: 700, color: msg.ok ? C.sageD : C.accentD }}>{msg.text}</div>}
    </div>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: "accent" | "sage" }) {
  const style = tone === "accent" ? { background: C.tint, color: C.accentD } : tone === "sage" ? { background: C.sageT, color: C.sageD } : { background: C.sand, color: "#6d6250" };
  return <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 9px", ...style }}>{children}</span>;
}
