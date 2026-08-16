export type Screen =
  | "onboarding"
  | "home"
  | "subjects"
  | "chapters"
  | "topic"
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
  ob: number; // onboarding step 1..5
  cls: string;
  track: string;
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
}
