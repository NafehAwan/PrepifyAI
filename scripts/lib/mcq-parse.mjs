// Deterministic MCQ parser for the FBISE Class 9 question bank the owner supplied.
//
// The 47 .docx files use four option layouts, so the parser detects the layout
// per file rather than assuming one:
//
//   paren   "(A) inorganic Chemistry"        — Chem units 1-6
//   letter  "A) Redox reaction"              — Chem 7-12, Physics, Computer
//   dot     "○ A. (15x)(y)"                  — Maths sets 4-6
//   bare    "Exothermic"  (no label at all)  — Chem 8(D), Maths set 3, Physics "Complicated"
//
// Roughly half the files state `Answer: C` after each question; that is
// authoritative and copied verbatim. The rest have no key at all, so questions
// come out with `answer: null` for the separate derive pass to fill in.

const FIGURE = "[figure]"; // see scripts/lib/docx-text.mjs

const LABEL_RE = /^(?:[○●■☐✓•*‑-]\s*)?\(?([A-Da-d])\)?\s*[.):\]]\s*(.*)$/;
const ANSWER_RE = /^(?:Answer|Ans|Correct answer|Correct option|Key)\s*[:.\-]?\s*\(?([A-Da-d])\)?\b/i;
// Headings look like "Chapter 7: Electrochemistry", "UNIT = 3 (SETS)" or
// "Chapter 8_Energetics" — so the number may be followed by an underscore,
// which is a word character and would defeat a \\b anchor. The length guard
// keeps a stem that happens to start with "Unit 5 ..." from being eaten.
const CHAPTER_RE = /^(?:Chapter|CHAPTER|Unit|UNIT)\s*[#=:]?\s*0*(\d{1,2})(?!\d)(?=[^?]{0,60}$)/;

// Boilerplate that is never part of a question.
const NOISE_RE = new RegExp(
  [
    "^(SET|Section|Tick|Level|Name|Roll|Time|Marks|Total|Class|Subject|Instructions?|Note)\\b",
    "^(Multiple Choice|Choose the correct|Encircle)\\s*[:.]?\\s*$", // NOT "Answer Key": splitKey needs that heading
    "^Page\\s*\\d+", // page furniture
    "^\\d{4,}[A-Za-z]?$", // ids left behind by embedded drawings
    "^0+[A-Za-z]?$",
    "^[\\s\\d.,()\\-]{0,4}$", // lone numbers / stray punctuation
  ].join("|"),
);

// Stem numbering ("1.", "Q3)", "12 -") is dropped so the stem reads cleanly.
const STEM_NUM_RE = /^(?:Q\s*)?0*(\d{1,3})\s*[.)\-:]\s*/;

// Board-style scenario cues. `(D)` / "Complicated" files are scenario sets by
// construction; these catch the scenario questions inside mixed files.
const SCENARIO_RE = new RegExp(
  [
    "\\b(a|an|the|one)\\s+(student|chemist|scientist|engineer|technician|teacher|farmer|driver|shopkeeper|patient|worker|boy|girl|user|programmer|company|factory|labourer|cyclist|athlete|swimmer|nurse|doctor|mechanic|carpenter|gardener)\\b",
    "^(During|While|Suppose|Consider|Imagine|In an experiment|In a laboratory|If a|If an|A group of|Two friends|After)\\b",
    "\\b(is observed|observes|notices|measures|is heated|is placed|is connected|is dropped|is mixed|experiment)\\b",
  ].join("|"),
  "i",
);

export function looksScenario(stem, fileIsScenarioSet) {
  if (fileIsScenarioSet) return true;
  return SCENARIO_RE.test(stem);
}

function clean(line) {
  return line
    // The Maths sets prefix option labels with zero-width spaces.
    .replace(/[\u200B-\u200D\uFEFF\u2060]/g, "")
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    // Math-italic letters (𝐿𝑖, 𝑪𝒔) typed with an equation font, back to plain.
    .replace(/[\u{1D400}-\u{1D7FF}]/gu, (ch) => ch.normalize("NFKC"))
    .replace(/\s+/g, " ")
    .trim();
}

