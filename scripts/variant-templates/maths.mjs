// Maths calculation templates. Each one re-values a board-style question;
// `anchor` names the bank question it varies, so a test never asks both.
import { mcq, mcqFixed, num, sup, frac, gcd } from "../lib/variant-kit.mjs";

// "x² + 6x + 9" from [[1, "x²"], [6, "x"], [9, ""]], skipping zero terms.
function poly(terms) {
  let out = "";
  for (const [c, v] of terms) {
    if (c === 0) continue;
    const abs = Math.abs(c);
    const body = v && abs === 1 ? v : `${abs}${v}`;
    out += out ? (c < 0 ? ` − ${body}` : ` + ${body}`) : c < 0 ? `−${body}` : body;
  }
  return out || "0";
}
// "(x + 3)" / "(x − 3)" / "(2x − 5)"
const bin = (a, v, b) => `(${poly([[a, v], [b, ""]])})`;
const setOf = (xs) => (xs.length ? `{${[...xs].sort((a, b) => a - b).join(", ")}}` : "∅");
const deg = (d) => `${String(d).padStart(3, "0")}°`;
const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20]];

export default [
  // ── Chapter 1: Real numbers ───────────────────────────────────────────────
  {
    key: "m1-surd",
    chapter: 1,
    make(r) {
      const a = r.int(2, 6);
      const b = r.pick([2, 3, 5, 6, 7]);
      if (a === b) return null;
      return mcq(r, `In simplest form, √${a * a * b} is:`, `${a}√${b}`, [`${b}√${a}`, `${a * a}√${b}`, `${a}√${b + 1}`, `${a + 1}√${b}`]);
    },
  },
  {
    key: "m1-exponent-laws",
    chapter: 1,
    make(r) {
      const m = r.int(2, 7);
      const n = r.int(2, 6);
      const x = r.pick(["x", "a", "y"]);
      const form = r.int(0, 2);
      if (form === 0) return mcq(r, `${x}${sup(m)} × ${x}${sup(n)} is equal to:`, `${x}${sup(m + n)}`, [`${x}${sup(m * n)}`, `${x}${sup(Math.abs(m - n) || 1)}`, `2${x}${sup(m + n)}`, `${x}${sup(m + n + 1)}`]);
      if (form === 1) return mcq(r, `(${x}${sup(m)})${sup(n)} is equal to:`, `${x}${sup(m * n)}`, [`${x}${sup(m + n)}`, `${x}${sup(m ** n)}`, `${n}${x}${sup(m)}`, `${x}${sup(m * n + 1)}`]);
      const big = m + n;
      return mcq(r, `${x}${sup(big)} ÷ ${x}${sup(n)} is equal to:`, `${x}${sup(m)}`, [`${x}${sup(big + n)}`, `${x}${sup(big * n)}`, `${x}${sup(Math.round(big / n) === m ? m + 1 : Math.round(big / n))}`, `1`]);
    },
  },
  {
    key: "m1-rationalise",
    chapter: 1,
    difficulty: "hard",
    make(r) {
      const a = r.pick([2, 3, 5, 7]);
      const c = r.int(1, 5);
      const k = a * c;
      const rt = (coef, rad) => (coef === 1 ? `√${rad}` : `${coef}√${rad}`);
      return mcq(r, `Rationalising the denominator, ${k}/√${a} becomes:`, rt(c, a), [rt(k, a), `√${a}/${k}`, rt(c + 1, a), `${k}/${a}`, rt(c, k)]);
    },
  },
  {
    key: "m1-terminating",
    chapter: 1,
    anchor: "a72e579d1e43",
    fixedStem: true,
    make(r) {
      const good = r.pick([4, 5, 8, 16, 20, 25, 40]);
      const bad = r.shuffle([3, 6, 7, 9, 11, 12, 15]).slice(0, 3);
      const f = (d) => {
        let p = r.int(1, d - 1);
        while (gcd(p, d) !== 1) p = r.int(1, d - 1);
        return `${p}/${d}`;
      };
      return mcq(r, "Which of these fractions has a terminating decimal expansion?", f(good), bad.map(f));
    },
  },
  {
    key: "m1-recurring",
    chapter: 1,
    make(r) {
      if (r.next() < 0.5) {
        const a = r.int(1, 8);
        return mcq(r, `The recurring decimal 0.${String(a).repeat(3)}… (the digit ${a} repeating) as a fraction is:`, frac(a, 9), [`${a}/10`, `${a}/99`, `${a * 11}/100`, `${a}/90`]);
      }
      const ab = r.int(12, 98);
      if (ab % 11 === 0 || ab % 10 === 0) return null;
      const s = String(ab);
      return mcq(r, `The recurring decimal 0.${s.repeat(3)}… (the digits ${s} repeating) as a fraction is:`, frac(ab, 99), [`${ab}/100`, `${ab}/999`, frac(ab, 90), `${s[0]}/${s[1]}`]);
    },
  },

  // ── Chapter 2: Logarithms ─────────────────────────────────────────────────
  {
    key: "m2-log-value",
    chapter: 2,
    make(r) {
      const [b, n] = r.pick([[2, 3], [2, 4], [2, 5], [2, 6], [3, 2], [3, 3], [3, 4], [5, 2], [5, 3], [10, 3], [10, 4], [4, 3]]);
      const sub = { 2: "₂", 3: "₃", 4: "₄", 5: "₅", 10: "₁₀" }[b];
      return mcq(r, `The value of log${sub} ${b ** n} is:`, String(n), [String(n + 1), String(n - 1), String(2 * n), String(b ** n / b)]);
    },
  },
  {
    key: "m2-log-form",
    chapter: 2,
    make(r) {
      const [b, n] = r.pick([[2, 5], [3, 4], [5, 3], [10, 2], [4, 3], [7, 2], [2, 7]]);
      const N = b ** n;
      const sub = (x) => String(x).split("").map((d) => "₀₁₂₃₄₅₆₇₈₉"[d]).join("");
      return mcq(r, `The logarithmic form of ${b}${sup(n)} = ${N} is:`, `log${sub(b)} ${N} = ${n}`, [`log${sub(n)} ${N} = ${b}`, `log${sub(b)} ${n} = ${N}`, `log${sub(N)} ${b} = ${n}`]);
    },
  },
  {
    key: "m2-log-laws",
    chapter: 2,
    make(r) {
      const [a, b, op, v] = r.pick([[2, 5, "+", 1], [4, 25, "+", 2], [20, 5, "+", 2], [8, 125, "+", 3], [50, 2, "+", 2], [25, 40, "+", 3], [200, 2, "−", 2], [5000, 5, "−", 3], [300, 3, "−", 2], [50, 5, "−", 1]]);
      const wrongOp = op === "+" ? a + b : a - b;
      return mcq(r, `log ${a} ${op} log ${b} is equal to:`, String(v), [`log ${wrongOp}`, String(op === "+" ? a * b : a / b), String(v + 1), String(v === 1 ? 10 : v - 1)]);
    },
  },
  {
    key: "m2-scientific",
    chapter: 2,
    make(r) {
      const digits = String(r.int(11, 99)).replace(/0$/, "5");
      const e = r.pick([-6, -5, -4, -3, 3, 4, 5, 6]);
      // Writes the digits d₁.d₂ × 10^e out in full.
      const plain = e >= 0 ? (digits + "0".repeat(e)).slice(0, e + 1) + (digits.length > e + 1 ? "." + digits.slice(e + 1) : "") : "0." + "0".repeat(-e - 1) + digits;
      const withCommas = e >= 4 ? plain.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : plain;
      const m = `${digits[0]}.${digits.slice(1)}`;
      const s = (x) => `${m} × 10${sup(x)}`;
      return mcq(r, `${withCommas} in scientific notation is:`, s(e), [s(e + 1), s(e - 1), s(-e), s(e + (e > 0 ? 2 : -2))]);
    },
  },
  {
    key: "m2-characteristic",
    chapter: 2,
    make(r) {
      const N = r.pick(["3.52", "47.3", "586.1", "2915", "70420", "8.07", "123.4", "45678"]);
      const c = N.split(".")[0].length - 1;
      return mcq(r, `The characteristic of log ${N} is:`, String(c), [String(c + 1), String(c === 0 ? 2 : c - 1), String(N.replace(".", "").length), `−${c + 1}`]);
    },
  },

  // ── Chapter 3: Sets and relations ─────────────────────────────────────────
  {
    key: "m3-union-count",
    chapter: 3,
    scenario: true,
    make(r) {
      const both = r.int(3, 12);
      const a = both + r.int(4, 20);
      const b = both + r.int(4, 20);
      const [x, y] = r.pick([["tea", "coffee"], ["cricket", "hockey"], ["Urdu", "English"], ["mangoes", "apples"]]);
      if (r.next() < 0.5) {
        return mcq(r, `In a class, ${a} students like ${x}, ${b} like ${y} and ${both} like both. How many students like ${x} or ${y} (or both)?`, String(a + b - both), [String(a + b), String(a + b - 2 * both), String(a + b + both), String(a - both)]);
      }
      return mcq(r, `If n(A) = ${a}, n(B) = ${b} and n(A ∩ B) = ${both}, then n(A ∪ B) is:`, String(a + b - both), [String(a + b), String(a + b + both), String(a + b - 2 * both), String(a * b - both)]);
    },
  },
  {
    key: "m3-subsets",
    chapter: 3,
    make(r) {
      const n = r.int(2, 5);
      const S = setOf([...Array(n)].map((_, i) => i + 1)).replace(/\d+/g, (d) => "abcde"[d - 1]);
      if (r.next() < 0.5) return mcq(r, `The number of subsets of ${S} is:`, String(2 ** n), [String(n), String(2 * n), String(n * n === 2 ** n ? n * n + 1 : n * n), String(2 ** n - 1), String(2 ** n + 1)]);
      return mcq(r, `The number of proper subsets of ${S} is:`, String(2 ** n - 1), [String(2 ** n), String(n), String(2 * n), String(2 ** n - 2)]);
    },
  },
  {
    key: "m3-cartesian",
    chapter: 3,
    make(r) {
      const a = r.int(2, 5);
      const b = r.int(2, 5);
      const A = setOf([...Array(a)].map((_, i) => i + 1));
      const B = "{" + "pqrst".slice(0, b).split("").join(", ") + "}";
      return mcq(r, `If A = ${A} and B = ${B}, the number of elements in A × B is:`, String(a * b), [String(a + b), String(2 ** (a + b)), String(a * b + 1), String(a ** b)]);
    },
  },
  {
    key: "m3-operations",
    chapter: 3,
    make(r) {
      const pickSet = () => r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, r.int(3, 5));
      const A = pickSet();
      const B = pickSet();
      const inter = A.filter((x) => B.includes(x));
      const union = [...new Set([...A, ...B])];
      const diff = A.filter((x) => !B.includes(x));
      const diffBA = B.filter((x) => !A.includes(x));
      const [name, right] = r.pick([["A ∩ B", inter], ["A ∪ B", union], ["A − B", diff]]);
      const all = [inter, union, diff, diffBA].map(setOf);
      return mcq(r, `If A = ${setOf(A)} and B = ${setOf(B)}, then ${name} is:`, setOf(right), all.filter((s) => s !== setOf(right)).concat(setOf([...A])));
    },
  },
  {
    key: "m3-complement",
    chapter: 3,
    make(r) {
      const A = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, r.int(3, 6));
      const comp = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((x) => !A.includes(x));
      const other = r.shuffle(comp).slice(0, Math.max(1, comp.length - 1));
      return mcq(r, `If U = {1, 2, 3, …, 10} and A = ${setOf(A)}, then A′ is:`, setOf(comp), [setOf(A), setOf(other), setOf([...comp, A[0]]), "U", "∅"]);
    },
  },

  // ── Chapter 4: Factorization and algebraic manipulation ──────────────────
  {
    key: "m4-expand-square",
    chapter: 4,
    make(r) {
      const a = r.int(1, 9) * (r.next() < 0.5 ? -1 : 1);
      const x = r.pick(["x", "a", "y"]);
      return mcq(r, `The expansion of ${bin(1, x, a)}² is:`, poly([[1, `${x}²`], [2 * a, x], [a * a, ""]]), [
        poly([[1, `${x}²`], [a * a, ""]]),
        poly([[1, `${x}²`], [a, x], [a * a, ""]]),
        poly([[1, `${x}²`], [2 * a, x], [2 * a, ""]]),
        poly([[1, `${x}²`], [-2 * a, x], [a * a, ""]]),
      ]);
    },
  },
  {
    key: "m4-factor-trinomial",
    chapter: 4,
    make(r) {
      const p = r.int(1, 9) * (r.next() < 0.5 ? -1 : 1);
      const q = r.int(1, 9) * (r.next() < 0.5 ? -1 : 1);
      if (p + q === 0 || p === q) return null;
      const f = (a, b) => `${bin(1, "x", a)}${bin(1, "x", b)}`;
      return mcq(r, `The factors of ${poly([[1, "x²"], [p + q, "x"], [p * q, ""]])} are:`, f(p, q), [f(-p, -q), f(p, -q), f(-p, q), f(p * q, 1)]);
    },
  },
  {
    key: "m4-difference-of-squares",
    chapter: 4,
    make(r) {
      const a = r.int(1, 5);
      const b = r.int(1, 9);
      if (gcd(a, b) !== 1) return null;
      return mcq(r, `The factors of ${poly([[a * a, "x²"], [-b * b, ""]])} are:`, `${bin(a, "x", -b)}${bin(a, "x", b)}`, [`${bin(a, "x", -b)}²`, `${bin(a, "x", b)}²`, `${bin(a * a, "x", -b)}${bin(1, "x", b)}`, `${bin(a, "x", -b * b)}${bin(a, "x", 1)}`]);
    },
  },
  {
    key: "m4-sum-of-squares",
    chapter: 4,
    difficulty: "hard",
    make(r) {
      const a = r.int(1, 8);
      const b = r.int(1, 8);
      const s = a + b;
      const p = a * b;
      return mcq(r, `If a + b = ${s} and ab = ${p}, then a² + b² is:`, String(s * s - 2 * p), [String(s * s + 2 * p), String(s * s - p), String(s * s), String(s * s - 4 * p)]);
    },
  },
  {
    key: "m4-reciprocal-square",
    chapter: 4,
    difficulty: "hard",
    make(r) {
      const k = r.int(2, 9);
      return mcq(r, `If x + 1/x = ${k}, then x² + 1/x² is:`, String(k * k - 2), [String(k * k), String(k * k + 2), String(2 * k), String(k * k - 1)]);
    },
  },
  {
    key: "m4-sum-of-cubes",
    chapter: 4,
    difficulty: "hard",
    make(r) {
      const a = r.int(1, 5);
      const b = r.int(1, 5);
      const s = a + b;
      const p = a * b;
      return mcq(r, `If a + b = ${s} and ab = ${p}, then a³ + b³ is:`, String(s ** 3 - 3 * p * s), [String(s ** 3 + 3 * p * s), String(s ** 3), String(s ** 3 - p * s), String(s ** 3 - 3 * p)]);
    },
  },

  // ── Chapter 5: Linear equations and inequalities ─────────────────────────
  {
    key: "m5-solve-linear",
    chapter: 5,
    make(r) {
      const a = r.int(2, 9);
      const x = r.int(-6, 9);
      const b = r.int(-15, 15);
      if (x === 0 || b === 0) return null;
      const c = a * x + b;
      return mcq(r, `The solution of ${poly([[a, "x"], [b, ""]])} = ${num(c)} is:`, `x = ${num(x)}`, [`x = ${num(-x)}`, `x = ${num((c + b) / a)}`, `x = ${num(c - b)}`, `x = ${num(x + 1)}`]);
    },
  },
  {
    key: "m5-absolute",
    chapter: 5,
    anchor: "fd37607b7138",
    make(r) {
      const a = r.int(1, 7) * (r.next() < 0.5 ? -1 : 1);
      const b = r.int(2, 9);
      if (Math.abs(a) === b || (a === 2 && b === 6)) return null;
      const s = (x, y) => `{${num(x)}, ${num(y)}}`;
      return mcq(r, `The solution set of |${poly([[1, "x"], [a, ""]])}| = ${b} is:`, s(b - a, -b - a), [s(b + a, -b + a), s(b - a, b + a), s(-b - a, -b + a), s(b, -b)]);
    },
  },
  {
    key: "m5-inequality",
    chapter: 5,
    make(r) {
      const a = r.int(2, 6) * (r.next() < 0.4 ? -1 : 1);
      const x = r.int(-5, 8);
      const b = r.int(-10, 10);
      if (b === 0) return null;
      const c = a * x + b;
      const flip = a < 0;
      return mcq(r, `The solution of ${poly([[a, "x"], [b, ""]])} < ${num(c)} is:`, `x ${flip ? ">" : "<"} ${num(x)}`, [`x ${flip ? "<" : ">"} ${num(x)}`, `x < ${num(-x)}`, `x > ${num(-x)}`, `x ${flip ? ">" : "<"} ${num(x + 1)}`]);
    },
    difficulty: "hard",
  },
  {
    key: "m5-word-problem",
    chapter: 5,
    scenario: true,
    make(r) {
      const form = r.int(0, 2);
      if (form === 0) {
        const n = r.int(10, 60);
        return mcq(r, `The sum of two consecutive integers is ${2 * n + 1}. The larger integer is:`, String(n + 1), [String(n), String(n + 2), String(2 * n), String(n - 1)]);
      }
      if (form === 1) {
        const x = r.int(4, 30);
        const k = r.int(3, 15);
        return mcq(r, `When a number is doubled and then increased by ${k}, the result is ${2 * x + k}. The number is:`, String(x), [String(x + k), String(2 * x), String((2 * x + k + k) / 2), String(x - 1)]);
      }
      const son = r.int(5, 15);
      const f = r.pick([3, 4]);
      return mcq(r, `A father is ${f} times as old as his son. The sum of their ages is ${son * (f + 1)} years. The son's age is:`, `${son} years`, [`${son * f} years`, `${son + f} years`, `${(son * (f + 1)) / 2} years`, `${son - 1} years`]);
    },
  },
  {
    key: "m5-radical",
    chapter: 5,
    anchor: "b7e7ce2d04ec",
    make(r) {
      const a = r.int(1, 9);
      const b = r.int(2, 6);
      if (a === 3 && b === 2) return null;
      return mcq(r, `The solution set of √(x − ${a}) = ${b} is:`, `{${b * b + a}}`, [`{${b + a}}`, `{${num(b * b - a)}}`, `{${b * b}}`, `{${(b + a) ** 2}}`]);
    },
  },
  {
    key: "m5-simultaneous",
    chapter: 5,
    difficulty: "hard",
    make(r) {
      const x = r.int(1, 12);
      const y = r.int(1, 12);
      if (x === y) return null;
      const p = (a, b) => `x = ${num(a)}, y = ${num(b)}`;
      return mcq(r, `If x + y = ${x + y} and x − y = ${num(x - y)}, then:`, p(x, y), [p(y, x), p(x + y, x - y), p(x, -y), p(-x, y)]);
    },
  },

  // ── Chapter 6: Trigonometry and bearing ──────────────────────────────────
  {
    key: "m6-degrees-radians",
    chapter: 6,
    make(r) {
      const T = [[30, "π/6"], [45, "π/4"], [60, "π/3"], [90, "π/2"], [120, "2π/3"], [135, "3π/4"], [150, "5π/6"], [180, "π"], [270, "3π/2"], [360, "2π"]];
      const [d, rad] = r.pick(T);
      const others = r.shuffle(T.filter((t) => t[0] !== d));
      if (r.next() < 0.5) return mcq(r, `${d}° in radians is:`, rad, others.map((t) => t[1]));
      return mcq(r, `${rad} radians in degrees is:`, `${d}°`, others.map((t) => `${t[0]}°`));
    },
  },
  {
    key: "m6-special-values",
    chapter: 6,
    make(r) {
      const V = {
        sin: { 0: "0", 30: "1/2", 45: "1/√2", 60: "√3/2", 90: "1" },
        cos: { 0: "1", 30: "√3/2", 45: "1/√2", 60: "1/2", 90: "0" },
        tan: { 0: "0", 30: "1/√3", 45: "1", 60: "√3" },
      };
      const fn = r.pick(["sin", "cos", "tan"]);
      const angle = Number(r.pick(Object.keys(V[fn])));
      const pool = r.shuffle(["0", "1/2", "1/√2", "√3/2", "1", "√3", "1/√3", "2"]);
      return mcq(r, `The value of ${fn} ${angle}° is:`, V[fn][angle], pool);
    },
  },
  {
    key: "m6-triangle-ratio",
    chapter: 6,
    make(r) {
      const [a, b, c] = r.pick(TRIPLES);
      const fn = r.pick(["sin", "cos", "tan"]);
      const right = { sin: frac(a, c), cos: frac(b, c), tan: frac(a, b) }[fn];
      return mcq(r, `In a right-angled triangle, the side opposite angle θ is ${a} cm, the adjacent side is ${b} cm and the hypotenuse is ${c} cm. The value of ${fn} θ is:`, right, [frac(a, c), frac(b, c), frac(a, b), frac(b, a), frac(c, a)]);
    },
  },
  {
    key: "m6-back-bearing",
    chapter: 6,
    anchor: "d4097edc799d",
    scenario: true,
    make(r) {
      const t = 5 * r.int(2, 70);
      if (t === 70 || t === 180) return null;
      const back = t < 180 ? t + 180 : t - 180;
      return mcq(r, `A ship sails from port A to port B on a bearing of ${deg(t)}. The bearing of A from B is:`, deg(back), [deg(t), deg(360 - t), deg(Math.abs(180 - t)), deg((t + 90) % 360)]);
    },
  },
  {
    key: "m6-compass-bearing",
    chapter: 6,
    make(r) {
      const a = 5 * r.int(2, 16);
      const [dir, b] = r.pick([[`N${a}°E`, a], [`S${a}°E`, 180 - a], [`S${a}°W`, 180 + a], [`N${a}°W`, 360 - a]]);
      return mcq(r, `The direction ${dir} written as a three-figure bearing is:`, deg(b), [deg(a), deg(180 - a), deg(180 + a), deg(360 - a), deg(90 + a)]);
    },
  },
  {
    key: "m6-arc-length",
    chapter: 6,
    make(r) {
      const rad = r.pick([3, 4, 5, 6, 8, 10, 12]);
      const th = r.pick([0.5, 1.5, 2, 2.5, 3]);
      return mcq(r, `A circle has radius ${rad} cm. The length of the arc cut off by a central angle of ${num(th)} radians is:`, `${num(rad * th)} cm`, [`${num(rad / th)} cm`, `${num(0.5 * rad * rad * th)} cm`, `${num(rad + th)} cm`, `${num(rad * th * 2)} cm`]);
    },
  },

  // ── Chapter 7: Coordinate geometry ───────────────────────────────────────
  {
    key: "m7-distance",
    chapter: 7,
    make(r) {
      const [a, b, c] = r.pick(TRIPLES.slice(0, 5));
      const x1 = r.int(-5, 5);
      const y1 = r.int(-5, 5);
      const sx = r.next() < 0.5 ? -1 : 1;
      const sy = r.next() < 0.5 ? -1 : 1;
      const [dx, dy] = r.next() < 0.5 ? [a, b] : [b, a];
      const P = `(${num(x1)}, ${num(y1)})`;
      const Q = `(${num(x1 + sx * dx)}, ${num(y1 + sy * dy)})`;
      return mcq(r, `The distance between the points ${P} and ${Q} is:`, String(c), [String(a + b), String(c * c), String(Math.abs(a - b) || c + 1), String(c + 2)]);
    },
  },
  {
    key: "m7-midpoint",
    chapter: 7,
    make(r) {
      const x1 = r.int(-8, 8);
      const y1 = r.int(-8, 8);
      const x2 = x1 + 2 * r.int(-5, 5);
      const y2 = y1 + 2 * r.int(-5, 5);
      if (x1 === x2 && y1 === y2) return null;
      const pt = (x, y) => `(${num(x)}, ${num(y)})`;
      return mcq(r, `The midpoint of the segment joining ${pt(x1, y1)} and ${pt(x2, y2)} is:`, pt((x1 + x2) / 2, (y1 + y2) / 2), [pt(x1 + x2, y1 + y2), pt((x2 - x1) / 2, (y2 - y1) / 2), pt((y1 + y2) / 2, (x1 + x2) / 2), pt((x1 + x2) / 2 + 1, (y1 + y2) / 2)]);
    },
  },
  {
    key: "m7-quadrant",
    chapter: 7,
    difficulty: "easy",
    make(r) {
      const x = r.int(1, 9) * (r.next() < 0.5 ? -1 : 1);
      const y = r.int(1, 9) * (r.next() < 0.5 ? -1 : 1);
      const q = x > 0 ? (y > 0 ? 0 : 3) : y > 0 ? 1 : 2;
      const names = ["first quadrant", "second quadrant", "third quadrant", "fourth quadrant"];
      return mcqFixed(`The point (${num(x)}, ${num(y)}) lies in the:`, names, q);
    },
  },
  {
    key: "m7-other-endpoint",
    chapter: 7,
    difficulty: "hard",
    make(r) {
      const [mx, my, ax, ay] = [r.int(-5, 6), r.int(-5, 6), r.int(-5, 6), r.int(-5, 6)];
      if (mx === ax && my === ay) return null;
      const pt = (x, y) => `(${num(x)}, ${num(y)})`;
      return mcq(r, `M${pt(mx, my)} is the midpoint of AB and A is ${pt(ax, ay)}. The coordinates of B are:`, pt(2 * mx - ax, 2 * my - ay), [pt((mx + ax) / 2, (my + ay) / 2), pt(mx - ax, my - ay), pt(2 * ax - mx, 2 * ay - my), pt(mx + ax, my + ay)]);
    },
  },

  // ── Chapter 8: Geometry of straight lines ────────────────────────────────
  {
    key: "m8-slope",
    chapter: 8,
    make(r) {
      const [x1, y1] = [r.int(-5, 5), r.int(-5, 5)];
      const dx = r.int(1, 6) * (r.next() < 0.5 ? -1 : 1);
      const dy = r.int(1, 8) * (r.next() < 0.5 ? -1 : 1);
      if (Math.abs(dx) === Math.abs(dy)) return null;
      const pt = (x, y) => `(${num(x)}, ${num(y)})`;
      return mcq(r, `The slope of the line through ${pt(x1, y1)} and ${pt(x1 + dx, y1 + dy)} is:`, frac(dy, dx), [frac(dx, dy), frac(-dy, dx), frac(-dx, dy), frac(dy + 1, dx)]);
    },
  },
  {
    key: "m8-slope-general-form",
    chapter: 8,
    difficulty: "hard",
    make(r) {
      const a = r.int(1, 6) * (r.next() < 0.5 ? -1 : 1);
      const b = r.int(1, 6) * (r.next() < 0.5 ? -1 : 1);
      const c = r.int(-9, 9);
      if (Math.abs(a) === Math.abs(b)) return null;
      return mcq(r, `The slope of the line ${poly([[a, "x"], [b, "y"], [c, ""]])} = 0 is:`, frac(-a, b), [frac(a, b), frac(-b, a), frac(b, a), frac(-c || 1, b)]);
    },
  },
  {
    key: "m8-perpendicular-slope",
    chapter: 8,
    make(r) {
      const p = r.int(1, 5) * (r.next() < 0.5 ? -1 : 1);
      const q = r.pick([1, 2, 3, 4]);
      if (gcd(p, q) !== 1 || Math.abs(p) === q) return null;
      const m = frac(p, q);
      return mcq(r, `A line has slope ${m}. The slope of a line perpendicular to it is:`, frac(-q, p), [m, frac(-p, q), frac(q, p), "0"]);
    },
  },
  {
    key: "m8-line-equation",
    chapter: 8,
    make(r) {
      const m = r.int(-4, 5);
      const [x1, y1] = [r.int(-4, 5), r.int(-5, 6)];
      if (m === 0 || x1 === 0) return null;
      const c = y1 - m * x1;
      const eq = (mm, cc) => `y = ${poly([[mm, "x"], [cc, ""]])}`;
      return mcq(r, `The equation of the line through (${num(x1)}, ${num(y1)}) with slope ${num(m)} is:`, eq(m, c), [eq(m, y1 + m * x1), eq(m, y1), eq(y1, m), eq(-m, c)]);
    },
  },
  {
    key: "m8-intercept",
    chapter: 8,
    make(r) {
      const a = r.int(1, 6);
      const b = r.int(1, 6) * (r.next() < 0.5 ? -1 : 1);
      const k = a * Math.abs(b) * r.int(1, 3);
      if (a === Math.abs(b)) return null;
      const pt = (x, y) => `(${num(x)}, ${num(y)})`;
      if (r.next() < 0.5) return mcq(r, `The line ${poly([[a, "x"], [b, "y"]])} = ${k} cuts the x-axis at:`, pt(k / a, 0), [pt(0, k / a), pt(k / b, 0), pt(0, k / b), pt(a, 0)]);
      return mcq(r, `The line ${poly([[a, "x"], [b, "y"]])} = ${k} cuts the y-axis at:`, pt(0, k / b), [pt(k / b, 0), pt(0, k / a), pt(k / a, 0), pt(0, b)]);
    },
  },

  // ── Chapter 9: Geometry and polygons ─────────────────────────────────────
  {
    key: "m9-interior-sum",
    chapter: 9,
    make(r) {
      const [n, name] = r.pick([[5, "pentagon"], [6, "hexagon"], [7, "heptagon"], [8, "octagon"], [9, "nonagon"], [10, "decagon"], [12, "12-sided polygon"]]);
      return mcq(r, `The sum of the interior angles of a ${name} is:`, `${(n - 2) * 180}°`, [`${n * 180}°`, `${(n - 1) * 180}°`, "360°", `${(n - 3) * 180}°`]);
    },
  },
  {
    key: "m9-regular-angle",
    chapter: 9,
    make(r) {
      const n = r.pick([5, 6, 8, 9, 10, 12, 15, 18, 20]);
      const ext = 360 / n;
      if (r.next() < 0.5) return mcq(r, `Each interior angle of a regular polygon with ${n} sides is:`, `${180 - ext}°`, [`${ext}°`, `${(n - 2) * 180}°`, `${180 - ext / 2}°`, `${180 - ext - 10}°`]);
      return mcq(r, `Each exterior angle of a regular polygon with ${n} sides is:`, `${ext}°`, [`${180 - ext}°`, `${num(180 / n, 1)}°`, `${ext * 2}°`, `${ext + 10}°`]);
    },
  },
  {
    key: "m9-sides-from-exterior",
    chapter: 9,
    difficulty: "hard",
    make(r) {
      const e = r.pick([10, 12, 15, 18, 20, 24, 36, 40, 45, 60, 72]);
      return mcq(r, `Each exterior angle of a regular polygon is ${e}°. The number of sides is:`, String(360 / e), [String(180 / e === Math.floor(180 / e) ? 180 / e : 360 / e + 2), String(360 / e + 1), String(360 / e - 1), String(e)]);
    },
  },
  {
    key: "m9-third-angle",
    chapter: 9,
    difficulty: "easy",
    make(r) {
      const a = 5 * r.int(5, 16);
      const b = 5 * r.int(5, 16);
      if (a + b >= 170) return null;
      return mcq(r, `Two angles of a triangle are ${a}° and ${b}°. The third angle is:`, `${180 - a - b}°`, [`${360 - a - b}°`, `${a + b}°`, `${Math.abs(a - b) || 10}°`, `${190 - a - b}°`]);
    },
  },
  {
    key: "m9-pythagoras",
    chapter: 9,
    make(r) {
      const [a, b, c] = r.pick(TRIPLES);
      if (r.next() < 0.5) return mcq(r, `The two shorter sides of a right-angled triangle are ${a} cm and ${b} cm. The hypotenuse is:`, `${c} cm`, [`${a + b} cm`, `${c + 1} cm`, `${a * b} cm`, `${c * c} cm`]);
      return mcq(r, `The hypotenuse of a right-angled triangle is ${c} cm and one side is ${a} cm. The other side is:`, `${b} cm`, [`${c - a} cm`, `${c + a} cm`, `${b + 1} cm`, `${b * b} cm`]);
    },
  },
  {
    key: "m9-ladder",
    chapter: 9,
    scenario: true,
    make(r) {
      const [a, b, c] = r.pick(TRIPLES);
      return mcq(r, `A ${c} m ladder leans against a vertical wall with its foot ${a} m from the wall. How high up the wall does it reach?`, `${b} m`, [`${c - a} m`, `${c + a} m`, `${b + 2} m`, `${a} m`]);
    },
  },
  {
    key: "m9-isosceles",
    chapter: 9,
    make(r) {
      const v = 2 * r.int(10, 60);
      return mcq(r, `The vertex angle of an isosceles triangle is ${v}°. Each base angle is:`, `${(180 - v) / 2}°`, [`${180 - v}°`, `${v}°`, `${v / 2}°`, `${(180 - v) / 2 + 10}°`]);
    },
  },
  {
    key: "m9-diagonals",
    chapter: 9,
    difficulty: "hard",
    make(r) {
      const n = r.int(4, 12);
      return mcq(r, `The number of diagonals of a polygon with ${n} sides is:`, String((n * (n - 3)) / 2), [String(n * (n - 3)), String(n), String((n * (n - 1)) / 2), String(n - 3)]);
    },
  },
  {
    key: "m9-quadrilateral",
    chapter: 9,
    make(r) {
      const [a, b, c] = [5 * r.int(12, 24), 5 * r.int(12, 24), 5 * r.int(12, 24)];
      const d = 360 - a - b - c;
      if (d < 40 || d > 160) return null;
      return mcq(r, `Three angles of a quadrilateral are ${a}°, ${b}° and ${c}°. The fourth angle is:`, `${d}°`, [`${d + 10}°`, `${540 - a - b - c}°`, `${Math.abs(180 - d)}°`, `${d - 10}°`]);
    },
  },

  // ── Chapter 10: Practical geometry ───────────────────────────────────────
  {
    key: "m10-triangle-inequality",
    chapter: 10,
    anchor: "396064b32d2f",
    fixedStem: true,
    make(r) {
      const valid = () => {
        const a = r.int(3, 9);
        const b = r.int(3, 9);
        const c = r.int(Math.abs(a - b) + 1, a + b - 1);
        return [a, b, c];
      };
      const invalid = () => {
        const a = r.int(2, 6);
        const b = r.int(2, 6);
        return [a, b, a + b + r.int(0, 3)];
      };
      const fmt = (t) => r.shuffle(t).map((x) => `${x} cm`).join(", ");
      return mcq(r, "Which set of lengths can form a triangle?", fmt(valid()), [fmt(invalid()), fmt(invalid()), fmt(invalid()), fmt(invalid())]);
    },
  },
  {
    key: "m10-third-side",
    chapter: 10,
    difficulty: "hard",
    make(r) {
      const a = r.int(4, 12);
      const b = r.int(2, a - 1);
      const lo = a - b;
      const hi = a + b;
      const ok = r.int(lo + 1, hi - 1);
      return mcq(r, `Two sides of a triangle are ${a} cm and ${b} cm. Which of these could be the third side?`, `${ok} cm`, [`${lo} cm`, `${hi} cm`, `${hi + r.int(1, 4)} cm`, `${Math.max(1, lo - 1)} cm`]);
    },
  },
  {
    key: "m10-circumradius",
    chapter: 10,
    make(r) {
      const [a, b, c] = r.pick(TRIPLES);
      return mcq(r, `A right-angled triangle has sides ${a} cm, ${b} cm and ${c} cm. The radius of its circumcircle is:`, `${num(c / 2)} cm`, [`${c} cm`, `${num(a / 2)} cm`, `${num(b / 2)} cm`, `${num(c / 3)} cm`]);
    },
  },
  {
    key: "m10-centroid",
    chapter: 10,
    make(r) {
      const m = 3 * r.int(2, 10);
      return mcq(r, `A median of a triangle is ${m} cm long. The distance from the vertex to the centroid along this median is:`, `${(2 * m) / 3} cm`, [`${m / 3} cm`, `${num(m / 2)} cm`, `${m} cm`, `${(2 * m) / 3 + 1} cm`]);
    },
  },

  // ── Chapter 11: Basic statistics ─────────────────────────────────────────
  {
    key: "m11-mean",
    chapter: 11,
    make(r) {
      const n = r.int(4, 6);
      const xs = [...Array(n - 1)].map(() => r.int(2, 30));
      const mean = r.int(Math.max(...xs) - 10, Math.max(...xs));
      const last = mean * n - xs.reduce((a, b) => a + b, 0);
      if (last < 1 || last > 40) return null;
      const data = r.shuffle([...xs, last]);
      const sum = mean * n;
      return mcq(r, `The mean of ${data.join(", ")} is:`, String(mean), [String(sum), String(mean + 1), String(mean - 2), num(sum / (n - 1)), num(sum / (n + 1))]);
    },
  },
  {
    key: "m11-median",
    chapter: 11,
    make(r) {
      const n = r.pick([5, 6, 7]);
      const set = new Set();
      while (set.size < n) set.add(r.int(1, 30));
      const data = r.shuffle([...set]);
      const s = [...set].sort((a, b) => a - b);
      const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
      const middleUnsorted = n % 2 ? data[(n - 1) / 2] : (data[n / 2 - 1] + data[n / 2]) / 2;
      const mean = s.reduce((a, b) => a + b, 0) / n;
      return mcq(r, `The median of ${data.join(", ")} is:`, num(med), [num(middleUnsorted), num(mean, 1), num(s[Math.floor(n / 2) + 1] ?? med + 2), num(s[Math.floor(n / 2) - 1] - (n % 2 ? 0 : 1))]);
    },
  },
  {
    key: "m11-mode",
    chapter: 11,
    difficulty: "easy",
    make(r) {
      const mode = r.int(1, 12);
      const others = r.shuffle([...Array(15)].map((_, i) => i + 1).filter((x) => x !== mode)).slice(0, 4);
      const data = r.shuffle([mode, mode, mode, others[0], others[0], others[1], others[2], others[3]]);
      return mcq(r, `The mode of ${data.join(", ")} is:`, String(mode), [String(others[0]), String(others[1]), String(Math.max(...data)), String(data.length)]);
    },
  },
  {
    key: "m11-range",
    chapter: 11,
    difficulty: "easy",
    make(r) {
      const data = r.shuffle([...new Set([...Array(6)].map(() => r.int(3, 60)))]);
      if (data.length < 5) return null;
      const max = Math.max(...data);
      const min = Math.min(...data);
      return mcq(r, `The range of ${data.join(", ")} is:`, String(max - min), [String(max), String(max + min), String(data[data.length - 1] - data[0] === max - min ? min : Math.abs(data[data.length - 1] - data[0])), String(max - min + 1)]);
    },
  },
  {
    key: "m11-pie-chart",
    chapter: 11,
    scenario: true,
    make(r) {
      const total = r.pick([30, 36, 40, 60, 72, 90, 120]);
      const part = r.int(2, total / 2);
      const angle = (part / total) * 360;
      if (!Number.isInteger(angle)) return null;
      const what = r.pick(["walk to school", "come by bus", "prefer cricket", "like maths best"]);
      return mcq(r, `In a survey of ${total} students, ${part} ${what}. In a pie chart, the angle of this sector is:`, `${angle}°`, [`${part}°`, `${num((part / total) * 100)}°`, `${num((part / total) * 180)}°`, `${angle + 10}°`]);
    },
  },
  {
    key: "m11-frequency-mean",
    chapter: 11,
    difficulty: "hard",
    make(r) {
      const xs = [1, 2, 3, 4].map((x) => x * r.pick([1, 2, 5]));
      const fs = xs.map(() => r.int(1, 6));
      const sf = fs.reduce((a, b) => a + b, 0);
      const sfx = xs.reduce((a, x, i) => a + x * fs[i], 0);
      const mean = sfx / sf;
      if (Math.round(mean * 100) !== mean * 100) return null;
      return mcq(r, `For the values x = ${xs.join(", ")} with frequencies f = ${fs.join(", ")}, the mean Σfx ÷ Σf is:`, num(mean), [num(sfx / xs.length), num(xs.reduce((a, b) => a + b, 0) / 4), num(sfx), num(mean + 0.5)]);
    },
  },
  {
    key: "m11-new-mean",
    chapter: 11,
    difficulty: "hard",
    make(r) {
      const n = r.int(3, 9);
      const m = r.int(8, 30);
      const newMean = m + r.int(1, 4);
      const v = newMean * (n + 1) - m * n;
      return mcq(r, `The mean of ${n} numbers is ${m}. When one more number, ${v}, is added, the new mean is:`, String(newMean), [num((m + v) / 2), num((m * n + v) / n), String(m), String(newMean + 1)]);
    },
  },
  {
    key: "m11-class-mark",
    chapter: 11,
    difficulty: "easy",
    make(r) {
      const w = r.pick([5, 10, 20]);
      const lo = w * r.int(1, 10);
      return mcq(r, `The class mark (mid-point) of the class ${lo}–${lo + w} is:`, num(lo + w / 2), [String(w), String(lo), String(lo + w), num((lo + w) / 2)]);
    },
  },
];
