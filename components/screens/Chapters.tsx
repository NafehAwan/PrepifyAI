"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C, pill } from "@/lib/theme";
import { CH } from "@/lib/data";
import { StrokeIcon, PATH } from "../Icon";
import { getChapters, getTopicProgress, getChapterProgress, computeTopicStates, type DBChapter, type DBTopicProgress, type DBChapterProgress, type TopicMastery } from "@/lib/curriculum";

type TopicState = "done" | "now" | "not";

export function Chapters() {
  const { s, set, patch, go } = useApp();
  const guided = s.mode === "guided";

  // Load the real chapter tree for the selected subject (if any), plus the
  // student's saved progress so topics show real mastery + guided locking.
  const [dbChapters, setDbChapters] = useState<DBChapter[] | null>(null);
  const [dbProgress, setDbProgress] = useState<Record<string, DBTopicProgress>>({});
  const [chapterProg, setChapterProg] = useState<Record<string, DBChapterProgress>>({});
  const [dbOpen, setDbOpen] = useState<Set<string>>(new Set());
  useEffect(() => {
    let active = true;
    setDbChapters(null);
    setDbProgress({});
    setChapterProg({});
    if (s.selectedSubjectId) {
      getChapters(s.selectedSubjectId).then(async (rows) => {
        if (!active) return;
        setDbChapters(rows);
        setDbOpen(new Set(rows.length > 0 ? [rows[0].id] : []));
        const topicIds = rows.flatMap((c) => c.topics.map((t) => t.id));
        const [progress, chProg] = await Promise.all([
          getTopicProgress(topicIds),
          getChapterProgress(rows.map((c) => c.id)),
        ]);
        if (!active) return;
        setDbProgress(progress);
        setChapterProg(chProg);
      });
    }
    return () => {
      active = false;
    };
  }, [s.selectedSubjectId]);

  const startTest = (chapterId: string, chapterTitle: string) => {
    patch({ testChapterId: chapterId, testChapterTitle: chapterTitle });
    go("test");
  };

  const openTopic = (topicId: string) => {
    patch({ selectedTopicId: topicId });
    go("topic");
  };
  const toggleDb = (id: string) =>
    setDbOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const subjectTitle = s.selectedSubjectName
    ? `${s.selectedSubjectName} · Class ${s.cls.replace(/\D/g, "") || "9"}`
    : "Physics · Class 11";
  const hasReal = dbChapters !== null && dbChapters.length > 0;
  const mastery = hasReal ? computeTopicStates(dbChapters!, dbProgress, guided) : null;
  const mc = mastery?.counts;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <button onClick={() => go("subjects")} style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 4 }}>← My Subjects</button>
          <div style={{ fontFamily: "Caprasimo", fontSize: 28 }}>{subjectTitle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>Study mode</div>
          <div style={{ display: "flex", background: C.sand, borderRadius: 999, padding: 3 }}>
            <button onClick={() => set("mode", "guided")} style={pill(guided)}>Guided path</button>
            <button onClick={() => set("mode", "free")} style={pill(!guided)}>Free roam</button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <LegendDot color={C.sage} label={`Mastered ${mc ? mc.mastered : 14}`} />
        <LegendDot color={C.accent} label={`In progress ${mc ? mc.inProgress : 5}`} ml />
        <LegendDot color="#d8c8ab" label={`Not started ${mc ? mc.notStarted : 29}`} ml />
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12.5, color: C.muted }}>
          {guided ? "Guided: topics unlock as you master the one before." : "Free roam: every topic is open — jump anywhere."}
        </div>
      </div>

      {s.selectedSubjectId && dbChapters === null && (
        <div style={{ color: C.muted, fontSize: 14 }}>Loading chapters…</div>
      )}

      {s.selectedSubjectId && dbChapters !== null && !hasReal && (
        <div style={{ maxWidth: 900, background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: "22px 24px", color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
          We&apos;re still ingesting {s.selectedSubjectName}&apos;s FBISE textbook. Physics is fully seeded — open it to try the live teach-and-test loop.
        </div>
      )}

      {hasReal && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 900 }}>
          {dbChapters!.map((c) => {
            const open = dbOpen.has(c.id);
            const masteredHere = c.topics.filter((t) => mastery!.states[t.id] === "done").length;
            const pct = c.topics.length > 0 ? Math.round((masteredHere / c.topics.length) * 100) : 0;
            const chFg = masteredHere === c.topics.length && c.topics.length > 0 ? C.sage : masteredHere > 0 ? C.accent : "#b3a58c";
            return (
              <div key={c.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}>
                  <button onClick={() => toggleDb(c.id)} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
                    <div style={{ width: 36, height: 36, flex: "none", borderRadius: 999, background: C.tint, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{c.seq}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15.5, color: C.ink }}>{c.title}</div>
                      <div style={{ fontSize: 12.5, color: "#9a8d78" }}>{c.topics.length} topics · {masteredHere} mastered</div>
                    </div>
                    <div style={{ width: 80, flex: "none" }}>
                      <div style={{ height: 8, background: C.sand, borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: 8, width: `${pct}%`, background: chFg, borderRadius: 999 }} />
                      </div>
                    </div>
                    <StrokeIcon d={PATH.chevronDown} size={18} stroke="#9a8d78" width={2.75} style={{ flex: "none", transform: `rotate(${open ? 180 : 0}deg)` }} />
                  </button>
                  {chapterProg[c.id]?.passed && (
                    <span style={{ flex: "none", fontSize: 11.5, fontWeight: 700, borderRadius: 999, padding: "5px 11px", background: C.sageT, color: C.sageD }}>Test ✓ {chapterProg[c.id]?.bestPct}%</span>
                  )}
                  <button onClick={() => startTest(c.id, c.title)} style={{ flex: "none", fontSize: 12.5, fontWeight: 700, borderRadius: 999, padding: "9px 16px", background: chapterProg[c.id] ? C.sand : C.accent, color: chapterProg[c.id] ? "#5d5648" : "#fff" }}>
                    {chapterProg[c.id] ? "Retake test" : "Take test"}
                  </button>
                </div>
                {open && (
                  <div style={{ padding: "0 20px 16px 70px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {c.topics.map((t) => {
                      const st: TopicMastery = mastery!.states[t.id] ?? "open";
                      const locked = st === "locked";
                      const dotBg = st === "done" ? C.sage : st === "now" ? C.accent : locked ? C.sand : "#e3d5bb";
                      const iconFg = locked || st === "open" ? "#a89a80" : "#fff";
                      const iconD = st === "done" ? PATH.check : locked ? PATH.lock : PATH.dot;
                      const chip = st === "done" ? "Mastered" : st === "now" ? "In progress" : locked ? "Locked" : t.estMinutes ? `${t.estMinutes} min` : "Start";
                      const chipBg = st === "done" ? C.sageT : st === "now" ? C.tint : C.sand;
                      const chipFg = st === "done" ? C.sageD : st === "now" ? C.accentD : "#8d8069";
                      return (
                        <button
                          key={t.id}
                          onClick={() => !locked && openTopic(t.id)}
                          disabled={locked}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "11px 14px", borderRadius: 14, textAlign: "left", background: st === "now" ? C.tint : "transparent", cursor: locked ? "not-allowed" : "pointer", opacity: locked ? 0.7 : 1 }}
                        >
                          <div style={{ width: 22, height: 22, flex: "none", borderRadius: 999, background: dotBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <StrokeIcon d={iconD} size={12} stroke={iconFg} width={3} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: locked ? "#a89a80" : C.ink }}>{t.title}</div>
                          <div style={{ fontSize: 11.5, fontWeight: 700, borderRadius: 999, padding: "4px 11px", background: chipBg, color: chipFg }}>{chip}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!s.selectedSubjectId && (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 900 }}>
        {CH.map(([num, title, topics, st2]) => {
          const id = "ch" + num;
          const open = s.open.includes(id);
          const pct = st2 === "m" ? 100 : st2 === "p" ? 45 : 0;
          const done = st2 === "m";
          const tint = done ? C.sageT : pct > 0 ? C.tint : C.sand;
          const fg = done ? C.sage : pct > 0 ? C.accent : "#b3a58c";
          const meta = `${topics.length} topics · ${st2 === "m" ? "mastered" : st2 === "p" ? "in progress" : "not started"}`;

          return (
            <div key={id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, overflow: "hidden" }}>
              <button
                onClick={() => patch({ open: open ? s.open.filter((x) => x !== id) : [...s.open, id] })}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", textAlign: "left" }}
              >
                <div style={{ width: 36, height: 36, flex: "none", borderRadius: 999, background: tint, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{num}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15.5, color: C.ink }}>{title}</div>
                  <div style={{ fontSize: 12.5, color: "#9a8d78" }}>{meta}</div>
                </div>
                <div style={{ width: 120, flex: "none" }}>
                  <div style={{ height: 8, background: C.sand, borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: 8, width: `${pct}%`, background: fg, borderRadius: 999 }} />
                  </div>
                </div>
                <StrokeIcon d={PATH.chevronDown} size={18} stroke="#9a8d78" width={2.75} style={{ flex: "none", transform: `rotate(${open ? 180 : 0}deg)` }} />
              </button>

              {open && (
                <div style={{ padding: "0 20px 16px 70px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {topics.map((t, ti) => {
                    let state: TopicState = "not";
                    if (st2 === "m") state = "done";
                    else if (st2 === "p") state = ti < 2 ? "done" : ti === 2 ? "now" : "not";
                    const locked = guided && state === "not" && !(st2 === "p" && ti === 3);
                    const dotBg = state === "done" ? C.sage : state === "now" ? C.accent : locked ? C.sand : "#e3d5bb";
                    const iconFg = state === "not" ? "#a89a80" : "#fff";
                    const iconD = state === "done" ? PATH.check : locked ? PATH.lock : PATH.dot;
                    const chip = state === "done" ? "Mastered" : state === "now" ? "In progress" : locked ? "Locked" : "Not started";
                    const chipBg = state === "done" ? C.sageT : state === "now" ? "#fff" : C.sand;
                    const chipFg = state === "done" ? C.sageD : state === "now" ? C.accentD : "#8d8069";
                    return (
                      <button key={t} onClick={() => go("topic")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "11px 14px", borderRadius: 14, textAlign: "left", background: state === "now" ? C.tint : "transparent" }}>
                        <div style={{ width: 22, height: 22, flex: "none", borderRadius: 999, background: dotBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <StrokeIcon d={iconD} size={12} stroke={iconFg} width={3} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: locked ? "#a89a80" : C.ink }}>{t}</div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, borderRadius: 999, padding: "4px 11px", background: chipBg, color: chipFg }}>{chip}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </>
  );
}

function LegendDot({ color, label, ml }: { color: string; label: string; ml?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: C.muted, fontWeight: 600, marginLeft: ml ? 12 : 0 }}>
      <span style={{ width: 11, height: 11, borderRadius: 999, background: color, display: "inline-block" }} />
      {label}
    </div>
  );
}
