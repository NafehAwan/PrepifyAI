// Turns the owner's supplied MCQ .docx files into reviewable JSON under
// content/mcq-bank/, so the bank can be loaded into Postgres (and re-loaded)
// without re-reading the source documents.
//
//   node scripts/ingest-mcqs.mjs --in=<dir-of-docx> [--out=content/mcq-bank] [--dry]
//
// The source .docx/.pdf files are deliberately NOT committed; only the parsed
// JSON is. Files whose source states `Answer: X` come out with that answer and
// `answer_source: "file"`. Files with no answer key come out with
// `answer: null` for scripts/derive-answers.mjs to fill in.

import fs from "node:fs";
import path from "node:path";
import { parseQuestions, looksScenario } from "./lib/mcq-parse.mjs";
import { bankId, fingerprint } from "./lib/bank-id.mjs";
import { docxToText } from "./lib/docx-text.mjs";
import { fixSpelling } from "./lib/spelling.mjs";

// Filename → which subject and chapter the questions belong to. `chapter: null`
// means the file spans several chapters and carries "Chapter N" headings.
// `scenario: true` marks the board-style sets: (D) = Difficult, "Complicated".
const FILES = [
  // Chemistry — units 1-6 have no answer key; 7-12 come in (A)verage / (D)ifficult pairs.
  { re: /^Chem unit#(\d+) MCQs\.docx$/i, subject: "Chemistry", chapter: "$1", difficulty: "medium" },
  { re: /^chem unit#(\d+) MC?Qs ?\(A\)\.docx$/i, subject: "Chemistry", chapter: "$1", difficulty: "easy" },
  { re: /^chem unit#(\d+) MC?Qs ?\(D\)\.docx$/i, subject: "Chemistry", chapter: "$1", difficulty: "hard", scenario: true },

  // Physics — units 1-6 are answer-keyed; the "Complicated" file spans 1-6.
  { re: /^Phy-Unit (\d+) MCQS\.docx$/i, subject: "Physics", chapter: "$1", difficulty: "medium" },
  { re: /^Mcqs CH 1-6 phy-IX \(Complicated\)\.docx$/i, subject: "Physics", chapter: null, difficulty: "hard", scenario: true },

  // Maths — no answer keys at all.
  { re: /^Maths-UNIT (\d+)\s+SET # \d+\.docx$/i, subject: "Maths", chapter: "$1", difficulty: "medium" },
  { re: /^Maths-Unit = (\d+) ?\(? ?Set \d+\)?.*\.docx$/i, subject: "Maths", chapter: "$1", difficulty: "medium" },

  // Computer Science — no answer keys.
  { re: /^Unit1_Computer_Systems_MCQs_Straight\.docx$/i, subject: "Computer Science", chapter: 1, difficulty: "easy" },
  { re: /^Unit_2_mcqs_done\.docx$/i, subject: "Computer Science", chapter: 2, difficulty: "medium" },
  { re: /^Unit_3_Programming_Fundamentals_MCQs-v2\.docx$/i, subject: "Computer Science", chapter: 3, difficulty: "medium" },
  // Not an MCQ file: a written question-and-answer worksheet. Parsing it as
  // MCQs produces fragments of model answers as "options".
  { re: /^computer chapter # 0?5 .*\.docx$/i, skip: true },
  { re: /^Unit_6_Impacts_of_Computing\.docx$/i, subject: "Computer Science", chapter: 6, difficulty: "medium" },
  { re: /^Entrepreneurship_MCQs_Bank-v2\.docx$/i, subject: "Computer Science", chapter: 7, difficulty: "medium" },

  // Biology is not one of the five offered subjects — skipped on purpose.
  { re: /Biology/i, skip: true },
];

const SUBJECT_SLUG = {
  Chemistry: "chemistry",
  Physics: "physics",
  Maths: "maths",
  "Computer Science": "computer-science",
  English: "english",
};

function matchFile(name) {
  for (const rule of FILES) {
    const m = rule.re.exec(name);
    if (!m) continue;
    if (rule.skip) return { skip: true };
    let chapter = rule.chapter;
    if (typeof chapter === "string" && chapter.startsWith("$")) chapter = Number(m[Number(chapter.slice(1))]);
    return { ...rule, chapter };
  }
  return null;
}


const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
if (!args.in) {
  console.error("usage: node scripts/ingest-mcqs.mjs --in=<dir-of-docx> [--out=content/mcq-bank] [--dry]");
  process.exit(1);
}
const outDir = path.resolve(args.out ?? "content/mcq-bank");
if (!args.dry) fs.mkdirSync(outDir, { recursive: true });

// subject → chapter_seq → questions
const banks = new Map();
const report = [];
let unmatched = [];

for (const name of fs.readdirSync(args.in).sort()) {
  if (!name.toLowerCase().endsWith(".docx")) continue;
  const rule = matchFile(name);
  if (!rule) {
    unmatched.push(name);
    continue;
  }
  if (rule.skip) continue;

  const { layout, questions, key } = parseQuestions(docxToText(path.join(args.in, name)), rule.chapter);
  let kept = 0;
  let keyed = 0;
  for (const q of questions) {
    if (!q.chapter_seq) continue; // a spanning file's question before its first heading
    q.stem = fixSpelling(q.stem, rule.subject);
    q.options = q.options.map((o) => fixSpelling(o, rule.subject));
    const subject = rule.subject;
    if (!banks.has(subject)) banks.set(subject, new Map());
    const byChapter = banks.get(subject);
    if (!byChapter.has(q.chapter_seq)) byChapter.set(q.chapter_seq, []);
    byChapter.get(q.chapter_seq).push({
      id: bankId(rule.subject, q.chapter_seq, q.stem),
      stem: q.stem,
      options: q.options,
      answer: q.answer,
      answer_source: q.answer_source,
      ...(q.explanation ? { explanation: q.explanation } : {}),
      difficulty: rule.difficulty,
      scenario: looksScenario(q.stem, !!rule.scenario),
      chapter_seq: q.chapter_seq,
      source_file: name,
    });
    kept++;
    if (q.answer !== null) keyed++;
  }
  report.push({ name, subject: rule.subject, layout, parsed: questions.length, kept, keyed, key });
}

// Drop questions that repeat a stem within the same chapter — several files
// overlap, and a test must never ask the same thing twice.
let duplicates = 0;
for (const byChapter of banks.values()) {
  for (const [seq, list] of byChapter) {
    const seen = new Set();
    const unique = [];
    for (const q of list) {
      const fingerprint = q.stem.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (seen.has(fingerprint)) {
        duplicates++;
        continue;
      }
      seen.add(fingerprint);
      unique.push(q);
    }
    byChapter.set(seq, unique);
  }
}

// Carry over answers derived since the last run. Re-parsing the documents
// yields answer:null for every unkeyed question, and silently discarding
// hundreds of derived answers would be an expensive mistake.
let carried = 0;
for (const [subject, byChapter] of banks) {
  for (const [seq, list] of byChapter) {
    const file = path.join(outDir, `${SUBJECT_SLUG[subject]}-u${String(seq).padStart(2, "0")}.json`);
    if (!fs.existsSync(file)) continue;
    const previous = new Map(
      JSON.parse(fs.readFileSync(file, "utf8")).questions.map((q) => [fingerprint(q.stem), q]),
    );
    for (const q of list) {
      const old = previous.get(fingerprint(q.stem));
      if (q.answer !== null || !old) continue;
      if (old.answer !== null) {
        q.answer = old.answer;
        q.answer_source = old.answer_source;
        if (old.answer_confidence) q.answer_confidence = old.answer_confidence;
        carried++;
      } else if (old.rejected) {
        // A question judged defective stays out of tests across re-runs.
        q.rejected = old.rejected;
        carried++;
      }
    }
  }
}

// Write one file per subject+chapter.
let written = 0;
let totals = { all: 0, keyed: 0, derived: 0, rejected: 0, scenario: 0 };
for (const [subject, byChapter] of [...banks].sort()) {
  for (const [seq, list] of [...byChapter].sort((a, b) => a[0] - b[0])) {
    totals.all += list.length;
    totals.keyed += list.filter((q) => q.answer_source === "file").length;
    totals.derived += list.filter((q) => q.answer_source === "derived").length;
    totals.rejected += list.filter((q) => q.rejected).length;
    totals.scenario += list.filter((q) => q.scenario).length;
    if (args.dry) continue;
    const file = path.join(outDir, `${SUBJECT_SLUG[subject]}-u${String(seq).padStart(2, "0")}.json`);
    fs.writeFileSync(file, JSON.stringify({ subject, chapter_seq: seq, questions: list }, null, 2) + "\n");
    written++;
  }
}

console.log("\nPer-file parse:");
for (const r of report) {
  const keyNote =
    r.key.status === "applied"
      ? ` · end-of-document key applied`
      : r.key.status === "mismatch"
        ? ` · KEY NOT APPLIED: ${r.key.entries} entries vs ${r.parsed} questions${r.key.conflicts ? `, ${r.key.conflicts} conflicts` : ""}`
        : "";
  console.log(`  ${r.kept.toString().padStart(4)} kept (${r.keyed} keyed) [${r.layout.padEnd(8)}] ${r.name}${keyNote}`);
}
console.log("\nPer subject / chapter:");
for (const [subject, byChapter] of [...banks].sort()) {
  const counts = [...byChapter]
    .sort((a, b) => a[0] - b[0])
    .map(([seq, l]) => `u${seq}:${l.length}`)
    .join(" ");
  const n = [...byChapter.values()].reduce((a, l) => a + l.length, 0);
  console.log(`  ${subject.padEnd(17)} ${String(n).padStart(4)}  ${counts}`);
}
console.log(
  `\nTotal ${totals.all} questions · ${totals.keyed} answers from the files · ${totals.derived} derived · ` +
    `${totals.rejected} rejected as defective · ${totals.all - totals.keyed - totals.derived - totals.rejected} still need an answer · ` +
    `${totals.scenario} scenario-style · ${duplicates} duplicates dropped` +
    (carried ? ` · ${carried} earlier judgements carried over` : ""),
);
if (unmatched.length) console.log(`\nUnmatched files (no rule):\n  ${unmatched.join("\n  ")}`);
if (!args.dry) console.log(`\nWrote ${written} files to ${outDir}`);
