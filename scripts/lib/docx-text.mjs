// Renders a .docx body to plain text, one paragraph per line, including Word
// equations.
//
// Stripping tags is not enough for these documents: Word stores maths as OMML
// (<m:f> fractions, <m:rad> roots, <m:sSub> subscripts...), and naive stripping
// glues the parts together, so 1/3 becomes "13", sqrt(11) becomes "11" and
// H2SO4 survives only by luck. A question with a mangled fraction is worse than
// no question, so equations are rendered properly here.
//
// Pictures are replaced by a FIGURE marker, so the parser can drop questions
// that only make sense with a diagram the app cannot show.

import { execFileSync } from "node:child_process";

export const FIGURE = "[figure]";

// --- a minimal XML parser (docx XML is machine-written and well-formed) -----

function parseXml(xml) {
  const root = { name: "#root", attrs: {}, children: [] };
  const stack = [root];
  const re = /<(\/?)([A-Za-z0-9_:.-]+)((?:\s+[^\s=>\/]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)|<\?[^>]*\?>|<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>/g;
  let m;
  while ((m = re.exec(xml))) {
    const [, closing, name, rawAttrs, selfClosing, text, cdata] = m;
    const top = stack[stack.length - 1];
    if (text !== undefined || cdata !== undefined) {
      top.children.push({ text: decode(text ?? cdata ?? "") });
      continue;
    }
    if (!name) continue; // declaration or comment
    if (closing) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const attrs = {};
    for (const a of (rawAttrs ?? "").matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      attrs[a[1]] = decode(a[2] ?? a[3] ?? "");
    }
    const node = { name, attrs, children: [] };
    top.children.push(node);
    if (!selfClosing) stack.push(node);
  }
  return root;
}

function decode(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");
}

const kids = (n, name) => (n.children ?? []).filter((c) => c.name === name);
const kid = (n, name) => kids(n, name)[0];
const val = (n, name) => kid(n, name)?.attrs?.["m:val"];

// --- equations ---------------------------------------------------------------

const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "−": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", n: "ⁿ", i: "ⁱ" };
const SUB = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋", "−": "₋", "=": "₌", "(": "₍", ")": "₎", a: "ₐ", e: "ₑ", o: "ₒ", x: "ₓ", n: "ₙ" };

function mapAll(s, table) {
  const chars = [...s];
  return chars.every((c) => table[c]) ? chars.map((c) => table[c]).join("") : null;
}

// Parenthesise a fraction part / root argument only when it is compound.
const isAtom = (s) => /^[\p{L}\p{N}.²³¹⁰-₟π]+$/u.test(s) || /^\(.*\)$/.test(s);
const wrap = (s) => (isAtom(s) ? s : `(${s})`);

function mathText(n) {
  return (n.children ?? []).map(renderMath).join("");
}

function renderMath(n) {
  if (n.text !== undefined) return "";
  const e = () => (kid(n, "m:e") ? mathText(kid(n, "m:e")) : "");
  switch (n.name) {
    case "m:r":
      return kids(n, "m:t").map((t) => t.children.map((c) => c.text ?? "").join("")).join("");
    case "m:f": {
      const num = mathText(kid(n, "m:num") ?? { children: [] }).trim();
      const den = mathText(kid(n, "m:den") ?? { children: [] }).trim();
      return `${wrap(num)}/${wrap(den)}`;
    }
    case "m:rad": {
      const arg = e().trim();
      const degNode = kid(n, "m:deg");
      const deg = degNode ? mathText(degNode).trim() : "";
      const sign = deg === "" || deg === "2" ? "√" : deg === "3" ? "∛" : deg === "4" ? "∜" : `${mapAll(deg, SUP) ?? `(${deg})`}√`;
      return sign + wrap(arg);
    }
    case "m:sSup": {
      const sup = mathText(kid(n, "m:sup") ?? { children: [] }).trim();
      return e() + (mapAll(sup, SUP) ?? `^${wrap(sup)}`);
    }
    case "m:sSub": {
      const sub = mathText(kid(n, "m:sub") ?? { children: [] }).trim();
      return e() + (mapAll(sub, SUB) ?? `_${wrap(sub)}`);
    }
    case "m:sSubSup": {
      const sub = mathText(kid(n, "m:sub") ?? { children: [] }).trim();
      const sup = mathText(kid(n, "m:sup") ?? { children: [] }).trim();
      return e() + (mapAll(sub, SUB) ?? `_${wrap(sub)}`) + (mapAll(sup, SUP) ?? `^${wrap(sup)}`);
    }
    case "m:d": {
      const pr = kid(n, "m:dPr");
      const beg = pr && kid(pr, "m:begChr") ? val(pr, "m:begChr") ?? "" : "(";
      const end = pr && kid(pr, "m:endChr") ? val(pr, "m:endChr") ?? "" : ")";
      const sep = pr && kid(pr, "m:sepChr") ? val(pr, "m:sepChr") ?? "|" : "|";
      return beg + kids(n, "m:e").map(mathText).join(sep) + end;
    }
    case "m:func": {
      const name = mathText(kid(n, "m:fName") ?? { children: [] }).trim();
      return `${name} ${e().trim()}`;
    }
    case "m:acc": {
      const pr = kid(n, "m:accPr");
      const chr = (pr && val(pr, "m:chr")) || "̂";
      // A combining mark goes after the text it decorates (0.3 + overline = 0.3̅).
      return /\p{M}/u.test(chr) ? e() + chr : e() + chr;
    }
    case "m:bar":
      return [...e()].map((c) => c + "̅").join("");
    case "m:nary": {
      const pr = kid(n, "m:naryPr");
      const chr = (pr && val(pr, "m:chr")) || "∫";
      const sub = kid(n, "m:sub") ? mathText(kid(n, "m:sub")) : "";
      const sup = kid(n, "m:sup") ? mathText(kid(n, "m:sup")) : "";
      return chr + (sub ? `_${wrap(sub)}` : "") + (sup ? `^${wrap(sup)}` : "") + " " + e();
    }
    default:
      // Property nodes carry no text; everything else (boxes, groups, arrays)
      // just renders its children in order.
      if (/Pr$/.test(n.name) || n.name === "m:ctrlPr") return "";
      return mathText(n);
  }
}

// --- document body -----------------------------------------------------------

const SKIP = new Set(["w:del", "w:delText", "w:instrText", "w:rPr", "w:pPr", "w:sectPr", "w:tblPr", "w:trPr", "w:tcPr", "w:proofErr", "w:bookmarkStart", "w:bookmarkEnd", "w:commentRangeStart", "w:commentRangeEnd", "w:lastRenderedPageBreak"]);
const PICTURE = new Set(["w:drawing", "w:pict", "w:object", "mc:AlternateContent"]);

function inline(n) {
  if (n.text !== undefined) return "";
  if (SKIP.has(n.name)) return "";
  if (PICTURE.has(n.name)) return ` ${FIGURE} `;
  switch (n.name) {
    case "w:t":
      return n.children.map((c) => c.text ?? "").join("");
    case "w:tab":
      return " ";
    case "w:br":
    case "w:cr":
      return "\n";
    case "w:noBreakHyphen":
      return "-";
    case "w:sym": {
      const code = n.attrs["w:char"];
      return code ? String.fromCodePoint(parseInt(code, 16) & 0xffff) : "";
    }
    case "m:oMath":
      return renderMath({ ...n, name: "m:e" });
    default:
      return (n.children ?? []).map(inline).join("");
  }
}

function blocks(n, out) {
  if (n.text !== undefined) return;
  if (n.name === "w:p") {
    out.push(inline(n));
    return;
  }
  if (n.name === "m:oMathPara") {
    out.push(inline(n));
    return;
  }
  for (const c of n.children ?? []) blocks(c, out);
}

export function docxToText(file) {
  const xml = execFileSync("unzip", ["-p", file, "word/document.xml"], { maxBuffer: 1 << 28 }).toString("utf8");
  const body = kid(kid(parseXml(xml), "w:document") ?? { children: [] }, "w:body");
  const out = [];
  if (body) blocks(body, out);
  return out.join("\n");
}
