import { GROQ_BASE_URL, GROQ_MODEL } from "./config";

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

export interface GroqChatResult {
  text: string;
  model: string;
}

// Calls Groq and returns the assistant's text. Throws a friendly Error on
// failure (invalid key, rate limit, bad model, network) so callers can surface
// it or fall back to canned content.
export async function groqChat(opts: GroqChatOptions): Promise<GroqChatResult> {
  const model = opts.model ?? GROQ_MODEL;
  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
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
  });

  let data: GroqResponse;
  try {
    data = (await res.json()) as GroqResponse;
  } catch {
    throw new Error(`Groq returned a non-JSON response (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    const msg = data.error?.message ?? `Groq request failed (HTTP ${res.status}).`;
    throw new Error(msg);
  }

  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("Groq returned an empty response.");
  return { text, model: data.model ?? model };
}
