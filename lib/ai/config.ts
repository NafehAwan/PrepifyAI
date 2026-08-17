// AI backend config. The tutor + examiner call the Claude API server-side.
// Without a key the app falls back to canned responses so the demo still works.

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

// Per the Claude API guidance the default is the latest Opus. Override with
// PREPIFY_MODEL (e.g. claude-sonnet-5 or claude-haiku-4-5) to trade cost/speed.
export const PREPIFY_MODEL = process.env.PREPIFY_MODEL ?? "claude-opus-5";

export function isAiConfigured(): boolean {
  return ANTHROPIC_API_KEY.length > 0;
}
