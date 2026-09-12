"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { NAV, TITLES } from "@/lib/data";
import { StrokeIcon, FillIcon, PATH } from "./Icon";
import { LogoMark } from "./Logo";
import { ChatWidget } from "./ChatWidget";
import { useIsMobile } from "@/lib/useIsMobile";
import { initialsFromName } from "@/lib/mappings";
import { signOut } from "@/app/login/actions";
import type { Screen } from "@/lib/types";

import { Home } from "./screens/Home";
import { Subjects } from "./screens/Subjects";
import { Chapters } from "./screens/Chapters";
import { Topic } from "./screens/Topic";
import { ChapterTest } from "./screens/ChapterTest";
import { Practice } from "./screens/Practice";
import { Mock } from "./screens/Mock";
import { Progress } from "./screens/Progress";
import { Plan } from "./screens/Plan";
import { Reviews } from "./screens/Reviews";
import { Settings } from "./screens/Settings";

export function AppShell() {
  const { s, go, patch, daysLeft } = useApp();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const isSubjectsActive = (id: string) =>
    s.screen === id || (id === "subjects" && (s.screen === "chapters" || s.screen === "topic" || s.screen === "test"));

  const navGo = (screen: Screen) => {
    go(screen);
    setMenuOpen(false);
  };

  const sidebar = (
    <div
      style={{
        width: 246,
        flex: "none",
        background: C.sidebar,
        borderRight: `1px solid ${C.sidebarLine}`,
        padding: "20px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        ...(isMobile
          ? { position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 120, transform: menuOpen ? "none" : "translateX(-100%)", transition: "transform .22s ease", boxShadow: menuOpen ? "0 0 40px rgba(0,0,0,.28)" : "none" }
          : { position: "sticky", top: 0, height: "100vh" }),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 6px 22px" }}>
        <LogoMark size={34} />
        <div style={{ fontFamily: "Caprasimo", fontSize: 19, flex: 1 }}>Prepify <span style={{ color: C.sage }}>AI</span></div>
        {isMobile && (
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ width: 32, height: 32, borderRadius: 999, background: C.sand, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <StrokeIcon d="M6 6l12 12M18 6L6 18" size={16} stroke="#5d5648" width={2.6} />
          </button>
        )}
      </div>
      {NAV.map(([id, label, d]) => {
        const active = isSubjectsActive(id);
        return (
          <button key={id} onClick={() => navGo(id as Screen)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, textAlign: "left", fontWeight: 600, fontSize: 14.5, background: active ? C.accent : "transparent", color: active ? "#fff" : "#5d5648" }}>
            <StrokeIcon d={d} style={{ flex: "none" }} />
            <span style={{ flex: 1 }}>{label}</span>
            {id === "reviews" && !s.authed && (
              <span style={{ background: C.accent, color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 7px" }}>23</span>
            )}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <button onClick={() => { patch({ screen: "onboarding", ob: 1 }); setMenuOpen(false); }} style={{ textAlign: "left", padding: "10px 12px", borderRadius: 14, fontSize: 13, fontWeight: 600, color: C.muted }}>
        ↻ Replay onboarding
      </button>
      {s.authed && (
        <form action={signOut}>
          <button type="submit" style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 14, fontSize: 13, fontWeight: 600, color: C.muted }}>
            ⎋ Sign out
          </button>
        </form>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {sidebar}
      {isMobile && menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(40,25,10,.4)", zIndex: 110 }} />
      )}

      {/* main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* topbar */}
        <div style={{ height: 62, flex: "none", borderBottom: `1px solid ${C.line}`, background: C.topbar, display: "flex", alignItems: "center", gap: isMobile ? 8 : 10, padding: isMobile ? "0 14px" : "0 26px", position: "sticky", top: 0, zIndex: 20 }}>
          {isMobile && (
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu" style={{ width: 38, height: 38, flex: "none", borderRadius: 12, background: C.sand, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <StrokeIcon d="M4 7h16M4 12h16M4 17h16" size={18} stroke="#5d5648" width={2.4} />
            </button>
          )}
          <div style={{ fontFamily: "Caprasimo", fontSize: isMobile ? 17 : 19, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {TITLES[s.screen] || "Prepify"}
          </div>

          {!isMobile && (
            <>
              {/* Streak + XP are demo-only chrome until real tracking exists. */}
              {!s.authed && (
                <>
                  <Chip bg={C.tint}>
                    <FillIcon d={PATH.flame} fill={C.accent} />
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: C.accentD, whiteSpace: "nowrap" }}>17 day streak</span>
                  </Chip>
                  <Chip bg={C.sageT}>
                    <FillIcon d={PATH.bolt} size={15} fill="#7a8a5e" />
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: C.sageD, whiteSpace: "nowrap" }}>Lv 12 · 3,840 XP</span>
                  </Chip>
                </>
              )}
              <Chip bg={C.sand}>
                <StrokeIcon d={PATH.clock} size={15} stroke={C.muted} width={2.6} />
                <span style={{ fontWeight: 700, fontSize: 13.5, color: "#5d5648", whiteSpace: "nowrap" }}>{daysLeft} days to boards</span>
              </Chip>
            </>
          )}
          <div style={{ width: 36, height: 36, flex: "none", borderRadius: 999, background: C.sage, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{initialsFromName(s.userName)}</div>
        </div>

        <div style={{ flex: 1, padding: isMobile ? "16px 14px" : 26, animation: "pf-in .5s var(--ease-out) both" }}>
          <ScreenBody screen={s.screen} />
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}

function ScreenBody({ screen }: { screen: Screen }) {
  switch (screen) {
    case "home": return <Home />;
    case "subjects": return <Subjects />;
    case "chapters": return <Chapters />;
    case "topic": return <Topic />;
    case "test": return <ChapterTest />;
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
