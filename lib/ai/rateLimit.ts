// A small per-user throttle for the chat route.
//
// Prepify runs on one shared Groq key, whose rate limit is per key — so a
// classroom of students chatting at once can exhaust it and everyone starts
// seeing errors. This caps how fast any single student can consume it.
//
// The window is in-process, so a serverless deployment enforces it per warm
// instance rather than globally. That is deliberate: it costs nothing, needs no
// extra infrastructure, and stops the common case (one student hammering the
// widget). Global fairness would need a shared store.

const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(id: string, maxPerMinute: number): RateLimitResult {
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= maxPerMinute) {
    const oldest = recent[0];
    hits.set(id, recent);
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000)) };
  }

  recent.push(now);
  hits.set(id, recent);

  // Opportunistic cleanup so the map can't grow without bound.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return { ok: true, retryAfterSeconds: 0 };
}

// Identifies the caller for throttling: the signed-in user when we can see one,
// otherwise the forwarded client IP.
export function callerId(req: Request, userId?: string | null): string {
  if (userId) return `u:${userId}`;
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${fwd || "unknown"}`;
}
