"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { applyReducedMotion, isReducedMotion } from "@/lib/motion";
import { C, DISPLAY, SHADOW } from "@/lib/theme";
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
import { SubjectTests } from "./screens/SubjectTests";
import { NewTest } from "./screens/NewTest";
import { TestRunner } from "./TestRunner";
import { NewChallenge } from "./screens/NewChallenge";
import { MockExam } from "./screens/MockExam";
import { ChallengeRoom } from "./ChallengeRoom";
import { Leaderboard } from "./screens/Leaderboard";
import { Support } from "./screens/Support";
import { SupportTicket } from "./screens/SupportTicket";
import { Admin } from "./screens/Admin";
import { countUnreadTickets, getAdminOverview } from "@/lib/support";
import { getMyStats, type MyStats } from "@/lib/engagement";
import { Progress } from "./screens/Progress";
import { PageTitle } from "./Em";
import { Settings } from "./screens/Settings";

export function AppShell() {
  const { s, go, patch, daysLeft } = useApp();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState<MyStats | null>(null);
  // Menu badges: replies a student hasn't read; for admins, what's waiting.
  const [badges, setBadges] = useState<Record<string, number>>({});

  // The student's streak and weekly XP for the top bar, refreshed as they move
  // between screens so a just-finished test shows up straight away.
  useEffect(() => {
    if (!s.authed) return;
    let active = true;
    getMyStats().then((m) => active && m && setStats(m));
    return () => {
      active = false;
    };
  }, [s.authed, s.screen]);

  useEffect(() => {
    if (!s.authed) return;
    let active = true;
    (async () => {
      const unread = await countUnreadTickets();
      const admin = s.isAdmin ? await getAdminOverview() : null;
      if (!active) return;
      setBadges({ support: unread, admin: admin ? admin.openTickets + admin.openReports : 0 });
    })();
    return () => {
      active = false;
    };
  }, [s.authed, s.isAdmin, s.screen]);

  // Re-apply the student's "Reduce animations" choice on mount (localStorage is
  // only readable client-side, so the root attribute can't be server-rendered).
  useEffect(() => {
    applyReducedMotion(isReducedMotion());
  }, []);

  // "My Subjects" stays highlighted through the whole test flow, which lives
  // underneath it.
  const SUBJECT_FLOW = ["subjectTests", "newTest", "testRun", "testReview", "newChallenge", "challengeRoom"];
  // A mock exam is taken in the same runner as a test, but belongs under "Mock Exam".
  const inMock = (s.screen === "testRun" || s.screen === "testReview") && s.activeTestKind === "mock";
  const isSubjectsActive = (id: string) =>
    s.screen === id ||
    (id === "mockExam" && inMock) ||
    (id === "subjects" && SUBJECT_FLOW.includes(s.screen) && !inMock) ||
    (id === "support" && s.screen === "supportTicket");

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
        <div style={{ fontFamily: DISPLAY, fontSize: 19, flex: 1 }}>Prepify <em style={{ color: C.accent }}>AI</em></div>
        {isMobile && (
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ width: 32, height: 32, borderRadius: 999, background: C.sand, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <StrokeIcon d="M6 6l12 12M18 6L6 18" size={16} stroke="#4A4A42" width={2.6} />
          </button>
        )}
      </div>
      {NAV.filter(([id]) => id !== "admin" || s.isAdmin).map(([id, label, d]) => {
        const active = isSubjectsActive(id);
        const badge = badges[id] ?? 0;
        return (
          <button key={id} onClick={() => navGo(id as Screen)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, textAlign: "left", fontWeight: active ? 600 : 500, fontSize: 14.5, background: active ? C.card : "transparent", boxShadow: active ? `0 0 0 0.5px ${C.line}, ${SHADOW.s1}` : "none", color: active ? C.ink : C.body }}>
            <StrokeIcon d={d} stroke={active ? C.accent : "currentColor"} style={{ flex: "none" }} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge > 0 && (
              <span style={{ minWidth: 20, height: 20, borderRadius: 999, background: C.danger, color: "#fff", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>
                {badge > 99 ? "99+" : badge}
              </span>
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
        <div style={{ height: 62, flex: "none", borderBottom: `0.5px solid ${C.line}`, background: C.topbar, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", display: "flex", alignItems: "center", gap: isMobile ? 8 : 10, padding: isMobile ? "0 14px" : "0 26px", position: "sticky", top: 0, zIndex: 20 }}>
          {isMobile && (
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu" style={{ position: "relative", width: 38, height: 38, flex: "none", borderRadius: 12, background: C.sand, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <StrokeIcon d="M4 7h16M4 12h16M4 17h16" size={18} stroke="#4A4A42" width={2.4} />
              {Object.values(badges).some((n) => n > 0) && (
                <span aria-label="New activity" style={{ position: "absolute", top: 6, right: 6, width: 9, height: 9, borderRadius: 999, background: C.danger, border: `2px solid ${C.sand}` }} />
              )}
            </button>
          )}
          <div style={{ fontSize: isMobile ? 15 : 14.5, fontWeight: 600, color: C.body, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {inMock ? "Mock Exam" : TITLES[s.screen] || "Prepify"}
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
                    <FillIcon d={PATH.bolt} size={15} fill="#3CB89A" />
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: C.sageD, whiteSpace: "nowrap" }}>Lv 12 · 3,840 XP</span>
                  </Chip>
                </>
              )}
              {s.authed && stats && (
                <>
                  <button onClick={() => navGo("leaderboard")} title="Your streak — see the leaderboard" style={{ flex: "none" }}>
                    <Chip bg={C.tint}>
                      <FillIcon d={PATH.flame} fill={C.accent} />
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: C.accentD, whiteSpace: "nowrap" }}>
                        {stats.streak} day streak
                      </span>
                    </Chip>
                  </button>
                  <button onClick={() => navGo("leaderboard")} title="XP this week — see the leaderboard" style={{ flex: "none" }}>
                    <Chip bg={C.sageT}>
                      <FillIcon d={PATH.bolt} size={15} fill="#3CB89A" />
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: C.sageD, whiteSpace: "nowrap" }}>{stats.xpWeek} XP this week</span>
                    </Chip>
                  </button>
                </>
              )}
              <Chip bg={C.sand}>
                <StrokeIcon d={PATH.clock} size={15} stroke={C.muted} width={2.6} />
                <span style={{ fontWeight: 700, fontSize: 13.5, color: "#4A4A42", whiteSpace: "nowrap" }}>{daysLeft} days to boards</span>
              </Chip>
            </>
          )}
          <button
            onClick={() => navGo("settings")}
            aria-label="Open settings"
            title="Settings"
            style={{ width: 36, height: 36, flex: "none", borderRadius: 999, background: C.sage, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: s.screen === "settings" ? `0 0 0 3px ${C.sageT}` : "none" }}
          >
            {initialsFromName(s.userName)}
          </button>
        </div>

        <div style={{ flex: 1, padding: isMobile ? "16px 14px" : 26, animation: "pf-in .5s var(--ease-out) both" }}>
          <ScreenBody screen={s.screen} isAdmin={s.isAdmin} />
        </div>
      </div>
      {/* No chatbot anywhere near a challenge — the chat route also refuses
          messages while one is running, so another tab doesn't help either. */}
      {/* Nor during a mock exam paper. */}
      {s.screen !== "challengeRoom" && !(inMock && s.screen === "testRun") && <ChatWidget />}
    </div>
  );
}

