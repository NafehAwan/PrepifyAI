// A stable id for a bank question: the same subject, chapter and stem always
// produce the same id. Variants point at their original through it, and it
// becomes the `family` column in the questions table.

import { createHash } from "node:crypto";

export function fingerprint(stem) {
  return String(stem).toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function bankId(subject, chapterSeq, stem) {
  return createHash("sha1").update(`${subject}|${chapterSeq}|${fingerprint(stem)}`).digest("hex").slice(0, 12);
}
