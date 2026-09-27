// Fills in the answers the source documents never stated.
//
//   node scripts/derive-answers.mjs                     # every subject
//   node scripts/derive-answers.mjs --subject=Maths     # one subject
//   node scripts/derive-answers.mjs --limit=50 --dry
//
// Needs GROQ_API_KEY. Roughly half the owner's files have no answer key at all
// (Chemistry units 1-6, every Maths set, the Physics "Complicated" set, and all
// of Computer Science), so the model has to solve those questions. Each one it
// answers is marked answer_source "derived", which is the flag to spot-check --
// a wrong derived answer marks a correct student answer wrong.
//
// Resumable and cheap to re-run: only questions still at answer:null are sent,
// and the bank file is rewritten after every batch.

import { readFileSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const bankDir = join(root, "content", "mcq-bank");

function loadEnv() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const KEY = process.env.GROQ_API_KEY ?? "";
if (!KEY && !args.dry) {
  console.error(
    "GROQ_API_KEY is not set.\n" +
      "Add it to .env.local or the environment, then re-run. Use --dry to see what would be sent.",
  );
  process.exit(1);
}

const BASE = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
const BATCH = 10; // small batches: a failure costs little and stays inside token limits
const PAUSE_MS = 1500; // stay under the free tier's per-minute limits

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Pick the strongest model this key can reach. Answer quality is what matters
// here and the script runs offline, so latency is irrelevant.
const PREFERENCE = [/(^|[^\d])120b/i, /(^|[^\d])70b/i, /gpt-oss/i, /8b.*instant/i, /llama/i];

async function pickModel() {
  if (process.env.PREPIFY_MODEL) return process.env.PREPIFY_MODEL;
  const res = await fetch(`${BASE}/models`, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!res.ok) throw new Error(`Could not list models (HTTP ${res.status}).`);
  const ids = ((await res.json()).data ?? [])
    .filter((m) => m.active !== false)
    .map((m) => m.id)
    .filter((id) => !/whisper|tts|guard|embed|distil/i.test(id));
  for (const re of PREFERENCE) {
    const hit = ids.find((id) => re.test(id));
    if (hit) return hit;
  }
  if (ids.length === 0) throw new Error("This key has no usable models.");
  return ids[0];
}

const SYSTEM = `You are an FBISE Class 9 examiner marking a question paper.
For each numbered question you are given, decide which ONE option is correct.
Work it out properly: for a calculation, compute it; for a definition, recall the
textbook meaning. If two options look right, pick the one the FBISE textbook
would call correct.
Return STRICT JSON only, no prose:
{"answers":[{"n":1,"answer":"A","confidence":"high"}]}
- n: the question number exactly as given.
- answer: one letter, A, B, C or D.
- confidence: "high" when you are sure, "low" when you are guessing.
Include every question. Never leave one out.`;

function userMessage(subject, chapter, batch) {
  const body = batch
    .map(
      ({ n, q }) =>
        `${n}. ${q.stem}\n` + q.options.map((o, i) => `   ${"ABCD"[i]}) ${o}`).join("\n"),
    )
    .join("\n\n");
  return `Subject: ${subject}, Class 9, chapter/unit ${chapter}.\n\n${body}`;
}

async function askGroq(model, subject, chapter, batch) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model,
        temperature: 0, // deciding a correct answer is not a creative task
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMessage(subject, chapter, batch) },
        ],
      }),
    });

    if (res.status === 429) {
      // Respect the server's own backoff when it gives one.
      const wait = Number(res.headers.get("retry-after")) * 1000 || 5000 * (attempt + 1);
      console.log(`    rate limited, waiting ${Math.round(wait / 1000)}s`);
      await sleep(wait);
      continue;
    }
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      console.log(`    HTTP ${res.status}${data?.error?.message ? `: ${data.error.message}` : ""}`);
      await sleep(2000 * (attempt + 1));
      continue;
    }

    let text = (data.choices?.[0]?.message?.content ?? "").trim();
    if (text.startsWith("```")) text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.answers)) return parsed.answers;
    } catch {
      // fall through and retry — a malformed batch is cheap to re-ask
    }
    console.log("    unparseable reply, retrying");
    await sleep(1500);
  }
  return null;
}

const files = readdirSync(bankDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

let pending = 0;
for (const f of files) {
  const bank = JSON.parse(readFileSync(join(bankDir, f), "utf8"));
  if (args.subject && bank.subject !== args.subject) continue;
  pending += bank.questions.filter((q) => q.answer === null).length;
}
console.log(`${pending} questions still need an answer.`);
if (args.dry || pending === 0) process.exit(0);

const model = await pickModel();
console.log(`Using model ${model}.\n`);

const limit = args.limit ? Number(args.limit) : Infinity;
let done = 0;
let lowConfidence = 0;

for (const f of files) {
  if (done >= limit) break;
  const path = join(bankDir, f);
  const bank = JSON.parse(readFileSync(path, "utf8"));
  if (args.subject && bank.subject !== args.subject) continue;

  const todo = bank.questions
    .map((q, i) => ({ n: i + 1, i, q }))
    .filter(({ q }) => q.answer === null);
  if (todo.length === 0) continue;

  console.log(`${f} — ${todo.length} to derive`);
  for (let start = 0; start < todo.length && done < limit; start += BATCH) {
    const batch = todo.slice(start, start + BATCH);
    const answers = await askGroq(model, bank.subject, bank.chapter_seq, batch);
    if (!answers) {
      console.log(`    giving up on questions ${batch[0].n}-${batch[batch.length - 1].n}`);
      continue;
    }

    const byNumber = new Map(answers.map((a) => [Number(a.n), a]));
    let filled = 0;
    for (const { n, i } of batch) {
      const a = byNumber.get(n);
      const idx = "ABCD".indexOf(String(a?.answer ?? "").trim().toUpperCase());
      if (idx < 0) continue; // unusable — leave it null for the next run
      bank.questions[i].answer = idx;
      bank.questions[i].answer_source = "derived";
      bank.questions[i].answer_confidence = a.confidence === "low" ? "low" : "high";
      if (a.confidence === "low") lowConfidence++;
      filled++;
      done++;
    }
    // Written after every batch so an interrupted run loses nothing.
    writeFileSync(path, JSON.stringify(bank, null, 2) + "\n");
    console.log(`    ${batch[0].n}-${batch[batch.length - 1].n}: filled ${filled}/${batch.length}`);
    await sleep(PAUSE_MS);
  }
}

console.log(`\nDerived ${done} answers (${lowConfidence} flagged low-confidence).`);
console.log("Spot-check the derived ones before trusting them, Maths especially:");
console.log("  node scripts/check-bank.mjs --derived --sample=15");
