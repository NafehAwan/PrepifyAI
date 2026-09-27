import type { DBMcq } from "./curriculum";

// Options that point at other options by position ("All of the above",
// "Both (a) and (b)", "Both B and C") only make sense in their original order.
// Shuffling those questions' options would silently change what they mean —
// "Both A and B" could end up naming two wrong answers.
const POSITIONAL =
  /\b(above|below)\b|\b(both|either|neither)\b[^.]*\b(\(?[a-d]\)?)\s*(and|or|nor|&)\s*\(?[a-d]\)?(?![a-z])/i;

export function hasPositionalOptions(options: string[]): boolean {
  return options.some((o) => POSITIONAL.test(o));
}

// Fisher–Yates shuffle of a question set: randomizes question order AND the
// option order within each question (remapping the correct-answer index). Used
// so a retake always looks different, even when the underlying pool is fixed.
export function shuffleMcqs(mcqs: DBMcq[]): DBMcq[] {
  const arr = mcqs.map(shuffleOptions);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleOptions(q: DBMcq): DBMcq {
  if (hasPositionalOptions(q.options)) return q;
  const order = q.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    answer: Math.max(0, order.indexOf(q.answer)),
  };
}
