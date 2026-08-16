"use client";

import { useApp } from "@/lib/store";
import { C, pill } from "@/lib/theme";
import { NAV, TITLES } from "@/lib/data";
import { StrokeIcon, FillIcon, PATH } from "./Icon";
import type { Screen } from "@/lib/types";

import { Home } from "./screens/Home";
import { Subjects } from "./screens/Subjects";
import { Chapters } from "./screens/Chapters";
import { Topic } from "./screens/Topic";
import { Practice } from "./screens/Practice";
import { Mock } from "./screens/Mock";
import { Progress } from "./screens/Progress";
import { Plan } from "./screens/Plan";
import { Reviews } from "./screens/Reviews";
import { Settings } from "./screens/Settings";

export function AppShell() {
  const { s, go, set, patch, daysLeft } = useApp();

  const isSubjectsActive = (id: string) =>
    s.screen === id || (id === "subjects" && (s.screen === "chapters" || s.screen === "topic"));

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* sidebar */}
      <div style={{ width: 246, flex: "none", background: C.sidebar, borderRight: `1px solid ${C.sidebarLine}`, padding: "20px 14px", display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 10px 22px" }}>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "Caprasimo", fontSize: 18 }}>P</div>
          <div style={{ fontFamily: "Caprasimo", fontSize: 19 }}>Prepify AI</div>
        </div>
        {NAV.map(([id, label, d]) => {
          const active = isSubjectsActive(id);
          return (
            <button key={id} onClick={() => go(id as Screen)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, textAlign: "left", fontWeight: 600, fontSize: 14.5, background: active ? C.accent : "transparent", color: active ? "#fff" : "#5d5648" }}>
              <StrokeIcon d={d} style={{ flex: "none" }} />
              <span style={{ flex: 1 }}>{label}</span>
              {id === "reviews" && (
                <span style={{ background: C.accent, color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 7px" }}>23</span>
              )}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button onClick={() => patch({ screen: "onboarding", ob: 1 })} style={{ textAlign: "left", padding: "10px 12px", borderRadius: 14, fontSize: 13, fontWeight: 600, color: C.muted }}>
          ↻ Replay onboarding
        </button>
        <div style={{ background: C.sageT, borderRadius: 18, padding: "14px 16px", marginTop: 6 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.sageD, marginBottom: 4 }}>Data saver is on</div>
          <div style={{ fontSize: 12, color: "#5d6b46", lineHeight: 1.4 }}>Chapters cached offline. Tutor replies use ~4 KB each.</div>
        </div>
      </div>

      {/* main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* topbar */}
        <div style={{ height: 66, flex: "none", borderBottom: `1px solid ${C.line}`, background: C.topbar, display: "flex", alignItems: "center", gap: 10, padding: "0 26px", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 19, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {TITLES[s.screen] || "Prepify"}
          </div>

          <Chip bg={C.tint}>
            <FillIcon d={PATH.flame} fill={C.accent} />
            <span style={{ fontWeight: 700, fontSize: 13.5, color: C.accentD, whiteSpace: "nowrap" }}>17 day streak</span>
          </Chip>
          <Chip bg={C.sageT}>
            <FillIcon d={PATH.bolt} size={15} fill="#7a8a5e" />
            <span style={{ fontWeight: 700, fontSize: 13.5, color: C.sageD, whiteSpace: "nowrap" }}>Lv 12 · 3,840 XP</span>
          </Chip>
          <Chip bg={C.sand}>
            <StrokeIcon d={PATH.clock} size={15} stroke={C.muted} width={2.6} />
            <span style={{ fontWeight: 700, fontSize: 13.5, color: "#5d5648", whiteSpace: "nowrap" }}>{daysLeft} days to boards</span>
          </Chip>
          <div style={{ flex: "none", display: "flex", background: C.sand, borderRadius: 999, padding: 3 }}>
            <button onClick={() => set("lang", "EN")} style={pill(s.lang === "EN")}>EN</button>
            <button onClick={() => set("lang", "UR")} style={pill(s.lang === "UR")}>اردو</button>
          </div>
          <button onClick={() => set("device", s.device === "desktop" ? "mobile" : "desktop")} title="Preview on phone" style={{ width: 36, height: 36, borderRadius: 999, background: C.sand, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <StrokeIcon d={PATH.phone} size={17} stroke="#5d5648" width={2.5} />
          </button>
          <div style={{ width: 36, height: 36, borderRadius: 999, background: C.sage, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>AR</div>
        </div>

        <div style={{ flex: 1, padding: 26, animation: "pf-in .25s ease" }}>
          <ScreenBody screen={s.screen} />
        </div>
      </div>
    </div>
  );
}

function ScreenBody({ screen }: { screen: Screen }) {
  switch (screen) {
    case "home": return <Home />;
    case "subjects": return <Subjects />;
    case "chapters": return <Chapters />;
    case "topic": return <Topic />;
    case "practice": return <Practice />;
    case "mock": return <Mock />;
    case "progress": return <Progress />;
    case "plan": return <Plan />;
    case "reviews": return <Reviews />;
    case "settings": return <Settings />;
    default: return <Home />;
  }
}

function Chip({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 7, background: bg, borderRadius: 999, padding: "7px 14px" }}>
      {children}
    </div>
  );
}
