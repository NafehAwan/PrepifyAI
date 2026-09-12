"use client";

import { C } from "@/lib/theme";
import { Mascot } from "../Mascot";

// Duolingo-style visual learning path: a winding trail of lesson nodes that
// unlock as the student masters each one, with a chapter-test "trophy" at the
// end of every chapter. Purely presentational — the caller builds the sections
// from real progress and handles taps.

export type NodeState = "done" | "now" | "locked" | "open";

export interface PathTopic {
  id: string;
  title: string;
  state: NodeState;
}
export interface PathSection {
  id: string;
  title: string;
  seq: number | string;
  topics: PathTopic[];
  test: { state: NodeState; pct?: number } | null;
}

// Gentle S-curve horizontal offsets (in px) as we walk down the trail.
const SWAY = [0, 74, 100, 74, 0, -74, -100, -74];

const ICON = {
  check: "M20 6 9 17l-5-5",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  play: "M8 5v14l11-7z",
  star: "M12 3l2.6 5.6 6.1.7-4.5 4.1 1.2 6L12 16.9 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
};

function nodeColors(state: NodeState, isTest: boolean): { bg: string; shadow: string; fg: string } {
  if (state === "done") return { bg: C.sage, shadow: C.sageD, fg: "#fff" };
  if (state === "locked") return { bg: "#dbccb0", shadow: "#c3b291", fg: "#a89a80" };
  // now / open — active and tappable
  return { bg: isTest ? "#e2a52f" : C.accent, shadow: isTest ? "#b47d17" : C.accentD, fg: "#fff" };
}

function Node({
  state,
  label,
  sub,
  isTest,
  highlight,
  onClick,
}: {
  state: NodeState;
  label: string;
  sub?: string;
  isTest?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const { bg, shadow, fg } = nodeColors(state, !!isTest);
  const locked = state === "locked";
  const size = isTest ? 78 : 66;
  const iconPath = locked ? ICON.lock : state === "done" ? ICON.check : isTest ? ICON.star : ICON.play;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      {highlight && (
        <div style={{ background: "#fff", border: `2px solid ${C.accent}`, color: C.accentD, fontWeight: 800, fontSize: 11.5, letterSpacing: ".05em", borderRadius: 10, padding: "4px 10px", boxShadow: "0 4px 10px rgba(198,113,57,.22)", animation: "pf-bob 2.4s ease-in-out infinite" }}>
          START
        </div>
      )}
      <button
        onClick={locked ? undefined : onClick}
        disabled={locked}
        aria-label={label}
        title={label}
        style={{
          position: "relative", width: size, height: size, borderRadius: "50%", background: bg,
          boxShadow: `0 6px 0 ${shadow}`, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: locked ? "not-allowed" : "pointer",
        }}
      >
        {/* pulse ring on the current node */}
        {highlight && <span style={{ position: "absolute", inset: -6, borderRadius: "50%", border: `3px solid ${C.accent}`, opacity: 0.5, animation: "pf-ring 1.6s ease-out infinite" }} />}
        {isTest && !locked && state !== "done" ? (
          <span style={{ fontSize: 30, lineHeight: 1 }}>🏆</span>
        ) : isTest && state === "done" ? (
          <span style={{ fontSize: 30, lineHeight: 1 }}>🏆</span>
        ) : (
          <svg width={isTest ? 30 : 26} height={isTest ? 30 : 26} viewBox="0 0 24 24" fill={state === "done" || isTest ? "none" : fg} stroke={fg} strokeWidth={state === "done" || locked ? 3 : 0} strokeLinecap="round" strokeLinejoin="round">
            <path d={iconPath} />
          </svg>
        )}
      </button>
      <div style={{ maxWidth: 150, textAlign: "center", fontSize: 12.5, fontWeight: 700, color: locked ? "#a89a80" : C.ink, lineHeight: 1.25 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, fontWeight: 700, color: state === "done" ? C.sageD : C.muted, marginTop: -3 }}>{sub}</div>}
    </div>
  );
}

export function LearningPath({
  sections,
  onTopic,
  onTest,
}: {
  sections: PathSection[];
  onTopic: (id: string) => void;
  onTest: (sectionId: string, title: string) => void;
}) {
  // Find the single "current" node across the whole path (first now/open) so
  // Prepi stands next to exactly one lesson.
  let currentKey: string | null = null;
  for (const sec of sections) {
    const t = sec.topics.find((tp) => tp.state === "now");
    if (t) { currentKey = `${sec.id}:${t.id}`; break; }
  }

  let idx = 0; // global node index for the S-curve
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", paddingBottom: 40 }}>
      {sections.map((sec) => {
        const mastered = sec.topics.filter((t) => t.state === "done").length;
        return (
          <div key={sec.id} style={{ marginBottom: 8 }}>
            {/* chapter banner */}
            <div style={{ position: "sticky", top: 8, zIndex: 2, background: C.accent, color: "#fff", borderRadius: 16, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 20px rgba(198,113,57,.22)", margin: "18px 0 6px" }}>
              <div style={{ width: 30, height: 30, flex: "none", borderRadius: 999, background: "rgba(255,255,255,.22)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>{sec.seq}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sec.title}</div>
                <div style={{ fontSize: 11.5, opacity: 0.9 }}>{mastered} / {sec.topics.length} mastered</div>
              </div>
            </div>

            {/* nodes */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "10px 0" }}>
              {sec.topics.map((t) => {
                const offset = SWAY[idx % SWAY.length];
                idx++;
                const isCurrent = currentKey === `${sec.id}:${t.id}`;
                return (
                  <div key={t.id} style={{ position: "relative", transform: `translateX(${offset}px)`, transition: "transform .2s ease" }}>
                    {isCurrent && (
                      <div style={{ position: "absolute", top: 2, left: offset >= 0 ? -78 : "auto", right: offset >= 0 ? "auto" : -78 }}>
                        <Mascot mood="happy" size={64} />
                      </div>
                    )}
                    <Node state={t.state} label={t.title} isTest={false} highlight={isCurrent} onClick={() => onTopic(t.id)} />
                  </div>
                );
              })}

              {/* chapter test trophy */}
              {sec.test && (() => {
                const offset = SWAY[idx % SWAY.length];
                idx++;
                return (
                  <div style={{ transform: `translateX(${offset}px)`, transition: "transform .2s ease" }}>
                    <Node
                      state={sec.test.state}
                      isTest
                      label={sec.test.state === "locked" ? "Chapter test — locked" : "Chapter test"}
                      sub={sec.test.state === "done" && sec.test.pct != null ? `✓ ${sec.test.pct}%` : undefined}
                      onClick={() => onTest(sec.id, sec.title)}
                    />
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
