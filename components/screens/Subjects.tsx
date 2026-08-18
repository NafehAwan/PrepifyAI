"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { SUBJECTS } from "@/lib/data";
import { listSubjects } from "@/lib/curriculum";
import { getSubjectMastery, type SubjectMastery } from "@/lib/analytics";

export function Subjects() {
  const { s, patch, go } = useApp();
  // Map subject name -> DB id so a card can open its real chapter tree.
  const [subjectIds, setSubjectIds] = useState<Record<string, string>>({});
  // Real per-subject mastery for the signed-in student (empty in demo mode).
  const [mastery, setMastery] = useState<Record<string, SubjectMastery>>({});
  useEffect(() => {
    let active = true;
    listSubjects().then((rows) => {
      if (!active) return;
      const map: Record<string, string> = {};
      for (const r of rows) map[r.name] = r.id;
      setSubjectIds(map);
    });
    getSubjectMastery(s.subs).then((m) => {
      if (active) setMastery(m);
    });
    return () => {
      active = false;
    };
  }, [s.subs]);

  const openSubject = (name: string) => {
    patch({ selectedSubjectId: subjectIds[name] ?? null, selectedSubjectName: name, selectedTopicId: null });
    go("chapters");
  };

  // Show only the subjects the student is actually enrolled in. In demo mode
  // `s.subs` holds the full set, so every card still appears.
  const enrolled = SUBJECTS.filter(([name]) => s.subs.includes(name));
  const list = enrolled.length > 0 ? enrolled : SUBJECTS;
  return (
    <>
      <div style={{ color: C.muted, marginBottom: 20, maxWidth: 620 }}>
        {list.length} subject{list.length === 1 ? "" : "s"} enrolled. Textbooks fetched and indexed — tap a subject to open its chapter tree.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        {list.map(([name, demoPct, demoGrade, due]) => {
          const m = mastery[name];
          const pct = m ? m.pct : demoPct;
          const grade = m ? m.grade : demoGrade;
          const strong = pct >= 75;
          const tint = strong ? C.sageT : C.tint;
          const fg = strong ? C.sageD : C.accentD;
          const meta = m ? `${m.total} topics · live` : "11 chapters · 48 topics";
          return (
            <button key={name} onClick={() => openSubject(name)} style={{ textAlign: "left", background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, flex: "none", borderRadius: 999, background: tint, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Caprasimo", fontSize: 20 }}>{name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
                  <div style={{ fontSize: 12.5, color: "#9a8d78" }}>{meta}</div>
                </div>
                <div style={{ fontFamily: "Caprasimo", fontSize: 22, color: fg }}>{grade}</div>
              </div>
              <div style={{ height: 10, background: C.sand, borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: 10, width: `${pct}%`, background: fg, borderRadius: 999 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.muted, fontWeight: 600 }}>
                <span>{pct}% mastered</span>
                <span>{m ? `${m.mastered}/${m.total} topics` : `${due} due`}</span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
