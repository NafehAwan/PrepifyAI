// Validates content/mcq-bank/ and prints a sample for eyeballing.
//
//   node scripts/check-bank.mjs                       # validate + counts
//   node scripts/check-bank.mjs --sample=10           # plus 10 random questions
//   node scripts/check-bank.mjs --derived --sample=15 # only model-derived answers
//   node scripts/check-bank.mjs --combinations=100    # test-variety check
//
// The --combinations run is the check behind "100 different tests of the same
// subject": it samples repeatedly the way lib/tests/build.ts does and asserts
// the sets really are distinct.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readBank, usableQuestions } from "./lib/bank-read.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const bankDir = join(__dirname, "..", "content", "mcq-bank");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const chapters = readBank(bankDir);

// --- structural validation -------------------------------------------------
const problems = [];
const all = [];
for (const b of chapters) {
  const seen = new Set();
  for (const q of b.questions) {
    all.push({ file: `${q.kind === "original" ? "" : q.kind + "/"}${q.file}`, subject: b.subject, q });
    if (q.options.length !== 4) problems.push(`${b.file}: ${q.options.length} options — ${q.stem.slice(0, 50)}`);
    if (q.options.some((o) => !String(o).trim())) problems.push(`${b.file}: empty option — ${q.stem.slice(0, 50)}`);
    if (q.answer !== null && (q.answer < 0 || q.answer > 3)) problems.push(`${b.file}: answer ${q.answer} out of range`);
    if (q.answer !== null && !"ABCD"[q.answer]) problems.push(`${b.file}: answer ${q.answer} has no letter`);
    const fp = q.stem.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(fp)) problems.push(`${b.file}: duplicate stem — ${q.stem.slice(0, 50)}`);
    seen.add(fp);
  }
}

// --- counts ----------------------------------------------------------------
const bySubject = new Map();
for (const { subject, q } of all) {
  const row = bySubject.get(subject) ?? { total: 0, keyed: 0, derived: 0, authored: 0, variants: 0, lowConf: 0, rejected: 0, missing: 0, scenario: 0, easy: 0, medium: 0, hard: 0 };
  row.total++;
  if (q.kind === "variant") row.variants++;
  if (q.rejected) row.rejected++;
  else if (q.answer === null) row.missing++;
  else if (q.kind === "variant") {
    // counted in the variants column only
  } else if (q.answer_source === "file") row.keyed++;
  else if (q.answer_source === "authored") row.authored++;
  else row.derived++;
  if (q.answer_confidence === "low") row.lowConf++;
  if (q.scenario) row.scenario++;
  row[q.difficulty] = (row[q.difficulty] ?? 0) + 1;
  bySubject.set(subject, row);
}

console.log("Subject           total  from file  derived  authored  variants  (low conf)  rejected  no answer  scenario   easy/med/hard");
for (const [subject, r] of [...bySubject].sort()) {
  console.log(
    `${subject.padEnd(17)} ${String(r.total).padStart(5)}  ${String(r.keyed).padStart(9)}  ${String(r.derived).padStart(7)}  ${String(r.authored).padStart(8)}  ${String(r.variants).padStart(8)}  ${String(r.lowConf).padStart(10)}  ${String(r.rejected).padStart(8)}  ${String(r.missing).padStart(9)}  ${String(r.scenario).padStart(8)}   ${r.easy}/${r.medium}/${r.hard}`,
  );
}
const usable = all.filter(({ q }) => q.answer !== null).length;
const rejected = all.filter(({ q }) => q.rejected).length;
console.log(
  `\n${all.length} questions · ${usable} usable in a test · ${rejected} rejected as defective · ` +
    `${all.length - usable - rejected} awaiting an answer`,
);

if (problems.length) {
  console.log(`\n${problems.length} PROBLEMS:`);
  for (const p of problems.slice(0, 40)) console.log(`  ${p}`);
  if (problems.length > 40) console.log(`  … and ${problems.length - 40} more`);
} else {
  console.log("\nNo structural problems: every question has 4 non-empty options and a letter-mappable answer.");
}

// --- variety: can we build N genuinely different tests? --------------------
if (args.combinations) {
  const wanted = Number(args.combinations);
  const size = Number(args.size ?? 25);
  const subject = args.subject ?? "Chemistry";
  const pool = chapters.filter((c) => c.subject === subject).flatMap((c) => usableQuestions(c));
  const families = new Map();
  for (const q of pool) {
    const f = q.variant_of ?? q.id;
    if (!families.has(f)) families.set(f, []);
    families.get(f).push(q);
  }
  console.log(`\nVariety check — ${wanted} tests of ${size} from ${subject} (${pool.length} questions in ${families.size} families):`);
  if (families.size < size) {
    console.log(`  NOT ENOUGH: fewer families than one test needs.`);
  } else {
    const sets = new Set();
    let internalRepeat = 0;
    let identicalConsecutive = 0;
    let previous = null;
    for (let t = 0; t < wanted; t++) {
      const fams = [...families.values()].sort(() => Math.random() - 0.5).slice(0, size);
      const picked = fams.map((m) => m[Math.floor(Math.random() * m.length)]);
      const famIds = picked.map((q) => q.variant_of ?? q.id);
      if (new Set(famIds).size !== famIds.length) internalRepeat++;
      const fp = picked.map((q) => q.id).sort().join("|");
      sets.add(fp);
      if (fp === previous) identicalConsecutive++;
      previous = fp;
    }
    console.log(`  distinct question sets: ${sets.size}/${wanted}`);
    console.log(`  tests asking two versions of one question: ${internalRepeat}`);
    console.log(`  consecutive tests that were identical: ${identicalConsecutive}`);
    const ok = sets.size === wanted && internalRepeat === 0 && identicalConsecutive === 0;
    console.log(`  ${ok ? "PASS" : "FAIL"}`);
  }
}

// --- sample for manual review ---------------------------------------------
if (args.sample) {
  const n = Number(args.sample);
  let pool = all.filter(({ q }) => q.answer !== null && !q.rejected);
  if (args.derived) pool = pool.filter(({ q }) => q.answer_source === "derived");
  if (args.variants) pool = pool.filter(({ q }) => q.kind === "variant");
  if (args.subject) pool = pool.filter((x) => x.subject === args.subject);
  console.log(`\n--- ${Math.min(n, pool.length)} random ${args.derived ? "DERIVED " : ""}questions to check ---`);
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
  for (const { file, q } of shuffled) {
    console.log(`\n[${file}${q.answer_confidence === "low" ? " · LOW CONFIDENCE" : ""}] ${q.stem}`);
    q.options.forEach((o, i) => console.log(`   ${"ABCD"[i]}${q.answer === i ? " <=" : "  "} ${o}`));
  }
}

process.exit(problems.length > 0 ? 1 : 0);
