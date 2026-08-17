// AI backend config. The tutor + examiner call Groq's OpenAI-compatible API.
//
// Prepify is "bring your own key": each student pastes their own free Groq API
// key in Settings. The key is stored only in their browser and sent per-request
// in the `x-groq-key` header — it is never persisted on our servers. A single
// shared `GROQ_API_KEY` env var is also supported as a fallback for local dev.
//
// Without any key the AI routes return `{configured:false}` and the UI falls
// back to canned responses, so the demo still works with zero setup.

export const GROQ_BASE_URL = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";

// Groq serves open models with a generous free tier. Default to their best
// general-purpose chat model; override with PREPIFY_MODEL (e.g.
// `llama-3.1-8b-instant` for faster/cheaper, or any current Groq model id).
export const GROQ_MODEL = process.env.PREPIFY_MODEL ?? "llama-3.3-70b-versatile";

// Optional server-side fallback key (developer convenience for local testing).
// Real users bring their own key from the browser instead.
export const GROQ_ENV_KEY = process.env.GROQ_API_KEY ?? "";

// The header a browser request carries the student's own key in.
export const GROQ_KEY_HEADER = "x-groq-key";

// Resolve the key for a given request: the student's own key (header) wins,
// otherwise fall back to the server env key (if the developer set one).
export function resolveGroqKey(req: Request): string {
  const header = req.headers.get(GROQ_KEY_HEADER)?.trim();
  if (header && header.length > 0) return header;
  return GROQ_ENV_KEY;
}

// True when a server-side fallback key exists. Per-request checks use
// `resolveGroqKey` instead, since most users bring their own key.
export function isAiConfigured(): boolean {
  return GROQ_ENV_KEY.length > 0;
}
