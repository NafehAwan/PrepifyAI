"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { OFFERED_SUBJECTS } from "@/lib/data";
import { listSubjects } from "@/lib/curriculum";
import { getSubjectStats, type SubjectStats } from "@/lib/analytics";
import { parseChallengeCode } from "@/lib/challenges";
import { subjectLook } from "@/lib/subjects";
import { StrokeIcon } from "../Icon";

// My Subjects: one card per enrolled subject showing how many tests the student
// has taken and their best score. Tapping a card opens that subject's tests.
export function Subjects() {
  const { s, patch, go } = useApp();
  const [subjectIds, setSubjectIds] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<Record<string, SubjectStats>>({});
  const [joinDraft, setJoinDraft] = useState("");
  const [joinError, setJoinError] = useState(false);

  // A friend may send the 6-letter code instead of the link — both work here.
  const joinByCode = () => {
    const code = parseChallengeCode(joinDraft);
    if (!code) {
      setJoinError(true);
      return;
    }
    patch({ activeChallengeCode: code });
    go("challengeRoom");
  };

  useEffect(() => {
    let active = true;
    listSubjects().then((rows) => {
      if (!active) return;
      const map: Record<string, string> = {};
      for (const r of rows) map[r.name] = r.id;
      setSubjectIds(map);
    });
    getSubjectStats(s.subs).then((m) => {
      if (active) setStats(m);
    });
    return () => {
      active = false;
    };
  }, [s.subs]);

  // Opens straight away. If the subject list hasn't arrived yet the id is
  // null, and the subject screen looks it up from the name itself.
  const openSubject = (name: string) => {
    patch({ selectedSubjectId: subjectIds[name] ?? null, selectedSubjectName: name });
    go("subjectTests");
  };

  // Only the subjects the student enrolled in. In demo mode `s.subs` holds the
  // full set, so every card still appears.
  const enrolled = OFFERED_SUBJECTS.filter((name) => s.subs.includes(name));
  const list = enrolled.length > 0 ? enrolled : [...OFFERED_SUBJECTS];

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ color: C.muted, maxWidth: 520, fontSize: 15.5 }}>
          Pick a subject to start a new test, challenge friends, or look back at the ones you&apos;ve taken.
        </div>
        {s.authed && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              joinByCode();
            }}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <input
              value={joinDraft}
              onChange={(e) => {
                setJoinDraft(e.target.value);
                setJoinError(false);
              }}
              placeholder="Challenge code"
              aria-label="Challenge code or link"
              style={{ width: 160, borderRadius: 14, border: `2px solid ${joinError ? C.danger : C.line}`, background: C.card, padding: "10px 14px", fontSize: 15, fontWeight: 800, textTransform: "uppercase" }}
            />
            <button type="submit" style={{ borderRadius: 16, background: C.accent, color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, boxShadow: "0 4px 0 #4F31D6", padding: "9px 16px", fontSize: 15 }}>
              Join
            </button>
          </form>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        {list.map((name) => {
          const st = stats[name];
          const taken = st?.testsTaken ?? 0;
          const best = st?.bestPct ?? null;
          const look = subjectLook(name);
          return (
            <button
              key={name}
              onClick={() => openSubject(name)}
              className="pf-press"
              style={{ textAlign: "left", background: C.card, borderRadius: 22, boxShadow: `0 5px 0 ${look.edge}`, padding: 0, overflow: "hidden" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "16px 18px", background: look.color, color: "#fff" }}>
                <div style={{ width: 50, height: 50, flex: "none", borderRadius: 16, background: "rgba(255,255,255,.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <StrokeIcon d={look.icon} size={28} width={2.4} stroke="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 21, lineHeight: 1.1 }}>{name}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, opacity: 0.95 }}>
                    {taken === 0 ? "No tests yet" : `${taken} test${taken === 1 ? "" : "s"} taken`}
                  </div>
                </div>
                <div style={{ minWidth: 48, height: 48, borderRadius: 16, background: "#fff", color: look.edge, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 21 }} aria-label={`Grade ${st?.grade ?? "none yet"}`}>{st?.grade ?? "—"}</div>
              </div>
              <div style={{ padding: "14px 18px 16px" }}>
                <div style={{ height: 12, background: C.sand, borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ height: 12, width: `${best ?? 0}%`, background: look.color, borderRadius: 999 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.muted, fontWeight: 800 }}>
                  <span>{best === null ? "Take your first test" : `Best ${best}%`}</span>
                  <span>{st?.avgPct === null || st?.avgPct === undefined ? "" : `avg ${st.avgPct}%`}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
