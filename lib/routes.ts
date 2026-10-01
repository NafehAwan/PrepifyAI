// Web addresses for every screen, so the browser's Back / Forward buttons (and
// a phone's back gesture) move between screens instead of leaving the site,
// and any screen can be refreshed, bookmarked or shared.
//
//   /                              Home
//   /subjects                      My Subjects
//   /subjects/physics              a subject's tests and challenges
//   /subjects/physics/new-test     New test
//   /subjects/physics/challenge    Challenge friends
//   /tests/<id>                    taking or reviewing a test
//   /challenges/<CODE>             a challenge (lobby, test or results)
//   /support, /support/<number>    Help & Feedback tickets
//   /admin                         the owner's portal
//   /progress, /leaderboard, /settings
//
// Shared by the server (to open the right screen on a fresh load) and the
// browser (to keep the address bar in step), so it must stay free of
// browser-only code.

import type { AppState } from "./types";
import { OFFERED_SUBJECTS } from "./data";

type RouteState = Pick<AppState, "screen" | "selectedSubjectName" | "activeTestId" | "activeChallengeCode" | "activeTicketNumber">;

export function subjectSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

export function subjectFromSlug(slug: string): string | null {
  return OFFERED_SUBJECTS.find((n) => subjectSlug(n) === slug.toLowerCase()) ?? null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE = /^[A-Z0-9]{6}$/;

// The address for what's on screen, or null for screens that shouldn't
// touch the address bar (onboarding).
export function pathFor(s: RouteState): string | null {
  const subject = s.selectedSubjectName ? `/subjects/${subjectSlug(s.selectedSubjectName)}` : null;
  switch (s.screen) {
    case "home":
      return "/";
    case "subjects":
      return "/subjects";
    case "progress":
      return "/progress";
    case "leaderboard":
      return "/leaderboard";
    case "support":
      return "/support";
    case "supportTicket":
      return s.activeTicketNumber ? `/support/${s.activeTicketNumber}` : "/support";
    case "admin":
      return "/admin";
    case "settings":
      return "/settings";
    case "subjectTests":
      return subject ?? "/subjects";
    case "newTest":
      return subject ? `${subject}/new-test` : "/subjects";
    case "newChallenge":
      return subject ? `${subject}/challenge` : "/subjects";
    case "testRun":
    case "testReview":
      return s.activeTestId ? `/tests/${s.activeTestId}` : (subject ?? "/subjects");
    case "challengeRoom":
      return s.activeChallengeCode ? `/challenges/${s.activeChallengeCode}` : "/subjects";
    default:
      return null;
  }
}

// The screen for an address, or null if the address isn't one of ours. The
// subject comes back as a name only; screens look its id up themselves.
export function stateFromPath(pathname: string): Partial<AppState> | null {
  const parts = pathname.split(/[?#]/)[0].split("/").filter(Boolean);
  const [a, b, c, ...rest] = parts;
  if (rest.length > 0) return null;

  if (!a) return { screen: "home" };
  if (a === "progress" && !b) return { screen: "progress" };
  if (a === "leaderboard" && !b) return { screen: "leaderboard" };
  if (a === "admin" && !b) return { screen: "admin" };
  if (a === "support") {
    if (!b) return { screen: "support" };
    if (!c && /^[1-9][0-9]{0,9}$/.test(b)) return { screen: "supportTicket", activeTicketNumber: Number(b) };
    return null;
  }
  if (a === "settings" && !b) return { screen: "settings" };

  if (a === "subjects") {
    if (!b) return { screen: "subjects" };
    const name = subjectFromSlug(b);
    if (!name) return null;
    const subject = { selectedSubjectName: name };
    if (!c) return { screen: "subjectTests", ...subject };
    if (c === "new-test") return { screen: "newTest", ...subject };
    if (c === "challenge") return { screen: "newChallenge", ...subject };
    return null;
  }

  if (a === "tests" && b && !c && UUID.test(b)) return { screen: "testRun", activeTestId: b.toLowerCase() };

  if (a === "challenges" && b && !c) {
    const code = b.toUpperCase();
    return CODE.test(code) ? { screen: "challengeRoom", activeChallengeCode: code } : null;
  }

  return null;
}
