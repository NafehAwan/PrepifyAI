"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { C, pill } from "@/lib/theme";
import { persistEnrollments, persistProfile } from "@/lib/supabase/persist";
import { groqAuthHeaders } from "@/lib/ai/key";
import { initialsFromName } from "@/lib/mappings";
import type { AppState } from "@/lib/types";

const ALL_SUBJECTS = ["Physics", "Chemistry", "Computer Science", "English"];

export function Settings() {
  const { s, set, patch } = useApp();

  // Apply a change locally and persist it (persist is a no-op in demo mode).
  const saveProfile = (partial: Partial<AppState>) => {
    patch(partial);
    void persistProfile({ ...s, ...partial });
  };
  const toggleSubject = (name: string) => {
    const on = s.subs.includes(name);
    const subs = on ? s.subs.filter((x) => x !== name) : [...s.subs, name];
    patch({ subs });
    void persistEnrollments({ ...s, subs });
  };

  return (
    <div style={{ maxWidth: 820, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, flex: "none", borderRadius: 999, background: C.sage, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Caprasimo", fontSize: 26 }}>{initialsFromName(s.userName)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Caprasimo", fontSize: 22 }}>{s.userName}</div>
            <div style={{ color: C.muted, fontSize: 14 }}>{s.userEmail || "areeba.r@example.com"}</div>
          </div>
          <button style={{ borderRadius: 999, background: C.sand, fontWeight: 700, padding: "11px 20px", fontSize: 14 }}>Edit profile</button>
        </div>
      </div>

      <ConnectAI />

      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Class &amp; subjects</div>
        <div style={{ display: "flex", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, marginBottom: 8 }}>Class</div>
            <div style={{ display: "flex", background: C.bg, borderRadius: 999, padding: 4 }}>
              {["9th"].map((name) => (
                <button key={name} onClick={() => saveProfile({ cls: name })} style={pill(s.cls === name)}>{name}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, marginBottom: 8 }}>Exam date</div>
            <input type="date" value={s.examDate} onChange={(e) => saveProfile({ examDate: e.target.value })} style={{ borderRadius: 999, border: "1.5px solid #e0d0b4", background: "#fff", padding: "10px 18px", fontSize: 14, fontWeight: 600 }} />
          </div>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, marginBottom: 9 }}>Enrolled subjects — tap to change</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ALL_SUBJECTS.map((name) => {
            const on = s.subs.includes(name);
            return (
              <button key={name} onClick={() => toggleSubject(name)} style={{ borderRadius: 999, padding: "9px 15px", fontWeight: 600, fontSize: 13.5, background: on ? C.accent : "transparent", color: on ? "#fff" : "#5d5648", border: `1.5px solid ${on ? C.accent : "#dfcfb2"}` }}>
                {on ? "✓ " : "+ "}{name}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Study preferences</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Row title="Study mode" desc="Guided locks topics until mastered. Free roam opens everything.">
            <div style={{ display: "flex", background: C.bg, borderRadius: 999, padding: 4, flex: "none" }}>
              <button onClick={() => saveProfile({ mode: "guided" })} style={pill(s.mode === "guided")}>Guided</button>
              <button onClick={() => saveProfile({ mode: "free" })} style={pill(s.mode === "free")}>Free roam</button>
            </div>
          </Row>
          <Divider />
          <Row title="Language" desc="Tutor explanations and feedback follow this. Textbook stays in the board's language.">
            <div style={{ display: "flex", background: C.bg, borderRadius: 999, padding: 4, flex: "none" }}>
              <button onClick={() => saveProfile({ lang: "EN" })} style={pill(s.lang === "EN")}>English</button>
              <button onClick={() => saveProfile({ lang: "UR" })} style={pill(s.lang === "UR")}>اردو</button>
            </div>
          </Row>
          <Divider />
          <Row title="Data saver" desc="Cache chapters overnight on Wi-Fi, skip images on mobile data.">
            <Toggle on={s.saver} onClick={() => set("saver", !s.saver)} />
          </Row>
          <Divider />
          <Row title="Daily reminder" desc="A nudge at 7:30 pm if you haven't studied.">
            <Toggle on={s.remind} onClick={() => set("remind", !s.remind)} />
          </Row>
        </div>
      </div>
    </div>
  );
}

// "Bring your own key" card: paste a free Groq key, test it, and learn how to
// get one. The key is stored only in this browser and powers the AI tutor +
// examiner. Without it the app falls back to canned responses.
function ConnectAI() {
  const { s, setGroqKey } = useApp();
  const [draft, setDraft] = useState(s.groqKey);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const connected = s.groqKey.length > 0;
  const effectiveKey = (draft.trim() || s.groqKey).trim();

  const save = () => {
    setGroqKey(draft);
    setSaved(true);
    setResult(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const test = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...groqAuthHeaders(effectiveKey) },
      });
      const data = (await res.json()) as { ok?: boolean; model?: string; error?: string };
      if (res.ok && data.ok) setResult({ ok: true, msg: `Connected — model ${data.model}.` });
      else setResult({ ok: false, msg: data.error || "That key didn't work. Double-check and try again." });
    } catch {
      setResult({ ok: false, msg: "Couldn't reach the AI service. Check your connection." });
    }
    setTesting(false);
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Connect your AI tutor</div>
        <span style={{ fontSize: 11.5, fontWeight: 700, borderRadius: 999, padding: "4px 11px", background: connected ? C.sageT : C.sand, color: connected ? C.sageD : "#8d8069" }}>
          {connected ? "✓ Connected" : "Not connected"}
        </span>
      </div>
      <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.55, marginBottom: 18 }}>
        Prepify uses your own free Groq API key to power the tutor and examiner. It&apos;s stored only in this browser — we never see or save it. It takes about a minute to set up.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", flex: "1 1 320px", minWidth: 240, border: "1.5px solid #e0d0b4", borderRadius: 14, background: "#fff", paddingRight: 6 }}>
          <input
            type={show ? "text" : "password"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste your Groq key (gsk_…)"
            spellCheck={false}
            autoComplete="off"
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", padding: "12px 14px", fontSize: 14, fontFamily: "monospace" }}
          />
          <button onClick={() => setShow((v) => !v)} style={{ fontSize: 12, fontWeight: 700, color: C.muted, padding: "6px 10px" }}>
            {show ? "Hide" : "Show"}
          </button>
        </div>
        <button onClick={save} disabled={!draft.trim()} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "12px 22px", fontSize: 14, opacity: draft.trim() ? 1 : 0.5 }}>
          {saved ? "Saved ✓" : "Save key"}
        </button>
        <button onClick={test} disabled={testing || !effectiveKey} style={{ borderRadius: 999, background: C.sand, fontWeight: 700, padding: "12px 20px", fontSize: 14, opacity: testing || !effectiveKey ? 0.6 : 1 }}>
          {testing ? "Testing…" : "Test connection"}
        </button>
        {connected && (
          <button onClick={() => { setGroqKey(""); setDraft(""); setResult(null); }} style={{ borderRadius: 999, background: "transparent", color: C.muted, fontWeight: 700, padding: "12px 14px", fontSize: 13.5 }}>
            Remove
          </button>
        )}
      </div>

      {result && (
        <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, borderRadius: 14, padding: "11px 14px", marginBottom: 12, background: result.ok ? C.sageT : "#fdf1e6", color: result.ok ? C.sageD : C.accentD }}>
          {result.ok ? "✓ " : "✕ "}{result.msg}
        </div>
      )}

      <details style={{ borderTop: "1px solid #ece0c8", paddingTop: 14 }}>
        <summary style={{ cursor: "pointer", fontSize: 14, fontWeight: 700, color: C.ink, listStyle: "none" }}>
          How do I get a free Groq key? →
        </summary>
        <ol style={{ margin: "14px 0 4px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5, color: "#4a443c", lineHeight: 1.55 }}>
          <li>
            Go to{" "}
            <a href="https://console.groq.com/login" target="_blank" rel="noreferrer" style={{ color: C.accentD, fontWeight: 700, textDecoration: "underline" }}>console.groq.com</a>{" "}
            and sign in — it&apos;s free, and you can use Google or GitHub.
          </li>
          <li>
            Open{" "}
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: C.accentD, fontWeight: 700, textDecoration: "underline" }}>API Keys</a>{" "}
            from the left menu.
          </li>
          <li>Click <strong>Create API Key</strong>, name it <em>Prepify</em>, and press Create.</li>
          <li>Copy the key (it starts with <code style={{ background: C.bg, padding: "1px 5px", borderRadius: 5 }}>gsk_</code>) — you only see it once.</li>
          <li>Paste it in the box above and hit <strong>Save key</strong>. Done!</li>
        </ol>
        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 12, lineHeight: 1.5 }}>
          Groq&apos;s free tier is generous — plenty for daily study. Your key never leaves your device except to talk to Groq directly.
        </div>
      </details>
    </div>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "#9a8d78" }}>{desc}</div>
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#ece0c8" }} />;
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 56, height: 32, borderRadius: 999, background: on ? C.sage : "#d8c8ab", position: "relative", flex: "none" }}>
      <div style={{ position: "absolute", top: 4, left: on ? 28 : 4, width: 24, height: 24, borderRadius: 999, background: "#fff", transition: "left .18s ease" }} />
    </button>
  );
}
