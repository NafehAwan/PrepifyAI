"use client";

import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { StrokeIcon, PATH } from "../Icon";

type ChipKind = "Do now" | "Weak spot" | "Review" | "High yield" | "Scheduled";

const PLAN_ITEMS: ReadonlyArray<readonly [string, string, ChipKind, string]> = [
  ["Centripetal force — finish quiz", "Physics · Ch 5.3 · worth ~9 marks", "Do now", "18 min"],
  ["Balancing redox equations", "Chemistry · Ch 3 · lowest score this month", "Weak spot", "25 min"],
  ["23 flashcards due", "Mixed · spaced repetition", "Review", "9 min"],
  ["Integration by substitution", "Maths · Ch 9 · appeared in 6 of last 8 papers", "High yield", "30 min"],
  ["Dihybrid crosses practice set", "Biology · Ch 16", "Weak spot", "20 min"],
  ["Full Physics mock paper", "Scheduled for Saturday", "Scheduled", "90 min"],
];

const CHIP_COLORS: Record<ChipKind, readonly [string, string]> = {
  "Do now": [C.accent, "#fff"],
  "Weak spot": [C.tint, C.accentD],
  Review: [C.sageT, C.sageD],
  "High yield": [C.sand, "#5d5648"],
  Scheduled: [C.sand, "#5d5648"],
};

const REVIEW_QUEUE: ReadonlyArray<readonly [string, string, number]> = [
  ["Oxidation numbers", "today", 0],
  ["Vector components", "today", 0],
  ["Enzyme inhibition", "today", 0],
  ["Projectile range formula", "tomorrow", 1],
  ["Ohm’s law limitations", "in 3 days", 1],
];

export function Plan() {
  const { go, daysLeft } = useApp();
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap", maxWidth: 1200 }}>
      <div style={{ flex: 1, minWidth: 440, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>What to study next</div>
          <div style={{ fontSize: 12.5, color: C.muted }}>Re-ranked every morning · {daysLeft} days left</div>
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>Ordered by how many board marks each topic is worth against how shaky you are on it.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PLAN_ITEMS.map(([title, meta, chip, time], i) => {
            const hot = i === 0;
            const [chipBg, chipFg] = CHIP_COLORS[chip];
            return (
              <div key={title} style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: hot ? C.tint : C.bg, border: `1px solid ${hot ? "#eec9a7" : "transparent"}`, borderRadius: 18, padding: "15px 18px" }}>
                <div style={{ width: 30, flex: "none", fontFamily: "Caprasimo", fontSize: 20, color: "#c1b39a" }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
                  <div style={{ fontSize: 12.5, color: "#9a8d78" }}>{meta}</div>
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, borderRadius: 999, padding: "5px 12px", background: chipBg, color: chipFg, flex: "none" }}>{chip}</div>
                <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600, width: 52, textAlign: "right", flex: "none" }}>{time}</div>
                <button onClick={() => go("topic")} style={{ borderRadius: 999, background: C.sand, fontWeight: 700, fontSize: 13, padding: "9px 16px", flex: "none" }}>Start</button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ width: 340, flex: "none", background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 999, background: C.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <StrokeIcon d={PATH.refresh} size={19} stroke={C.accent} width={2.75} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Reviews due</div>
            <div style={{ fontSize: 12.5, color: C.muted }}>23 cards · about 9 minutes</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {REVIEW_QUEUE.map(([topic, due, later]) => (
            <div key={topic} style={{ display: "flex", alignItems: "center", gap: 11, background: C.bg, borderRadius: 14, padding: "11px 14px" }}>
              <div style={{ width: 9, height: 9, flex: "none", borderRadius: 999, background: later ? "#d8c8ab" : C.accent }} />
              <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{topic}</div>
              <div style={{ fontSize: 12, color: "#9a8d78", flex: "none" }}>{due}</div>
            </div>
          ))}
        </div>
        <button onClick={() => go("reviews")} style={{ width: "100%", borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "13px 0", fontSize: 15 }}>Start review session</button>
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #ece0c8", fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>Cards you get right come back in 4 days, then 10, then 25. Cards you miss come back tomorrow.</div>
      </div>
    </div>
  );
}
