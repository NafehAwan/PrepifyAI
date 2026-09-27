// Writes the English MCQ bank that no source document covered.
//
//   node scripts/generate-english-bank.mjs                  # all 12 units
//   node scripts/generate-english-bank.mjs --unit=3 --per=20
//   node scripts/generate-english-bank.mjs --dry
//
// Needs GROQ_API_KEY. The owner supplied no English files, and generating
// English questions per request would make English the one subject that breaks
// when the shared key is rate-limited. So it is generated ONCE, offline, into
// content/mcq-bank/english-uNN.json and committed like every other subject --
// after which no test of any subject costs an API call.
//
// Resumable: a unit whose file already holds enough questions is skipped.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
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
const BASE = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
const PER_UNIT = Number(args.per ?? 45);
const CHUNK = 15; // questions per request — small enough to stay well-formed
const PAUSE_MS = 1500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chapters = JSON.parse(readFileSync(join(root, "content", "chapters-9.json"), "utf8"));
const english = chapters.subjects.find((s) => s.subject === "English");
if (!english) {
  console.error("No English entry in content/chapters-9.json.");
  process.exit(1);
}

// Mirrors MCQ_STYLE_GUIDE in lib/ai/prompts.ts. Kept as its own copy because a
// Node script cannot import the TypeScript module, and drifting apart is less
// harmful than adding a build step for one string.
const STYLE = `HOUSE STYLE — match the FBISE Class 9 board paper:
1. Exactly 4 options. Exactly one is correct.
2. Options are short, parallel and the same grammatical shape — a phrase or a
   word, not a sentence. Never "All of the above" or "None of these".
3. Distractors must be the mistakes a real student makes: a confused
   near-synonym, the opposite meaning, the wrong part of speech, a wrong tense.
4. A SCENARIO question sets up a short concrete situation in one or two
   sentences and then asks what follows, ending in a colon or a question mark.
5. A CONCEPT question is direct recall or understanding, one step, no setup.
6. Plain FBISE textbook wording. Keep stems under 45 words.
7. Vary which option letter is correct across the set.`;

const SYSTEM = `You are an FBISE paper-setter writing English MCQs for Class 9.

${STYLE}

Cover the range an English paper actually tests for the given unit: vocabulary
in context from the text, comprehension of what the text says, grammar and
tenses, parts of speech, active/passive, punctuation, and for a poem its imagery
and theme. Do not invent quotations from the text -- ask about language and
meaning a student could answer from having studied the unit.

Return STRICT JSON only:
{"questions":[{"stem":"...","options":["...","...","...","..."],"answer":0,"scenario":false,"difficulty":"easy"}]}
- answer: the 0-based index (0-3) of the correct option.
- scenario: true when the question sets up a situation, per the house style.
- difficulty: "easy", "medium" or "hard".`;

async function pickModel() {
  if (process.env.PREPIFY_MODEL) return process.env.PREPIFY_MODEL;
  const res = await fetch(`${BASE}/models`, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!res.ok) throw new Error(`Could not list models (HTTP ${res.status}).`);
  const ids = ((await res.json()).data ?? [])
    .filter((m) => m.active !== false)
    .map((m) => m.id)
    .filter((id) => !/whisper|tts|guard|embed|distil/i.test(id));
  for (const re of [/(^|[^\d])120b/i, /(^|[^\d])70b/i, /gpt-oss/i, /8b.*instant/i, /llama/i]) {
    const hit = ids.find((id) => re.test(id));
    if (hit) return hit;
  }
  if (ids.length === 0) throw new Error("This key has no usable models.");
  return ids[0];
}

// Board papers are scenario-heavy, so ask for a matching share per chunk.
function askFor(unitTitle, n, scenarioShare) {
  return `Unit ${unitTitle}.

Write ${n} multiple-choice questions on this unit.
About ${scenarioShare}% must be SCENARIO questions; the rest CONCEPT questions.
Mix the difficulties: roughly a third easy, a third medium, a third hard.
Write a FRESH set — do not repeat phrasings you have used before.`;
}

