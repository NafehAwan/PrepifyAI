import { redirect } from "next/navigation";
import { PrepifyApp } from "@/components/PrepifyApp";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { loadUserContext } from "@/lib/supabase/queries";
import { isAiConfigured } from "@/lib/ai/config";

export default async function Page({ searchParams }: { searchParams?: { join?: string } }) {
  // Demo mode: no backend configured, render the app with sample data.
  if (!isSupabaseConfigured()) {
    return <PrepifyApp initial={{ aiConfigured: isAiConfigured() }} />;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects, but guard here too for direct hits.
  if (!user) redirect("/login");

  const ctx = await loadUserContext(supabase, user);

  // Arrived from a challenge invite (/c/CODE → /?join=CODE). Someone who hasn't
  // finished onboarding does that first; Onboarding then opens the challenge.
  const join = (searchParams?.join ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (join.length === 6) {
    ctx.initial.activeChallengeCode = join;
    if (ctx.onboarded) ctx.initial.screen = "challengeRoom";
  }
  return <PrepifyApp initial={ctx.initial} />;
}
