// A stable id for a bank question: the same subject, chapter, stem and options
// always produce the same id. Variants point at their original through it, and
// it becomes the `family` column in the questions table.
//
// Options are part of the identity because stems repeat: "Choose the correct
// sentence:" or "Choose the synonym of..." head many different questions, and
// a stem-only id made them collide (and made the ingest drop them as
// duplicates).

import { createHash } from "node:crypto";

// NFKC first, so a superscript or subscript digit counts as the digit: H2O,
// H₂O and x², x2 fingerprint the same, and a rendering fix never orphans an
// answer that was already derived for the question.
export function fingerprint(text) {
  return String(text).normalize("NFKC").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Identity of one question: its stem plus its options (order-insensitive, so a
// reshuffled copy is still recognised as the same question).
export function questionKey(stem, options = []) {
  const opts = options.map(fingerprint).sort().join("|");
  return `${fingerprint(stem)}#${opts}`;
}

export function bankId(subject, chapterSeq, stem, options = []) {
  return createHash("sha1").update(`${subject}|${chapterSeq}|${questionKey(stem, options)}`).digest("hex").slice(0, 12);
}
