// Lightweight markdown renderer for chatbot replies.
//
// The AI answers in light markdown (**bold**, "- " bullets, "1." lists). We
// render those as real rich text — bold spans, bulleted/numbered lists — and
// strip any leftover stray markdown symbols (*, #, `) so the student never sees
// raw asterisks. Also supports a `limit` (visible character count) so the text
// can be revealed with a typewriter effect without ever flashing markup.

import { C } from "@/lib/theme";

type Seg = { t: "text" | "b" | "i" | "code"; s: string };
type Block =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

// Split a line into styled inline segments, then scrub stray markers.
function tokenize(line: string): Seg[] {
  const segs: Seg[] = [];
  const re = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\n]+)\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) segs.push({ t: "text", s: line.slice(last, m.index) });
    if (m[2] !== undefined) segs.push({ t: "b", s: m[2] });
    else if (m[3] !== undefined) segs.push({ t: "b", s: m[3] });
    else if (m[4] !== undefined) segs.push({ t: "i", s: m[4] });
    else if (m[5] !== undefined) segs.push({ t: "code", s: m[5] });
    last = re.lastIndex;
  }
  if (last < line.length) segs.push({ t: "text", s: line.slice(last) });
  // Remove any unmatched *, ` or leading # that slipped through.
  return segs
    .map((seg) => (seg.t === "text" ? { ...seg, s: seg.s.replace(/[*`]+/g, "").replace(/^#+\s*/g, "") } : seg))
    .filter((seg) => seg.s.length > 0);
}

function parse(md: string): Block[] {
  const lines = md.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "p", text: para.join(" ").trim() });
      para = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const t = line.trim();
    if (t === "") {
      flushPara();
      continue;
    }
    const bullet = /^[-*•]\s+(.*)$/.exec(t);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(t);
    if (bullet) {
      flushPara();
      const prev = blocks[blocks.length - 1];
      if (prev && prev.type === "ul") prev.items.push(bullet[1]);
      else blocks.push({ type: "ul", items: [bullet[1]] });
    } else if (numbered) {
      flushPara();
      const prev = blocks[blocks.length - 1];
      if (prev && prev.type === "ol") prev.items.push(numbered[1]);
      else blocks.push({ type: "ol", items: [numbered[1]] });
    } else {
      // strip a markdown heading prefix but keep the text as a bold-ish line
      para.push(t.replace(/^#+\s*/, ""));
    }
  }
  flushPara();
  return blocks;
}

// Render segments, consuming a shared visible-character budget.
function renderSegs(segs: Seg[], budget: { n: number }, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < segs.length; i++) {
    if (budget.n <= 0) break;
    const seg = segs[i];
    const s = seg.s.slice(0, budget.n);
    budget.n -= s.length;
    const key = `${keyBase}-${i}`;
    if (seg.t === "b") out.push(<strong key={key}>{s}</strong>);
    else if (seg.t === "i") out.push(<em key={key}>{s}</em>);
    else if (seg.t === "code") out.push(<code key={key} style={{ background: "rgba(0,0,0,.06)", borderRadius: 5, padding: "1px 5px", fontSize: "0.92em" }}>{s}</code>);
    else out.push(<span key={key}>{s}</span>);
  }
  return out;
}

export function ChatMarkdown({ text, limit }: { text: string; limit?: number }) {
  const blocks = parse(text);
  const budget = { n: limit ?? Number.POSITIVE_INFINITY };
  const out: React.ReactNode[] = [];
  for (let b = 0; b < blocks.length; b++) {
    if (budget.n <= 0) break;
    const block = blocks[b];
    if (block.type === "p") {
      out.push(
        <p key={b} style={{ margin: out.length ? "8px 0 0" : 0, lineHeight: 1.55 }}>
          {renderSegs(tokenize(block.text), budget, `p${b}`)}
        </p>,
      );
    } else {
      const ordered = block.type === "ol";
      // Render each item's inline content while consuming the shared budget.
      const contents: React.ReactNode[][] = [];
      for (let j = 0; j < block.items.length; j++) {
        if (budget.n <= 0) break;
        contents.push(renderSegs(tokenize(block.items[j]), budget, `l${b}-${j}`));
      }
      const marginTop = out.length ? 8 : 0;
      out.push(
        ordered ? (
          <ol key={b} style={{ margin: `${marginTop}px 0 0`, paddingLeft: 22 }}>
            {contents.map((c, k) => (
              <li key={k} style={{ margin: "2px 0", lineHeight: 1.5 }}>{c}</li>
            ))}
          </ol>
        ) : (
          <ul key={b} style={{ margin: `${marginTop}px 0 0`, padding: 0, listStyle: "none" }}>
            {contents.map((c, k) => (
              <li key={k} style={{ display: "flex", gap: 8, margin: "3px 0", lineHeight: 1.5 }}>
                <span style={{ color: C.accent, flex: "none", fontWeight: 700 }}>•</span>
                <span style={{ flex: 1 }}>{c}</span>
              </li>
            ))}
          </ul>
        ),
      );
    }
  }
  return <>{out}</>;
}

// Plain-text length of a reply (used to time the typewriter reveal).
export function plainLength(md: string): number {
  return parse(md).reduce((n, block) => {
    if (block.type === "p") return n + block.text.replace(/[*`#]/g, "").length;
    return n + block.items.reduce((m, it) => m + it.replace(/[*`#]/g, "").length, 0);
  }, 0);
}
