"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { groqAuthHeaders } from "@/lib/ai/key";
import type { ChatMsg } from "@/lib/types";
import { ChatSession, deleteChat, deriveTitle, loadChats, newChatId, saveChat } from "@/lib/ai/chatStore";
import { Mascot } from "./Mascot";
import { ChatMarkdown, plainLength } from "./ChatMarkdown";
import { sfxTap } from "@/lib/sfx";

// Floating "Ask Prepify" helper, available on every dashboard screen. A general
// study buddy (not topic-grounded) so a student can ask anything and learn.
// Conversations are saved in the browser so students can start a new chat and
// return to old ones.
export function ChatWidget() {
  const { s, go } = useApp();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [chatId, setChatId] = useState<string>(() => newChatId());
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  // Typewriter: which message index is currently revealing, and how many chars.
  const [typeIdx, setTypeIdx] = useState<number | null>(null);
  const [typeShown, setTypeShown] = useState(0);
  const scroller = useRef<HTMLDivElement | null>(null);
  const createdAt = useRef<number>(Date.now());

  // Load saved chats once the widget is first opened (client-only).
  useEffect(() => {
    if (open) setChats(loadChats());
  }, [open]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open, typeShown]);

  // Drive the typewriter reveal of the newest AI reply.
  useEffect(() => {
    if (typeIdx === null) return;
    const msg = msgs[typeIdx];
    if (!msg) { setTypeIdx(null); return; }
    const full = plainLength(msg[1]);
    if (typeShown >= full) { setTypeIdx(null); return; }
    const step = Math.max(2, Math.round(full / 90)); // ~1.5s regardless of length
    const id = setTimeout(() => setTypeShown((n) => Math.min(full, n + step)), 18);
    return () => clearTimeout(id);
  }, [typeIdx, typeShown, msgs]);

  // Persist the current conversation whenever it has real messages.
  const persist = (next: ChatMsg[]) => {
    if (!next.some(([who]) => who === "me")) return;
    const now = Date.now();
    const session: ChatSession = {
      id: chatId,
      title: deriveTitle(next),
      msgs: next,
      createdAt: createdAt.current,
      updatedAt: now,
    };
    setChats(saveChat(session));
  };

  const startNewChat = () => {
    setMsgs([]);
    setDraft("");
    setChatId(newChatId());
    createdAt.current = Date.now();
    setShowHistory(false);
    setTypeIdx(null);
  };

  const openChat = (c: ChatSession) => {
    setMsgs(c.msgs);
    setChatId(c.id);
    createdAt.current = c.createdAt;
    setShowHistory(false);
    setTypeIdx(null); // old chats render fully, no re-typing
  };

  const removeChat = (id: string) => {
    const remaining = deleteChat(id);
    setChats(remaining);
    if (id === chatId) startNewChat();
  };

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    sfxTap();
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
    const settled: ChatMsg[] = [...history, ["ai", reply]];
    setMsgs(settled);
    persist(settled);
    setBusy(false);
    // reveal the reply with a typewriter effect
    setTypeIdx(settled.length - 1);
    setTypeShown(0);
  };

  const chips = ["Explain photosynthesis simply", "How do I study for the board?", "Give me an example of Newton's first law"];

  const iconBtn: React.CSSProperties = {
    width: 30, height: 30, flex: "none", borderRadius: 999, background: "rgba(255,255,255,.2)",
    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
  };

  return (
    <>
      {/* launcher — Prepi the mascot waves you over */}
      <button
        onClick={() => { sfxTap(); setOpen((v) => !v); }}
        aria-label="Ask Prepify"
        style={{
          position: "fixed", right: 22, bottom: 22, zIndex: 60, width: 62, height: 62, borderRadius: 999,
          background: open ? C.accent : C.card, border: `2px solid ${C.accent}`,
          boxShadow: "0 10px 26px rgba(198,113,57,.4)",
          display: "flex", alignItems: "center", justifyContent: "center", animation: "pf-bounce-in .4s ease", overflow: "hidden",
        }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        ) : (
          <Mascot mood="idle" size={50} />
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
          <div style={{ padding: "12px 14px", background: C.accent, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 999, background: "rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", overflow: "hidden" }}><Mascot mood={busy ? "thinking" : "happy"} size={30} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Ask Prepify</div>
              <div style={{ fontSize: 11.5, opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {showHistory ? "Your saved chats" : "Your study buddy — ask anything"}
              </div>
            </div>
            <button onClick={() => { setShowHistory((v) => !v); if (!showHistory) setChats(loadChats()); }} aria-label="Chat history" title="Chat history" style={iconBtn}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-9 9" /><path d="M3 12H1m2 0 3-3" /><path d="M12 7v5l3 2" /></svg>
            </button>
            <button onClick={startNewChat} aria-label="New chat" title="New chat" style={iconBtn}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>

          {showHistory ? (
            <div style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={startNewChat} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", fontSize: 13.5, fontWeight: 700, color: C.accentD, background: C.tint, borderRadius: 12, padding: "11px 13px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.accentD} strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                Start a new chat
              </button>
              {chats.length === 0 ? (
                <div style={{ fontSize: 13, color: "#8a8172", textAlign: "center", padding: "24px 12px", lineHeight: 1.5 }}>
                  No saved chats yet. Ask a question and it&apos;ll be saved here.
                </div>
              ) : (
                chats.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, background: c.id === chatId ? C.tint : C.bg, border: `1px solid ${c.id === chatId ? C.accent : C.line}`, borderRadius: 12, padding: "4px 4px 4px 12px" }}>
                    <button onClick={() => openChat(c)} style={{ flex: 1, minWidth: 0, textAlign: "left", background: "transparent" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#332f2b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: "#9a917f" }}>{relTime(c.updatedAt)}</div>
                    </button>
                    <button onClick={() => removeChat(c.id)} aria-label="Delete chat" title="Delete chat" style={{ width: 30, height: 30, flex: "none", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#b0a793" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              <div ref={scroller} style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {msgs.length === 0 && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "6px 0 2px" }}>
                    <Mascot mood="wave" size={72} />
                    <div style={{ maxWidth: "92%", background: C.bg, borderRadius: 16, padding: "12px 14px", fontSize: 14, lineHeight: 1.55, color: "#332f2b", textAlign: "center" }}>
                      Salam! Stuck on something? Ask me and I&apos;ll explain it simply. {s.groqKey ? "" : "First connect your free AI key in Settings."}
                    </div>
                  </div>
                )}
                {msgs.map(([who, text], i) => {
                  const me = who === "me";
                  const thinking = !me && text === "…";
                  const limit = i === typeIdx ? typeShown : undefined;
                  return (
                    <div key={i} style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: "90%", background: me ? C.accent : C.bg, color: me ? "#fff" : "#332f2b", borderRadius: me ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "11px 14px", fontSize: 14, lineHeight: 1.55, whiteSpace: me ? "pre-wrap" : "normal", animation: "pf-in .2s ease" }}>
                      {me ? text : thinking ? <TypingDots /> : <ChatMarkdown text={text} limit={limit} />}
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
            </>
          )}
        </div>
      )}
    </>
  );
}

// Three little bouncing dots shown while Prepi is thinking.
function TypingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: 999, background: C.accent, display: "inline-block", animation: "pf-typing 1s ease-in-out infinite", animationDelay: `${i * 0.16}s` }} />
      ))}
    </span>
  );
}

// "just now" / "5m ago" / "3h ago" / "2d ago"
function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
