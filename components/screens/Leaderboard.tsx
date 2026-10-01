"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C, pill } from "@/lib/theme";
import { getLeaderboard, type Leaderboard as Board } from "@/lib/engagement";
import { ordinal } from "@/lib/challenges";

// The global leaderboard: XP this week (from Monday, Pakistan time) or all
// time, everyone's streak, and the student's own position even when they're
// outside the top 50 or have hidden themselves.
export function Leaderboard() {
  const { s, go } = useApp();
  const [period, setPeriod] = useState<"week" | "all">("week");
  const [board, setBoard] = useState<Board | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState("loading");
    getLeaderboard(period).then((b) => {
      if (!active) return;
      setBoard(b);
      setState(b ? "ready" : "error");
    });
    return () => {
      active = false;
    };
  }, [period, attempt]);

  if (!s.authed) {
    return (
      <Card>
        <div style={{ fontSize: 14, color: C.muted }}>Sign in to see the leaderboard and your streak.</div>
      </Card>
    );
  }

  const me = board?.me;
  const meInTop = board?.rows.some((r) => r.isMe);

  return (
    <div style={{ maxWidth: 820, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", background: C.sand, borderRadius: 999, padding: 4 }}>
          <button onClick={() => setPeriod("week")} style={pill(period === "week")}>This week</button>
          <button onClick={() => setPeriod("all")} style={pill(period === "all")}>All time</button>
        </div>
        <div style={{ fontSize: 12.5, color: C.muted }}>
          {period === "week" ? "Resets every Monday (Pakistan time)." : "Every test and challenge since you joined."}
        </div>
      </div>

      {me && (
        <div style={{ background: C.tint, borderRadius: 24, padding: "20px 22px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <Big label="Your rank" value={me.rank ? ordinal(me.rank) : "—"} />
          <Big label={period === "week" ? "XP this week" : "XP all time"} value={String(me.xp)} />
          <Big label="Streak" value={`🔥 ${me.streak} day${me.streak === 1 ? "" : "s"}`} />
          <Big label="Challenge wins" value={String(me.wins)} />
          <div style={{ flex: "1 1 200px", fontSize: 12.5, color: "#5d5648", lineHeight: 1.5 }}>
            {me.hidden ? (
              <>You&apos;re hidden from the public list. <button onClick={() => go("settings")} style={{ fontWeight: 700, color: C.accentD, fontSize: 12.5 }}>Change in Settings</button></>
            ) : me.xp === 0 ? (
              "Finish a test or challenge to get on the board."
            ) : (
              <>Shown to others as <strong>{me.name}</strong>.</>
            )}
          </div>
        </div>
      )}

      <Card>
        {state === "loading" && <div style={{ fontSize: 14, color: C.muted }}>Loading the leaderboard…</div>}
        {state === "error" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 13.5, fontWeight: 600, color: C.accentD }}>
            <span style={{ flex: 1 }}>Couldn&apos;t load the leaderboard. Check your connection.</span>
            <button onClick={() => setAttempt((n) => n + 1)} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "8px 16px", fontSize: 13 }}>
              Try again
            </button>
          </div>
        )}
        {state === "ready" && board && board.rows.length === 0 && (
          <div style={{ fontSize: 14, color: C.muted }}>
            Nobody has scored {period === "week" ? "this week" : "yet"} — finish a test and you&apos;re first!
          </div>
        )}
        {state === "ready" && board && board.rows.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 420 }}>
              <thead>
                <tr style={{ color: C.muted, textAlign: "left" }}>
                  {["#", "Student", "XP", "Streak", "Wins", "Papers"].map((h) => (
                    <th key={h} style={{ padding: "6px 8px", fontWeight: 700, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {board.rows.map((r, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.line}`, background: r.isMe ? C.tint : "transparent" }}>
                    <td style={{ padding: "10px 8px", fontFamily: "Caprasimo", fontSize: 17, color: r.rank <= 3 ? C.accent : C.muted }}>
                      {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : r.rank}
                    </td>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>
                      {r.name}
                      {r.isMe ? " (you)" : ""}
                    </td>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>{r.xp}</td>
                    <td style={{ padding: "10px 8px" }}>{r.streak > 0 ? `🔥 ${r.streak}` : "—"}</td>
                    <td style={{ padding: "10px 8px" }}>{r.wins}</td>
                    <td style={{ padding: "10px 8px", color: C.muted }}>{r.papers}</td>
                  </tr>
                ))}
                {me && !meInTop && !me.hidden && me.rank && (
                  <tr style={{ borderTop: `2px dashed ${C.line}`, background: C.tint }}>
                    <td style={{ padding: "10px 8px", fontFamily: "Caprasimo", fontSize: 17, color: C.muted }}>{me.rank}</td>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>{me.name} (you)</td>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>{me.xp}</td>
                    <td style={{ padding: "10px 8px" }}>{me.streak > 0 ? `🔥 ${me.streak}` : "—"}</td>
                    <td style={{ padding: "10px 8px" }}>{me.wins}</td>
                    <td style={{ padding: "10px 8px", color: C.muted }}>{me.papers}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>How XP works</div>
        <div style={{ fontSize: 13, color: "#5d5648", lineHeight: 1.7 }}>
          Every correct answer earns XP: <strong>1</strong> on Easy, <strong>2</strong> on Medium or Mixed, <strong>3</strong> on Hard.
          Winning a challenge adds <strong>+10</strong>. Your <strong>streak</strong> counts the days in a row you&apos;ve finished at
          least one test or challenge — do one today to keep it going.
        </div>
      </Card>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "20px 22px" }}>{children}</div>;
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 96 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{label}</div>
      <div style={{ fontFamily: "Caprasimo", fontSize: 24, color: C.ink }}>{value}</div>
    </div>
  );
}
