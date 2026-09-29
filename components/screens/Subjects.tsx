"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { OFFERED_SUBJECTS } from "@/lib/data";
import { listSubjects, subjectIdByName } from "@/lib/curriculum";
import { getSubjectStats, type SubjectStats } from "@/lib/analytics";
import { parseChallengeCode } from "@/lib/challenges";

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

  // The subject list loads in the background; a card tapped before it
  // arrives looks the id up rather than opening the subject without one.
  const openSubject = async (name: string) => {
    const id = subjectIds[name] ?? (await subjectIdByName(name));
    patch({ selectedSubjectId: id, selectedSubjectName: name });
    go("subjectTests");
  };

  // Only the subjects the student enrolled in. In demo mode `s.subs` holds the
  // full set, so every card still appears.
  const enrolled = OFFERED_SUBJECTS.filter((name) => s.subs.includes(name));
  const list = enrolled.length > 0 ? enrolled : [...OFFERED_SUBJECTS];

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ color: C.muted, maxWidth: 520 }}>
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
              style={{ width: 150, borderRadius: 999, border: `1.5px solid ${joinError ? C.accent : C.line}`, background: C.card, padding: "9px 14px", fontSize: 13.5, fontWeight: 600, textTransform: "uppercase" }}
            />
            <button type="submit" style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "9px 16px", fontSize: 13.5 }}>
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
          const strong = (best ?? 0) >= 75;
          const tint = strong ? C.sageT : C.tint;
          const fg = strong ? C.sageD : C.accentD;
          return (
            <button
              key={name}
              onClick={() => void openSubject(name)}
              className="pf-lift"
              style={{ textAlign: "left", background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 22 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, flex: "none", borderRadius: 999, background: tint, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Caprasimo", fontSize: 20 }}>
                  {name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
                  <div style={{ fontSize: 12.5, color: "#9a8d78" }}>
                    {taken === 0 ? "No tests yet" : `${taken} test${taken === 1 ? "" : "s"} taken`}
                  </div>
                </div>
                <div style={{ fontFamily: "Caprasimo", fontSize: 22, color: fg }}>{st?.grade ?? "—"}</div>
              </div>
              <div style={{ height: 10, background: C.sand, borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: 10, width: `${best ?? 0}%`, background: fg, borderRadius: 999 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.muted, fontWeight: 600 }}>
                <span>{best === null ? "Take your first test" : `Best ${best}%`}</span>
                <span>{st?.avgPct === null || st?.avgPct === undefined ? "" : `avg ${st.avgPct}%`}</span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