async function generate(model, unitTitle, n, scenarioShare) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model,
        temperature: 0.9, // variety matters here, unlike answer derivation
        max_tokens: 900 + n * 240,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: askFor(unitTitle, n, scenarioShare) },
        ],
      }),
    });

    if (res.status === 429) {
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
      if (Array.isArray(parsed.questions)) return parsed.questions;
    } catch {
      // retry — a malformed chunk is cheap to re-ask
    }
    console.log("    unparseable reply, retrying");
    await sleep(1500);
  }
  return [];
}

// Only well-formed questions reach the bank; the loader would reject the rest
// anyway, and a half-valid question is worse than a missing one.
function clean(raw, seq) {
  const out = [];
  for (const q of raw) {
    if (typeof q?.stem !== "string" || !Array.isArray(q.options) || q.options.length !== 4) continue;
    if (q.options.some((o) => typeof o !== "string" || !o.trim())) continue;
    const answer = Number(q.answer);
    if (!Number.isInteger(answer) || answer < 0 || answer > 3) continue;
    const difficulty = ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium";
    out.push({
      stem: q.stem.trim(),
      options: q.options.map((o) => o.trim()),
      answer,
      // Generated, so never authoritative — flagged for the same spot-check as
      // any other derived answer.
      answer_source: "derived",
      difficulty,
      scenario: !!q.scenario,
      chapter_seq: seq,
      source_file: "generated",
    });
  }
  return out;
}

console.log(`English: ${english.chapters.length} units, aiming for ${PER_UNIT} questions each.`);
if (args.dry) {
  english.chapters.forEach((t, i) => console.log(`  u${i + 1}: ${t}`));
  process.exit(0);
}
if (!KEY) {
  console.error("\nGROQ_API_KEY is not set. Add it to .env.local or the environment, then re-run.");
  process.exit(1);
}

mkdirSync(bankDir, { recursive: true });
const model = await pickModel();
console.log(`Using model ${model}.\n`);

let written = 0;
for (let i = 0; i < english.chapters.length; i++) {
  const seq = i + 1;
  if (args.unit && Number(args.unit) !== seq) continue;
  const title = english.chapters[i];
  const path = join(bankDir, `english-u${String(seq).padStart(2, "0")}.json`);

  let existing = [];
  if (existsSync(path)) existing = JSON.parse(readFileSync(path, "utf8")).questions ?? [];
  if (existing.length >= PER_UNIT) {
    console.log(`u${seq} ${title} — already has ${existing.length}, skipping`);
    continue;
  }

  console.log(`u${seq} ${title} — have ${existing.length}, want ${PER_UNIT}`);
  const seen = new Set(existing.map((q) => q.stem.toLowerCase().replace(/[^a-z0-9]/g, "")));

  while (existing.length < PER_UNIT) {
    const need = Math.min(CHUNK, PER_UNIT - existing.length);
    // Alternate the scenario weighting so a unit ends up with a real spread
    // rather than 45 questions of the same shape.
    const share = existing.length < PER_UNIT / 2 ? 25 : 65;
    const batch = clean(await generate(model, title, need, share), seq);
    const fresh = batch.filter((q) => {
      const fp = q.stem.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (seen.has(fp)) return false;
      seen.add(fp);
      return true;
    });
    if (fresh.length === 0) {
      console.log(`    no new questions came back — stopping this unit at ${existing.length}`);
      break;
    }
    existing = [...existing, ...fresh];
    writeFileSync(path, JSON.stringify({ subject: "English", chapter_seq: seq, questions: existing }, null, 2) + "\n");
    console.log(`    +${fresh.length} (${existing.length}/${PER_UNIT})`);
    await sleep(PAUSE_MS);
  }
  written++;
}

console.log(`\nWrote ${written} English unit file(s).`);
console.log("Then: node scripts/check-bank.mjs --subject=English --sample=10");
