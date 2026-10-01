import { GROQ_BASE_URL, GROQ_MODEL, GROQ_MODEL_PINNED } from "./config";

// Cache the chosen model across requests (Groq retires ids, so we resolve a
// real one from the account's /models list once).
let cachedModel: string | null = null;

// Prefer a capable general chat model, then progressively fall back. Groq
// retires ids (llama-3.3-70b-versatile went away mid-project), so this is a
// preference list over whatever the account can actually see, not a pin.
const MODEL_PREFERENCE: RegExp[] = [
  /(^|[^\d])(120|70)b/i, // largest general models first
  /llama-3\.3-70b/i,
  /70b.*(versatile|instruct)/i,
  /llama.*70b/i,
  /gpt-oss/i,
  /llama-3\.1-8b-instant/i,
  /8b.*instant/i,
  /llama/i,
];

export async function pickModel(key: string): Promise<string> {
  if (GROQ_MODEL_PINNED) return GROQ_MODEL; // developer pinned via PREPIFY_MODEL
  if (cachedModel) return cachedModel;
  try {
    const res = await fetch(`${GROQ_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const data = (await res.json()) as { data?: Array<{ id: string; active?: boolean }> };
      const ids = (data.data ?? [])
        .filter((m) => m.active !== false)
        .map((m) => m.id)
        // drop non-text models (audio / moderation / embeddings)
        .filter((id) => !/whisper|tts|guard|embed|distil|prompt-guard/i.test(id));
      for (const re of MODEL_PREFERENCE) {
        const hit = ids.find((id) => re.test(id));
        if (hit) {
          // Log once so a future retirement is visible in the server logs.
          console.log(`[prepify] Groq model resolved to ${hit}`);
          return (cachedModel = hit);
        }
      }
      if (ids.length) {
        console.log(`[prepify] Groq model resolved to ${ids[0]} (no preference matched)`);
        return (cachedModel = ids[0]);
      }
    }
  } catch {
    // fall through to the static fallback
  }
  return GROQ_MODEL;
}

// Minimal Groq chat client over the OpenAI-compatible Chat Completions API.
// We use plain fetch (no SDK) so the student's key can be passed per-request and
// nothing about it is retained server-side.

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqChatOptions {
  key: string;
  messages: GroqMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  // When true, ask Groq to return a strict JSON object (used by the examiner).
  jsonMode?: boolean;
}

interface GroqChoice {
  message?: { content?: string };
}
interface GroqResponse {
  model?: string;
  choices?: GroqChoice[];
  error?: { message?: string };
}

// A failed Groq call. `status` is the upstream HTTP status (0 for a network
// failure), so routes can choose a friendly message without echoing Groq's own
// error text to the browser.
export class GroqError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "GroqError";
  }
}

export interface GroqChatResult {
  text: string;
  model: string;
}

// Calls Groq and returns the assistant's text. Throws a GroqError on failure
// (invalid key, rate limit, bad model, network); its message is for the server
// log, not the browser.
export async function groqChat(opts: GroqChatOptions): Promise<GroqChatResult> {
  const model = opts.model ?? (await pickModel(opts.key));
  let res: Response;
  try {
    res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.key}`,
      },
      body: JSON.stringify({
        model,
        messages: opts.messages,
        max_tokens: opts.maxTokens ?? 2048,
        temperature: opts.temperature ?? 0.4,
        ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch (err) {
    throw new GroqError(`Groq request failed: ${err instanceof Error ? err.message : String(err)}`, 0);
  }

  let data: GroqResponse;
  try {
    data = (await res.json()) as GroqResponse;
  } catch {
    throw new GroqError(`Groq returned a non-JSON response (HTTP ${res.status}).`, res.status);
  }

  if (!res.ok) {
    throw new GroqError(data.error?.message ?? `Groq request failed (HTTP ${res.status}).`, res.status);
  }

  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new GroqError("Groq returned an empty response.", 502);
  return { text, model: data.model ?? model };
}
