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
    "^(Multiple Choice|Choose the correct|Encircle|Answer Key|Answers?)\\s*[:.]?\\s*$",
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
    .replace(/\s+/g, " ")
    .trim();
}

// Splits raw document text into the lines a question can be built from.
export function toLines(text) {
  return text
    .split("\n")
    .map(clean)
    .filter((l) => l.length > 0 && !NOISE_RE.test(l));
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

// A parsed question, or null when the block didn't look like one.
function makeQuestion(stemLines, options, answerLetter, chapter) {
  if (options.length !== 4) return null;
  const stem = clean(stemLines.join(" ")).replace(STEM_NUM_RE, "");
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
        const q = makeQuestion(stem.slice(-3), options, ans[1], chapter);
        if (q) out.push(q);
      }
      buf = [];
    }
    return out;
  }

  // No key anywhere: assume stem + 4 options, and only accept a group whose
  // "options" all look like options (short, not questions).
  let chapter = defaultChapter;
  let group = [];
  const flush = () => {
    if (group.length === 5) {
      const [stem, ...options] = group;
      const plausible = options.every((o) => o.length <= 120 && !o.endsWith("?"));
      if (plausible) {
        const q = makeQuestion([stem], options, null, chapter);
        if (q) out.push(q);
      }
    }
    group = [];
  };
  for (const line of lines) {
    const chap = CHAPTER_RE.exec(line);
    if (chap) {
      flush();
      chapter = Number(chap[1]);
      continue;
    }
    group.push(line);
    if (group.length === 5) flush();
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

export function parseQuestions(text, defaultChapter) {
  const lines = toLines(text);
  const layouts = new Set();
  const questions = [];
  for (const block of toBlocks(lines, defaultChapter)) {
    const layout = detectLayout(block.lines);
    layouts.add(layout);
    const parsed = layout === "labelled" ? parseLabelled(block.lines, block.chapter) : parseBare(block.lines, block.chapter);
    questions.push(...parsed);
  }
  return { layout: [...layouts].sort().join("+") || "none", questions };
}
