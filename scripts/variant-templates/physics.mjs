// Physics calculation templates. Each one re-values a board-style question;
// `anchor` names the bank question it varies, so a test never asks both.
import { mcq, num, u, sup } from "../lib/variant-kit.mjs";

const ord = (k) => `${k}${k % 10 === 1 && k !== 11 ? "st" : k % 10 === 2 && k !== 12 ? "nd" : k % 10 === 3 && k !== 13 ? "rd" : "th"}`;

export default [
  // ── Chapter 1: Physical quantities and measurement ─────────────────────────
  {
    key: "p1-prefix",
    chapter: 1,
    anchor: "b6080be9e37b",
    make(r) {
      const P = [["k", 3], ["M", 6], ["G", 9], ["m", -3], ["μ", -6], ["n", -9]];
      const [sym, e] = r.pick(P);
      const v = r.int(2, 9);
      const others = r.shuffle(P.filter((p) => p[0] !== sym).map((p) => `${v} ${p[0]}m`));
      return mcq(r, `The length ${v} × 10${sup(e)} m can be written as:`, `${v} ${sym}m`, others);
    },
  },
  {
    key: "p1-convert",
    chapter: 1,
    difficulty: "easy",
    make(r) {
      const C = [
        [(v) => `A desk is ${v} cm long. Its length in metres is:`, [45, 60, 75, 80, 120, 150], 0.01, "m"],
        [(v) => `A screw is ${v} mm long. In centimetres this is:`, [15, 25, 35, 45, 64], 0.1, "cm"],
        [(v) => `A school is ${v} km from a student's home. In metres this distance is:`, [1.5, 2, 2.5, 3.2, 4], 1000, "m"],
        [(v) => `A bag of sugar has a mass of ${v} g. In kilograms this is:`, [250, 500, 750, 1500], 0.001, "kg"],
        [(v) => `A tablet contains ${v} mg of medicine. In grams this is:`, [250, 500, 650], 0.001, "g"],
        [(v) => `A journey takes ${v} hours. In seconds this is:`, [2, 3, 1.5], 3600, "s"],
        [(v) => `A race lasts ${v} minutes. In seconds this is:`, [3, 4, 12, 2.5], 60, "s"],
      ];
      const [stem, values, f, unit] = r.pick(C);
      const v = r.pick(values);
      const a = v * f;
      return mcq(r, stem(v), u(a, unit, 6), [a * 10, a / 10, a * 100, a / 100].map((x) => u(x, unit, 6)));
    },
  },
  {
    key: "p1-vernier-read",
    chapter: 1,
    make(r) {
      const M = r.int(12, 68) / 10;
      const k = r.int(1, 9);
      const stem = `In a vernier caliper, the main-scale reading is ${num(M, 1)} cm and the ${ord(k)} vernier division coincides with a main-scale line. If the least count is 0.01 cm, the reading is:`;
      return mcq(r, stem, u(M + 0.01 * k, "cm"), [
        u(M + 0.1 * k, "cm"),
        u(M + 0.001 * k, "cm", 3),
        u(M, "cm"),
        u(M + 0.01 * (10 - k), "cm"),
      ]);
    },
  },
  {
    key: "p1-vernier-division",
    chapter: 1,
    anchor: "411540de471e",
    make(r) {
      const M = r.int(12, 68) / 10;
      const k = r.int(2, 8);
      const wrong = r.shuffle([k + 1, k - 1, 10 - k, k + 2].filter((x) => x >= 1 && x <= 9 && x !== k)).map(ord);
      return mcq(
        r,
        `A vernier caliper reads ${num(M + 0.01 * k, 2)} cm. If the main-scale reading is ${num(M, 1)} cm and the least count is 0.01 cm, the coinciding vernier division is the:`,
        ord(k),
        [...wrong, ord(Math.round((M + 0.01 * k) * 100) % 100 || 10)]
      );
    },
  },
  {
    key: "p1-screw-least-count",
    chapter: 1,
    make(r) {
      const [p, n] = r.pick([[1, 100], [0.5, 50], [1, 50], [0.5, 100]]);
      return mcq(r, `A screw gauge has a pitch of ${num(p)} mm and ${n} divisions on its circular scale. Its least count is:`, u(p / n, "mm", 3), [
        u(p * n, "mm"),
        u(n / p, "mm"),
        u((p / n) * 10, "mm", 3),
        "0.1 mm",
        "0.001 mm",
      ]);
    },
  },
  {
    key: "p1-screw-read",
    chapter: 1,
    make(r) {
      const M = r.int(2, 9);
      const c = r.int(11, 94);
      return mcq(
        r,
        `The main-scale reading of a screw gauge is ${M} mm and the ${ord(c)} division of the circular scale is on the reference line. If the least count is 0.01 mm, the reading is:`,
        u(M + c / 100, "mm"),
        [u(M + c / 10, "mm"), u(M + c / 1000, "mm", 3), u(c + M / 100, "mm"), u(M, "mm")]
      );
    },
  },
  {
    key: "p1-sig-figs",
    chapter: 1,
    make(r) {
      const pattern = r.pick(["0.00XX", "0.0X0X", "X.X0", "X0.0X", "0.X00", "X.00X", "XX.0", "X0X", "0.000X", "X.XX0", "X00.X", "X0.X0"]);
      const s = pattern.replace(/X/g, () => String(r.int(1, 9)));
      const sig = s.includes(".") ? s.replace(".", "").replace(/^0+/, "").length : s.replace(/^0+/, "").replace(/0+$/, "").length;
      const stem = r.pick([
        `The number of significant figures in ${s} is:`,
        `A student records a length as ${s} m. How many significant figures does this reading have?`,
      ]);
      const allDigits = s.replace(".", "").length;
      const nonZero = s.replace(/[0.]/g, "").length;
      const wrongs = [sig + 1, sig - 1, allDigits, nonZero, sig + 2].filter((x) => x >= 1);
      return mcq(r, stem, String(sig), wrongs.map(String));
    },
  },
  {
    key: "p1-displacement-volume",
    chapter: 1,
    scenario: true,
    make(r) {
      const a = 5 * r.int(4, 12);
      const v = 5 * r.int(1, 8);
      const b = a + v;
      return mcq(r, `Water in a measuring cylinder rises from ${a} cm³ to ${b} cm³ when a stone is lowered into it. The volume of the stone is:`, u(v, "cm³"), [
        u(a + b, "cm³"),
        u(b, "cm³"),
        u(a, "cm³"),
        u(2 * v, "cm³"),
      ]);
    },
  },

  // ── Chapter 2: Kinematics ─────────────────────────────────────────────────
  {
    key: "p2-average-speed",
    chapter: 2,
    anchor: "233843f8f4a5",
    make(r) {
      if (r.next() < 0.5) {
        const s = r.pick([40, 50, 60, 80, 90]);
        const t = r.pick([2, 3, 4, 5]);
        const who = r.pick(["A bus", "A train", "A car", "A van"]);
        return mcq(r, `${who} covers ${s * t} km in ${t} hours. Its average speed is:`, u(s, "km/h"), [
          u(s * t * t, "km/h"),
          u(s / 2, "km/h"),
          u(2 * s, "km/h"),
          u(s * t + t, "km/h"),
        ]);
      }
      const s = r.int(4, 15);
      const t = r.pick([20, 40, 50, 60, 80]);
      const straight = Math.round(s * t * r.pick([0.5, 0.6, 0.8]));
      return mcq(
        r,
        `A cyclist rides along a winding road ${s * t} m long in ${t} s. The straight-line distance from start to finish is ${straight} m. The cyclist's average speed is:`,
        u(s, "m/s"),
        [u(straight / t, "m/s"), u(s * 2, "m/s"), u((s * t + straight) / t, "m/s"), u(s / 2, "m/s")]
      );
    },
  },
  {
    key: "p2-acceleration",
    chapter: 2,
    anchor: "89851d5fe393",
    make(r) {
      const uu = r.pick([5, 10, 15, 20]);
      const a = r.int(1, 6);
      const t = r.int(2, 8);
      const v = uu + a * t;
      const who = r.pick(["A car", "A motorcycle", "A bus", "A train"]);
      return mcq(r, `${who} speeds up uniformly from ${uu} m/s to ${v} m/s in ${t} s. Its acceleration is:`, u(a, "m/s²"), [
        u(v / t, "m/s²"),
        u((v + uu) / t, "m/s²"),
        u((v - uu) * t, "m/s²"),
        u(a + 1, "m/s²"),
        u(a * 2, "m/s²"),
      ]);
    },
  },
  {
    key: "p2-acceleration-from-rest",
    chapter: 2,
    anchor: "e748cecc7f5f",
    make(r) {
      const a = r.int(2, 6);
      const t = r.int(3, 9);
      const v = a * t;
      return mcq(r, `A particle starts from rest and reaches a velocity of ${v} m/s in ${t} s. Its average acceleration is:`, u(a, "m/s²"), [
        u(v * t, "m/s²"),
        u(t / v, "m/s²"),
        u(v / (2 * t), "m/s²"),
        u((2 * v) / t, "m/s²"),
      ]);
    },
  },
  {
    key: "p2-deceleration",
    chapter: 2,
    scenario: true,
    make(r) {
      const t = r.int(2, 6);
      const a = r.int(2, 6);
      const v = a * t;
      return mcq(r, `A car moving at ${v} m/s is brought to rest by its brakes in ${t} s. Its acceleration is:`, u(-a, "m/s²"), [
        u(a, "m/s²"),
        u(-v * t, "m/s²"),
        "0 m/s²",
        u(-t / v, "m/s²"),
      ]);
    },
  },
  {
    key: "p2-free-fall-speed",
    chapter: 2,
    anchor: "54d154502459",
    make(r) {
      const t = r.pick([1, 2, 4, 5, 6]);
      return mcq(r, `A stone is dropped from rest from the top of a tall building. Taking g = 10 m/s², its speed after ${t} s is:`, u(10 * t, "m/s"), [
        u(5 * t * t, "m/s"),
        u(10 / t, "m/s"),
        u(10 + t, "m/s"),
        u(20 * t, "m/s"),
      ]);
    },
  },
  {
    key: "p2-free-fall-distance",
    chapter: 2,
    difficulty: "hard",
    make(r) {
      const t = r.int(1, 5);
      return mcq(r, `A stone dropped from rest falls freely for ${t} s. Taking g = 10 m/s², the distance it falls is:`, u(5 * t * t, "m"), [
        u(10 * t * t, "m"),
        u(10 * t, "m"),
        u(5 * t, "m"),
        u(20 * t * t, "m"),
      ]);
    },
  },
  {
    key: "p2-final-velocity",
    chapter: 2,
    make(r) {
      const uu = r.int(2, 12);
      const a = r.int(2, 5);
      const t = r.int(2, 8);
      const who = r.pick(["A cyclist", "A car", "A boat", "A trolley"]);
      return mcq(r, `${who} moving at ${uu} m/s accelerates uniformly at ${a} m/s² for ${t} s. Its final velocity is:`, u(uu + a * t, "m/s"), [
        u(a * t, "m/s"),
        u(uu * a * t, "m/s"),
        u((uu + a) * t, "m/s"),
        u(uu + a + t, "m/s"),
      ]);
    },
  },
  {
    key: "p2-distance-from-rest",
    chapter: 2,
    difficulty: "hard",
    make(r) {
      const a = r.pick([2, 4, 6]);
      const t = r.int(2, 8);
      return mcq(r, `A car starts from rest and accelerates uniformly at ${a} m/s² for ${t} s. The distance it covers is:`, u(0.5 * a * t * t, "m"), [
        u(a * t * t, "m"),
        u(a * t, "m"),
        u(0.5 * a * t, "m"),
        u(2 * a * t * t, "m"),
      ]);
    },
  },
  {
    key: "p2-braking-distance",
    chapter: 2,
    difficulty: "hard",
    scenario: true,
    make(r) {
      const [v, a] = r.pick([[10, 2], [10, 5], [20, 4], [20, 5], [30, 5], [20, 8], [30, 6], [16, 4]]);
      return mcq(
        r,
        `A car travelling at ${v} m/s brakes with a uniform deceleration of ${a} m/s² until it stops. Its stopping distance is:`,
        u((v * v) / (2 * a), "m"),
        [u((v * v) / a, "m"), u(v / a, "m"), u(v / (2 * a), "m"), u(v * a, "m")]
      );
    },
  },
  {
    key: "p2-kmh-ms",
    chapter: 2,
    make(r) {
      const k = r.pick([18, 36, 54, 72, 90, 108]);
      if (r.next() < 0.5) {
        return mcq(r, `A car's speedometer reads ${k} km/h. In metres per second this is:`, u(k / 3.6, "m/s"), [
          u(k * 3.6, "m/s"),
          u(k / 60, "m/s", 1),
          u(k / 10, "m/s", 1),
          u((2 * k) / 3.6, "m/s"),
        ]);
      }
      const v = k / 3.6;
      return mcq(r, `A car travels at ${num(v)} m/s. In kilometres per hour this is:`, u(k, "km/h"), [
        u(v / 3.6, "km/h", 1),
        u(v * 60, "km/h"),
        u(v * 10, "km/h"),
        u(k / 2, "km/h"),
      ]);
    },
  },
  {
    key: "p2-distance-displacement",
    chapter: 2,
    anchor: "4488a73703a9",
    scenario: true,
    make(r) {
      const [a, b, c] = r.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [30, 40, 50]]);
      const unit = a >= 30 ? "m" : r.pick(["m", "km"]);
      const who = unit === "km" ? "A delivery van travels" : "A boy walks";
      const opt = (d, s) => `Distance = ${d} ${unit}, displacement = ${s} ${unit}`;
      return mcq(r, `${who} ${a} ${unit} east and then ${b} ${unit} north. What are the distance covered and the magnitude of the displacement?`, opt(a + b, c), [
        opt(c, a + b),
        opt(a + b, a + b),
        opt(c, c),
      ]);
    },
  },
  {
    key: "p2-graph-area",
    chapter: 2,
    make(r) {
      const v = r.pick([4, 6, 8, 10, 12, 15, 20]);
      const t = r.pick([4, 5, 6, 8, 10]);
      if (r.next() < 0.5) {
        return mcq(r, `A car moves at a constant speed of ${v} m/s for ${t} s. The area under its speed–time graph, which gives the distance covered, is:`, u(v * t, "m"), [
          u(v / t, "m"),
          u(v + t, "m"),
          u((v * t) / 2, "m"),
          u(2 * v * t, "m"),
        ]);
      }
      return mcq(r, `A body accelerates uniformly from rest to ${v} m/s in ${t} s. Using the area under its velocity–time graph, the distance it covers is:`, u((v * t) / 2, "m"), [
        u(v * t, "m"),
        u(v / t, "m"),
        u(v + t, "m"),
        u((v * t) / 4, "m"),
      ]);
    },
  },
  {
    key: "p2-half-lap",
    chapter: 2,
    anchor: "464080c982ff",
    difficulty: "hard",
    scenario: true,
    make(r) {
      const rad = r.pick([7, 14, 21, 35, 70]);
      const arc = (22 * rad) / 7;
      const opt = (d, s) => `Distance = ${num(d)} m, displacement = ${num(s)} m`;
      return mcq(r, `An athlete runs half a lap of a circular track of radius ${rad} m. Taking π = 22/7, the distance covered and the displacement are:`, opt(arc, 2 * rad), [
        opt(2 * rad, arc),
        opt(2 * arc, 0),
        opt(arc, rad),
        opt(arc, 0),
      ]);
    },
  },

  // ── Chapter 3: Dynamics I ─────────────────────────────────────────────────
  {
    key: "p3-force",
    chapter: 3,
    make(r) {
      const m = r.int(2, 20);
      const a = r.int(2, 9);
      const what = r.pick(["box", "trolley", "cart", "crate"]);
      return mcq(r, `A net force gives a ${m} kg ${what} an acceleration of ${a} m/s². The force is:`, u(m * a, "N"), [
        u(m / a, "N"),
        u(m + a, "N"),
        u(2 * m * a, "N"),
        u(a / m, "N"),
      ]);
    },
  },
  {
    key: "p3-acceleration",
    chapter: 3,
    make(r) {
      const m = r.int(2, 12);
      const a = r.int(2, 8);
      return mcq(r, `A force of ${m * a} N acts on a body of mass ${m} kg. The acceleration produced is:`, u(a, "m/s²"), [
        u(m * a * m, "m/s²"),
        u(m / (m * a), "m/s²"),
        u(m * a - m, "m/s²"),
        u(2 * a, "m/s²"),
      ]);
    },
  },
  {
    key: "p3-mass-ratio",
    chapter: 3,
    anchor: "1ad44ae6550d",
    make(r) {
      const k = r.pick([2, 3, 4]);
      const a = k * r.int(2, 5);
      const F = r.pick([10, 20, 30, 40, 60]);
      const times = { 2: "twice", 3: "three times", 4: "four times" }[k];
      return mcq(r, `A force of ${F} N gives a body an acceleration of ${a} m/s². The same force acting on a body of ${times} the mass produces an acceleration of:`, u(a / k, "m/s²"), [
        u(a * k, "m/s²"),
        u(a, "m/s²"),
        u(a / (k * k), "m/s²"),
        u(a + k, "m/s²"),
      ]);
    },
  },
  {
    key: "p3-weight",
    chapter: 3,
    difficulty: "easy",
    make(r) {
      const m = r.pick([5, 8, 12, 25, 40, 50, 60, 75]);
      if (r.next() < 0.5) {
        return mcq(r, `The mass of a child is ${m} kg. Taking g = 10 m/s², the child's weight is:`, u(10 * m, "N"), [
          u(m, "N"),
          u(m / 10, "N"),
          u(10 * m, "kg"),
          u(100 * m, "N"),
        ]);
      }
      return mcq(r, `A parcel weighs ${10 * m} N. Taking g = 10 m/s², its mass is:`, u(m, "kg"), [
        u(10 * m, "kg"),
        u(100 * m, "kg"),
        u(m, "N"),
        u(m / 10, "kg"),
      ]);
    },
  },
  {
    key: "p3-momentum",
    chapter: 3,
    make(r) {
      const m = r.pick([0.5, 2, 4, 5, 10, 50, 60]);
      const v = r.int(2, 12);
      const what = m < 1 ? "ball" : m >= 50 ? "runner" : "trolley";
      return mcq(r, `A ${num(m)} kg ${what} moves at ${v} m/s. Its momentum is:`, u(m * v, "kg m/s"), [
        u(m / v, "kg m/s"),
        u(0.5 * m * v * v, "kg m/s"),
        u(m + v, "kg m/s"),
        u(m * v * v, "kg m/s"),
      ]);
    },
  },
  {
    key: "p3-net-force",
    chapter: 3,
    difficulty: "hard",
    scenario: true,
    make(r) {
      const m = r.int(2, 10);
      const a = r.int(1, 5);
      const F2 = 5 * r.int(2, 8);
      const F1 = F2 + m * a;
      return mcq(r, `Two children pull a ${m} kg box in opposite directions with forces of ${F1} N and ${F2} N. The acceleration of the box is:`, u(a, "m/s²"), [
        u((F1 + F2) / m, "m/s²"),
        u(F1 / m, "m/s²"),
        u((F1 - F2) * m, "m/s²"),
        "0 m/s²",
      ]);
    },
  },
  {
    key: "p3-friction",
    chapter: 3,
    make(r) {
      const mu = r.pick([0.2, 0.25, 0.3, 0.4, 0.5]);
      const W = r.pick([40, 60, 80, 100, 120, 200]);
      return mcq(r, `A block weighing ${W} N rests on a floor. If the coefficient of friction between them is ${num(mu)}, the force needed to just make it slide is:`, u(mu * W, "N"), [
        u(W / mu, "N"),
        u(W, "N"),
        u(W - mu * W, "N"),
        u(mu, "N"),
      ]);
    },
  },
  {
    key: "p3-moon-weight",
    chapter: 3,
    scenario: true,
    make(r) {
      const m = r.pick([50, 60, 70, 80, 90]);
      return mcq(r, `An astronaut has a mass of ${m} kg. On the Moon, where g = 1.6 m/s², the astronaut's weight is:`, u(1.6 * m, "N"), [
        u(m, "N"),
        u(10 * m, "N"),
        u(m / 1.6, "N", 1),
        u(16 * m, "N"),
      ]);
    },
  },

  // ── Chapter 4: Dynamics II ────────────────────────────────────────────────
  {
    key: "p4-torque",
    chapter: 4,
    anchor: "b1c2c952b644",
    make(r) {
      const F = r.pick([20, 25, 40, 50, 60, 80, 100]);
      const d = r.pick([0.2, 0.25, 0.3, 0.4, 0.5]);
      const stem = r.pick([
        `A force of ${F} N acts at a perpendicular distance of ${num(d)} m from a pivot. The torque is:`,
        `A mechanic pushes with ${F} N at right angles to the end of a spanner ${num(d)} m long. The turning effect (torque) is:`,
      ]);
      return mcq(r, stem, u(F * d, "N m"), [u(F / d, "N m"), u(F + d, "N m"), u(d / F, "N m", 3), u(2 * F * d, "N m")]);
    },
  },
  {
    key: "p4-seesaw",
    chapter: 4,
    anchor: "b757eac75cfe",
    scenario: true,
    make(r) {
      const [W1, W2] = r.pick([[300, 200], [400, 200], [600, 400], [500, 250], [450, 300], [600, 300]]);
      const d1 = r.pick([1, 1.5, 2]);
      const d2 = (W1 * d1) / W2;
      return mcq(r, `A ${W1} N child sits ${num(d1)} m from the pivot of a see-saw. To balance it, a ${W2} N child must sit on the other side at a distance of:`, u(d2, "m"), [
        u((W2 * d1) / W1, "m"),
        u(d1, "m"),
        u(d2 + 1, "m"),
        u(d1 * 2 + 1, "m"),
        u(W1 / W2, "m"),
      ]);
    },
  },
  {
    key: "p4-centripetal",
    chapter: 4,
    anchor: "b7ba5c3412e0",
    make(r) {
      const [m, v, rad] = r.pick([[1, 4, 2], [2, 6, 3], [3, 4, 2], [2, 10, 5], [4, 6, 4], [0.5, 8, 4], [5, 2, 1]]);
      return mcq(r, `A ${num(m)} kg ball moves in a circle of radius ${rad} m at a speed of ${v} m/s. The centripetal force on it is:`, u((m * v * v) / rad, "N"), [
        u((m * v) / rad, "N"),
        u(m * v * v * rad, "N"),
        u((m * v * v) / (rad * rad), "N"),
        u((m * v * v) / (2 * rad), "N"),
      ]);
    },
  },
  {
    key: "p4-impulse",
    chapter: 4,
    make(r) {
      const F = r.pick([20, 40, 50, 100, 200, 500]);
      const t = r.pick([0.05, 0.1, 0.2, 0.5]);
      return mcq(r, `A batsman's bat exerts a force of ${F} N on a ball for ${num(t)} s. The impulse given to the ball is:`, u(F * t, "N s"), [
        u(F / t, "N s"),
        u(F + t, "N s"),
        u(t / F, "N s", 4),
        u(2 * F * t, "N s"),
      ]);
    },
  },
  {
    key: "p4-force-from-momentum",
    chapter: 4,
    difficulty: "hard",
    make(r) {
      const m = r.pick([0.5, 1, 2, 4]);
      const uu = r.int(2, 6);
      const v = uu + r.int(2, 10);
      const t = r.pick([0.1, 0.2, 0.5, 1, 2]);
      return mcq(r, `The velocity of a ${num(m)} kg ball changes from ${uu} m/s to ${v} m/s in ${num(t)} s. The average force on the ball is:`, u((m * (v - uu)) / t, "N"), [
        u((m * v) / t, "N"),
        u(m * (v - uu) * t, "N"),
        u((m * (v + uu)) / t, "N"),
        u(m * (v - uu), "N"),
      ]);
    },
  },
  {
    key: "p4-recoil",
    chapter: 4,
    difficulty: "hard",
    scenario: true,
    make(r) {
      const [mg, v, M] = r.pick([[20, 400, 4], [10, 500, 5], [25, 400, 5], [50, 200, 4], [20, 300, 3], [10, 400, 2]]);
      const V = ((mg / 1000) * v) / M;
      return mcq(r, `A gun of mass ${M} kg fires a bullet of mass ${mg} g at ${v} m/s. The recoil speed of the gun is:`, u(V, "m/s"), [
        u((mg * v) / M, "m/s"),
        u(v / M, "m/s"),
        u(V * 10, "m/s"),
        u((M * v) / mg, "m/s"),
      ]);
    },
  },
  {
    key: "p4-stick-together",
    chapter: 4,
    difficulty: "hard",
    make(r) {
      const [m1, m2] = r.pick([[2, 2], [1, 3], [2, 6], [4, 4], [3, 3], [1, 1], [2, 8]]);
      const v = r.int(1, 4);
      const uu = ((m1 + m2) * v) / m1;
      return mcq(
        r,
        `A ${m1} kg trolley moving at ${num(uu)} m/s hits a stationary ${m2} kg trolley and they move off together. Their common speed is:`,
        u(v, "m/s"),
        [u(uu, "m/s"), u((m1 * uu) / m2, "m/s"), u(uu / 2 === v ? uu * 2 : uu / 2, "m/s"), u(v + 1, "m/s"), u(v * 3, "m/s")]
      );
    },
  },

  // ── Chapter 5: Pressure and deformation ───────────────────────────────────
  {
    key: "p5-pressure",
    chapter: 5,
    make(r) {
      const A = r.pick([0.5, 2, 4, 5, 0.25]);
      const P = r.pick([100, 200, 400, 800, 1000]);
      const what = r.pick(["box", "crate", "statue", "water tank"]);
      return mcq(r, `A ${what} of weight ${num(P * A)} N rests on an area of ${num(A)} m². The pressure it exerts is:`, u(P, "Pa"), [
        u(P * A * A, "Pa"),
        u(A / (P * A), "Pa", 5),
        u(P / 2, "Pa"),
        u(P * 2, "Pa"),
      ]);
    },
  },
  {
    key: "p5-liquid-pressure",
    chapter: 5,
    make(r) {
      const h = r.pick([2, 3, 5, 8, 10, 15, 20]);
      return mcq(r, `Taking the density of water as 1000 kg/m³ and g = 10 m/s², the pressure due to the water at a depth of ${h} m is:`, u(10000 * h, "Pa"), [
        u(1000 * h, "Pa"),
        u(100 * h, "Pa"),
        u(10000 / h, "Pa"),
        u(100000 * h, "Pa"),
      ]);
    },
  },
  {
    key: "p5-hooke",
    chapter: 5,
    anchor: "21bf2202539d",
    make(r) {
      const x1 = r.pick([2, 3, 4, 5]);
      const F1 = r.pick([10, 20, 25]);
      const k = r.pick([2, 3, 4]);
      const F2 = F1 * k;
      return mcq(r, `A spring stretches by ${x1} cm under a load of ${F1} N. Within the elastic limit, a load of ${F2} N stretches it by:`, u(x1 * k, "cm"), [
        u(x1 / k, "cm"),
        u(x1, "cm"),
        u(x1 * k * k, "cm"),
        u(x1 + k, "cm"),
      ]);
    },
  },
  {
    key: "p5-spring-constant",
    chapter: 5,
    make(r) {
      const x = r.pick([0.02, 0.05, 0.1, 0.2, 0.25]);
      const k = r.pick([100, 200, 400, 500, 1000]);
      return mcq(r, `A force of ${num(k * x)} N stretches a spring by ${num(x)} m. The spring constant is:`, u(k, "N/m"), [
        u(k * x * x, "N/m", 4),
        u(x / (k * x), "N/m", 5),
        u(k / 10, "N/m"),
        u(k * 10, "N/m"),
      ]);
    },
  },
  {
    key: "p5-hydraulic",
    chapter: 5,
    scenario: true,
    difficulty: "hard",
    make(r) {
      const F1 = r.pick([50, 100, 200, 250]);
      const A1 = r.pick([5, 10, 20]);
      const k = r.pick([10, 20, 40, 50]);
      return mcq(
        r,
        `In a car-lift, a force of ${F1} N is applied to a small piston of area ${A1} cm². The large piston has an area of ${A1 * k} cm². The upward force on the large piston is:`,
        u(F1 * k, "N"),
        [u(F1 / k, "N"), u(F1, "N"), u(F1 * A1 * k, "N"), u(F1 + A1 * k, "N")]
      );
    },
  },
  {
    key: "p5-strain",
    chapter: 5,
    difficulty: "hard",
    make(r) {
      const L = r.pick([1, 2, 4, 5]);
      const e = r.pick([1, 2, 4, 5]);
      return mcq(r, `A wire ${L} m long is stretched by ${e} mm. The strain in the wire is:`, num(e / 1000 / L, 5), [
        num(e / L, 5),
        num(L / (e / 1000), 5),
        num(e / 100 / L, 5),
        num(e / 1000 / L / 10, 6),
      ]);
    },
  },

  // ── Chapter 6: Work and energy ────────────────────────────────────────────
  {
    key: "p6-work",
    chapter: 6,
    make(r) {
      const F = r.pick([10, 20, 25, 40, 50, 80]);
      const d = r.pick([2, 3, 4, 5, 8, 10]);
      const what = r.pick(["box", "table", "cupboard", "trolley"]);
      return mcq(r, `A force of ${F} N pushes a ${what} ${d} m along the floor in the direction of the force. The work done is:`, u(F * d, "J"), [
        u(F / d, "J"),
        u(F + d, "J"),
        u((F * d) / 2, "J"),
        u(2 * F * d, "J"),
      ]);
    },
  },
  {
    key: "p6-kinetic-energy",
    chapter: 6,
    anchor: "b7db771e8b48",
    make(r) {
      const m = r.pick([2, 4, 5, 6, 10]);
      const v = r.pick([2, 3, 4, 6, 10]);
      const what = r.pick(["object", "ball", "trolley", "stone"]);
      return mcq(r, `A ${m} kg ${what} moves at ${v} m/s. Its kinetic energy is:`, u(0.5 * m * v * v, "J"), [
        u(m * v * v, "J"),
        u(m * v, "J"),
        u(0.5 * m * v, "J"),
        u(m * m * v, "J"),
      ]);
    },
  },
  {
    key: "p6-potential-energy",
    chapter: 6,
    make(r) {
      const m = r.pick([2, 3, 5, 8, 10, 20]);
      const h = r.pick([1.5, 2, 3, 4, 5, 10]);
      return mcq(r, `A ${m} kg bag is lifted onto a shelf ${num(h)} m high. Taking g = 10 m/s², its gain in potential energy is:`, u(10 * m * h, "J"), [
        u(m * h, "J"),
        u(5 * m * h, "J"),
        u((10 * m) / h, "J"),
        u(20 * m * h, "J"),
      ]);
    },
  },
  {
    key: "p6-pe-two-heights",
    chapter: 6,
    anchor: "a69f4843c857",
    make(r) {
      const W = r.pick([200, 300, 400, 500, 800]);
      const h1 = r.int(1, 4);
      const h2 = h1 + r.int(2, 6);
      return mcq(r, `A ${W} N box is lifted from a height of ${h1} m to ${h2} m. Its increase in potential energy is:`, u(W * (h2 - h1), "J"), [
        u(W * h2, "J"),
        u(W * h1, "J"),
        u(W * (h1 + h2), "J"),
        u((W * (h2 - h1)) / 2, "J"),
      ]);
    },
  },
  {
    key: "p6-power",
    chapter: 6,
    make(r) {
      const P = r.pick([20, 40, 50, 100, 250, 500]);
      const t = r.pick([2, 4, 5, 10, 20]);
      return mcq(r, `A motor does ${num(P * t)} J of work in ${t} s. Its power is:`, u(P, "W"), [
        u(P * t * t, "W"),
        u(t / (P * t), "W", 4),
        u(P * t - t, "W"),
        u(2 * P, "W"),
      ]);
    },
  },
  {
    key: "p6-stair-power",
    chapter: 6,
    difficulty: "hard",
    scenario: true,
    make(r) {
      const [m, h, t] = r.pick([[50, 6, 10], [60, 5, 6], [40, 9, 12], [50, 8, 10], [60, 4, 8], [70, 6, 12]]);
      return mcq(r, `A student of mass ${m} kg runs up a staircase ${h} m high in ${t} s. Taking g = 10 m/s², the power developed is:`, u((10 * m * h) / t, "W"), [
        u(10 * m * h, "W"),
        u((m * h) / t, "W"),
        u(10 * m * h * t, "W"),
        u((10 * m * t) / h, "W", 1),
      ]);
    },
  },
  {
    key: "p6-efficiency",
    chapter: 6,
    anchor: "dea113ea9d82",
    make(r) {
      const input = r.pick([200, 400, 500, 800, 1000, 2000]);
      const eff = r.pick([20, 25, 40, 60, 75, 80]);
      const out = (input * eff) / 100;
      return mcq(r, `A machine takes in ${num(input)} J of energy and gives out ${num(out)} J of useful energy. Its efficiency is:`, `${eff}%`, [
        `${100 - eff}%`,
        `${num((input / out) * 100)}%`,
        `${num(out / 10)}%`,
        `${num(eff / 2)}%`,
      ]);
    },
  },
  {
    key: "p6-electrical-energy",
    chapter: 6,
    anchor: "9bd8d81f645f",
    make(r) {
      const P = r.pick([40, 60, 100, 200, 500]);
      const t = r.pick([2, 5, 10, 30, 60]);
      if (r.next() < 0.5) {
        return mcq(r, `A ${P} W heater is switched on for ${t} s. The electrical energy it uses is:`, u(P * t, "J"), [
          u(P / t, "J"),
          u(P + t, "J"),
          u(t / P, "J", 3),
          u((P * t) / 2, "J"),
        ]);
      }
      return mcq(r, `A ${P} W bulb uses ${num(P * t)} J of energy in:`, u(t, "s"), [u(P * P * t, "s"), u(t * 2, "s"), u(t + 1, "s"), u(P, "s")]);
    },
  },
  {
    key: "p6-speed-from-height",
    chapter: 6,
    difficulty: "hard",
    make(r) {
      const h = r.pick([5, 20, 45, 80, 125]);
      const v = Math.sqrt(20 * h);
      return mcq(r, `A ball falls from rest through a height of ${h} m. Ignoring air resistance and taking g = 10 m/s², its speed just before hitting the ground is:`, u(v, "m/s"), [
        u(20 * h, "m/s"),
        u(10 * h, "m/s"),
        u(v / 2, "m/s"),
        u(v * 2, "m/s"),
        u(h / 2, "m/s"),
      ]);
    },
  },
  {
    key: "p6-horsepower",
    chapter: 6,
    anchor: "6c0ab2cfdfb7",
    make(r) {
      const hp = r.pick([0.5, 1, 1.5, 2, 3]);
      if (r.next() < 0.5) {
        return mcq(r, `A water pump is rated at ${num(hp)} hp. Taking 1 hp = 746 W, its power in watts is:`, u(hp * 746, "W"), [
          u(hp * 1000, "W"),
          u(746 / hp, "W", 1),
          u(hp * 746 * 2, "W"),
          u(hp + 746, "W"),
        ]);
      }
      return mcq(r, `A motor uses ${num(hp * 746)} W of power. Taking 1 hp = 746 W, this is:`, `${num(hp)} hp`, [
        `${num(hp * 2)} hp`,
        `${num(hp + 1)} hp`,
        `${num(hp * 746)} hp`,
        `${num(hp / 2)} hp`,
      ]);
    },
  },

  // ── Chapter 7: Density and temperature ────────────────────────────────────
  {
    key: "p7-density",
    chapter: 7,
    anchor: "ec83732ce0e6",
    make(r) {
      const d = r.pick([0.5, 0.8, 2, 2.5, 3, 4, 8]);
      const V = r.pick([10, 20, 25, 40, 50, 100]);
      return mcq(r, `A block has a mass of ${num(d * V)} g and a volume of ${V} cm³. Its density is:`, u(d, "g cm⁻³"), [
        u(V / (d * V), "g cm⁻³", 3),
        u(d * V * V, "g cm⁻³"),
        u(d * 10, "g cm⁻³"),
        u(d * V + V, "g cm⁻³"),
      ]);
    },
  },
  {
    key: "p7-mass-from-density",
    chapter: 7,
    anchor: "45135ec7557a",
    make(r) {
      const [liquid, rho] = r.pick([["water", 1000], ["cooking oil", 900], ["petrol", 700], ["kerosene", 800]]);
      const V = r.pick([0.5, 2, 3, 4, 5]);
      return mcq(r, `What is the mass of ${num(V)} m³ of ${liquid} (density ${rho} kg m⁻³)?`, u(rho * V, "kg"), [
        u(rho / V, "kg"),
        u(V / rho, "kg", 4),
        u(rho + V, "kg"),
        u((rho * V) / 10, "kg"),
      ]);
    },
  },
  {
    key: "p7-volume-from-density",
    chapter: 7,
    anchor: "d600e293793e",
    make(r) {
      const d = r.pick([2, 2.5, 4, 5, 8, 10]);
      const V = r.pick([20, 40, 50, 100, 200]);
      return mcq(r, `A substance has a density of ${num(d)} g cm⁻³. What volume does ${num(d * V)} g of it occupy?`, u(V, "cm³"), [
        u(d * d * V, "cm³"),
        u(d / (d * V), "cm³", 4),
        u(d * V + d, "cm³"),
        u(V / 2, "cm³"),
      ]);
    },
  },
  {
    key: "p7-kelvin",
    chapter: 7,
    anchor: "4028fea8da16",
    difficulty: "easy",
    make(r) {
      const c = r.pick([-73, 17, 37, 50, 100, 127, 227]);
      if (r.next() < 0.5) {
        return mcq(r, `${num(c)} °C on the Kelvin scale is:`, u(c + 273, "K"), [u(c - 273, "K"), u(273 - c, "K"), u(c + 373, "K"), u(c, "K")]);
      }
      return mcq(r, `A temperature of ${c + 273} K on the Celsius scale is:`, u(c, "°C"), [
        u(c + 546, "°C"),
        u(c + 273, "°C"),
        u(-c, "°C"),
        u(c - 100, "°C"),
      ]);
    },
  },
  {
    key: "p7-fahrenheit",
    chapter: 7,
    anchor: "4c40abc4ecec",
    make(r) {
      const c = r.pick([10, 20, 25, 30, 35, 40, 50, 60]);
      return mcq(r, `${c} °C on the Fahrenheit scale is:`, u((9 * c) / 5 + 32, "°F"), [
        u((9 * c) / 5, "°F"),
        u(c + 32, "°F"),
        u((5 * c) / 9 + 32, "°F", 1),
        u((9 * c) / 5 - 32, "°F"),
      ]);
    },
  },
  {
    key: "p7-celsius-from-fahrenheit",
    chapter: 7,
    anchor: "748a91863507",
    scenario: true,
    make(r) {
      const c = r.pick([5, 10, 15, 20, 30, 35, 40]);
      const f = (9 * c) / 5 + 32;
      return mcq(r, `A weather report gives the temperature as ${f} °F. In Celsius this is:`, u(c, "°C"), [
        u(f - 32, "°C"),
        u((9 * f) / 5 + 32, "°C"),
        u(c + 10, "°C"),
        u(f / 2, "°C"),
      ]);
    },
  },
  {
    key: "p7-specific-heat",
    chapter: 7,
    difficulty: "hard",
    make(r) {
      const m = r.pick([0.5, 1, 2, 3, 5]);
      const dT = r.pick([10, 20, 25, 40, 50]);
      return mcq(
        r,
        `How much heat is needed to raise the temperature of ${num(m)} kg of water by ${dT} °C? (specific heat capacity of water = 4200 J kg⁻¹ °C⁻¹)`,
        u(4200 * m * dT, "J"),
        [u(4200 * m, "J"), u(4200 * dT, "J"), u(420 * m * dT, "J"), u(42000 * m * dT, "J")]
      );
    },
  },
  {
    key: "p7-latent-heat",
    chapter: 7,
    difficulty: "hard",
    scenario: true,
    make(r) {
      const m = r.pick([0.25, 0.5, 2, 3, 5]);
      return mcq(
        r,
        `How much heat is needed to melt ${num(m)} kg of ice already at 0 °C? (specific latent heat of fusion of ice = 336,000 J/kg)`,
        u(336000 * m, "J"),
        [u(336000 / m, "J"), u(4200 * m, "J"), u(336000 * m * 10, "J"), u(33600 * m, "J")]
      );
    },
  },
  {
    key: "p7-expansion",
    chapter: 7,
    difficulty: "hard",
    scenario: true,
    make(r) {
      const L = r.pick([10, 20, 25, 50]);
      const dT = r.pick([20, 40, 50, 100]);
      const mm = 1.2e-5 * L * dT * 1000;
      return mcq(
        r,
        `A steel rail ${L} m long is heated through ${dT} °C. If the coefficient of linear expansion of steel is 1.2 × 10⁻⁵ per °C, its increase in length is:`,
        u(mm, "mm"),
        [u(mm * 10, "mm"), u(mm / 10, "mm", 3), u(mm * 100, "mm"), u(mm * 2, "mm")]
      );
    },
  },
  {
    key: "p7-float-or-sink",
    chapter: 7,
    scenario: true,
    make(r) {
      const d = r.pick([0.4, 0.5, 0.6, 0.8, 1.5, 2, 2.5, 3]);
      const V = r.pick([10, 20, 40, 50]);
      const m = d * V;
      const verdict = d < 1 ? "float" : "sink";
      const other = d < 1 ? "sink" : "float";
      return mcq(r, `An object has a mass of ${num(m)} g and a volume of ${V} cm³. When placed in water (density 1 g cm⁻³), it will:`, `${verdict}, because its density is ${num(d)} g cm⁻³`, [
        `${other}, because its density is ${num(d)} g cm⁻³`,
        `${other}, because its mass is ${num(m)} g`,
        `${verdict}, because its volume is ${V} cm³`,
      ]);
    },
  },
];
