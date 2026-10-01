"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AppState } from "./types";
import { daysUntil } from "./data";
import { getGroqKey, setGroqKey as persistGroqKey } from "./ai/key";
import { pathFor, stateFromPath } from "./routes";

const INITIAL: AppState = {
  screen: "home",
  ob: 1,
  cls: "9th",
  subs: ["Physics", "Chemistry", "Computer Science", "English"],
  examDate: "2027-04-12",
  dq: 0,
  lang: "EN",
  mode: "guided",
  saver: true,
  remind: true,
  authed: false,
  supabaseConfigured: false,
  userName: "Areeba",
  userEmail: "areeba.r@example.com",
  username: null,
  hideFromLeaderboard: false,
  selectedSubjectId: null,
  selectedSubjectName: null,
  activeTestId: null,
  activeChallengeCode: null,
  aiConfigured: false,
  groqKey: "",
};

export interface AppStore {
  s: AppState;
  set: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  patch: (partial: Partial<AppState>) => void;
  go: (screen: AppState["screen"]) => void;
  daysLeft: number;
  setGroqKey: (key: string) => void;
}

const Ctx = createContext<AppStore | null>(null);

export function AppProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: Partial<AppState>;
}) {
  const [s, setState] = useState<AppState>({ ...INITIAL, ...initial });
  const set = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const patch = useCallback((partial: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const go = useCallback((screen: AppState["screen"]) => {
    setState((prev) => ({ ...prev, screen }));
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  // Save + apply the student's own Groq key (persists to localStorage).
  const setGroqKey = useCallback((key: string) => {
    const trimmed = key.trim();
    persistGroqKey(trimmed);
    setState((prev) => ({ ...prev, groqKey: trimmed }));
  }, []);

  // On mount, hydrate the saved key from localStorage into state.
  useEffect(() => {
    const saved = getGroqKey();
    if (saved) setState((prev) => ({ ...prev, groqKey: saved }));
  }, []);

  // Keep the address bar in step with the screen. Moving to a new screen adds
  // a history entry, so the browser's Back button (or a phone's back gesture)
  // returns to the previous screen instead of leaving the site. The first
  // render only tidies the address (e.g. /?join=CODE → /challenges/CODE).
  const firstSync = useRef(true);
  const { screen, selectedSubjectName, activeTestId, activeChallengeCode } = s;
  useEffect(() => {
    const path = pathFor({ screen, selectedSubjectName, activeTestId, activeChallengeCode });
    const here = window.location.pathname;
    if (firstSync.current) {
      firstSync.current = false;
      if (path && here + window.location.search !== path) window.history.replaceState(null, "", path);
      return;
    }
    // After Back/Forward the address already matches, so nothing is pushed.
    if (path && here !== path) window.history.pushState(null, "", path);
  }, [screen, selectedSubjectName, activeTestId, activeChallengeCode]);

  // Back / Forward: show the screen for the address we've landed on.
  useEffect(() => {
    const onPop = () => {
      const next = stateFromPath(window.location.pathname);
      if (!next) return;
      setState((prev) => {
        if (prev.screen === "onboarding") return prev;
        const sameSubject = next.selectedSubjectName === undefined || next.selectedSubjectName === prev.selectedSubjectName;
        return {
          ...prev,
          ...next,
          // Keep the subject's id when the subject hasn't changed; otherwise
          // the screen looks it up from the name.
          selectedSubjectId: sameSubject ? prev.selectedSubjectId : null,
        };
      });
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const value = useMemo<AppStore>(
    () => ({ s, set, patch, go, daysLeft: daysUntil(s.examDate), setGroqKey }),
    [s, set, patch, go, setGroqKey],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
