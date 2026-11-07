import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";

// Keeps the Supabase project awake. Free projects pause after about a week with
// no database activity, which takes the whole site down; a Vercel Cron job
// (vercel.json) calls this once a day so that never happens.
//
// It runs one tiny read and returns nothing private. When CRON_SECRET is set in
// Vercel, only the cron job (which sends it as a Bearer token) may call it.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase is not configured" }, { status: 500 });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { error } = await db.from("subjects").select("id").limit(1);
  if (error) {
    // Shows up in Vercel's logs, e.g. if the project was paused anyway.
    console.error("keepalive: Supabase query failed:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
