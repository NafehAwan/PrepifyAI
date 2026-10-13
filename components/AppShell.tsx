"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { applyReducedMotion, isReducedMotion } from "@/lib/motion";
import { C, FD } from "@/lib/theme";
import { NAV, TITLES } from "@/lib/data";
import { StrokeIcon, FillIcon, PATH } from "./Icon";
import { LogoMark, Wordmark } from "./Logo";
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
import { Settings } from "./screens/Settings";

const iconFor = (id: string) => NAV.find(([n]) => n === id)?.[2] ?? "";

// The phone tab bar: the four places a student goes most, plus "More".
const TABS: ReadonlyArray<readonly [id: Screen | "more", label: string]> = [
  ["home", "Home"],
  ["subjects", "Subjects"],
  ["mockExam", "Mock"],
  ["leaderboard", "Ranks"],
  ["more", "More"],
];
const MORE_ICON = "M5 12h.01M12 12h.01M19 12h.01";

export function AppShell() {
  const { s, go, patch, daysLeft } = useApp();
  const isMobile = useIsMobile();
  const [moreOpen, setMoreOpen] = useState(false);
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
  const isActive = (id: string) =>
    s.screen === id ||
    (id === "mockExam" && inMock) ||
    (id === "subjects" && SUBJECT_FLOW.includes(s.screen) && !inMock) ||
    (id === "support" && s.screen === "supportTicket");
  const moreIds = ["progress", "support", "admin", "settings"];
  const moreActive = moreIds.some(isActive);
  const moreBadge = (badges.support ?? 0) + (badges.admin ?? 0);

  // While a test or a challenge is running the tab bar steps aside: one stray
  // tap shouldn't walk a student out of a paper.
  const focusMode = s.screen === "testRun" || s.screen === "challengeRoom";

  const navGo = (screen: Screen) => {
    go(screen);
    setMoreOpen(false);
  };

  const streak = s.authed ? stats?.streak ?? 0 : 12;
  const xp = s.authed ? stats?.xpWeek ?? 0 : 340;

  const statChips = (
    <>
      <button onClick={() => navGo("leaderboard")} title="Your streak — see the leaderboard" style={chip}>
        <FillIcon d={PATH.flame} size={17} fill={C.go} />
        <span>{streak}</span>
      </button>
      <button onClick={() => navGo("leaderboard")} title="XP this week — see the leaderboard" style={chip}>
        <FillIcon d={PATH.bolt} size={16} fill={C.goldD} />
        <span>{xp}</span>
      </button>
    </>
  );

  const avatar = (
    <button
      onClick={() => navGo("settings")}
      aria-label="Open settings"
      title="Settings"
      style={{ width: 40, height: 40, flex: "none", borderRadius: 14, background: C.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FD, fontWeight: 800, fontSize: 16, boxShadow: `0 3px 0 ${C.accentD}` }}
    >
      {initialsFromName(s.userName)}
    </button>
  );

  const extras = (
    <>
      <button onClick={() => { patch({ screen: "onboarding", ob: 1 }); setMoreOpen(false); }} style={quietRow}>
        <StrokeIcon d={PATH.refresh} size={18} style={{ flex: "none" }} />
        Replay onboarding
      </button>
      {s.authed && (
        <form action={signOut}>
          <button type="submit" style={{ ...quietRow, width: "100%" }}>
            <StrokeIcon d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H4" size={18} style={{ flex: "none" }} />
            Sign out
          </button>
        </form>
      )}
    </>
  );

  // ---- laptop / desktop / tablet: a white sidebar ----
  const sidebar = (
    <nav
      aria-label="Main"
      style={{ width: 252, flex: "none", background: C.sidebar, borderRight: `2px solid ${C.sidebarLine}`, padding: "20px 14px", display: "flex", flexDirection: "column", gap: 6, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}
    >
      <button onClick={() => navGo("home")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 8px 20px" }}>
        <LogoMark size={38} />
        <Wordmark size={25} />
      </button>
      {NAV.filter(([id]) => id !== "admin" || s.isAdmin).map(([id, label, d]) => {
        const active = isActive(id);
        const badge = badges[id] ?? 0;
        return (
          <button
            key={id}
            onClick={() => navGo(id as Screen)}
            aria-current={active ? "page" : undefined}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 16, textAlign: "left", fontFamily: FD, fontWeight: 700, fontSize: 16.5, background: active ? C.tint : "transparent", color: active ? C.accentD : C.muted, boxShadow: active ? `inset 0 0 0 2px #CFC3FF` : "none" }}
          >
            <StrokeIcon d={d} size={21} width={2.5} style={{ flex: "none" }} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge > 0 && <Badge n={badge} />}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      {extras}
    </nav>
  );

  // ---- phone: "More" sheet over the tab bar ----
  const moreSheet = moreOpen && (
    <>
      <div onClick={() => setMoreOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(32,36,74,.35)", zIndex: 110, animation: "pf-in .2s var(--ease-out) both" }} />
      <div role="dialog" aria-label="More" style={{ position: "fixed", left: 10, right: 10, bottom: "calc(86px + env(safe-area-inset-bottom))", zIndex: 120, background: "#fff", borderRadius: 24, padding: 10, boxShadow: "0 18px 40px -12px rgba(32,36,74,.45)", animation: "pf-pop .28s var(--ease-soft) both" }}>
        {NAV.filter(([id]) => moreIds.includes(id) && (id !== "admin" || s.isAdmin)).map(([id, label, d]) => (
          <button key={id} onClick={() => navGo(id as Screen)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 16, textAlign: "left", fontFamily: FD, fontWeight: 700, fontSize: 17, background: isActive(id) ? C.tint : "transparent", color: isActive(id) ? C.accentD : C.ink }}>
            <span style={{ width: 38, height: 38, borderRadius: 12, background: C.sand, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <StrokeIcon d={d} size={20} width={2.5} />
            </span>
            <span style={{ flex: 1 }}>{label}</span>
            {(badges[id] ?? 0) > 0 && <Badge n={badges[id]} />}
          </button>
        ))}
        <div style={{ height: 2, background: C.sand, margin: "6px 10px" }} />
        {extras}
      </div>
    </>
  );

  const tabBar = (
    <nav aria-label="Main" style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 100, background: "#fff", borderTop: `2px solid ${C.sidebarLine}`, display: "flex", justifyContent: "space-around", padding: "8px 6px calc(10px + env(safe-area-inset-bottom))" }}>
      {TABS.map(([id, label]) => {
        const active = id === "more" ? moreActive || moreOpen : isActive(id);
        return (
          <button
            key={id}
            onClick={() => (id === "more" ? setMoreOpen((o) => !o) : navGo(id))}
            aria-current={active && id !== "more" ? "page" : undefined}
            aria-expanded={id === "more" ? moreOpen : undefined}
            style={{ position: "relative", flex: 1, maxWidth: 84, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 0 4px", borderRadius: 16, color: active ? C.accentD : "#8A90B2", background: active ? C.tint : "transparent", fontFamily: FD, fontWeight: 700, fontSize: 12.5 }}
          >
            <StrokeIcon d={id === "more" ? MORE_ICON : iconFor(id)} size={23} width={id === "more" ? 3.6 : 2.5} />
            {label}
            {id === "more" && moreBadge > 0 && <span aria-label="New activity" style={{ position: "absolute", top: 4, right: "50%", marginRight: -18, width: 10, height: 10, borderRadius: 999, background: C.danger, border: "2px solid #fff" }} />}
          </button>
        );
      })}
    </nav>
  );

  const title = s.screen === "home" ? null : inMock ? "Mock Exam" : TITLES[s.screen] || "Prepify";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      {!isMobile && sidebar}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ height: isMobile ? 60 : 68, flex: "none", background: C.topbar, backdropFilter: "saturate(1.4) blur(10px)", WebkitBackdropFilter: "saturate(1.4) blur(10px)", borderBottom: `2px solid ${C.sidebarLine}`, display: "flex", alignItems: "center", gap: 8, padding: isMobile ? "0 14px" : "0 28px", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
            {isMobile && title === null && (
              <>
                <LogoMark size={32} />
                <Wordmark size={23} />
              </>
            )}
            {title !== null && (
              <h1 style={{ margin: 0, fontSize: isMobile ? 21 : 25, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</h1>
            )}
            {!isMobile && title === null && <h1 style={{ margin: 0, fontSize: 25, lineHeight: 1.1 }}>Your map</h1>}
          </div>
          {statChips}
          {!isMobile && (
            <div style={{ ...chip, cursor: "default", color: C.muted }} title="Days until your board exams">
              <StrokeIcon d={PATH.clock} size={16} width={2.6} />
              <span>{daysLeft} days to boards</span>
            </div>
          )}
          {avatar}
        </header>

        <main style={{ flex: 1, width: "100%", maxWidth: 1180, margin: "0 auto", padding: isMobile ? `16px 14px ${focusMode ? 24 : 110}px` : "26px 30px 40px", animation: "pf-fade .35s var(--ease-out) both" }} key={s.screen}>
          <ScreenBody screen={s.screen} isAdmin={s.isAdmin} />
        </main>
      </div>

      {isMobile && !focusMode && tabBar}
      {isMobile && moreSheet}
      {/* No chatbot anywhere near a challenge — the chat route also refuses
          messages while one is running, so another tab doesn't help either. */}
      {/* Nor during a mock exam paper. */}
      {s.screen !== "challengeRoom" && !(inMock && s.screen === "testRun") && <ChatWidget />}
    </div>
  );
}

function ScreenBody({ screen, isAdmin }: { screen: Screen; isAdmin: boolean }) {
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

function Badge({ n }: { n: number }) {
  return (
    <span style={{ minWidth: 22, height: 22, borderRadius: 999, background: C.danger, color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>
      {n > 99 ? "99+" : n}
    </span>
  );
}

const chip: React.CSSProperties = {
  flex: "none",
  display: "flex",
  alignItems: "center",
  gap: 5,
  height: 40,
  padding: "0 12px",
  borderRadius: 14,
  background: "#fff",
  boxShadow: "0 3px 0 #D3DAEC",
  fontFamily: FD,
  fontWeight: 800,
  fontSize: 16,
  color: C.ink,
  whiteSpace: "nowrap",
};

const quietRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  textAlign: "left",
  padding: "11px 14px",
  borderRadius: 14,
  fontSize: 14.5,
  fontWeight: 700,
  color: C.muted,
};
