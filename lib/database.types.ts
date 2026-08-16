// Hand-authored types for the tables the app reads/writes. Mirrors
// supabase/schema.sql. If you later run `supabase gen types typescript`,
// you can replace this file with the generated output.

export type Track = "pre_eng" | "pre_med" | "ics" | "general";
export type Medium = "english" | "urdu";
export type StudyMode = "guided" | "free" | "topper";
export type QuestionType = "mcq" | "short" | "long";

export interface ProfileRow {
  id: string;
  role: string | null;
  class_level: number | null;
  track: string | null;
  medium: Medium | null;
  exam_date: string | null; // ISO date
  locale: string | null;
  mode: StudyMode | null;
}

export interface SubjectRow {
  id: string;
  name: string;
  name_ur: string | null;
  track: string | null;
}

export interface BookRow {
  id: string;
  subject_id: string;
  class_level: number;
  edition: string | null;
}

export interface ChapterRow {
  id: string;
  book_id: string;
  seq: number;
  title: string;
  title_ur: string | null;
}

export interface TopicRow {
  id: string;
  chapter_id: string;
  seq: number;
  title: string;
  title_ur: string | null;
  est_minutes: number | null;
}

export interface SloRow {
  id: string;
  topic_id: string;
  code: string;
  statement: string;
  statement_ur: string | null;
  bloom_level: string | null;
}

export interface QuestionRow {
  id: string;
  slo_id: string | null;
  chapter_id: string | null;
  type: QuestionType;
  category: string;
  source: string;
  bloom_level: string | null;
  difficulty: number | null;
  stem_md: string;
  stem_ur_md: string | null;
  options_json: string[] | null;
  answer_key_md: string | null;
  marking_scheme_json: string[] | null;
  marks: number | null;
}

export interface TopicProgressRow {
  user_id: string;
  topic_id: string;
  status: "locked" | "teaching" | "tested" | "completed";
  taught_at: string | null;
  mcq_score: number | null;
  mcq_passed: boolean;
  attempts: number;
  updated_at: string;
}

export interface ChapterProgressRow {
  user_id: string;
  chapter_id: string;
  status: "locked" | "in_progress" | "test_ready" | "passed" | "failed";
  best_score_pct: number;
  passed: boolean;
  unlocked_next: boolean;
  updated_at: string;
}
