"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { C } from "@/lib/theme";
import { getSubjectStats, currentUserId, type SubjectStats } from "@/lib/analytics";
import { listAllTests, type TestRow } from "@/lib/tests/store";
import { WeakChapters } from "../WeakChapters";

type Row = TestRow & { subjectId: string };

// Progress: every test taken, newest first, with per-subject totals above it.
export function Progress() {
  const { s, patch, go } = useApp();
  const [stats, setStats] = useState<Record<string, SubjectStats>>({});
  const [tests, setTests] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [st, userId] = await Promise.all([getSubjectStats(s.subs), currentUserId()]);
      if (!active) return;
      setStats(st);
      if (userId) {
        const all = await listAllTests(userId);
        if (active) setTests(all.filter((t) => t.status === "submitted"));
      }
      if (active) setLoading(false);
    })().catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [s.subs]);

  const nameById = new Map(Object.values(stats).map((x) => [x.id, x.name] as const));
  const bySubject = Object.values(stats).filter((x) => x.testsTaken > 0);

  const openSubject = (id: string, name: string) => {
    patch({ selectedSubjectId: id, selectedSubjectName: name });
    go("subjectTests");
  };

  if (loading) return <div style={{ color: C.muted, fontSize: 14 }}>Loading your results…</div>;

  if (tests.length === 0) {
    return (
      <div style={{ maxWidth: 560, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Nothing to show yet</div>
        <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
          Take a test and this page fills up: every score, every subject average, and where you&apos;re
          losing marks.
        </div>
        <button onClick={() => go("subjects")} style={{ borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "12px 24px", fontSize: 14.5 }}>
          Pick a subject →
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "22px 24px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>By subject</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bySubject.map((x) => {
            const avg = x.avgPct ?? 0;
            const fg = avg >= 75 ? C.sageD : avg >= 50 ? C.accentD : C.danger;
            return (
              <button key={x.id} onClick={() => openSubject(x.id, x.name)} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 92, flex: "none", fontSize: 13.5, fontWeight: 600 }}>{x.name}</div>
                <div style={{ flex: 1, height: 12, background: C.sand, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: 12, width: `${avg}%`, background: fg, borderRadius: 999 }} />
                </div>
                <div style={{ width: 130, flex: "none", textAlign: "right", fontSize: 12.5, color: C.muted, fontWeight: 600 }}>
                  avg {avg}% · best {x.bestPct}% · {x.testsTaken}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <WeakChapters />

      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "22px 24px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Every test</div>
        <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>Newest first. Tap one to read the answers again.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tests.map((t) => {
            const pct = t.scorePct ?? 0;
            const fg = pct >= 75 ? C.sageD : pct >= 50 ? C.accentD : C.danger;
            const bg = pct >= 75 ? C.sageT : pct >= 50 ? C.tint : "#fdecec";
            return (
              <button
                key={t.id}
                onClick={() => {
                  patch({ activeTestId: t.id, selectedSubjectId: t.subjectId, selectedSubjectName: nameById.get(t.subjectId) ?? null });
                  go("testReview");
                }}
                style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, background: C.bg, borderRadius: 16, padding: "12px 14px" }}
              >
                <div style={{ width: 44, height: 44, flex: "none", borderRadius: 999, background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                  {pct}%
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {nameById.get(t.subjectId) ?? "Subject"} · {t.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#9a8d78", textTransform: "capitalize" }}>
                    {t.correctCount}/{t.questionCount} · {t.difficulty} · {t.remarks}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#9a8d78", flex: "none" }}>
                  {new Date(t.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
