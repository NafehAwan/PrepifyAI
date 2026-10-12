"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import {
  getTicket,
  replyToTicket,
  setTicketStatus,
  TICKET_CATEGORIES,
  type TicketStatus,
  type TicketThread,
} from "@/lib/support";
import { StatusPill } from "./Support";

const POLL_MS = 20_000;

// One ticket's conversation — the same screen for the student who opened it
// and for an admin answering it. Admins also see who sent it (name, email)
// and the page/device it came from, and can set its status.
export function SupportTicket() {
  const { s, patch, go } = useApp();
  const number = s.activeTicketNumber;
  const [thread, setThread] = useState<TicketThread | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  const load = useCallback(async () => {
    if (!number) return;
    const t = await getTicket(number);
    if (t === "error") {
      setState((prev) => (prev === "ready" ? prev : "error"));
      return;
    }
    if (!t) {
      setState("missing");
      return;
    }
    setThread(t);
    setState("ready");
  }, [number]);

  useEffect(() => {
    setState("loading");
    setThread(null);
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  // Scroll to the newest message when one arrives.
  useEffect(() => {
    const n = thread?.messages.length ?? 0;
    if (n > lastCount.current) endRef.current?.scrollIntoView({ block: "end" });
    lastCount.current = n;
  }, [thread?.messages.length]);

  const asAdmin = !!thread && thread.viewerIsAdmin && !thread.isMine;
  const back = () => {
    patch({ activeTicketNumber: null });
    go(asAdmin || (s.isAdmin && !thread) ? "admin" : "support");
  };

  const send = async () => {
    if (!number || !draft.trim()) return;
    setSending(true);
    setNotice(null);
    const res = await replyToTicket(number, draft.trim());
    setSending(false);
    if (res === "ok") {
      setDraft("");
      await load();
    } else if (res === "closed") setNotice("This ticket is closed. Open a new one if you need more help.");
    else if (res === "limit") setNotice("You've sent a lot of messages — please wait a bit.");
    else setNotice("Couldn't send — check your connection and try again.");
  };

  const changeStatus = async (status: TicketStatus) => {
    if (!number) return;
    if (status === "closed" && !asAdmin && !window.confirm("Close this ticket? You can open a new one any time.")) return;
    const ok = await setTicketStatus(number, status);
    if (ok) await load();
    else setNotice("Couldn't update the ticket — try again.");
  };

  const backLabel = asAdmin ? "← Admin" : "← Help & Feedback";

  if (!number || state === "missing") {
    return (
      <Frame backLabel={backLabel} onBack={back} title="Ticket">
        <Panel>That ticket doesn&apos;t exist, or it isn&apos;t yours.</Panel>
      </Frame>
    );
  }
  if (state === "loading" || !thread) {
    return (
      <Frame backLabel={backLabel} onBack={back} title={`Ticket #${number}`}>
        <div style={{ color: state === "error" ? C.accentD : C.muted, fontSize: 14 }}>
          {state === "error" ? "Couldn't load this ticket. Check your connection — retrying…" : "Loading…"}
        </div>
      </Frame>
    );
  }

  const cat = TICKET_CATEGORIES.find((c) => c.id === thread.category);
  const canReply = thread.status !== "closed" || asAdmin;

  return (
    <Frame backLabel={backLabel} onBack={back} title={`#${thread.number} · ${thread.title}`}>
      <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.muted }}>{cat?.label ?? thread.category}</span>
          <StatusPill status={thread.status} />
          <span style={{ fontSize: 12, color: "#9a8d78" }}>
            opened {new Date(thread.createdAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
          </span>
        </div>

        {asAdmin && thread.student && (
          <div style={{ background: C.sageT, borderRadius: 18, padding: "12px 16px", fontSize: 13, color: C.sageD, lineHeight: 1.6 }}>
            <div>
              <strong>From:</strong> {thread.student.name}
              {thread.student.email ? ` · ${thread.student.email}` : ""}
            </div>
            {thread.context && (
              <div style={{ wordBreak: "break-word" }}>
                <strong>Sent from:</strong> {String(thread.context.page ?? "?")}
                {thread.context.screen ? ` · screen ${String(thread.context.screen)}` : ""}
                {thread.context.userAgent ? ` · ${String(thread.context.userAgent)}` : ""}
              </div>
            )}
          </div>
        )}

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "18px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {thread.messages.map((m, i) => {
            const mine = m.isMe;
            const who = m.isAdmin ? (mine ? "You (Prepify team)" : "Prepify team") : mine ? "You" : thread.student?.name ?? "Student";
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: m.isAdmin ? C.sageD : C.muted, marginBottom: 3 }}>
                  {who} · {new Date(m.createdAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                </div>
                <div
                  style={{
                    maxWidth: "85%",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: 14,
                    lineHeight: 1.5,
                    borderRadius: 16,
                    padding: "10px 14px",
                    background: mine ? C.accent : m.isAdmin ? C.sageT : C.bg,
                    color: mine ? "#fff" : C.ink,
                  }}
                >
                  {m.body}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {canReply ? (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={4000}
              rows={3}
              placeholder={asAdmin ? "Reply to the student…" : "Write a reply…"}
              aria-label="Reply"
              style={{ borderRadius: 12, border: "1.5px solid #e0d0b4", background: "#fff", padding: "10px 14px", fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={send} disabled={sending || !draft.trim()} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "10px 22px", fontSize: 14, opacity: sending || !draft.trim() ? 0.6 : 1 }}>
                {sending ? "Sending…" : "Send"}
              </button>
              <div style={{ flex: 1 }} />
              {asAdmin ? (
                <>
                  {(["open", "answered", "closed"] as TicketStatus[])
                    .filter((st) => st !== thread.status)
                    .map((st) => (
                      <button key={st} onClick={() => changeStatus(st)} style={{ borderRadius: 999, background: C.sand, color: "#5d5648", fontWeight: 700, padding: "8px 14px", fontSize: 12.5 }}>
                        Mark {st === "open" ? "open" : st === "answered" ? "replied" : "closed"}
                      </button>
                    ))}
                </>
              ) : (
                thread.status !== "closed" && (
                  <button onClick={() => changeStatus("closed")} style={{ fontSize: 13, fontWeight: 700, color: C.muted, padding: "8px 6px" }}>
                    Close ticket
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: C.sand, borderRadius: 16, padding: "12px 16px", fontSize: 13.5, color: "#5d5648" }}>
            <span style={{ flex: 1 }}>This ticket is closed. Need more help? Open a new one.</span>
            <button onClick={() => { patch({ activeTicketNumber: null }); go("support"); }} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "8px 16px", fontSize: 13 }}>
              New ticket
            </button>
          </div>
        )}

        {notice && <div style={{ fontSize: 13, fontWeight: 600, color: C.accentD, background: "#fdf1e6", borderRadius: 12, padding: "10px 14px" }}>{notice}</div>}
      </div>
    </Frame>
  );
}

function Frame({ title, backLabel, onBack, children }: { title: string; backLabel: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <button onClick={onBack} style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
          {backLabel}
        </button>
        <div style={{ fontFamily: "Caprasimo", fontSize: 26, lineHeight: 1.2, wordBreak: "break-word" }}>{title}</div>
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
