import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AppState } from "@/lib/types";
import type { ProfileRow } from "@/lib/database.types";
import {
  CODE_TO_TRACK,
  LEVEL_TO_CLASS,
  displayNameFromEmail,
  fromDbMode,
} from "@/lib/mappings";

export interface UserContext {
  authed: boolean;
  onboarded: boolean;
  userName: string;
  userEmail: string;
  initial: Partial<AppState>;
}

// Reads the signed-in user's profile + enrolments and produces the initial
// dashboard state. Missing profile fields => the user hasn't onboarded yet.
export async function loadUserContext(
  supabase: SupabaseClient,
  user: User,
): Promise<UserContext> {
  const userName =
    (user.user_metadata?.full_name as string | undefined) ??
    displayNameFromEmail(user.email);
  const userEmail = user.email ?? "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, class_level, track, medium, exam_date, locale, mode")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const { data: enrols } = await supabase
    .from("enrollments")
    .select("subjects(name)")
    .eq("user_id", user.id);

  // The embedded `subjects` relation may come back as an object or an array
  // depending on the client's type inference; normalise both shapes.
  const subs = ((enrols ?? []) as Array<{ subjects: unknown }>)
    .map((r) => {
      const rel = r.subjects as { name?: string } | Array<{ name?: string }> | null;
      if (Array.isArray(rel)) return rel[0]?.name;
      return rel?.name;
    })
    .filter((n): n is string => Boolean(n));

  const onboarded = Boolean(profile?.class_level && profile?.exam_date);

  const initial: Partial<AppState> = {
    authed: true,
    supabaseConfigured: true,
    userName,
    userEmail,
    screen: onboarded ? "home" : "onboarding",
    ob: onboarded ? 5 : 1,
  };
  if (profile?.class_level) initial.cls = LEVEL_TO_CLASS[profile.class_level] ?? "11th";
  if (profile?.track) initial.track = CODE_TO_TRACK[profile.track] ?? "Pre-Medical";
  if (profile?.exam_date) initial.examDate = profile.exam_date;
  if (profile?.mode) initial.mode = fromDbMode(profile.mode);
  if (subs.length > 0) initial.subs = subs;

  return { authed: true, onboarded, userName, userEmail, initial };
}
