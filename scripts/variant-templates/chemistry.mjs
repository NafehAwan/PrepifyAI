// Chemistry calculation templates. Each one re-values a board-style question;
// `anchor` names the bank question it varies, so a test never asks both.
import { mcq, num, u, chem, sci, signed, gcd, sup } from "../lib/variant-kit.mjs";

const MASS = { H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, Al: 27, S: 32, Cl: 35.5, K: 39, Ca: 40 };

// [formula, { element: count }]
const COMPOUNDS = [
  ["H2O", { H: 2, O: 1 }],
  ["CO2", { C: 1, O: 2 }],
  ["NaCl", { Na: 1, Cl: 1 }],
  ["NH3", { N: 1, H: 3 }],
  ["CH4", { C: 1, H: 4 }],
  ["H2SO4", { H: 2, S: 1, O: 4 }],
  ["CaCO3", { Ca: 1, C: 1, O: 3 }],
  ["NaOH", { Na: 1, O: 1, H: 1 }],
  ["HCl", { H: 1, Cl: 1 }],
  ["MgO", { Mg: 1, O: 1 }],
  ["C6H12O6", { C: 6, H: 12, O: 6 }],
  ["KOH", { K: 1, O: 1, H: 1 }],
  ["HNO3", { H: 1, N: 1, O: 3 }],
  ["SO2", { S: 1, O: 2 }],
  ["C2H5OH", { C: 2, H: 6, O: 1 }],
  ["Al2O3", { Al: 2, O: 3 }],
];
const molar = (comp) => Object.entries(comp).reduce((m, [el, n]) => m + MASS[el] * n, 0);
const massKey = (comp) => Object.keys(comp).map((el) => `${el} = ${MASS[el]}`).join(", ");

// Electron shells for Z ≤ 20 (the 2, 8, 8, 2 model used at this level).
function shells(z) {
  const out = [];
  for (const cap of [2, 8, 8, 2]) {
    if (z <= 0) break;
    out.push(Math.min(cap, z));
    z -= Math.min(cap, z);
  }
  return out;
}
const ELEMENTS = [
  ["lithium", "Li", 3, 7], ["beryllium", "Be", 4, 9], ["boron", "B", 5, 11], ["carbon", "C", 6, 12], ["nitrogen", "N", 7, 14],
  ["oxygen", "O", 8, 16], ["fluorine", "F", 9, 19], ["sodium", "Na", 11, 23], ["magnesium", "Mg", 12, 24], ["aluminium", "Al", 13, 27],
  ["silicon", "Si", 14, 28], ["phosphorus", "P", 15, 31], ["sulphur", "S", 16, 32], ["chlorine", "Cl", 17, 35], ["potassium", "K", 19, 39],
  ["calcium", "Ca", 20, 40],
];
const GROUP = { 1: 1, 2: 2, 3: 13, 4: 14, 5: 15, 6: 16, 7: 17, 8: 18 };

const ALKYL = ["meth", "eth", "prop", "but", "pent", "hex", "hept", "oct"];

