// Compiles hand-written question sets in content/authored/*.txt into the bank.
//
//   node scripts/compile-authored.mjs
//
// Each .txt file starts with a header of "# key: value" lines:
//   # subject: Computer Science
//   # chapter: 4
//   # kind: questions | variants          (default questions)
//   # source: <where the questions came from>
//   # answer_source: file | authored      (file = transcribed with the source's key)
//   # difficulty: easy | medium | hard    (default for the file)
//
// then one question per line:
//   stem | option A | option B | option C | option D | ANSWER [| flags]
//
// ANSWER is a letter A-D. Optional flags, space-separated: s (scenario),
// e/m/h (difficulty override), and for variants v:<family id> naming the
// original question the line rewords. Blank lines and "//" comments are ignored.
//
// Output: content/mcq-bank/extra/<subject>-uNN.json for new questions and
// content/mcq-bank/variants/<subject>-uNN.json for variants. The ingest never
// writes those folders, so re-parsing the source documents cannot clobber them.

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { bankId, fingerprint } from "./lib/bank-id.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const srcDir = join(root, "content", "authored");
const bankDir = join(root, "content", "mcq-bank");

const SLUG = { Chemistry: "chemistry", Physics: "physics", Maths: "maths", "Computer Science": "computer-science", English: "english" };

// Every original question id, so a variant pointing at a missing original fails loudly.
const originalIds = new Set();
for (const f of readdirSync(bankDir).filter((f) => f.endsWith(".json"))) {
  for (const q of JSON.parse(readFileSync(join(bankDir, f), "utf8")).questions) originalIds.add(q.id);
}
if (existsSync(join(bankDir, "extra"))) {
  for (const f of readdirSync(join(bankDir, "extra")).filter((f) => f.endsWith(".json"))) {
    for (const q of JSON.parse(readFileSync(join(bankDir, "extra", f), "utf8")).questions) originalIds.add(q.id);
  }
}

const out = new Map(); // "<kind>/<slug>-uNN.json" -> { subject, chapter_seq, questions }
const problems = [];

const files = existsSync(srcDir) ? readdirSync(srcDir).filter((f) => f.endsWith(".txt")).sort() : [];
// Extra (new) questions first, so variants of them can be validated in the same run.
files.sort((a, b) => Number(/variants/.test(a)) - Number(/variants/.test(b)));

for (const file of files) {
  const text = readFileSync(join(srcDir, file), "utf8");
  const meta = {};
  const lines = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("//")) continue;
    const m = /^#\s*([a-z_]+)\s*:\s*(.*)$/.exec(line);
    if (m) meta[m[1]] = m[2].trim();
    else lines.push(line);
  }
  const subject = meta.subject;
  const chapter = Number(meta.chapter);
  const kind = meta.kind === "variants" ? "variants" : "extra";
  if (!SLUG[subject] || !chapter) {
    problems.push(`${file}: header needs a valid subject and chapter`);
    continue;
  }
  const key = `${kind}/${SLUG[subject]}-u${String(chapter).padStart(2, "0")}.json`;
  if (!out.has(key)) out.set(key, { subject, chapter_seq: chapter, questions: [] });
  const target = out.get(key).questions;
  const seen = new Set(target.map((q) => fingerprint(q.stem)));

  lines.forEach((line, i) => {
    const parts = line.split(" | ").map((p) => p.trim());
    if (parts.length < 6) {
      problems.push(`${file}:${i + 1}: expected stem | 4 options | answer, got ${parts.length} fields`);
      return;
    }
    const [stem, a, b, c, d, answer, flags = ""] = parts;
    const options = [a, b, c, d];
    const idx = "ABCD".indexOf(answer.toUpperCase());
    const flagSet = flags.split(/\s+/).filter(Boolean);
    const variantOf = flagSet.find((f) => f.startsWith("v:"))?.slice(2);
    const difficulty =
      flagSet.includes("h") ? "hard" : flagSet.includes("e") ? "easy" : flagSet.includes("m") ? "medium" : meta.difficulty || "medium";

    if (idx < 0) return problems.push(`${file}:${i + 1}: answer "${answer}" is not A-D`);
    if (options.some((o) => !o)) return problems.push(`${file}:${i + 1}: empty option`);
    if (new Set(options.map((o) => o.toLowerCase())).size !== 4) return problems.push(`${file}:${i + 1}: repeated option`);
    if (kind === "variants" && !variantOf) return problems.push(`${file}:${i + 1}: variant without v:<id>`);
    if (variantOf && !originalIds.has(variantOf)) return problems.push(`${file}:${i + 1}: v:${variantOf} is not a bank question`);
    if (seen.has(fingerprint(stem))) return problems.push(`${file}:${i + 1}: duplicate stem in this chapter`);
    seen.add(fingerprint(stem));

    const q = {
      id: bankId(subject, chapter, stem),
      stem,
      options,
      answer: idx,
      answer_source: meta.answer_source === "file" ? "file" : "authored",
      difficulty,
      scenario: flagSet.includes("s"),
      chapter_seq: chapter,
      source_file: meta.source || file,
    };
    if (variantOf) q.variant_of = variantOf;
    target.push(q);
    if (kind === "extra") originalIds.add(q.id);
  });
}

for (const [key, bank] of out) {
  mkdirSync(join(bankDir, dirname(key)), { recursive: true });
  writeFileSync(join(bankDir, key), JSON.stringify(bank, null, 2) + "\n");
}
const count = [...out.values()].reduce((n, b) => n + b.questions.length, 0);
console.log(`Compiled ${count} questions into ${out.size} files.`);
if (problems.length) {
  console.log(`\n${problems.length} PROBLEMS:`);
  for (const p of problems) console.log(`  ${p}`);
  process.exit(1);
}
