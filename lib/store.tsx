"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AppState, ChatMsg } from "./types";
import { daysUntil } from "./data";

const INITIAL: AppState = {
  screen: "home",
  ob: 1,
  cls: "11th",
  track: "Pre-Medical",
  subs: ["Physics", "Chemistry", "Biology", "Maths", "English", "Urdu", "Islamiyat", "Pak Studies", "Computer Science"],
  examDate: "2027-04-12",
  dq: 0,
  obVar: "A",
  homeVar: "A",
  topicVar: "A",
  fbVar: "A",
  lang: "EN",
  device: "desktop",
  mode: "guided",
  open: ["ch5"],
  topicTab: "tutor",
  chat: [],
  draft: "",
  quizPick: null,
  quizDone: false,
  pAnswer: "",
  pShow: false,
  mockRunning: false,
  mockLeft: 5400,
  mockDone: false,
  saver: true,
  remind: true,
};

const SEED_CHAT: ChatMsg[] = [
  ["ai", "Salam Areeba. You’re on 5.3 — ask me anything from this page and I’ll answer from your FBISE textbook."],
  ["me", "why is centrifugal force not real?"],
  ["ai", "Because it only appears when you sit inside the turning car. In an outside (inertial) frame there is no outward push — the passenger is simply carrying on straight while the car curves away. Examiners award the mark for saying it is a fictitious force in a rotating frame."],
];

export interface AppStore {
  s: AppState;
  set: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  patch: (partial: Partial<AppState>) => void;
  go: (screen: AppState["screen"]) => void;
  daysLeft: number;
  ask: (text: string) => void;
}

const Ctx = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [s, setState] = useState<AppState>(INITIAL);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const ask = useCallback((text: string) => {
    const t = (text || "").trim();
    if (!t) return;
    const reply =
      "Here’s the short version from your book: Fᴄ = mv²/r. For a 1000 kg car at 20 m s⁻¹ on a 50 m bend that’s 8000 N of friction — more than dry tyres can usually give, which is exactly why the road is banked. Want me to set you two numericals on this?";
    setState((prev) => {
      const base = prev.chat.length ? prev.chat : SEED_CHAT;
      return { ...prev, chat: [...base, ["me", t], ["ai", reply]], draft: "" };
    });
  }, []);

  // Mock-exam countdown, mirrors the prototype's componentDidMount interval.
  useEffect(() => {
    timer.current = setInterval(() => {
      setState((prev) =>
        prev.mockRunning && prev.mockLeft > 0 ? { ...prev, mockLeft: prev.mockLeft - 1 } : prev,
      );
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const value = useMemo<AppStore>(
    () => ({ s, set, patch, go, daysLeft: daysUntil(s.examDate), ask }),
    [s, set, patch, go, ask],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export const CHAT_SEED = SEED_CHAT;
