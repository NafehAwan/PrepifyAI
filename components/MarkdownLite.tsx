// Minimal markdown renderer for textbook content_md — handles ## headings,
// **bold**, and paragraphs. Not a full parser; enough for the seeded content.

import { C } from "@/lib/theme";

function renderInline(text: string): React.ReactNode[] {
  // Split on **bold** spans.
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function MarkdownLite({ md }: { md: string }) {
  const blocks = md.split(/\n{2,}/).filter((b) => b.trim().length > 0);
  return (
    <>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (trimmed.startsWith("## ")) {
          return (
            <div key={i} style={{ fontFamily: "Caprasimo", fontSize: 18, margin: "18px 0 8px" }}>
              {trimmed.replace(/^##\s+/, "")}
            </div>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <div key={i} style={{ fontFamily: "Caprasimo", fontSize: 20, margin: "18px 0 8px" }}>
              {trimmed.replace(/^#\s+/, "")}
            </div>
          );
        }
        // List block: lines starting with * or -
        if (/^[*-]\s+/.test(trimmed)) {
          const items = trimmed.split("\n").map((l) => l.replace(/^[*-]\s+/, ""));
          return (
            <ul key={i} style={{ margin: "0 0 14px", paddingLeft: 22 }}>
              {items.map((it, j) => (
                <li key={j} style={{ marginBottom: 4 }}>{renderInline(it)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} style={{ margin: "0 0 14px" }}>{renderInline(trimmed)}</p>
        );
      })}
    </>
  );
}

export function ExaminerNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: C.tint, borderRadius: 14, padding: "12px 16px", margin: "8px 0 16px", fontSize: 13.5, color: C.accentD, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}