// Splits raw document text into the lines a question can be built from.
//
// A paragraph holding nothing but a picture is folded into the line before it,
// so the question that needs the picture carries the marker (and is dropped by
// makeQuestion) without knocking the stem/option line count out of step.
export function toLines(text) {
  const out = [];
  for (const raw of text.split("\n")) {
    const line = clean(raw);
    if (line.length === 0 || NOISE_RE.test(line)) continue;
    // One picture or several side by side — either way the line is only pictures.
    if (line.replaceAll(FIGURE, "").trim() === "" && out.length > 0) {
      out[out.length - 1] += ` ${FIGURE}`;
      continue;
    }
    out.push(line);
  }
  return out;
}

// Which option layout dominates this file.
export function detectLayout(lines) {
  let labelled = 0;
  for (const l of lines) {
    const m = LABEL_RE.exec(l);
    // A label only counts when it is followed by option text, so a stem like
    // "A. Explain..." in prose doesn't tip the count on its own.
    if (m && m[2].trim().length > 0) labelled++;
  }
  return labelled >= 8 ? "labelled" : "bare";
}

// Every one of these documents keeps a stem in a single paragraph, so the lines
// before it are furniture (a unit title, "Multiple Choice Questions (MCQs)",
// "Tick the correct option") and must not be glued onto the question. The only
// exception is a stem broken mid-sentence by a manual line break, which is why
// a short or clearly-continuing tail pulls the previous line back in.
function pickStem(stemLines) {
  if (stemLines.length <= 1) return stemLines.join(" ");
  const last = stemLines[stemLines.length - 1];
  const bare = last.replace(STEM_NUM_RE, "");
  const continues = bare.length < 25 || /^[a-z(=+\-]/.test(bare);
  return continues ? stemLines.slice(-2).join(" ") : last;
}

// A parsed question, or null when the block didn't look like one — or when it
// depends on a diagram the app has no way to show.
function makeQuestion(stemLines, options, answerLetter, chapter) {
  if (options.length !== 4) return null;
  if (stemLines.some((l) => l.includes(FIGURE)) || options.some((o) => o.includes(FIGURE))) return null;
  const normalised = options.map((o) => clean(o).toLowerCase());
  if (new Set(normalised).size !== 4) return null; // a repeated option makes the question ambiguous
  const stem = clean(pickStem(stemLines)).replace(STEM_NUM_RE, "");
  if (stem.length < 8) return null;
  if (options.some((o) => o.length === 0)) return null;
  const answer = answerLetter ? "ABCD".indexOf(answerLetter.toUpperCase()) : null;
  return {
    stem,
    options,
    answer: answer === -1 ? null : answer,
    answer_source: answer === null || answer === -1 ? null : "file",
    chapter_seq: chapter,
  };
}

// Layout with explicit A/B/C/D labels. The stem is everything between the
// previous question's last option and this question's "A" label.
function parseLabelled(lines, defaultChapter) {
  const out = [];
  let chapter = defaultChapter;
  let stem = [];
  let options = [];
  let expect = 0; // 0 = A, 1 = B, …

  const flush = (answerLetter) => {
    const q = makeQuestion(stem, options, answerLetter, chapter);
    if (q) out.push(q);
    stem = [];
    options = [];
    expect = 0;
  };

  for (const line of lines) {
    const chap = CHAPTER_RE.exec(line);
    if (chap && options.length === 0) {
      chapter = Number(chap[1]);
      stem = [];
      continue;
    }

    const ans = ANSWER_RE.exec(line);
    if (ans) {
      if (options.length === 4) flush(ans[1]);
      continue;
    }

    const m = LABEL_RE.exec(line);
    const idx = m ? "abcd".indexOf(m[1].toLowerCase()) : -1;
    if (m && m[2].trim().length > 0 && idx === expect) {
      options.push(clean(m[2]));
      expect++;
      // A complete set with no Answer line following is flushed when the next
      // stem line arrives (below) or at end of file.
      continue;
    }

    // Not an option line: it belongs to the next question's stem.
    if (options.length === 4) flush(null);
    else if (options.length > 0) {
      // A broken/partial option run — drop it and start over on this line.
      stem = [];
      options = [];
      expect = 0;
    }
    stem.push(line);
  }
  if (options.length === 4) flush(null);
  return out;
}

// No labels at all. `Answer:` lines are the anchor: the four lines before one
// are the options and the line before those is the stem. Files without any
// answer key fall back to fixed 5-line groups (stem + 4 options).
function parseBare(lines, defaultChapter) {
  const out = [];
  const hasAnswers = lines.some((l) => ANSWER_RE.test(l));

  if (hasAnswers) {
    let chapter = defaultChapter;
    let buf = [];
    for (const line of lines) {
      const chap = CHAPTER_RE.exec(line);
      if (chap) {
        chapter = Number(chap[1]);
        buf = [];
        continue;
      }
      const ans = ANSWER_RE.exec(line);
      if (!ans) {
        buf.push(line);
        continue;
      }
      if (buf.length >= 5) {
        const options = buf.slice(-4);
        const stem = buf.slice(0, -4);
        const q = makeQuestion(stem, options, ans[1], chapter);
        if (q) out.push(q);
      }
      buf = [];
    }
    return out;
  }

  // No key anywhere. Two conventions exist among the unkeyed files:
  //
  //  - stems end in "?", ":", "." or "-----" (the Maths unit 3 sets). Anchor on
  //    those: a stem followed by exactly four option-like lines is a question,
  //    and a stem with no options (its choices were pictures) is skipped rather
  //    than allowed to shift every question after it.
  //  - stems carry no punctuation at all (the Physics "Complicated" set). There
  //    is nothing to anchor on, so fall back to fixed stem + 4 groups.
  const isStemLike = (l) => /[?:]\s*$|-{3,}\s*$|\.\s*$/.test(l.replaceAll(FIGURE, "").trim());
  const isOptionLike = (l) => !isStemLike(l) && l.length <= 120;

  let chapter = defaultChapter;
  const blockStarts = [];
  const flat = [];
  for (const line of lines) {
    const chap = CHAPTER_RE.exec(line);
    if (chap) {
      chapter = Number(chap[1]);
      blockStarts.push(flat.length);
      continue;
    }
    flat.push({ line, chapter });
  }

  const punctuated = flat.filter(({ line }) => isStemLike(line)).length >= (flat.length / 5) * 0.6;
  void blockStarts; // chapter changes are carried per line in `flat`

  if (punctuated) {
    for (let i = 0; i < flat.length; ) {
      const window = flat.slice(i + 1, i + 5);
      if (isStemLike(flat[i].line) && window.length === 4 && window.every(({ line }) => isOptionLike(line))) {
        const q = makeQuestion([flat[i].line], window.map(({ line }) => line), null, flat[i].chapter);
        if (q) out.push(q);
        i += 5;
      } else {
        i += 1; // an orphan stem or stray line — skip it, don't shift the rest
      }
    }
    return out;
  }

  // Unpunctuated stems (the Physics "Complicated" set): anchor on shape. A stem
  // is a long line, options are short, and a real question is a stem, exactly
  // four options, then another stem (or the end). Some questions in that file
  // lost their options in the source, and fixed 5-line counting slid out of
  // step at the first one; anchoring skips them instead.
  const STEM_MIN = 26;
  const OPTION_MAX = 45;
  const looksStem = (l) => l.length >= STEM_MIN;
  const looksOption = (l) => l.length <= OPTION_MAX && !/[?:]\s*$/.test(l);
  for (let i = 0; i < flat.length; ) {
    const window = flat.slice(i + 1, i + 5);
    const after = flat[i + 5];
    const sameChapter = window.every((w) => w.chapter === flat[i].chapter);
    const closes = !after || after.chapter !== flat[i].chapter || looksStem(after.line);
    if (looksStem(flat[i].line) && window.length === 4 && sameChapter && window.every((w) => looksOption(w.line)) && closes) {
      const q = makeQuestion([flat[i].line], window.map((w) => w.line), null, flat[i].chapter);
      if (q) out.push(q);
      i += 5;
    } else {
      i += 1;
    }
  }
  return out;
}

// Splits the document at "Chapter N" / "Unit N" headings. A file that spans
// several chapters can switch layout between them, so each block is detected
// and parsed on its own.
function toBlocks(lines, defaultChapter) {
  const blocks = [{ chapter: defaultChapter, lines: [] }];
  for (const line of lines) {
    const chap = CHAPTER_RE.exec(line);
    if (chap) {
      blocks.push({ chapter: Number(chap[1]), lines: [] });
      continue;
    }
    blocks[blocks.length - 1].lines.push(line);
  }
  return blocks.filter((b) => b.lines.length > 0);
}

// Some documents (the Maths unit 4-6 sets) put the answers at the END, under an
// "ANSWER KEY" heading, in one of three shapes:
//   a flattened table   "1" / "B" / "4.1 Factorization" / "16" / "B" / ...
//   numbered lines      "1. B"
//   Q-prefixed lines    "Q1: A"   or with a worked reason  "Q1: Ans: B — 15x²y = ..."
const KEY_HEADING_RE = /^(?:answer\s*key|answers?\s*key|detailed\s+answer\s+explanations?|answers)\s*:?$/i;
const KEY_LINE_RE = /^Q?\s*#?\s*0*(\d{1,3})\s*[:.)\-]?\s*(?:Ans(?:wer)?\s*[:.\-]?\s*)?\(?([A-D])\)?(?:\s*[\u2014\u2013:-]\s*(.*))?$/;

function splitKey(lines) {
  const at = lines.findIndex((l) => KEY_HEADING_RE.test(l));
  if (at < 0) return { body: lines, key: new Map(), explanations: new Map(), conflicts: 0 };

  const key = new Map();
  const explanations = new Map();
  let conflicts = 0;
  const tail = lines.slice(at + 1);
  const record = (n, letter, why) => {
    if (key.has(n) && key.get(n) !== letter) conflicts++;
    if (!key.has(n)) key.set(n, letter);
    if (why && why.trim().length > 3 && !explanations.has(n)) explanations.set(n, why.trim());
  };
  for (let i = 0; i < tail.length; i++) {
    const m = KEY_LINE_RE.exec(tail[i]);
    if (m) {
      record(Number(m[1]), m[2], m[3]);
      continue;
    }
    // Table cells come out one per line: a bare number, then a bare letter.
    if (/^\d{1,3}$/.test(tail[i]) && /^[A-D]$/.test(tail[i + 1] ?? "")) {
      record(Number(tail[i]), tail[i + 1]);
      i++;
    }
  }
  return { body: lines.slice(0, at), key, explanations, conflicts };
}

export function parseQuestions(text, defaultChapter) {
  const { body, key, explanations, conflicts } = splitKey(toLines(text));
  const layouts = new Set();
  const questions = [];
  for (const block of toBlocks(body, defaultChapter)) {
    const layout = detectLayout(block.lines);
    layouts.add(layout);
    const parsed = layout === "labelled" ? parseLabelled(block.lines, block.chapter) : parseBare(block.lines, block.chapter);
    questions.push(...parsed);
  }

  // An end-of-document key numbers questions 1..N in document order. Apply it
  // only when it lines up exactly with what was parsed — mapping a key onto a
  // list that lost or gained a question would shift every answer after the gap.
  let keyStatus = key.size === 0 ? "none" : "mismatch";
  const numbers = [...key.keys()].sort((a, b) => a - b);
  const contiguous = numbers.length > 0 && numbers[0] === 1 && numbers[numbers.length - 1] === numbers.length;
  if (key.size > 0 && contiguous && key.size === questions.length && conflicts === 0) {
    questions.forEach((q, i) => {
      if (q.answer !== null) return;
      q.answer = "ABCD".indexOf(key.get(i + 1));
      q.answer_source = "file";
      const why = explanations.get(i + 1);
      if (why) q.explanation = why;
    });
    keyStatus = "applied";
  }

  return {
    layout: [...layouts].sort().join("+") || "none",
    questions,
    key: { status: keyStatus, entries: key.size, conflicts },
  };
}
