"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { groqAuthHeaders } from "@/lib/ai/key";
import type { ChatMsg } from "@/lib/types";

// Floating "Ask Prepify" helper, available on every dashboard screen. A general
// study buddy (not topic-grounded) so a student can ask anything and learn.
export function ChatWidget() {
  const { s, go } = useApp();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    const history: ChatMsg[] = [...msgs, ["me", t]];
    setMsgs([...history, ["ai", "…"]]);
    setDraft("");
    setBusy(true);
    let reply = "";
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...groqAuthHeaders(s.groqKey) },
        body: JSON.stringify({ messages: history.map(([role, text]) => ({ role, text })) }),
      });
      if (res.status === 503) reply = "Connect your free AI key in Settings → Connect your AI, then I can help you learn anything.";
      else if (res.ok) reply = ((await res.json()) as { reply?: string }).reply ?? "Sorry, I couldn't answer that — try again.";
      else {
        const err = ((await res.json().catch(() => ({}))) as { error?: string }).error;
        reply = err ? `Couldn't answer: ${err}` : "Something went wrong. Please try again in a moment.";
      }
    } catch {
      reply = "I couldn't reach the AI service. Check your connection and try again.";
    }
    setMsgs((prev) => {
      const next = prev.slice();
      if (next.length) next[next.length - 1] = ["ai", reply];
      return next;
    });
    setBusy(false);
  };

  const chips = ["Explain photosynthesis simply", "How do I study for the board?", "Give me an example of Newton's first law"];

  return (
    <>
      {/* launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Ask Prepify"
        style={{
          position: "fixed", right: 22, bottom: 22, zIndex: 60, width: 58, height: 58, borderRadius: 999,
          background: C.accent, color: "#fff", boxShadow: "0 10px 26px rgba(198,113,57,.4)",
          display: "flex", alignItems: "center", justifyContent: "center", animation: "pf-bounce-in .4s ease",
        }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" /></svg>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "fixed", right: 22, bottom: 92, zIndex: 60, width: "min(380px, calc(100vw - 44px))", height: "min(560px, calc(100vh - 130px))",
            background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, boxShadow: "0 18px 48px rgba(90,62,30,.24)",
            display: "flex", flexDirection: "column", overflow: "hidden", animation: "pf-pop .22s ease",
          }}
        >
          <div style={{ padding: "14px 16px", background: C.accent, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 999, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Caprasimo", fontSize: 15 }}>P</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Ask Prepify</div>
              <div style={{ fontSize: 11.5, opacity: 0.9 }}>Your study buddy — ask anything</div>
            </div>
          </div>

          <div ref={scroller} style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {msgs.length === 0 && (
              <div style={{ alignSelf: "flex-start", maxWidth: "90%", background: C.bg, borderRadius: "14px 14px 14px 4px", padding: "12px 14px", fontSize: 14, lineHeight: 1.55, color: "#332f2b" }}>
                Salam! Stuck on something? Ask me and I&apos;ll explain it simply. {s.groqKey ? "" : "First connect your free AI key in Settings."}
              </div>
            )}
            {msgs.map(([who, text], i) => {
              const me = who === "me";
              return (
                <div key={i} style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: "90%", background: me ? C.accent : C.bg, color: me ? "#fff" : "#332f2b", borderRadius: me ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "11px 14px", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap", animation: "pf-in .2s ease" }}>
                  {text}
                </div>
              );
            })}
          </div>

          <div style={{ padding: 12, borderTop: "1px solid #ece0c8" }}>
            {msgs.length === 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 9, flexWrap: "wrap" }}>
                {chips.map((c) => (
                  <button key={c} onClick={() => send(c)} style={{ fontSize: 11.5, fontWeight: 600, color: "#5d5648", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 999, padding: "6px 11px" }}>{c}</button>
                ))}
              </div>
            )}
            {!s.groqKey && (
              <button onClick={() => { setOpen(false); go("settings"); }} style={{ width: "100%", marginBottom: 9, fontSize: 12.5, fontWeight: 700, color: C.accentD, background: C.tint, borderRadius: 12, padding: "9px 12px" }}>
                Connect your free AI key →
              </button>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "center", background: C.bg, borderRadius: 999, padding: "5px 5px 5px 16px" }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(draft); } }}
                placeholder="Ask anything…"
                style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", outline: "none", fontSize: 14, padding: "8px 0" }}
              />
              <button onClick={() => send(draft)} disabled={busy} style={{ width: 36, height: 36, flex: "none", borderRadius: 999, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", opacity: busy ? 0.6 : 1 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff"><path d="M3.4 20.4 21 12 3.4 3.6 3 10l12 2-12 2z" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