// Headlines for the screens that don't draw their own.
const PAGE_TITLES: Partial<Record<Screen, { eyebrow: string; lead: string; em: string }>> = {
  subjects: { eyebrow: "Pick one to practise", lead: "Your", em: "subjects." },
  progress: { eyebrow: "How you're doing", lead: "Your", em: "progress." },
  leaderboard: { eyebrow: "XP and streaks", lead: "The", em: "leaderboard." },
  support: { eyebrow: "We reply right here", lead: "Help &", em: "feedback." },
  settings: { eyebrow: "Your account", lead: "Your", em: "settings." },
};

function ScreenBody({ screen, isAdmin }: { screen: Screen; isAdmin: boolean }) {
  const title = PAGE_TITLES[screen];
  return (
    <>
      {title && <PageTitle eyebrow={title.eyebrow} lead={title.lead} em={title.em} />}
      <ScreenContent screen={screen} isAdmin={isAdmin} />
    </>
  );
}

function ScreenContent({ screen, isAdmin }: { screen: Screen; isAdmin: boolean }) {
  switch (screen) {
    case "home": return <Home />;
    case "subjects": return <Subjects />;
    case "subjectTests": return <SubjectTests />;
    case "newTest": return <NewTest />;
    case "testRun": return <TestRunner />;
    case "testReview": return <TestRunner readOnly />;
    case "newChallenge": return <NewChallenge />;
    case "challengeRoom": return <ChallengeRoom />;
    case "mockExam": return <MockExam />;
    case "progress": return <Progress />;
    case "leaderboard": return <Leaderboard />;
    case "support": return <Support />;
    case "supportTicket": return <SupportTicket />;
    // Admin calls are refused by the database for anyone else anyway.
    case "admin": return isAdmin ? <Admin /> : <Home />;
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
