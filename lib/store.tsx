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
import type { AppState, ChatMsg, TeachContext } from "./types";
import { daysUntil } from "./data";
import { CANNED_TUTOR_REPLY, DEMO_TEACH } from "./ai/context";
import { getGroqKey, groqAuthHeaders, setGroqKey as persistGroqKey } from "./ai/key";

const INITIAL: AppState = {
  screen: "home",
  ob: 1,
  cls: "9th",
  subs: ["Physics", "Chemistry", "Computer Science", "English"],
  examDate: "2027-04-12",
  dq: 0,
  obVar: "B",
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
  authed: false,
  supabaseConfigured: false,
  aiConfigured: false,
  userName: "Areeba",
  userEmail: "areeba.r@example.com",
  selectedSubjectId: null,
  selectedSubjectName: null,
  selectedTopicId: null,
  testChapterId: null,
  testChapterTitle: null,
  teach: null,
  groqKey: "",
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
  setGroqKey: (key: string) => void;
}

const Ctx = createContext<AppStore | null>(null);

// Calls the grounded tutor route; falls back to a canned reply when the AI
// backend isn't configured or the request fails, so the demo always answers.
async function fetchTutorReply(history: ChatMsg[], teach: TeachContext | null, groqKey: string, lang: "EN" | "UR"): Promise<string> {
  const ctx = teach ?? DEMO_TEACH;
  try {
    const res = await fetch("/api/ai/teach", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...groqAuthHeaders(groqKey) },
      body: JSON.stringify({
        messages: history.map(([role, text]) => ({ role, text })),
        subject: ctx.subject,
        classLevel: ctx.classLevel,
        // The language toggle drives the tutor's reply language.
        medium: lang === "UR" ? "Urdu" : "English",
        level: ctx.level,
        sloList: ctx.sloList,
        groundTruth: ctx.groundTruth,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { reply?: string };
      if (data.reply) return data.reply;
    }
  } catch {
    // fall through to the canned reply
  }
  return CANNED_TUTOR_REPLY;
}

export function AppProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: Partial<AppState>;
}) {
  const [s, setState] = useState<AppState>({ ...INITIAL, ...initial });
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

  const ask = useCallback(async (text: string) => {
    const t = (text || "").trim();
    if (!t) return;
    // Optimistically add the student’s turn + a placeholder, then fill the reply.
    let history: ChatMsg[] = [];
    let teach: TeachContext | null = null;
    let groqKey = "";
    let lang: "EN" | "UR" = "EN";
    setState((prev) => {
      const base = prev.chat.length ? prev.chat : SEED_CHAT;
      history = [...base, ["me", t]];
      teach = prev.teach;
      groqKey = prev.groqKey;
      lang = prev.lang;
      return { ...prev, chat: [...history, ["ai", "…"]], draft: "" };
    });
    const reply = await fetchTutorReply(history, teach, groqKey, lang);
    setState((prev) => {
      const chat = prev.chat.slice();
      if (chat.length > 0) chat[chat.length - 1] = ["ai", reply];
      return { ...prev, chat };
    });
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
    () => ({ s, set, patch, go, daysLeft: daysUntil(s.examDate), ask, setGroqKey }),
    [s, set, patch, go, ask, setGroqKey],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export const CHAT_SEED = SEED_CHAT;
