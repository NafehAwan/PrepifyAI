export type Screen =
  | "onboarding"
  | "home"
  | "subjects"
  | "chapters"
  | "topic"
  | "test"
  | "practice"
  | "mock"
  | "progress"
  | "plan"
  | "reviews"
  | "settings";

export type Variant = "A" | "B";
export type Lang = "EN" | "UR";
export type Device = "desktop" | "mobile";
export type Mode = "guided" | "free";
export type TopicTab = "tutor" | "quiz" | "read";
export type ChatRole = "ai" | "me";
export type ChatMsg = readonly [ChatRole, string];

export interface AppState {
  screen: Screen;
  ob: number; // onboarding step 1..N
  cls: string;
  subs: string[];
  examDate: string;
  dq: number; // placement diagnostic index
  obVar: Variant;
  homeVar: Variant;
  topicVar: Variant;
  fbVar: Variant;
  lang: Lang;
  device: Device;
  mode: Mode;
  open: string[]; // expanded chapter ids
  topicTab: TopicTab;
  chat: ChatMsg[];
  draft: string;
  quizPick: number | null;
  quizDone: boolean;
  pAnswer: string;
  pShow: boolean;
  mockRunning: boolean;
  mockLeft: number; // seconds
  mockDone: boolean;
  saver: boolean;
  remind: boolean;
  // Auth / real-data context (populated server-side when Supabase is configured).
  authed: boolean;
  supabaseConfigured: boolean;
  userName: string;
  userEmail: string;
  // Live curriculum navigation (set when browsing real DB content).
  selectedSubjectId: string | null;
  selectedSubjectName: string | null;
  selectedTopicId: string | null;
  // The chapter whose test is being taken (set from the chapter tree).
  testChapterId: string | null;
  testChapterTitle: string | null;
  // Grounding context for the tutor, set by the topic screen from real content.
  teach: TeachContext | null;
  // The student's own Groq API key (browser-only; hydrated from localStorage).
  groqKey: string;
}

export interface TeachContext {
  subject: string;
  classLevel: number | string;
  medium: string;
  level: string;
  sloList: string;
  groundTruth: string;
}
