// AI backend config. The chatbot and the MCQ generator call Groq's
// OpenAI-compatible API.
//
// Prepify runs on ONE shared `GROQ_API_KEY` that the owner sets on the server,
// so students need no setup at all. A browser may still send its own key in the
// `x-groq-key` header (useful for local development against a personal
// account); that key is forwarded straight to Groq and never persisted.
//
// Note that tests themselves cost no API calls — questions are sampled from the
// `questions` table. The chatbot is the only runtime consumer of this key.

export const GROQ_BASE_URL = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";

// Fallback model id used only if live model discovery fails. Groq retires
// model ids over time, so at runtime we query the account's available models
// (see pickModel in client.ts) and choose one that actually works.
export const GROQ_MODEL = process.env.PREPIFY_MODEL || "llama-3.1-8b-instant";

// When PREPIFY_MODEL is explicitly set, pin to it and skip auto-discovery.
export const GROQ_MODEL_PINNED = !!process.env.PREPIFY_MODEL;

// The shared server key. This is the normal path for every signed-in student.
export const GROQ_ENV_KEY = process.env.GROQ_API_KEY ?? "";

// The header a browser request may carry an overriding key in.
export const GROQ_KEY_HEADER = "x-groq-key";

// Resolve the key for a given request: an explicit per-request key wins,
// otherwise the shared server key.
export function resolveGroqKey(req: Request): string {
  const header = req.headers.get(GROQ_KEY_HEADER)?.trim();
  if (header && header.length > 0) return header;
  return GROQ_ENV_KEY;
}

// True when the shared server key exists, i.e. AI works with no student setup.
// Surfaced to the UI as `AppState.aiConfigured` so no "connect your key"
// prompts are shown.
export function isAiConfigured(): boolean {
  return GROQ_ENV_KEY.length > 0;
}
