import { redirect } from "next/navigation";
import { PrepifyApp } from "@/components/PrepifyApp";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { loadUserContext } from "@/lib/supabase/queries";
import { isAiConfigured } from "@/lib/ai/config";
import { stateFromPath } from "@/lib/routes";

// Renders the app with the screen for `pathname` open — used by "/" and by
// every other app address (/subjects/physics, /tests/…, /challenges/…), so a
// refresh or a shared link lands on the same screen. Unknown addresses go home.
export async function renderApp(pathname: string, join?: string) {
  const route = stateFromPath(pathname);
  if (!route) redirect("/");

  // Old-style invite links (/?join=CODE) still open the challenge.
  const code = (join ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const target = code.length === 6 ? { screen: "challengeRoom" as const, activeChallengeCode: code } : route;

  // Demo mode: no backend configured, render the app with sample data.
  if (!isSupabaseConfigured()) {
    return <PrepifyApp initial={{ aiConfigured: isAiConfigured(), ...target }} />;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects, but guard here too for direct hits.
  if (!user) redirect("/login");

  const ctx = await loadUserContext(supabase, user);
  if (ctx.onboarded) {
    Object.assign(ctx.initial, target);
  } else if (target.activeChallengeCode) {
    // Onboarding comes first; it then opens the challenge they were invited to.
    ctx.initial.activeChallengeCode = target.activeChallengeCode;
  }
  return <PrepifyApp initial={ctx.initial} />;
}
