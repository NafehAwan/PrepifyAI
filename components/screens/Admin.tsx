"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C, pill } from "@/lib/theme";
import {
  getAdminOverview,
  listAdminTickets,
  listReportedQuestions,
  setReportStatus,
  updateQuestion,
  type AdminOverview,
  type ReportedQuestion,
  type ReportStatus,
  type TicketStatus,
  type TicketSummary,
} from "@/lib/support";
import { TicketRow } from "./Support";

type Tab = "overview" | "tickets" | "reports";

const REASON_LABEL: Record<string, string> = {
  wrong_answer: "Wrong answer",
  typo: "Typo",
  unclear: "Unclear",
  other: "Other",
};

// The owner's portal: site numbers, every Help & Feedback ticket, and reported
// questions with an in-place editor to fix them. Hidden from the menu for
// non-admins, and every call behind it is refused by the database for them.
export function Admin() {
  const { s } = useApp();
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);

  useEffect(() => {
    if (!s.isAdmin) return;
    let active = true;
    getAdminOverview().then((o) => active && setOverview(o));
    return () => {
      active = false;
    };
  }, [s.isAdmin, tab]);

  if (!s.isAdmin) {
    return (
      <div style={{ maxWidth: 560, background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: "22px 24px", color: C.muted, fontSize: 14 }}>
        This page is for Prepify admins only.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", background: C.sand, borderRadius: 999, padding: 4, alignSelf: "flex-start", flexWrap: "wrap" }}>
        <button onClick={() => setTab("overview")} style={pill(tab === "overview")}>Overview</button>
        <button onClick={() => setTab("tickets")} style={pill(tab === "tickets")}>
          Tickets{overview?.openTickets ? ` (${overview.openTickets})` : ""}
        </button>
        <button onClick={() => setTab("reports")} style={pill(tab === "reports")}>
          Reported questions{overview?.openReports ? ` (${overview.openReports})` : ""}
        </button>
      </div>

      {tab === "overview" && <Overview o={overview} go={setTab} />}
      {tab === "tickets" && <Tickets />}
      {tab === "reports" && <Reports />}
    </div>
  );
}

function Overview({ o, go }: { o: AdminOverview | null; go: (t: Tab) => void }) {
  if (!o) return <div style={{ color: C.muted, fontSize: 14 }}>Loading…</div>;
  const tiles: Array<[string, number, string?, Tab?]> = [
    ["Students", o.students, `+${o.newStudentsWeek} this week`],
    ["Active today", o.activeToday, `${o.activeWeek} this week`],
    ["Tests today", o.testsToday, `${o.testsWeek} this week · ${o.testsTotal} total`],
    ["Challenges this week", o.challengesWeek],
    ["Open tickets", o.openTickets, "Waiting for your reply", "tickets"],
    ["Reported questions", o.openReports, "Still to check", "reports"],
    ["Questions in the bank", o.questions],
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
      {tiles.map(([label, value, sub, tab]) => {
        const alert = tab && value > 0;
        return (
          <button
            key={label}
            onClick={() => tab && go(tab)}
            disabled={!tab}
            style={{ textAlign: "left", background: alert ? C.tint : C.card, border: `1.5px solid ${alert ? C.accent : C.line}`, borderRadius: 20, padding: "16px 18px", cursor: tab ? "pointer" : "default" }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted }}>{label}</div>
            <div style={{ fontFamily: "Caprasimo", fontSize: 32, color: alert ? C.accentD : C.ink }}>{value.toLocaleString()}</div>
            {sub && <div style={{ fontSize: 12, color: "#9a8d78" }}>{sub}</div>}
          </button>
        );
      })}
    </div>
  );
}

