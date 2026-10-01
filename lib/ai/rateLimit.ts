// Guards for the AI API routes: who may call them, and how often.
//
// Prepify runs on one shared Groq key whose rate limit is per key, so a single
// student (or a script with a stolen session) must not be able to spend it
// all. Limits are counted in the database (rate_limit_hit in
// supabase/security.sql), which every serverless instance shares. If that call
// fails, an in-memory counter takes over so a database hiccup never turns the
// limit off.

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface RateRule {
  bucket: string; // short name, unique per rule
  max: number;
  windowSeconds: number;
}

// ---- In-memory fallback (per warm instance) ---------------------------------

const hits = new Map<string, number[]>();

function memoryHit(id: string, rule: RateRule): boolean {
  const now = Date.now();
  const windowMs = rule.windowSeconds * 1000;
  const key = `${rule.bucket}:${id}`;
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= rule.max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  // Opportunistic cleanup so the map can't grow without bound.
  if (hits.size > 5000) {
    for (const [k, times] of hits) if (times.every((t) => now - t >= 86_400_000)) hits.delete(k);
  }
  return true;
}

// Identifies an anonymous caller (demo mode only) by forwarded client IP.
function ipOf(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// ---- Route guard -------------------------------------------------------------

export type Guarded = { userId: string | null; supabase: ReturnType<typeof createClient> | null } | NextResponse;

// Requires a signed-in user (when accounts are switched on) and applies the
// rate rules in order. Returns the caller, or the response to send instead:
// 401 when signed out, 429 with Retry-After when over a limit.
export async function guardAiRoute(req: Request, rules: RateRule[], limitMessage: string): Promise<Guarded> {
  if (!isSupabaseConfigured()) {
    // Demo mode has no accounts; throttle by IP instead.
    for (const rule of rules) {
      if (!memoryHit(`ip:${ipOf(req)}`, rule)) return tooMany(rule, limitMessage);
    }
    return { userId: null, supabase: null };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to use this." }, { status: 401 });

  for (const rule of rules) {
    const { data, error } = await supabase.rpc("rate_limit_hit", {
      p_bucket: rule.bucket,
      p_max: rule.max,
      p_window_seconds: rule.windowSeconds,
    });
    const allowed = error ? memoryHit(`u:${user.id}`, rule) : data === true;
    if (!allowed) return tooMany(rule, limitMessage);
  }
  return { userId: user.id, supabase };
}

function tooMany(rule: RateRule, message: string): NextResponse {
  const retry = Math.min(rule.windowSeconds, 60);
  return NextResponse.json(
    { error: message, rateLimited: true },
    { status: 429, headers: { "Retry-After": String(retry) } },
  );
}

// Reads a JSON body no larger than `maxBytes`, or null if it is too big or
// isn't JSON — so a huge request can't run up the token bill.
export async function readJsonBody<T>(req: Request, maxBytes: number): Promise<T | null> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) return null;
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