export default [
  // ── Chapter 2: Matter (solutions) ─────────────────────────────────────────
  {
    key: "c2-mass-percent",
    chapter: 2,
    scenario: true,
    make(r) {
      const total = r.pick([50, 100, 200, 250]);
      const s = r.pick([5, 10, 20, 25]);
      const solute = r.pick(["sugar", "salt", "copper sulphate", "urea"]);
      return mcq(r, `${s} g of ${solute} is dissolved in ${total - s} g of water. The concentration of the solution by mass is:`, `${num((s / total) * 100, 1)}%`, [
        `${num((s / (total - s)) * 100, 1)}%`,
        `${s}%`,
        `${num(((total - s) / total) * 100, 1)}%`,
        `${num((s / total) * 50, 1)}%`,
      ]);
    },
  },

  // ── Chapter 3: Atomic structure ───────────────────────────────────────────
  {
    key: "c3-nucleons",
    chapter: 3,
    make(r) {
      const [name, sym, Z, A] = r.pick(ELEMENTS);
      if (r.next() < 0.6) {
        return mcq(r, `An atom of ${name} has mass number ${A} and atomic number ${Z}. The number of neutrons in its nucleus is:`, String(A - Z), [
          String(A),
          String(Z),
          String(A + Z),
          String(A - Z + 1),
          String(A - Z - 1),
        ]);
      }
      return mcq(r, `A ${name} atom has ${Z} protons and ${A - Z} neutrons. Its mass number is:`, String(A), [
        String(Z),
        String(A - Z),
        String(A - 2 * Z === 0 ? A + 1 : Math.abs(A - 2 * Z)),
        String(A + Z),
      ]);
    },
  },
  {
    key: "c3-configuration",
    chapter: 3,
    make(r) {
      const Z = r.int(3, 20);
      const cfg = (z) => shells(z).join(", ");
      const s = shells(Z);
      const lumped = s.length > 2 ? [s[0], s.slice(1).reduce((a, b) => a + b, 0)].join(", ") : [s[0] - 1, s[1] + 1].join(", ");
      return mcq(r, `The electronic configuration of an element with atomic number ${Z} is:`, cfg(Z), [
        cfg(Z + 1),
        cfg(Z - 1),
        lumped,
        [...s].reverse().join(", "),
        cfg(Z + 2),
      ]);
    },
  },
  {
    key: "c3-ion-electrons",
    chapter: 3,
    make(r) {
      const [ion, Z, q] = r.pick([["Na⁺", 11, 1], ["Mg²⁺", 12, 2], ["Al³⁺", 13, 3], ["Cl⁻", 17, -1], ["O²⁻", 8, -2], ["S²⁻", 16, -2], ["K⁺", 19, 1], ["Ca²⁺", 20, 2], ["F⁻", 9, -1], ["N³⁻", 7, -3]]);
      const e = Z - q;
      return mcq(r, `The atomic number of the element in the ${ion} ion is ${Z}. How many electrons does the ion have?`, String(e), [
        String(Z),
        String(Z + q),
        String(e + 1),
        String(e - 1),
        String(Z + 2 * q),
      ]);
    },
  },
  {
    key: "c3-valence-electrons",
    chapter: 3,
    difficulty: "easy",
    make(r) {
      const [name, , Z] = r.pick(ELEMENTS);
      const s = shells(Z);
      const v = s[s.length - 1];
      return mcq(r, `${name[0].toUpperCase() + name.slice(1)} has atomic number ${Z}. How many valence electrons does its atom have?`, String(v), [
        String(8 - v === v ? v + 2 : 8 - v),
        String(s.length),
        String(v + 1),
        String(v === 1 ? 3 : v - 1),
        String(Z),
      ]);
    },
  },

  // ── Chapter 4: Periodic table ─────────────────────────────────────────────
  {
    key: "c4-period-group",
    chapter: 4,
    make(r) {
      const [, , Z] = r.pick(ELEMENTS);
      const s = shells(Z);
      const p = s.length;
      const v = s[s.length - 1];
      const g = GROUP[v];
      const opt = (pp, gg) => `Period ${pp}, Group ${gg}`;
      return mcq(r, `An element has the electronic configuration ${s.join(", ")}. Its position in the periodic table is:`, opt(p, g), [
        opt(v, p),
        opt(p + 1, g),
        opt(p, g === 18 ? 17 : g + 1),
        opt(p - 1 || p + 2, g),
        opt(g, p),
      ]);
    },
  },

  // ── Chapter 5: Chemical bonding ───────────────────────────────────────────
  {
    key: "c5-ionic-formula",
    chapter: 5,
    make(r) {
      const [cName, c, qc] = r.pick([["sodium", "Na", 1], ["potassium", "K", 1], ["magnesium", "Mg", 2], ["calcium", "Ca", 2], ["aluminium", "Al", 3]]);
      const [aName, a, qa] = r.pick([["chloride", "Cl", 1], ["oxide", "O", 2], ["sulphide", "S", 2], ["nitride", "N", 3], ["fluoride", "F", 1]]);
      const ion = (sym, q, sign) => `${sym}${q > 1 ? sup(q) : ""}${sign}`;
      const f = (x, y) => chem(`${c}${x > 1 ? x : ""}${a}${y > 1 ? y : ""}`);
      const g = gcd(qc, qa);
      const correct = f(qa / g, qc / g);
      return mcq(
        r,
        `The formula of the compound formed between ${cName} ions (${ion(c, qc, "⁺")}) and ${aName} ions (${ion(a, qa, "⁻")}) is:`,
        correct,
        [f(qc, qa), f(1, 1), f(qa, 1), f(1, qc), f(2, 3), f(3, 2), f(qa + qc, 1)]
      );
    },
  },
  {
    key: "c5-shared-pairs",
    chapter: 5,
    make(r) {
      const [m, n] = r.pick([["H2", 1], ["O2", 2], ["N2", 3], ["CH4", 4], ["H2O", 2], ["NH3", 3], ["CO2", 4], ["HCl", 1], ["C2H4", 6], ["Cl2", 1]]);
      return mcq(r, `How many shared pairs of electrons are there in a molecule of ${chem(m)}?`, String(n), [n * 2, n + 1, n === 1 ? 3 : n - 1, n + 2, n + 3].map(String));
    },
  },

  // ── Chapter 6: Stoichiometry ──────────────────────────────────────────────
  {
    key: "c6-molar-mass",
    chapter: 6,
    make(r) {
      const [f, comp] = r.pick(COMPOUNDS);
      const M = molar(comp);
      const once = Object.keys(comp).reduce((m, el) => m + MASS[el], 0);
      return mcq(r, `The molar mass of ${chem(f)} is: (${massKey(comp)})`, u(M, "g/mol", 1), [
        u(once, "g/mol", 1),
        u(M + 16, "g/mol", 1),
        u(M - 2, "g/mol", 1),
        u(2 * M, "g/mol", 1),
        u(M + 1, "g/mol", 1),
      ]);
    },
  },
  {
    key: "c6-moles-from-mass",
    chapter: 6,
    make(r) {
      const [f, comp] = r.pick(COMPOUNDS);
      const M = molar(comp);
      const n = r.pick([0.1, 0.25, 0.5, 2, 3, 5]);
      return mcq(r, `How many moles are present in ${num(n * M)} g of ${chem(f)}? (molar mass = ${num(M)} g/mol)`, u(n, "mol"), [
        u(n * M * M, "mol"),
        u(1 / n, "mol"),
        u(n * 2, "mol"),
        u(n / 2, "mol", 3),
        u(n * 10, "mol"),
      ]);
    },
  },
  {
    key: "c6-mass-from-moles",
    chapter: 6,
    make(r) {
      const [f, comp] = r.pick(COMPOUNDS);
      const M = molar(comp);
      const n = r.pick([0.1, 0.2, 0.5, 1.5, 2, 4]);
      return mcq(r, `What is the mass of ${num(n)} mol of ${chem(f)}? (molar mass = ${num(M)} g/mol)`, u(n * M, "g"), [
        u(M / n, "g"),
        u(n / M, "g", 4),
        u(M, "g"),
        u(2 * n * M, "g"),
      ]);
    },
  },
  {
    key: "c6-particles",
    chapter: 6,
    anchor: "8677b0e49163",
    make(r) {
      const n = r.pick([0.1, 0.25, 1.5, 2, 3, 5]);
      const [f, atoms] = r.pick([["O2", 2], ["N2", 2], ["H2O", 3], ["CO2", 3], ["CH4", 5], ["NH3", 4]]);
      const asSci = (x) => {
        let e = 23;
        let m = x * 6.02;
        while (m >= 10) (m /= 10), e++;
        while (m < 1) (m *= 10), e--;
        return sci(m, e);
      };
      if (r.next() < 0.6) {
        return mcq(r, `How many molecules are present in ${num(n)} mol of ${chem(f)}? (Nₐ = 6.02 × 10²³ mol⁻¹)`, asSci(n), [
          asSci(1),
          asSci(n * atoms),
          asSci(n * 10),
          asSci(n / 10),
        ]);
      }
      return mcq(r, `How many atoms in total are present in ${num(n)} mol of ${chem(f)}? (Nₐ = 6.02 × 10²³ mol⁻¹)`, asSci(n * atoms), [
        asSci(n),
        asSci(atoms),
        asSci(n * atoms * 10),
        asSci(n * (atoms + 1)),
      ]);
    },
  },
  {
    key: "c6-atoms-in-moles",
    chapter: 6,
    anchor: "8de74113c845",
    make(r) {
      const [f, el, k] = r.pick([["H2O", "hydrogen", 2], ["CH4", "hydrogen", 4], ["CO2", "oxygen", 2], ["H2SO4", "oxygen", 4], ["C6H12O6", "carbon", 6], ["NH3", "hydrogen", 3], ["CaCO3", "oxygen", 3]]);
      const n = r.pick([0.2, 0.25, 0.5, 2, 3]);
      return mcq(r, `How many moles of ${el} atoms are present in ${num(n)} mol of ${chem(f)}?`, num(n * k), [num(n), num(k), num(n * k * 2), num(n + k), num(n * (k + 1))]);
    },
  },
  {
    key: "c6-gas-volume",
    chapter: 6,
    make(r) {
      const n = r.pick([0.1, 0.25, 0.5, 1.5, 2, 3]);
      const gas = r.pick(["oxygen", "nitrogen", "carbon dioxide", "hydrogen"]);
      return mcq(r, `What volume does ${num(n)} mol of ${gas} gas occupy at STP? (molar volume = 22.4 dm³)`, u(22.4 * n, "dm³"), [
        u(22.4 / n, "dm³"),
        u(n / 22.4, "dm³", 3),
        "22.4 dm³",
        u(44.8 * n, "dm³"),
      ]);
    },
  },
  {
    key: "c6-percent-composition",
    chapter: 6,
    difficulty: "hard",
    make(r) {
      const [f, el, comp] = r.pick([
        ["H2O", "O", { H: 2, O: 1 }],
        ["CO2", "C", { C: 1, O: 2 }],
        ["CaCO3", "Ca", { Ca: 1, C: 1, O: 3 }],
        ["NH3", "N", { N: 1, H: 3 }],
        ["NaOH", "Na", { Na: 1, O: 1, H: 1 }],
        ["CH4", "C", { C: 1, H: 4 }],
        ["SO2", "S", { S: 1, O: 2 }],
        ["MgO", "Mg", { Mg: 1, O: 1 }],
        ["CaCO3", "O", { Ca: 1, C: 1, O: 3 }],
      ]);
      const M = molar(comp);
      const pct = ((MASS[el] * comp[el]) / M) * 100;
      const atomShare = (comp[el] / Object.values(comp).reduce((a, b) => a + b, 0)) * 100;
      return mcq(r, `What is the percentage by mass of ${el} in ${chem(f)}? (${massKey(comp)})`, `${num(pct, 1)}%`, [
        `${num(100 - pct, 1)}%`,
        `${num(atomShare, 1)}%`,
        `${num((MASS[el] / M) * 100, 1)}%`,
        `${num(pct / 2, 1)}%`,
        `${num(MASS[el], 1)}%`,
      ]);
    },
  },
  {
    key: "c6-percent-yield",
    chapter: 6,
    anchor: "6996c937b647",
    scenario: true,
    make(r) {
      const T = r.pick([20, 25, 40, 50, 80, 120]);
      const pct = r.pick([60, 75, 80, 90, 95]);
      const A = (T * pct) / 100;
      return mcq(r, `A student calculates that a reaction should give ${T} g of product but actually collects ${num(A)} g. The percentage yield is:`, `${pct}%`, [
        `${100 - pct}%`,
        `${num((T / A) * 100, 1)}%`,
        `${num(A)}%`,
        `${num(pct / 2)}%`,
      ]);
    },
  },
  {
    key: "c6-molecular-formula",
    chapter: 6,
    anchor: "b60f5ea245a9",
    difficulty: "hard",
    make(r) {
      // Only multiples that give real compounds (C₂H₆, not C₃H₉).
      const [emp, parts, mass, ks] = r.pick([
        ["CH2", { C: 1, H: 2 }, 14, [2, 3, 4, 5]],
        ["CH2O", { C: 1, H: 2, O: 1 }, 30, [2, 3, 6]],
        ["CH", { C: 1, H: 1 }, 13, [2, 6]],
        ["NO2", { N: 1, O: 2 }, 46, [2]],
        ["CH3", { C: 1, H: 3 }, 15, [2]],
      ]);
      const k = r.pick(ks);
      const f = (n) => chem(Object.entries(parts).map(([el, c]) => `${el}${c * n > 1 ? c * n : ""}`).join(""));
      return mcq(r, `A compound has the empirical formula ${chem(emp)}. If its molar mass is ${mass * k} g/mol, its molecular formula is:`, f(k), [
        f(k + 1),
        f(k - 1 || 5),
        f(k * 2),
        f(k === 2 ? 3 : 2),
      ]);
    },
  },

  // ── Chapter 7: Electrochemistry ───────────────────────────────────────────
  {
    key: "c7-oxidation-number",
    chapter: 7,
    make(r) {
      const [f, el, v] = r.pick([
        ["SO2", "sulphur", 4], ["H2S", "sulphur", -2], ["KMnO4", "manganese", 7], ["K2Cr2O7", "chromium", 6], ["HNO3", "nitrogen", 5],
        ["NH3", "nitrogen", -3], ["NO2", "nitrogen", 4], ["CO2", "carbon", 4], ["CH4", "carbon", -4], ["Fe2O3", "iron", 3],
        ["FeO", "iron", 2], ["H2O2", "oxygen", -1], ["KClO3", "chlorine", 5], ["Cl2", "chlorine", 0], ["Na2SO4", "sulphur", 6],
        ["P2O5", "phosphorus", 5], ["MnO2", "manganese", 4], ["CuSO4", "copper", 2],
      ]);
      return mcq(r, `The oxidation number of ${el} in ${chem(f)} is:`, signed(v), [signed(-v || 2), signed(v + 2), signed(v - 2), signed(v + 1), "0"]);
    },
  },

  // ── Chapter 8: Energetics ─────────────────────────────────────────────────
  {
    key: "c8-scale-enthalpy",
    chapter: 8,
    make(r) {
      const [fuel, H] = r.pick([["methane", 890], ["hydrogen", 286], ["carbon", 393], ["ethanol", 1367]]);
      const n = r.pick([0.5, 2, 3, 4, 1.5]);
      return mcq(r, `Burning 1 mol of ${fuel} releases ${H} kJ of heat. How much heat is released when ${num(n)} mol burn completely?`, u(n * H, "kJ", 1), [
        u(H / n, "kJ", 1),
        u(H, "kJ"),
        u(H + n, "kJ", 1),
        u(2 * n * H, "kJ", 1),
      ]);
    },
  },
  {
    key: "c8-enthalpy-sign",
    chapter: 8,
    make(r) {
      const Er = 10 * r.int(10, 60);
      const d = 10 * r.int(3, 20) * (r.next() < 0.5 ? -1 : 1);
      const Ep = Er + d;
      if (Ep <= 0) return null;
      const opt = (x, kind) => `ΔH = ${signed(x)} kJ; ${kind}`;
      return mcq(r, `The reactants of a reaction have ${Er} kJ of energy and the products have ${Ep} kJ. Which statement is correct?`, opt(d, d < 0 ? "exothermic" : "endothermic"), [
        opt(-d, d < 0 ? "endothermic" : "exothermic"),
        opt(d, d < 0 ? "endothermic" : "exothermic"),
        opt(-d, d < 0 ? "exothermic" : "endothermic"),
      ]);
    },
  },
  {
    key: "c8-bond-energy",
    chapter: 8,
    difficulty: "hard",
    make(r) {
      const b = 50 * r.int(8, 40);
      const f = b + 50 * r.int(-6, 6);
      if (f === b) return null;
      const d = b - f;
      const opt = (x, kind) => `ΔH = ${signed(x)} kJ; ${kind}`;
      return mcq(
        r,
        `In a reaction, ${b} kJ of energy is absorbed to break the bonds of the reactants and ${f} kJ is released when the bonds of the products form. Which is correct?`,
        opt(d, d < 0 ? "exothermic" : "endothermic"),
        [opt(-d, d < 0 ? "endothermic" : "exothermic"), opt(d, d < 0 ? "endothermic" : "exothermic"), opt(b + f, "endothermic")]
      );
    },
  },

  // ── Chapter 9: Chemical equilibrium ───────────────────────────────────────
  {
    key: "c9-kc-value",
    chapter: 9,
    difficulty: "hard",
    make(r) {
      const [a, b] = r.pick([[0.1, 0.7], [0.2, 0.8], [0.5, 1], [0.1, 0.5], [0.2, 1.2], [0.1, 0.9], [0.1, 0.3]]);
      const K = (b * b) / (a * a);
      return mcq(
        r,
        `For H₂ + I₂ ⇌ 2HI at equilibrium, [H₂] = [I₂] = ${num(a)} mol/dm³ and [HI] = ${num(b)} mol/dm³. The value of Kc is:`,
        num(K),
        [num(b / (a * a)), num((b * b) / (2 * a)), num((a * a) / (b * b), 4), num((2 * b) / (a * a)), num(K * 2)]
      );
    },
  },
  {
    key: "c9-kc-expression",
    chapter: 9,
    make(r) {
      const [eq, right, wrongs] = r.pick([
        ["N₂ + 3H₂ ⇌ 2NH₃", "[NH₃]² / ([N₂][H₂]³)", ["([N₂][H₂]³) / [NH₃]²", "[NH₃] / ([N₂][H₂])", "2[NH₃] / ([N₂] 3[H₂])"]],
        ["2SO₂ + O₂ ⇌ 2SO₃", "[SO₃]² / ([SO₂]²[O₂])", ["([SO₂]²[O₂]) / [SO₃]²", "[SO₃] / ([SO₂][O₂])", "[SO₃]² / ([SO₂][O₂])"]],
        ["H₂ + I₂ ⇌ 2HI", "[HI]² / ([H₂][I₂])", ["([H₂][I₂]) / [HI]²", "[HI] / ([H₂][I₂])", "2[HI] / ([H₂][I₂])"]],
        ["PCl₅ ⇌ PCl₃ + Cl₂", "[PCl₃][Cl₂] / [PCl₅]", ["[PCl₅] / ([PCl₃][Cl₂])", "[PCl₃] / [PCl₅]", "([PCl₃] + [Cl₂]) / [PCl₅]"]],
        ["2NO₂ ⇌ N₂O₄", "[N₂O₄] / [NO₂]²", ["[NO₂]² / [N₂O₄]", "[N₂O₄] / [NO₂]", "[N₂O₄] / 2[NO₂]"]],
        ["N₂ + O₂ ⇌ 2NO", "[NO]² / ([N₂][O₂])", ["([N₂][O₂]) / [NO]²", "[NO] / ([N₂][O₂])", "2[NO] / ([N₂][O₂])"]],
      ]);
      return mcq(r, `The equilibrium constant expression (Kc) for ${eq} is:`, right, wrongs);
    },
  },

  // ── Chapter 10: Acids, bases and salts ────────────────────────────────────
  {
    key: "c10-ph",
    chapter: 10,
    make(r) {
      if (r.next() < 0.5) {
        const n = r.int(1, 13);
        return mcq(r, `The hydrogen-ion concentration of a solution is 1 × 10${sup(-n)} mol/dm³. Its pH is:`, String(n), [
          String(14 - n === n ? n + 1 : 14 - n),
          `−${n}`,
          String(n + 1),
          String(n === 1 ? 3 : n - 1),
        ]);
      }
      const p = r.pick([1, 2, 5, 6, 7, 8, 9, 13, 14]);
      const kinds = ["strongly acidic", "weakly acidic", "neutral", "weakly alkaline", "strongly alkaline"];
      const kind = p <= 2 ? 0 : p < 7 ? 1 : p === 7 ? 2 : p <= 11 ? 3 : 4;
      return mcq(r, `A solution has a pH of ${p}. It is:`, kinds[kind], r.shuffle(kinds.filter((_, i) => i !== kind)));
    },
  },
  {
    key: "c10-poh",
    chapter: 10,
    make(r) {
      const p = r.pick([2, 3, 4, 5, 9, 10, 11, 12]);
      return mcq(r, `The pH of a solution is ${p}. Its pOH is:`, String(14 - p), [String(p), String(14 + p), String(Math.abs(7 - p) || 1), String(14 - p + 1)]);
    },
  },
  {
    key: "c10-neutralisation",
    chapter: 10,
    difficulty: "hard",
    scenario: true,
    make(r) {
      const [acid, k] = r.pick([["HCl", 1], ["HNO₃", 1], ["H₂SO₄", 2]]);
      const n = r.pick([0.1, 0.2, 0.5, 1, 1.5]);
      return mcq(r, `How many moles of NaOH are needed to neutralise ${num(n)} mol of ${acid} completely?`, u(n * k, "mol"), [
        u(k === 1 ? n * 2 : n, "mol"),
        u(n / 2, "mol", 3),
        u(n * 4, "mol"),
        u(n * 3, "mol"),
      ]);
    },
  },

  // ── Chapter 13: Organic chemistry ─────────────────────────────────────────
  {
    key: "c13-carbon-count",
    chapter: 13,
    difficulty: "easy",
    make(r) {
      const [name, n] = r.pick([
        ["methanol", 1], ["ethanol", 2], ["propane", 3], ["butane", 4], ["pentane", 5], ["hexane", 6], ["heptane", 7], ["octane", 8],
        ["propene", 3], ["butanol", 4], ["ethanoic acid", 2], ["pentene", 5], ["propanol", 3],
      ]);
      return mcq(r, `How many carbon atoms are in one molecule of ${name}?`, String(n), [String(n + 1), String(n === 1 ? 3 : n - 1), String(n + 2), String(2 * n + 2)]);
    },
  },

  // ── Chapter 14: Hydrocarbons ──────────────────────────────────────────────
  {
    key: "c14-formula",
    chapter: 14,
    make(r) {
      const n = r.int(2, 8);
      const [suffix, h] = r.pick([["ane", 2 * n + 2], ["ene", 2 * n], ["yne", 2 * n - 2]]);
      const f = (hh) => chem(`C${n}H${hh}`);
      return mcq(r, `The molecular formula of ${ALKYL[n - 1]}${suffix} is:`, f(h), [f(2 * n + 2), f(2 * n), f(2 * n - 2), f(2 * n + 4), chem(`C${n}H${n}`)]);
    },
  },
  {
    key: "c14-molar-mass",
    chapter: 14,
    anchor: "9ce64a9326e8",
    make(r) {
      const n = r.int(1, 8);
      const [suffix, h] = n === 1 ? ["ane", 4] : r.pick([["ane", 2 * n + 2], ["ene", 2 * n]]);
      const M = 12 * n + h;
      if (n === 3 && suffix === "ane") return null; // that is the anchor question itself
      return mcq(r, `The molar mass of ${ALKYL[n - 1]}${suffix} (${chem(`C${n > 1 ? n : ""}H${h}`)}) is (C = 12, H = 1):`, u(M, "g mol⁻¹"), [
        u(12 * n, "g mol⁻¹"),
        u(M + 14, "g mol⁻¹"),
        u(M - 2, "g mol⁻¹"),
        u(n + h, "g mol⁻¹"),
        u(M + 2, "g mol⁻¹"),
      ]);
    },
  },
  {
    key: "c14-combustion-products",
    chapter: 14,
    difficulty: "hard",
    make(r) {
      const n = r.int(1, 6);
      const [suffix, h] = n === 1 ? ["ane", 4] : r.pick([["ane", 2 * n + 2], ["ene", 2 * n]]);
      const opt = (c, w) => `${c} CO₂ and ${w} H₂O`;
      return mcq(r, `Complete combustion of one molecule of ${ALKYL[n - 1]}${suffix} (${chem(`C${n > 1 ? n : ""}H${h}`)}) produces:`, opt(n, h / 2), [
        opt(h / 2, n),
        opt(n, h),
        opt(2 * n, h / 2),
        opt(n + 1, h / 2 + 1),
      ]);
    },
  },
];
