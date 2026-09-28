// Reads the whole question bank: the parsed originals in content/mcq-bank/,
// new questions in content/mcq-bank/extra/, hand-reworded variants in
// content/mcq-bank/variants/ and re-valued calculations generated from
// templates in content/mcq-bank/generated/, grouped by subject and chapter.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

function readDir(dir, kind) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({ file: f, kind, ...JSON.parse(readFileSync(join(dir, f), "utf8")) }));
}

const FOLDER = { original: "", extra: "extra/", variant: "variants/", generated: "generated/" };

// A question's family: every version of one question shares it, and a test
// asks at most one member of a family.
export const familyOf = (q) => q.variant_of ?? q.family ?? q.id;

// Returns [{ key, subject, chapter_seq, files, questions }] where every question
// carries `kind` ("original" | "extra" | "variant" | "generated") and `file`.
export function readBank(bankDir) {
  const all = [
    ...readDir(bankDir, "original"),
    ...readDir(join(bankDir, "extra"), "extra"),
    ...readDir(join(bankDir, "variants"), "variant"),
    ...readDir(join(bankDir, "generated"), "generated"),
  ];
  const byChapter = new Map();
  for (const b of all) {
    const key = `${b.subject}::${b.chapter_seq}`;
    if (!byChapter.has(key)) byChapter.set(key, { key, subject: b.subject, chapter_seq: b.chapter_seq, files: [], questions: [] });
    const entry = byChapter.get(key);
    entry.files.push(`${FOLDER[b.kind]}${b.file}`);
    for (const q of b.questions) entry.questions.push({ ...q, kind: b.kind, file: b.file });
  }
  return [...byChapter.values()].sort((a, b) => a.subject.localeCompare(b.subject) || a.chapter_seq - b.chapter_seq);
}

// Only questions a test may ask: answered, not rejected, and — for a version
// of another question — that original must itself be askable.
export function usableQuestions(chapter) {
  const askable = (q) => q.answer !== null && q.answer >= 0 && q.answer <= 3 && !q.rejected;
  const isVersion = (q) => q.kind === "variant" || q.kind === "generated";
  const okIds = new Set(chapter.questions.filter((q) => !isVersion(q) && askable(q)).map((q) => q.id));
  return chapter.questions.filter((q) => askable(q) && (!q.variant_of || okIds.has(q.variant_of)));
}
