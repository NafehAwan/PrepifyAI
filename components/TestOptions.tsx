"use client";

// The option pickers shared by the New Test and Challenge Friends screens:
// which chapters, how many questions, how hard.

import { C } from "@/lib/theme";
import { Glyph } from "./Icon";
import type { SubjectChapter } from "@/lib/tests/build";
import type { McqDifficulty } from "@/lib/ai/prompts";
import type { ChaptersStatus } from "@/lib/useSubject";

const PRESETS = [5, 10, 15, 20, 25, 30];

export const LEVELS: Array<{ id: McqDifficulty; label: string; blurb: string }> = [
  { id: "easy", label: "Easy", blurb: "Direct recall — definitions, units, one-step facts." },
  { id: "medium", label: "Medium", blurb: "A mix, leaning on understanding. Some scenarios." },
  { id: "hard", label: "Hard", blurb: "Mostly scenario questions, like the board paper." },
  { id: "mixed", label: "Mixed", blurb: "Everything jumbled together — closest to a real paper." },
];

export function OptionCard({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, borderRadius: 20, boxShadow: "0 4px 0 #D3DAEC", padding: "20px 22px" }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>{hint}</div>
      {children}
    </div>
  );
}

// Empty `picked` means the whole book.
export function ChapterPicker({
  chapters,
  picked,
  onChange,
  status = "ready",
  onRetry,
}: {
  chapters: SubjectChapter[];
  picked: string[];
  onChange: (next: string[]) => void;
  status?: ChaptersStatus;
  onRetry?: () => void;
}) {
  const toggle = (id: string) => onChange(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);

  if (status !== "ready") {
    return (
      <OptionCard title="Which chapters?" hint="The whole book, or pick one or more chapters to focus on.">
        {status === "loading" ? (
          <div style={{ fontSize: 13.5, color: C.muted, fontWeight: 600, padding: "10px 2px" }}>Loading chapters…</div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 13.5, fontWeight: 600, color: C.accentD, background: "#FFEBDD", borderRadius: 14, padding: "12px 14px" }}>
            <span style={{ flex: 1, minWidth: 180 }}>Couldn&apos;t load the chapters. Check your connection.</span>
            {onRetry && (
              <button onClick={onRetry} style={{ borderRadius: 16, background: C.accent, color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, boxShadow: "0 4px 0 #4F31D6", padding: "8px 16px", fontSize: 15 }}>
                Try again
              </button>
            )}
          </div>
        )}
      </OptionCard>
    );
  }

  return (
    <OptionCard title="Which chapters?" hint="The whole book, or pick one or more chapters to focus on.">
      <button
        onClick={() => onChange([])}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", borderRadius: 14, padding: "12px 14px", marginBottom: 10, background: picked.length === 0 ? C.tint : C.bg, border: `1.5px solid ${picked.length === 0 ? C.accent : "transparent"}` }}
      >
        <Check on={picked.length === 0} />
        <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: picked.length === 0 ? C.accentD : C.ink }}>Whole book</div>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
          {chapters.reduce((n, c) => n + c.mcqCount, 0)} questions
        </div>
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 340, overflowY: "auto" }}>
        {chapters.map((c) => {
          const on = picked.includes(c.id);
          const empty = c.mcqCount === 0;
          return (
            <button
              key={c.id}
              onClick={() => !empty && toggle(c.id)}
              disabled={empty}
              style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", borderRadius: 12, padding: "10px 12px", background: on ? C.tint : "transparent", border: `1.5px solid ${on ? C.accent : C.line}`, opacity: empty ? 0.45 : 1 }}
            >
              <Check on={on} />
              <div style={{ width: 28, flex: "none", fontSize: 12.5, fontWeight: 700, color: C.muted }}>{c.seq}</div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, flex: "none" }}>
                {empty ? "coming soon" : c.mcqCount}
              </div>
            </button>
          );
        })}
      </div>
    </OptionCard>
  );
}

export function CountPicker({ count, onChange }: { count: number; onChange: (n: number) => void }) {
  return (
    <OptionCard title="How many questions?" hint="Anywhere from 1 to 30.">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {PRESETS.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{ borderRadius: 999, padding: "10px 20px", fontSize: 14.5, fontWeight: 700, background: count === n ? C.accent : C.bg, color: count === n ? "#fff" : "#3E4370", border: `1.5px solid ${count === n ? C.accent : C.line}` }}
          >
            {n}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <input
          type="range"
          min={1}
          max={30}
          value={count}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Number of questions"
          style={{ flex: 1, accentColor: C.accent }}
        />
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, minWidth: 44, textAlign: "right", color: C.accentD }}>{count}</div>
      </div>
    </OptionCard>
  );
}

export function DifficultyPicker({ difficulty, onChange }: { difficulty: McqDifficulty; onChange: (d: McqDifficulty) => void }) {
  return (
    <OptionCard title="How hard?" hint="Easy all the way to hard.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        {LEVELS.map((l) => {
          const on = difficulty === l.id;
          return (
            <button
              key={l.id}
              onClick={() => onChange(l.id)}
              style={{ textAlign: "left", borderRadius: 16, padding: "13px 15px", background: on ? C.tint : C.bg, border: `1.5px solid ${on ? C.accent : "transparent"}` }}
            >
              <div style={{ fontSize: 14.5, fontWeight: 700, color: on ? C.accentD : C.ink, marginBottom: 3 }}>{l.label}</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45 }}>{l.blurb}</div>
            </button>
          );
        })}
      </div>
    </OptionCard>
  );
}

// A row of pill choices, used for the friend count and the time limit.
export function ChipRow<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: ReadonlyArray<T>;
  value: T;
  onChange: (v: T) => void;
  label: (v: T) => string;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((o) => (
        <button
          key={String(o)}
          onClick={() => onChange(o)}
          style={{ borderRadius: 999, padding: "10px 18px", fontSize: 14, fontWeight: 700, background: value === o ? C.accent : C.bg, color: value === o ? "#fff" : "#3E4370", border: `1.5px solid ${value === o ? C.accent : C.line}` }}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

export function Check({ on }: { on: boolean }) {
  return (
    <div style={{ width: 20, height: 20, flex: "none", borderRadius: 6, border: `2px solid ${on ? C.accent : "#D3DAEC"}`, background: on ? C.accent : "transparent", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
      {on ? <Glyph name="check" size={14} /> : null}
    </div>
  );
}
