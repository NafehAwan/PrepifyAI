// Generates re-valued versions of calculation questions from the templates in
// scripts/variant-templates/, so a student who retakes a chapter meets the same
// idea with different numbers. The answer is computed, never guessed.
//
//   node scripts/generate-variants.mjs            # 6 versions per template
//   node scripts/generate-variants.mjs --per=8
//
// Output: content/mcq-bank/generated/<subject>-uNN.json, rewritten from scratch
// on every run. Each template is seeded by its key, so the same templates always
// produce the same questions (and ids) — a student's history stays meaningful.
//
// A template with an `anchor` varies that bank question: its versions join the
// anchor's family, so a test asks the original or one version, never both. A
// template without one is a family of its own.
//
// Template fields: key, chapter, make(rng) → { stem, options, answer } | null,
// and optionally anchor, difficulty (easy | medium | hard), scenario, count,
// fixedStem.

import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readBank, usableQuestions } from "./lib/bank-read.mjs";
import { bankId, fingerprint, questionKey } from "./lib/bank-id.mjs";
import { makeRng } from "./lib/variant-kit.mjs";
import physics from "./variant-templates/physics.mjs";
import chemistry from "./variant-templates/chemistry.mjs";
import maths from "./variant-templates/maths.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const bankDir = join(__dirname, "..", "content", "mcq-bank");
const outDir = join(bankDir, "generated");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const PER = Number(args.per ?? 6);

const SETS = [
  ["Physics", "physics", physics],
  ["Chemistry", "chemistry", chemistry],
  ["Maths", "maths", maths],
];

// Everything already in the bank except earlier generated output.
const chapters = readBank(bankDir).map((c) => ({ ...c, questions: c.questions.filter((q) => q.kind !== "generated") }));
const chapterOf = (subject, seq) => chapters.find((c) => c.subject === subject && c.chapter_seq === seq);

const problems = [];
const out = new Map();
const keys = new Set();
let total = 0;

for (const [subject, slug, templates] of SETS) {
  for (const t of templates) {
    if (keys.has(`${slug}:${t.key}`)) problems.push(`${slug}: duplicate template key ${t.key}`);
    keys.add(`${slug}:${t.key}`);
    const chapter = chapterOf(subject, t.chapter);
    if (!chapter) {
      problems.push(`${t.key}: ${subject} has no chapter ${t.chapter} in the bank`);
      continue;
    }
    if (t.anchor && !usableQuestions(chapter).some((q) => q.id === t.anchor && q.kind !== "variant")) {
      problems.push(`${t.key}: anchor ${t.anchor} is not an askable ${subject} chapter ${t.chapter} question`);
      continue;
    }

    const r = makeRng(`${slug}:${t.key}`);
    const want = t.count ?? PER;
    // Dedupe on the stem alone: two versions with the same wording and different
    // distractors are the same question to a student. A `fixedStem` template
    // ("Which set of lengths can form a triangle?") varies only its options, so
    // it dedupes on stem + options instead.
    const keyOf = (q) => (t.fixedStem ? questionKey(q.stem, q.options) : fingerprint(q.stem));
    const seen = new Set(chapter.questions.map(keyOf));
    const made = [];
    for (let tries = 0; made.length < want && tries < want * 60; tries++) {
      const q = t.make(r);
      if (!q) continue;
      if (q.options.length !== 4 || q.options.some((o) => !String(o).trim()) || new Set(q.options).size !== 4) {
        problems.push(`${t.key}: malformed options ${JSON.stringify(q.options)}`);
        break;
      }
      if (!(q.answer >= 0 && q.answer <= 3)) {
        problems.push(`${t.key}: answer missing from options`);
        break;
      }
      const key = keyOf(q);
      if (seen.has(key)) continue;
      seen.add(key);
      made.push({
        id: bankId(subject, t.chapter, q.stem, q.options),
        stem: q.stem,
        options: q.options,
        answer: q.answer,
        answer_source: "computed",
        difficulty: t.difficulty ?? "medium",
        scenario: Boolean(t.scenario),
        chapter_seq: t.chapter,
        source_file: `template:${t.key}`,
        ...(t.anchor ? { variant_of: t.anchor } : { family: `gen-${slug}-${t.key}` }),
      });
    }
    if (made.length < Math.min(want, 3)) problems.push(`${t.key}: only ${made.length} distinct versions`);

    const file = `${slug}-u${String(t.chapter).padStart(2, "0")}.json`;
    if (!out.has(file)) out.set(file, { subject, chapter_seq: t.chapter, questions: [] });
    out.get(file).questions.push(...made);
    total += made.length;
  }
}

if (problems.length) {
  console.log(`${problems.length} PROBLEMS:`);
  for (const p of problems) console.log(`  ${p}`);
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const [file, bank] of [...out].sort()) writeFileSync(join(outDir, file), JSON.stringify(bank, null, 2) + "\n");
console.log(`Generated ${total} questions from ${keys.size} templates into ${out.size} chapter files.`);
