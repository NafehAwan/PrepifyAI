// Translations between the UI's human-readable values and the DB's stored codes.

import type { StudyMode, Track } from "./database.types";

export const CLASS_TO_LEVEL: Record<string, number> = { "9th": 9, "10th": 10, "11th": 11, "12th": 12 };
export const LEVEL_TO_CLASS: Record<number, string> = { 9: "9th", 10: "10th", 11: "11th", 12: "12th" };

export const TRACK_TO_CODE: Record<string, Track> = {
  "Pre-Medical": "pre_med",
  "Pre-Engineering": "pre_eng",
  ICS: "ics",
  "General Science": "general",
};
export const CODE_TO_TRACK: Record<string, string> = {
  pre_med: "Pre-Medical",
  pre_eng: "Pre-Engineering",
  ics: "ICS",
  general: "General Science",
};

// UI study mode is guided|free; the DB also allows 'topper'.
export function toDbMode(mode: string): StudyMode {
  return mode === "free" ? "free" : mode === "topper" ? "topper" : "guided";
}
export function fromDbMode(mode: string | null): "guided" | "free" {
  return mode === "free" ? "free" : "guided";
}

export function displayNameFromEmail(email: string | undefined | null): string {
  if (!email) return "there";
  const local = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return local.replace(/\b\w/g, (c) => c.toUpperCase()) || "there";
}

export function initialsFromName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