function Tickets() {
  const { patch, go } = useApp();
  const [status, setStatus] = useState<TicketStatus | "all">("open");
  const [tickets, setTickets] = useState<TicketSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setTickets(null);
    setFailed(false);
    const t = await listAdminTickets(status);
    if (t === null) setFailed(true);
    setTickets(t ?? []);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "18px 20px" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {(["open", "answered", "closed", "all"] as const).map((st) => (
          <button key={st} onClick={() => setStatus(st)} style={{ ...pill(status === st), border: `1.5px solid ${status === st ? C.accent : C.line}` }}>
            {st === "open" ? "Waiting for reply" : st === "answered" ? "Replied" : st === "closed" ? "Closed" : "All"}
          </button>
        ))}
      </div>
      {failed && <div style={{ fontSize: 13.5, color: C.accentD, fontWeight: 600 }}>Couldn&apos;t load tickets. <button onClick={() => void load()} style={{ fontWeight: 700, color: C.accent }}>Try again</button></div>}
      {tickets === null ? (
        <div style={{ color: C.muted, fontSize: 14 }}>Loading…</div>
      ) : tickets.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 14 }}>{status === "open" ? "No tickets waiting — all caught up. 🎉" : "Nothing here."}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tickets.map((t) => (
            <TicketRow
              key={t.number}
              t={t}
              showStudent
              onOpen={() => {
                patch({ activeTicketNumber: t.number });
                go("supportTicket");
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Reports() {
  const [status, setStatus] = useState<ReportStatus | "all">("open");
  const [items, setItems] = useState<ReportedQuestion[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setItems(null);
    setFailed(false);
    const r = await listReportedQuestions(status);
    if (r === null) setFailed(true);
    setItems(r ?? []);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["open", "fixed", "dismissed", "all"] as const).map((st) => (
          <button key={st} onClick={() => setStatus(st)} style={{ ...pill(status === st), border: `1.5px solid ${status === st ? C.accent : C.line}`, textTransform: "capitalize" }}>
            {st === "open" ? "To check" : st}
          </button>
        ))}
      </div>
      {failed && <div style={{ fontSize: 13.5, color: C.accentD, fontWeight: 600 }}>Couldn&apos;t load reports. <button onClick={() => void load()} style={{ fontWeight: 700, color: C.accent }}>Try again</button></div>}
      {items === null ? (
        <div style={{ color: C.muted, fontSize: 14 }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: "18px 20px", color: C.muted, fontSize: 14 }}>
          {status === "open" ? "No reported questions to check. 🎉" : "Nothing here."}
        </div>
      ) : (
        items.map((q) => <ReportCard key={q.questionId} q={q} onChanged={load} />)
      )}
    </div>
  );
}

function ReportCard({ q, onChanged }: { q: ReportedQuestion; onChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const keyIndex = "ABCD".indexOf(q.answerKey ?? "");

  const mark = async (status: ReportStatus) => {
    setBusy(true);
    const ok = await setReportStatus(q.questionId, status);
    setBusy(false);
    if (ok) await onChanged();
    else setMsg("Couldn't update — try again.");
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", background: C.accent, borderRadius: 999, padding: "3px 10px" }}>
          {q.reports} report{q.reports === 1 ? "" : "s"}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>
          {q.subject ?? "Unknown subject"}
          {q.chapter ? ` · Chapter ${q.chapter}` : ""}
        </span>
        <span style={{ fontSize: 12, color: "#9a8d78" }}>last {new Date(q.lastReported).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
      </div>

      {editing && q.editable ? (
        <QuestionEditor
          q={q}
          onCancel={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await onChanged();
          }}
        />
      ) : (
        <>
          <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.45, marginBottom: 8 }}>{q.stem ?? "(This question isn't in the bank — it may have been AI-generated.)"}</div>
          {q.options && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 6, marginBottom: 8 }}>
              {q.options.map((o, i) => (
                <div key={i} style={{ fontSize: 13.5, borderRadius: 10, padding: "7px 10px", background: i === keyIndex ? C.sageT : C.bg, color: i === keyIndex ? C.sageD : C.ink, fontWeight: i === keyIndex ? 700 : 500 }}>
                  {"ABCD"[i]}. {o} {i === keyIndex ? "✓ (current key)" : ""}
                </div>
              ))}
            </div>
          )}
          {q.explanation && <div style={{ fontSize: 12.5, color: "#7a6f5d", marginBottom: 8 }}>Explanation: {q.explanation}</div>}
        </>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "10px 0" }}>
        {q.details.map((d, i) => {
          const saw = d.shown?.options;
          return (
            <div key={i} style={{ fontSize: 12.5, background: C.bg, borderRadius: 12, padding: "8px 12px", lineHeight: 1.5 }}>
              <strong>{REASON_LABEL[d.reason] ?? d.reason}</strong> · {d.by} · {d.source ?? ""}{" "}
              {new Date(d.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              {d.note && <div style={{ color: C.ink }}>“{d.note}”</div>}
              {saw && typeof d.shown?.markedAnswer === "number" && (
                <div style={{ color: "#9a8d78" }}>
                  They saw “{saw[d.shown.markedAnswer]}” marked correct
                  {typeof d.shown.picked === "number" ? ` and picked “${saw[d.shown.picked]}”` : " and left it blank"}.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {msg && <div style={{ fontSize: 12.5, color: C.accentD, fontWeight: 700, marginBottom: 8 }}>{msg}</div>}
      {!editing && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {q.editable && (
            <button onClick={() => setEditing(true)} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "8px 16px", fontSize: 13 }}>
              ✏️ Fix question
            </button>
          )}
          <button disabled={busy} onClick={() => mark("fixed")} style={{ borderRadius: 999, background: C.sageT, color: C.sageD, fontWeight: 700, padding: "8px 14px", fontSize: 13 }}>
            Mark fixed
          </button>
          <button disabled={busy} onClick={() => mark("dismissed")} style={{ borderRadius: 999, background: C.sand, color: "#5d5648", fontWeight: 700, padding: "8px 14px", fontSize: 13 }}>
            Dismiss (question is fine)
          </button>
          <button disabled={busy} onClick={() => mark("open")} style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, padding: "8px 6px" }}>
            Reopen
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionEditor({ q, onCancel, onSaved }: { q: ReportedQuestion; onCancel: () => void; onSaved: () => Promise<void> }) {
  const [stem, setStem] = useState(q.stem ?? "");
  const [options, setOptions] = useState<string[]>(q.options && q.options.length === 4 ? [...q.options] : ["", "", "", ""]);
  const [answer, setAnswer] = useState<"A" | "B" | "C" | "D">((["A", "B", "C", "D"].includes(q.answerKey ?? "") ? q.answerKey : "A") as "A" | "B" | "C" | "D");
  const [explanation, setExplanation] = useState(q.explanation ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await updateQuestion({ questionId: q.questionId, stem, options, answerKey: answer, explanation });
    setSaving(false);
    if (res === "ok") await onSaved();
    else
      setError(
        res === "bad_options" ? "All four options need text." : res === "bad_stem" ? "The question needs some text." : res === "not_found" ? "This question no longer exists." : "Couldn't save — try again.",
      );
  };

  const field: React.CSSProperties = { borderRadius: 10, border: "1.5px solid #e0d0b4", background: "#fff", padding: "8px 12px", fontSize: 13.5, fontFamily: "inherit", width: "100%" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, background: C.bg, borderRadius: 16, padding: "14px 14px", marginBottom: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>Question</label>
      <textarea value={stem} onChange={(e) => setStem(e.target.value)} rows={3} style={{ ...field, resize: "vertical" }} />
      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>Options — tap the letter of the correct one</div>
      {options.map((o, i) => {
        const letter = "ABCD"[i] as "A" | "B" | "C" | "D";
        const on = answer === letter;
        return (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setAnswer(letter)}
              aria-label={`Mark ${letter} correct`}
              style={{ width: 32, height: 32, flex: "none", borderRadius: 999, fontWeight: 800, fontSize: 13, background: on ? C.sage : C.sand, color: on ? "#fff" : "#5d5648" }}
            >
              {on ? "✓" : letter}
            </button>
            <input value={o} onChange={(e) => setOptions((cur) => cur.map((v, k) => (k === i ? e.target.value : v)))} style={field} />
          </div>
        );
      })}
      <label style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>Explanation (optional, shown in reviews)</label>
      <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} style={{ ...field, resize: "vertical" }} />
      <div style={{ fontSize: 12, color: "#9a8d78" }}>
        Saving changes this question for every future test, and marks its reports fixed. Correct answer: <strong>{answer}</strong>.
      </div>
      {error && <div style={{ fontSize: 12.5, color: C.accentD, fontWeight: 700 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={save} disabled={saving} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "9px 18px", fontSize: 13.5, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : "Save fix"}
        </button>
        <button onClick={onCancel} style={{ fontSize: 13, fontWeight: 700, color: C.muted, padding: "9px 6px" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
