export type Screen =
  | "onboarding"
  | "home"
  | "subjects"
  | "subjectTests" // one subject's test cards + "New test"
  | "newTest" // choose question count and difficulty
  | "testRun" // taking a test
  | "testReview" // read-only review of a submitted test
  | "progress"
  | "settings";

export type Lang = "EN" | "UR";
export type Mode = "guided" | "free";
export type ChatRole = "ai" | "me";
export type ChatMsg = readonly [ChatRole, string];

export interface AppState {
  screen: Screen;
  ob: number; // onboarding step 1..N
  cls: string;
  subs: string[];
  examDate: string;
  dq: number; // placement diagnostic index
  lang: Lang;
  mode: Mode;
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
  // The test being taken or reviewed.
  activeTestId: string | null;
  // True when the server has a shared GROQ_API_KEY, so nobody has to supply
  // their own. Set server-side; false in the demo build.
  aiConfigured: boolean;
  // An optional per-browser key override (hydrated from localStorage). Only a
  // developer testing against their own account normally sets this.
  groqKey: string;
}

