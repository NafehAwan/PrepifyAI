"use client";

import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { NAV, SUBJECTS, CH, TASKS, GAUGES, TITLES } from "@/lib/data";
import { CHAT_SEED } from "@/lib/store";
import { StrokeIcon, FillIcon, PATH } from "./Icon";
import type { ChatMsg, Screen } from "@/lib/types";

const QUIZ_OPTS = ["2 N", "4 N", "8 N", "16 N"];
const MOBILE_NAV: ReadonlyArray<readonly [string, string]> = [
  ["home", "Home"], ["subjects", "Subjects"], ["plan", "Plan"], ["practice", "Practice"], ["progress", "Progress"],
];

function gaugeColor(pct: number): string {
  return pct >= 75 ? C.sage : pct >= 55 ? C.accent : C.danger;
}
function spill(on: boolean): React.CSSProperties {
  return { borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 700, background: on ? C.accent : "transparent", color: on ? "#fff" : C.muted };
}
function mpill(on: boolean): React.CSSProperties {
  return { flex: 1, borderRadius: 999, padding: "8px 0", fontSize: 12.5, fontWeight: 700, background: on ? C.accent : "transparent", color: on ? "#fff" : C.muted };
}
function mtab(on: boolean): React.CSSProperties {
  return { flex: 1, borderRadius: 999, padding: "8px 0", fontSize: 13, fontWeight: 700, background: on ? C.accent : "transparent", color: on ? "#fff" : C.muted };
}

export function MobilePreview() {
  const { s, set, go, daysLeft } = useApp();
  const dedicated = ["home", "subjects", "chapters", "topic"].includes(s.screen);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(32,30,29,.55)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", gap: 28, padding: 24, overflow: "auto" }}>
      <div style={{ width: 392, flex: "none", height: 812, background: C.bg, borderRadius: 42, border: "9px solid #201e1d", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 30px 70px rgba(0,0,0,.4)" }}>
        <div style={{ height: 40, flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", fontSize: 12.5, fontWeight: 700, background: C.topbar }}>
          <span>9:41</span>
          <span>{daysLeft}d to boards</span>
        </div>
        <div style={{ flex: "none", padding: "8px 18px 12px", background: C.topbar, display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 18, flex: 1 }}>{TITLES[s.screen] || "Prepify"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.tint, borderRadius: 999, padding: "5px 11px" }}>
            <FillIcon d={PATH.flame} size={13} fill={C.accent} />
            <span style={{ fontWeight: 700, fontSize: 12, color: C.accentD }}>17</span>
          </div>
          <div style={{ display: "flex", background: C.sand, borderRadius: 999, padding: 2 }}>
            <button onClick={() => set("lang", "EN")} style={spill(s.lang === "EN")}>EN</button>
            <button onClick={() => set("lang", "UR")} style={spill(s.lang === "UR")}>اردو</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "14px 16px 20px" }}>
          {s.screen === "home" && <MHome />}
          {s.screen === "subjects" && <MSubjects />}
          {s.screen === "chapters" && <MChapters />}
          {s.screen === "topic" && <MTopic />}
          {!dedicated && (
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: 22, textAlign: "center" }}>
              <div style={{ fontFamily: "Caprasimo", fontSize: 20, marginBottom: 8 }}>{TITLES[s.screen]}</div>
              <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>This screen is designed desktop-first. On phone it collapses to a single scrolling column — switch back to desktop to review the full layout.</div>
            </div>
          )}
        </div>

        <div style={{ flex: "none", background: C.topbar, borderTop: `1px solid ${C.line}`, display: "flex", padding: "8px 6px 14px" }}>
          {MOBILE_NAV.map(([id, label]) => {
            const item = NAV.find((n) => n[0] === id)!;
            const active = s.screen === id || (id === "subjects" && (s.screen === "chapters" || s.screen === "topic"));
            return (
              <button key={id} onClick={() => go(id as Screen)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "5px 0", color: active ? C.accent : "#9a8d78" }}>
                <StrokeIcon d={item[2]} size={20} />
                <span style={{ fontSize: 10.5, fontWeight: 700 }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ width: 250, flex: "none", color: C.bg }}>
        <div style={{ fontFamily: "Caprasimo", fontSize: 22, marginBottom: 8 }}>Phone preview</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.8, marginBottom: 18 }}>Same data, one column, bottom tabs. Home, Subjects, Chapters and the Topic workspace have dedicated phone layouts.</div>
        <button onClick={() => set("device", "desktop")} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "12px 24px", fontSize: 14 }}>Back to desktop</button>
      </div>
    </div>
  );
}

