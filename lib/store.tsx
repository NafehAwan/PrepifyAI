"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AppState } from "./types";
import { daysUntil } from "./data";
import { getGroqKey, setGroqKey as persistGroqKey } from "./ai/key";

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
