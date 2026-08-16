import { redirect } from "next/navigation";
import { PrepifyApp } from "@/components/PrepifyApp";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { loadUserContext } from "@/lib/supabase/queries";

export default async function Page() {
  // Demo mode: no backend configured, render the app with sample data.
  if (!isSupabaseConfigured()) {
    return <PrepifyApp />;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects, but guard here too for direct hits.
  if (!user) redirect("/login");

  const ctx = await loadUserContext(supabase, user);
  return <PrepifyApp initial={ctx.initial} />;
}