function MHome() {
  const { go } = useApp();
  return (
    <>
      <div style={{ background: C.accent, color: "#fff", borderRadius: 22, padding: "18px 20px", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.85, marginBottom: 6 }}>Resume</div>
        <div style={{ fontFamily: "Caprasimo", fontSize: 19, lineHeight: 1.2, marginBottom: 4 }}>5.3 Centripetal Force</div>
        <div style={{ fontSize: 12.5, opacity: 0.9, marginBottom: 12 }}>Physics · Ch 5 · 4 min in</div>
        <button onClick={() => go("topic")} style={{ borderRadius: 999, background: "#fff", color: C.accentD, fontWeight: 700, padding: "10px 22px", fontSize: 14 }}>Continue</button>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button onClick={() => go("reviews")} style={{ flex: 1, background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 14, textAlign: "left" }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 26, color: C.accent, lineHeight: 1 }}>23</div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>reviews due</div>
        </button>
        <div style={{ flex: 1, background: C.sageT, borderRadius: 20, padding: 14 }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 26, color: C.sageD, lineHeight: 1 }}>Lv 12</div>
          <div style={{ fontSize: 12, color: C.sageD, fontWeight: 600 }}>3,840 XP</div>
        </div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: 18, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 2 }}>Today&apos;s Plan</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>3 of 5 done · 38 min left</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {TASKS.map(([title, meta, done]) => (
            <div key={title} style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 21, height: 21, flex: "none", borderRadius: 999, border: `2px solid ${done ? C.sage : "#d8c8ab"}`, background: done ? C.sage : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <StrokeIcon d={PATH.check} size={11} stroke={done ? "#fff" : "transparent"} width={3.5} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: done ? "#9a8d78" : C.ink, textDecoration: done ? "line-through" : "none" }}>{title}</div>
                <div style={{ fontSize: 11.5, color: "#9a8d78" }}>{meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 12 }}>Predicted grades</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {GAUGES.map(([name, pct, grade]) => {
            const color = gaugeColor(pct);
            return (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ width: 74, flex: "none", fontSize: 13, fontWeight: 600 }}>{name}</div>
                <div style={{ flex: 1, height: 9, background: C.sand, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: 9, width: `${pct}%`, background: color, borderRadius: 999 }} />
                </div>
                <div style={{ width: 30, textAlign: "right", fontFamily: "Caprasimo", fontSize: 16, color }}>{grade}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function MSubjects() {
  const { go } = useApp();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {SUBJECTS.map(([name, pct, grade]) => {
        const strong = pct >= 75;
        const fg = strong ? C.sageD : C.accentD;
        return (
          <button key={name} onClick={() => go("chapters")} style={{ width: "100%", textAlign: "left", background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: "15px 16px", display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 40, height: 40, flex: "none", borderRadius: 999, background: strong ? C.sageT : C.tint, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Caprasimo", fontSize: 18 }}>{name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{name}</div>
              <div style={{ height: 7, background: C.sand, borderRadius: 999, overflow: "hidden", marginTop: 7 }}>
                <div style={{ height: 7, width: `${pct}%`, background: fg, borderRadius: 999 }} />
              </div>
            </div>
            <div style={{ fontFamily: "Caprasimo", fontSize: 19, color: fg, flex: "none" }}>{grade}</div>
          </button>
        );
      })}
    </div>
  );
}

function MChapters() {
  const { s, set, patch, go } = useApp();
  const guided = s.mode === "guided";
  return (
    <>
      <div style={{ display: "flex", background: C.sand, borderRadius: 999, padding: 3, marginBottom: 12 }}>
        <button onClick={() => set("mode", "guided")} style={mpill(guided)}>Guided path</button>
        <button onClick={() => set("mode", "free")} style={mpill(!guided)}>Free roam</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {CH.map(([num, title, topics, st2]) => {
          const id = "ch" + num;
          const open = s.open.includes(id);
          const pct = st2 === "m" ? 100 : st2 === "p" ? 45 : 0;
          const done = st2 === "m";
          const tint = done ? C.sageT : pct > 0 ? C.tint : C.sand;
          const fg = done ? C.sage : pct > 0 ? C.accent : "#b3a58c";
          return (
            <div key={id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, overflow: "hidden" }}>
              <button onClick={() => patch({ open: open ? s.open.filter((x) => x !== id) : [...s.open, id] })} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", textAlign: "left" }}>
                <div style={{ width: 30, height: 30, flex: "none", borderRadius: 999, background: tint, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{num}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
                  <div style={{ fontSize: 11.5, color: "#9a8d78" }}>{topics.length} topics · {st2 === "m" ? "mastered" : st2 === "p" ? "in progress" : "not started"}</div>
                </div>
                <StrokeIcon d={PATH.chevronDown} size={16} stroke="#9a8d78" width={2.75} style={{ flex: "none", transform: `rotate(${open ? 180 : 0}deg)` }} />
              </button>
              {open && (
                <div style={{ padding: "0 14px 12px 14px", display: "flex", flexDirection: "column", gap: 5 }}>
                  {topics.map((t, ti) => {
                    let state: "done" | "now" | "not" = "not";
                    if (st2 === "m") state = "done";
                    else if (st2 === "p") state = ti < 2 ? "done" : ti === 2 ? "now" : "not";
                    const locked = guided && state === "not" && !(st2 === "p" && ti === 3);
                    const dotBg = state === "done" ? C.sage : state === "now" ? C.accent : locked ? C.sand : "#e3d5bb";
                    const iconFg = state === "not" ? "#a89a80" : "#fff";
                    const iconD = state === "done" ? PATH.check : locked ? PATH.lock : PATH.dot;
                    return (
                      <button key={t} onClick={() => go("topic")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 13, textAlign: "left", background: state === "now" ? C.tint : "transparent" }}>
                        <div style={{ width: 20, height: 20, flex: "none", borderRadius: 999, background: dotBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <StrokeIcon d={iconD} size={11} stroke={iconFg} width={3} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: locked ? "#a89a80" : C.ink }}>{t}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function MTopic() {
  const { s, set, patch, ask } = useApp();
  const tab = s.topicTab;
  const msgs: ChatMsg[] = s.chat.length ? s.chat : CHAT_SEED;
  return (
    <>
      <div style={{ display: "flex", background: C.sand, borderRadius: 999, padding: 3, marginBottom: 12 }}>
        <button onClick={() => set("topicTab", "read")} style={mtab(tab === "read")}>Read</button>
        <button onClick={() => set("topicTab", "tutor")} style={mtab(tab === "tutor")}>Tutor</button>
        <button onClick={() => set("topicTab", "quiz")} style={mtab(tab === "quiz")}>Quiz</button>
      </div>
      {tab === "read" && (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 18, fontSize: 14.5, lineHeight: 1.7, color: "#332f2b" }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 19, marginBottom: 10 }}>5.3 Centripetal Force</div>
          <p style={{ margin: "0 0 12px" }}>When a body moves along a circular path with uniform speed its direction changes continuously, so it is accelerating towards the centre.</p>
          <div style={{ background: C.tint, borderRadius: 14, padding: 14, margin: "14px 0", fontFamily: "Georgia,serif", fontSize: 18 }}>F<sub>c</sub> = m v² / r</div>
          <p style={{ margin: 0 }}>Centripetal force is not a new force — it is whatever real force acts inward: tension, friction, or gravity.</p>
        </div>
      )}
      {tab === "tutor" && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
            {msgs.map(([who, text], i) => {
              const me = who === "me";
              return (
                <div key={i} style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: "86%", background: me ? C.accent : C.card, color: me ? "#fff" : "#332f2b", borderRadius: me ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "12px 14px", fontSize: 14, lineHeight: 1.55 }}>{text}</div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", background: C.card, border: `1px solid ${C.line}`, borderRadius: 999, padding: "5px 5px 5px 16px" }}>
            <input value={s.draft} onChange={(e) => set("draft", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ask(s.draft); } }} placeholder="Ask anything…" style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", outline: "none", fontSize: 14, padding: "8px 0" }} />
            <button onClick={() => ask(s.draft)} style={{ width: 36, height: 36, flex: "none", borderRadius: 999, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FillIcon d={PATH.send} size={15} fill="#fff" />
            </button>
          </div>
        </>
      )}
      {tab === "quiz" && (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45, marginBottom: 14 }}>A 0.5 kg stone is whirled on a 1 m string at 4 m s⁻¹. Tension in the string?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {QUIZ_OPTS.map((text, i) => {
              const picked = s.quizPick === i;
              const right = i === 2;
              return (
                <button key={text} onClick={() => patch({ quizPick: i, quizDone: right })} style={{ display: "flex", alignItems: "center", gap: 11, textAlign: "left", borderRadius: 14, padding: "13px 14px", background: picked ? (right ? C.sageT : C.tint) : C.bg, border: `1.5px solid ${picked ? (right ? C.sage : C.accent) : "transparent"}` }}>
                  <div style={{ width: 24, height: 24, flex: "none", borderRadius: 999, background: picked ? (right ? C.sage : C.accent) : C.sand, color: picked ? "#fff" : "#5d5648", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{"ABCD"[i]}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{text}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
