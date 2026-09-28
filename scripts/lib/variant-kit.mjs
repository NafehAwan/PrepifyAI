// Small helpers for the question templates in scripts/variant-templates/.
//
// A template turns a seeded random source into one MCQ whose answer is
// computed, so re-valued versions of a calculation are always marked right.
// Seeding by template key keeps the output (and so every question id) stable
// from run to run.

// mulberry32 over a string hash — deterministic, good enough for picking values.
export function makeRng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle(arr) {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}

// Formats a number for a question: rounds to `dp` places, drops trailing zeros,
// uses a true minus sign and groups thousands with commas above 9,999.
export function num(x, dp = 2) {
  if (!Number.isFinite(x)) throw new Error(`not a number: ${x}`);
  const r = Math.round(x * 10 ** dp) / 10 ** dp;
  let s = Math.abs(r).toFixed(dp);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  const [whole, frac] = s.split(".");
  const grouped = whole.length > 4 ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : whole;
  s = frac ? `${grouped}.${frac}` : grouped;
  return (r < 0 ? "−" : "") + s;
}

// num() plus a unit, e.g. u(20, "m/s") → "20 m/s".
export const u = (x, unit, dp = 2) => `${num(x, dp)} ${unit}`;

// Signed value for oxidation numbers and charges: +3, −2, 0.
export const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");

const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
const SUB = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };
export const sup = (n) => String(n).split("").map((c) => SUP[c] ?? c).join("");
export const sub = (n) => String(n).split("").map((c) => SUB[c] ?? c).join("");

// Writes a chemical formula with subscripts from plain digits: "H2SO4" → "H₂SO₄".
export const chem = (f) => f.replace(/\d+/g, (d) => sub(d));

// m × 10ⁿ with the mantissa formatted by num().
export const sci = (m, e, dp = 3) => `${num(m, dp)} × 10${sup(e)}`;

// Builds the MCQ. `wrongs` should offer more than three candidates so a
// collision with the correct option (or each other) still leaves three.
// Returns null when three distinct distractors can't be found — the generator
// then just tries fresh values.
export function mcq(r, stem, correct, wrongs) {
  const options = [String(correct)];
  for (const w of wrongs) {
    const s = String(w);
    if (options.length === 4) break;
    if (!options.includes(s)) options.push(s);
  }
  if (options.length < 4) return null;
  const shuffled = r.shuffle(options);
  return { stem, options: shuffled, answer: shuffled.indexOf(String(correct)) };
}

// Same, but for options that must keep their order (e.g. "all of the above").
export function mcqFixed(stem, options, answer) {
  if (new Set(options).size !== 4) return null;
  return { stem, options, answer };
}

// Greatest common divisor and fraction formatting.
export const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export function frac(n, d) {
  const g = gcd(n, d);
  const [p, q] = [n / g, d / g];
  const sign = p * q < 0 ? "−" : "";
  return Math.abs(q) === 1 ? `${sign}${Math.abs(p)}` : `${sign}${Math.abs(p)}/${Math.abs(q)}`;
}
