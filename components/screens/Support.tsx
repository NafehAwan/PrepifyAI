"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import {
  createTicket,
  listMyTickets,
  STATUS_LABEL,
  TICKET_CATEGORIES,
  type TicketCategory,
  type TicketSummary,
} from "@/lib/support";

// Help & Feedback: the student's tickets (bugs, suggestions, questions) and a
// form to open a new one. Replies from the Prepify team appear in the ticket.
export function Support() {
  const { s, patch, go } = useApp();
  const [tickets, setTickets] = useState<TicketSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    const list = await listMyTickets();
    if (list === null) setFailed(true);
    setTickets(list ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const open = (n: number) => {
    patch({ activeTicketNumber: n });
    go("supportTicket");
  };

  if (!s.authed) {
    return <Panel>Sign in to send feedback or report a problem.</Panel>;
  }

  const showForm = formOpen || (tickets !== null && tickets.length === 0);

  return (
    <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
        Found a bug, have an idea, or stuck on something? Open a ticket — the Prepify team replies right here, and
        you&apos;ll see a <strong style={{ color: C.accentD }}>New reply</strong> badge when they do.
      </div>

      {showForm ? (
        <NewTicketForm
          onCancel={tickets && tickets.length > 0 ? () => setFormOpen(false) : undefined}
          onCreated={(n) => {
            setFormOpen(false);
            open(n);
          }}
        />
      ) : (
        <button
          onClick={() => setFormOpen(true)}
          style={{ alignSelf: "flex-start", borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "13px 26px", fontSize: 15 }}
        >
          + New ticket
        </button>
      )}

      {failed && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13.5, fontWeight: 600, color: C.accentD, background: "#fdf1e6", borderRadius: 16, padding: "12px 16px" }}>
          <span style={{ flex: 1 }}>Couldn&apos;t load your tickets. Check your connection.</span>
          <button onClick={() => void load()} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "8px 16px", fontSize: 13 }}>
            Try again
          </button>
        </div>
      )}

      {tickets === null ? (
        <div style={{ color: C.muted, fontSize: 14 }}>Loading your tickets…</div>
      ) : tickets.length > 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "18px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Your tickets</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tickets.map((t) => (
              <TicketRow key={t.number} t={t} onOpen={() => open(t.number)} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TicketRow({ t, onOpen, showStudent }: { t: TicketSummary; onOpen: () => void; showStudent?: boolean }) {
  const cat = TICKET_CATEGORIES.find((c) => c.id === t.category);
  return (
    <button
      onClick={onOpen}
      style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, background: t.unread ? C.tint : C.bg, border: `1.5px solid ${t.unread ? C.accent : "transparent"}`, borderRadius: 16, padding: "12px 14px" }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <span style={{ color: C.muted }}>#{t.number}</span> {t.title}
        </div>
        <div style={{ fontSize: 12, color: "#9a8d78", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cat?.label ?? t.category}
          {showStudent && t.student ? ` · ${t.student}` : ""} · {t.messages} message{t.messages === 1 ? "" : "s"} ·{" "}
          {new Date(t.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
          {t.preview ? ` · “${t.preview}”` : ""}
        </div>
      </div>
      {t.unread && <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: C.accent, borderRadius: 999, padding: "3px 9px", flex: "none" }}>{showStudent ? "New message" : "New reply"}</span>}
      <StatusPill status={t.status} />
    </button>
  );
}

export function StatusPill({ status }: { status: TicketSummary["status"] }) {
  const style =
    status === "answered"
      ? { background: C.sageT, color: C.sageD }
      : status === "closed"
        ? { background: C.sand, color: C.muted }
        : { background: C.tint, color: C.accentD };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 10px", flex: "none", ...style }}>{STATUS_LABEL[status]}</span>
  );
}

function NewTicketForm({ onCreated, onCancel }: { onCreated: (n: number) => void; onCancel?: () => void }) {
  const [category, setCategory] = useState<TicketCategory>("bug");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setError(null);
    if (title.trim().length < 3) return setError("Give it a short title (3+ characters).");
    if (!body.trim()) return setError("Write a message first.");
    setSending(true);
    const res = await createTicket(category, title.trim(), body.trim());
    setSending(false);
    if ("error" in res) setError(res.error);
    else onCreated(res.number);
  };

  const hint = TICKET_CATEGORIES.find((c) => c.id === category)?.hint;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 15 }}>New ticket</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {TICKET_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            style={{ borderRadius: 999, padding: "8px 14px", fontSize: 13.5, fontWeight: 700, background: category === c.id ? C.accent : C.bg, color: category === c.id ? "#fff" : "#5d5648", border: `1.5px solid ${category === c.id ? C.accent : C.line}` }}
          >
            {c.label}
          </button>
        ))}
      </div>
      {hint && <div style={{ fontSize: 12.5, color: C.muted, marginTop: -4 }}>{hint}</div>}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        placeholder={category === "bug" ? "e.g. Chapters don't load on my phone" : category === "suggestion" ? "e.g. Add a dark mode" : "A short title"}
        aria-label="Title"
        style={{ borderRadius: 12, border: "1.5px solid #e0d0b4", background: "#fff", padding: "11px 14px", fontSize: 14.5 }}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={4000}
        rows={5}
        placeholder={category === "bug" ? "What happened, and what did you expect? Which subject or screen?" : "Tell us more…"}
        aria-label="Message"
        style={{ borderRadius: 12, border: "1.5px solid #e0d0b4", background: "#fff", padding: "11px 14px", fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
      />
      {category === "bug" && (
        <div style={{ fontSize: 12, color: "#9a8d78" }}>The page you&apos;re on and your device type are attached automatically, to help us find the bug.</div>
      )}
      {error && <div style={{ fontSize: 13, fontWeight: 600, color: C.accentD, background: "#fdf1e6", borderRadius: 12, padding: "10px 14px" }}>{error}</div>}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={send} disabled={sending} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "12px 24px", fontSize: 14.5, opacity: sending ? 0.7 : 1 }}>
          {sending ? "Sending…" : "Send ticket"}
        </button>
        {onCancel && (
          <button onClick={onCancel} style={{ fontSize: 13.5, fontWeight: 700, color: C.muted, padding: "12px 8px" }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 560, background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: "22px 24px", color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}
