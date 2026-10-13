"use client";

// Home is the student's map: one subject at a time, its chapters laid out as
// stops on a winding path. Gold stops are chapters the student has done well
// in, red ones need fixing, the glowing orange stop is where to go next, and
// Prepi waits beside it. Tapping a stop starts a short test on that chapter.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { C, FD, btn3d, card } from "@/lib/theme";
import { getSubjectStats, currentUserId, type SubjectStats } from "@/lib/analytics";
import { listSubjects } from "@/lib/curriculum";
import { listAllTests, startTest, type TestRow } from "@/lib/tests/store";
import { listChapterStats, WEAK_BELOW_PCT, WEAK_MIN_ATTEMPTED, type ChapterStat } from "@/lib/engagement";
import { useSubjectChapters } from "@/lib/useSubject";
import { OFFERED_SUBJECTS } from "@/lib/data";
import { DEMO_CHAPTERS, DEMO_RESULTS, shortSubject, subjectLook } from "@/lib/subjects";
import { Mascot } from "../Mascot";
import { StrokeIcon, PATH } from "../Icon";
import { useIsMobile } from "@/lib/useIsMobile";

const QUICK_COUNT = 10; // questions in a one-tap chapter test
const BOOK_COUNT = 20; // questions in the end-of-map whole-book test
const STEP = 124; // vertical distance between stops
const TOP = 86; // first stop's centre, below the map header
const SUBJECT_KEY = "prepify:map-subject";

type StopState = "done" | "weak" | "started" | "new" | "empty";
interface Stop {
  id: string;
  seq: number;
  title: string;
  mcqCount: number;
  attempted: number;
  correct: number;
  pct: number | null;
  state: StopState;
  stars: number;
}

const ICON = {
  check: PATH.check,
  play: "M7 4.5v15l12-7.5z",
  target: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10M13 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0",
  trophy: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4",
  star: "M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z",
  timer: "M10 2h4M12 14l3-3M12 6a8 8 0 1 0 0 16 8 8 0 0 0 0-16",
  swords: "M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2",
  arrow: "M5 12h14M13 6l6 6-6 6",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
};

function starsFor(pct: number): number {
  return pct >= 90 ? 3 : pct >= 75 ? 2 : 1;
}

export function Home() {
  const { s, patch, go } = useApp();
  const isMobile = useIsMobile();
  const demo = !s.supabaseConfigured;

  const enrolled = OFFERED_SUBJECTS.filter((n) => s.subs.includes(n));
  const subjects: string[] = enrolled.length > 0 ? enrolled : [...OFFERED_SUBJECTS];

  // The subject on the map: the last one looked at on this device.
  const [subject, setSubject] = useState<string>(subjects[0]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SUBJECT_KEY);
      if (saved && subjects.includes(saved)) setSubject(saved);
    } catch {
      // storage blocked: start on the first subject
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pickSubject = (name: string) => {
    setSubject(name);
    setSheet(null);
    try {
      localStorage.setItem(SUBJECT_KEY, name);
    } catch {
      // ignore
    }
  };

  const [ids, setIds] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<Record<string, SubjectStats>>({});
  const [chStats, setChStats] = useState<ChapterStat[]>([]);
  const [recent, setRecent] = useState<Array<TestRow & { subjectId: string }>>([]);

  useEffect(() => {
    let active = true;
    listSubjects().then((rows) => active && setIds(Object.fromEntries(rows.map((r) => [r.name, r.id]))));
    getSubjectStats(s.subs).then((m) => active && setStats(m));
    listChapterStats().then((rows) => active && setChStats(rows));
    currentUserId().then(async (uid) => {
      if (!uid) return;
      const all = await listAllTests(uid);
      if (active) setRecent(all.filter((t) => t.status === "submitted").slice(0, 3));
    });
    return () => {
      active = false;
    };
  }, [s.subs]);

  const subjectId = ids[subject] ?? null;
  const { chapters, status } = useSubjectChapters(demo ? null : subjectId);

  const stops: Stop[] = useMemo(() => {
    const rows = demo
      ? (DEMO_CHAPTERS[subject] ?? []).map((title, i) => ({ id: `demo-${i + 1}`, seq: i + 1, title, mcqCount: 100 }))
      : chapters;
    const byId = new Map(chStats.map((c) => [c.chapterId, c]));
    return rows.map((r) => {
      const res = demo ? DEMO_RESULTS[r.seq] : byId.get(r.id);
      const attempted = res?.attempted ?? 0;
      const correct = res?.correct ?? 0;
      const pct = attempted > 0 ? Math.round((correct / attempted) * 100) : null;
      let state: StopState = "new";
      if (r.mcqCount === 0) state = "empty";
      else if (attempted >= WEAK_MIN_ATTEMPTED) state = (pct as number) >= WEAK_BELOW_PCT ? "done" : "weak";
      else if (attempted > 0) state = "started";
      return { id: r.id, seq: r.seq, title: r.title, mcqCount: r.mcqCount, attempted, correct, pct, state, stars: state === "done" ? starsFor(pct as number) : 0 };
    });
  }, [demo, subject, chapters, chStats]);

  // Where to go next: the first chapter, in book order, that isn't done yet.
  const nextIdx = stops.findIndex((x) => x.state !== "done" && x.state !== "empty");
  const doneCount = stops.filter((x) => x.state === "done").length;

  const [sheet, setSheet] = useState<Stop | "book" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async (chapterIds: string[], count: number, scope: string) => {
    setError(null);
    if (demo || !subjectId) {
      setError(demo ? "This is the demo — sign in to take real tests." : "Still loading your subject — try again in a moment.");
      return;
    }
    if (!s.authed) {
      setError("Sign in to take a test — that's how your results get saved.");
      return;
    }
    setBusy(true);
    const res = await startTest({ subjectId, count, difficulty: "mixed", chapterIds, scope });
    setBusy(false);
    if ("error" in res) {
      setError(
        res.error === "limit"
          ? "You've started a lot of tests today — try again tomorrow."
          : res.error === "empty"
            ? "No questions in this chapter yet."
            : "Couldn't start the test — check your connection and try again.",
      );
      return;
    }
    patch({ activeTestId: res.id, selectedSubjectId: subjectId, selectedSubjectName: subject });
    go("testRun");
  };

  const openSubjectTests = () => {
    patch({ selectedSubjectId: subjectId, selectedSubjectName: subject });
    go("subjectTests");
  };

  const st = stats[subject];
  const look = subjectLook(subject);
  const first = s.userName.split(" ")[0];

  const aside = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SubjectSummary subject={subject} st={st} done={doneCount} total={stops.length} demo={demo} onOpen={openSubjectTests} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <ActionTile color="#7C5CFF" edge="#4F31D6" icon={ICON.timer} title="Mock exam" note="Timed · up to 60" onClick={() => go("mockExam")} />
        <ActionTile color="#F2539A" edge="#C4357A" icon={ICON.swords} title="Challenge" note="Race a friend" onClick={() => { patch({ selectedSubjectId: subjectId, selectedSubjectName: subject }); go("newChallenge"); }} />
      </div>
      {recent.length > 0 && (
        <div style={{ ...card, padding: "16px 16px 8px" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 19 }}>Recent tests</h2>
          {recent.map((t) => {
            const pct = t.scorePct ?? 0;
            const good = pct >= 50;
            return (
              <button key={t.id} onClick={() => { patch({ activeTestId: t.id }); go("testReview"); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: `2px solid ${C.sand}`, textAlign: "left" }}>
                <span style={{ width: 46, height: 46, flex: "none", borderRadius: 14, background: good ? C.sageT : C.dangerT, color: good ? C.sageD : C.danger, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FD, fontWeight: 800, fontSize: 16 }}>{pct}%</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>{t.title}</span>
                  <span style={{ display: "block", fontSize: 13, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.correctCount}/{t.questionCount} right · {t.remarks}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 24 : 30, lineHeight: 1.15 }}>Assalam-o-Alaikum, {first}!</h2>
        <div style={{ color: C.muted, fontSize: 15 }}>{greeting(stops, nextIdx, subject)}</div>
      </div>

      <SubjectPills subjects={subjects} value={subject} onPick={pickSubject} />

      <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 22, alignItems: "start", marginTop: 14 }}>
        <section aria-label={`${subject} map`} style={{ position: "relative", borderRadius: 28, overflow: "hidden", background: "linear-gradient(180deg,#7FD3FF 0px,#B9E8FF 260px,#DDF4FF 70%,#E9FFE6 100%)", boxShadow: "0 4px 0 #A9D8F2" }}>
          <MapHeader subject={subject} done={doneCount} total={stops.length} color={look.color} edge={look.edge} icon={look.icon} />
          {status === "error" && !demo ? (
            <div style={{ padding: "30px 20px 40px", textAlign: "center", fontWeight: 700, color: C.ink2 }}>Couldn&apos;t load the chapters — check your connection.</div>
          ) : stops.length === 0 ? (
            <div style={{ padding: "40px 20px 60px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: C.ink2, fontWeight: 700 }}>
              <Mascot mood="thinking" size={80} />
              Drawing your map…
            </div>
          ) : (
            <MapPath stops={stops} nextIdx={nextIdx} onStop={(x) => { setError(null); setSheet(x); }} onBook={() => { setError(null); setSheet("book"); }} />
          )}
          {demo && stops.length > 0 && (
            <div style={{ position: "absolute", left: 14, bottom: 14, background: "rgba(255,255,255,.85)", borderRadius: 12, padding: "5px 10px", fontSize: 12.5, fontWeight: 800, color: C.ink2 }}>Sample progress — sign in to see yours</div>
          )}
        </section>

        <div style={{ marginTop: isMobile ? 16 : 0, position: isMobile ? "static" : "sticky", top: 90 }}>{aside}</div>
      </div>

      {sheet !== null && (
        <StopSheet
          stop={sheet}
          subject={subject}
          busy={busy}
          error={error}
          onClose={() => setSheet(null)}
          onStart={() =>
            sheet === "book"
              ? start([], BOOK_COUNT, "Whole book")
              : start([sheet.id], QUICK_COUNT, `Chapter ${sheet.seq}`)
          }
          onCustom={() => { patch({ selectedSubjectId: subjectId, selectedSubjectName: subject }); go("newTest"); }}
        />
      )}
    </>
  );
}

function greeting(stops: Stop[], nextIdx: number, subject: string): string {
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 5) return "Studying late? One short test, then rest.";
  if (stops.length === 0) return `Loading your ${subject} map…`;
  if (nextIdx === -1) return `Every ${subject} chapter is gold. Masha'Allah! Try the whole-book test.`;
  const n = stops[nextIdx];
  if (n.state === "weak") return `Chapter ${n.seq} needs another go. You've got this.`;
  return stops.every((x) => x.attempted === 0) ? `Start your ${subject} journey at Chapter ${n.seq}.` : `Next stop: Chapter ${n.seq}, ${n.title}.`;
}

// ---- subject switcher -------------------------------------------------------

function SubjectPills({ subjects, value, onPick }: { subjects: string[]; value: string; onPick: (n: string) => void }) {
  return (
    <div role="tablist" aria-label="Subject" style={{ display: "flex", gap: 10, overflowX: "auto", padding: "4px 2px 10px", margin: "0 -2px", scrollbarWidth: "none" }}>
      {subjects.map((name) => {
        const on = name === value;
        const look = subjectLook(name);
        return (
          <button
            key={name}
            role="tab"
            aria-selected={on}
            onClick={() => onPick(name)}
            className="pf-press"
            style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "7px 14px 7px 7px", borderRadius: 16, fontFamily: FD, fontWeight: 800, fontSize: 16.5, background: on ? look.color : "#fff", color: on ? "#fff" : C.ink, boxShadow: `0 4px 0 ${on ? look.edge : "#D3DAEC"}` }}
          >
            <span style={{ width: 32, height: 32, borderRadius: 11, background: on ? "rgba(255,255,255,.22)" : look.wash, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <StrokeIcon d={look.icon} size={19} width={2.4} stroke={on ? "#fff" : look.edge} />
            </span>
            {shortSubject(name)}
          </button>
        );
      })}
    </div>
  );
}

// ---- the map ----------------------------------------------------------------

function MapHeader({ subject, done, total, color, edge, icon }: { subject: string; done: number; total: number; color: string; edge: string; icon: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 12, margin: 14, padding: "12px 14px", borderRadius: 20, background: color, color: "#fff", boxShadow: `0 4px 0 ${edge}` }}>
      <span style={{ width: 44, height: 44, flex: "none", borderRadius: 14, background: "rgba(255,255,255,.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <StrokeIcon d={icon} size={26} width={2.4} stroke="#fff" />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FD, fontWeight: 800, fontSize: 20, lineHeight: 1.1 }}>{subject}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
          <div style={{ flex: 1, height: 10, borderRadius: 999, background: "rgba(255,255,255,.3)", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: "#fff", transition: "width .8s var(--ease-out)" }} />
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 800, whiteSpace: "nowrap" }}>
            {done}/{total} gold
          </span>
        </div>
      </div>
    </div>
  );
}

const NODE = 72;
const LOOK: Record<StopState | "now" | "book", { bg: string; edge: string; fg: string }> = {
  done: { bg: "#FFC93C", edge: "#D99A00", fg: "#fff" },
  weak: { bg: "#FF6B6B", edge: "#D23B3B", fg: "#fff" },
  started: { bg: "#41A6F6", edge: "#2B7FD0", fg: "#fff" },
  new: { bg: "#FFFFFF", edge: "#C3CDE4", fg: "#5C6185" },
  empty: { bg: "#E4E9F4", edge: "#C9D2E6", fg: "#8A90B2" },
  now: { bg: "#E85D0C", edge: "#B8470A", fg: "#fff" },
  book: { bg: "#7C5CFF", edge: "#4F31D6", fg: "#fff" },
};

function MapPath({ stops, nextIdx, onStop, onBook }: { stops: Stop[]; nextIdx: number; onStop: (x: Stop) => void; onBook: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(360);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Bring the next stop into view when it's further down the map.
  const nowRef = useRef<HTMLButtonElement>(null);
  const scrolled = useRef(false);
  useEffect(() => {
    if (scrolled.current || nextIdx < 4 || !nowRef.current) return;
    scrolled.current = true;
    nowRef.current.scrollIntoView({ block: "center", behavior: document.documentElement.dataset.reduceMotion === "1" ? "auto" : "smooth" });
  }, [nextIdx]);

  const amp = Math.round(Math.max(56, Math.min(120, (w - NODE) / 2 - 70)));
  const count = stops.length + 1; // + the whole-book stop
  // Whole pixels, so the server and the browser write identical styles.
  const pos = (i: number) => ({ x: Math.round(w / 2 + Math.sin(i * (Math.PI / 3)) * amp), y: TOP + i * STEP });
  const height = TOP + (count - 1) * STEP + 120;

  let d = "";
  for (let i = 0; i < count; i++) {
    const p = pos(i);
    if (i === 0) d = `M ${p.x} ${p.y}`;
    else {
      const q = pos(i - 1);
      d += ` C ${q.x} ${q.y + Math.round(STEP * 0.55)}, ${p.x} ${p.y - Math.round(STEP * 0.55)}, ${p.x} ${p.y}`;
    }
  }

  return (
    <div ref={ref} style={{ position: "relative", height, marginTop: -10 }}>
      {/* clouds and hills: the map's own scenery */}
      <Cloud x={Math.round(w * 0.08)} y={40} s={1} />
      <Cloud x={Math.round(w * 0.72)} y={260} s={0.8} />
      <Cloud x={Math.round(w * 0.12)} y={620} s={0.9} />
      {height > 1100 && <Cloud x={Math.round(w * 0.7)} y={980} s={1} />}
      <div style={{ position: "absolute", left: "-20%", right: "35%", bottom: -150, height: 260, borderRadius: "50%", background: "#7EE07A" }} />
      <div style={{ position: "absolute", left: "35%", right: "-25%", bottom: -170, height: 260, borderRadius: "50%", background: "#66D464" }} />

      <svg width={w} height={height} style={{ position: "absolute", inset: 0 }} aria-hidden>
        <path d={d} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={30} strokeLinecap="round" />
        <path d={d} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeDasharray="0.1 20" />
      </svg>

      {stops.map((x, i) => {
        const p = pos(i);
        const now = i === nextIdx;
        const look = LOOK[now ? "now" : x.state];
        const labelLeft = p.x > w / 2 + 4;
        const icon = now ? ICON.play : x.state === "done" ? ICON.check : x.state === "weak" ? ICON.target : null;
        return (
          <div key={x.id}>
            <button
              ref={now ? nowRef : undefined}
              onClick={() => onStop(x)}
              disabled={x.state === "empty"}
              aria-label={`Chapter ${x.seq}: ${x.title}. ${stateText(x, now)}`}
              className={now ? "pf-node-now pf-press" : "pf-press"}
              style={{ position: "absolute", left: p.x - NODE / 2, top: p.y - NODE / 2, width: NODE, height: NODE - 4, borderRadius: 999, background: look.bg, color: look.fg, boxShadow: `0 6px 0 ${look.edge}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FD, fontWeight: 800, fontSize: 26, zIndex: 3, opacity: 1 }}
            >
              {icon ? <StrokeIcon d={icon} size={now ? 30 : 32} width={now ? 0 : 4} stroke={look.fg} style={now ? { fill: "#fff" } : undefined} /> : x.seq}
            </button>
            {x.stars > 0 && (
              <div style={{ position: "absolute", left: p.x - 33, top: p.y + NODE / 2 + 6, width: 66, display: "flex", justifyContent: "center", gap: 1, zIndex: 3 }} aria-hidden>
                {[0, 1, 2].map((k) => (
                  <svg key={k} width="20" height="20" viewBox="0 0 24 24" style={{ transform: k === 1 ? "translateY(-3px)" : undefined }}>
                    <path d={ICON.star} fill={k < x.stars ? "#FFC93C" : "#fff"} stroke={k < x.stars ? "#D99A00" : "#C3CDE4"} strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                ))}
              </div>
            )}
            <div
              style={{ position: "absolute", top: p.y - 26, ...(labelLeft ? { right: w - p.x + NODE / 2 + 12 } : { left: p.x + NODE / 2 + 12 }), maxWidth: Math.max(110, (labelLeft ? p.x : w - p.x) - NODE / 2 - 24), zIndex: 2, textAlign: labelLeft ? "right" : "left", pointerEvents: "none" }}
            >
              <div style={{ display: "inline-block", background: "rgba(255,255,255,.92)", borderRadius: 14, padding: "6px 10px", boxShadow: "0 3px 0 rgba(32,36,74,.10)" }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: now ? C.goD : C.muted, letterSpacing: ".02em" }}>
                  Ch {x.seq}
                  {x.pct !== null ? ` · ${x.pct}%` : ""}
                </div>
                <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 15, lineHeight: 1.15, color: C.ink, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{x.title}</div>
              </div>
            </div>
            {now && (
              <div style={{ position: "absolute", top: p.y - 46, ...(labelLeft ? { left: p.x + NODE / 2 + 10 } : { right: w - p.x + NODE / 2 + 10 }), zIndex: 2 }} aria-hidden>
                <Mascot mood={x.state === "weak" ? "curious" : "wave"} size={74} />
              </div>
            )}
          </div>
        );
      })}

      {/* the end of the map: a whole-book test */}
      {(() => {
        const p = pos(stops.length);
        const look = LOOK.book;
        return (
          <>
            <button onClick={onBook} className="pf-press" aria-label="Whole-book test" style={{ position: "absolute", left: p.x - 44, top: p.y - 42, width: 88, height: 82, borderRadius: 28, background: look.bg, color: "#fff", boxShadow: `0 6px 0 ${look.edge}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}>
              <StrokeIcon d={ICON.trophy} size={40} width={2.6} stroke="#FFC93C" />
            </button>
            <div style={{ position: "absolute", top: p.y + 48, left: p.x - 80, width: 160, textAlign: "center", zIndex: 3, pointerEvents: "none" }}>
              <span style={{ display: "inline-block", background: "rgba(255,255,255,.92)", borderRadius: 12, padding: "4px 10px", fontFamily: FD, fontWeight: 800, fontSize: 15 }}>Whole-book test</span>
            </div>
          </>
        );
      })()}
    </div>
  );
}

function stateText(x: Stop, now: boolean): string {
  if (now) return "Next stop.";
  switch (x.state) {
    case "done": return `Done, ${x.stars} star${x.stars === 1 ? "" : "s"}.`;
    case "weak": return `Needs work, ${x.pct}%.`;
    case "started": return "Started.";
    case "empty": return "No questions yet.";
    default: return "Not tried yet.";
  }
}

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <div aria-hidden style={{ position: "absolute", left: x, top: y, width: 86 * s, height: 26 * s, borderRadius: 999, background: "rgba(255,255,255,.9)", animation: "pf-drift 9s var(--ease-io) infinite alternate" }}>
      <div style={{ position: "absolute", left: 14 * s, top: -16 * s, width: 36 * s, height: 36 * s, borderRadius: 999, background: "inherit" }} />
      <div style={{ position: "absolute", left: 40 * s, top: -10 * s, width: 28 * s, height: 28 * s, borderRadius: 999, background: "inherit" }} />
    </div>
  );
}

// ---- tap a stop -------------------------------------------------------------

function StopSheet({ stop, subject, busy, error, onClose, onStart, onCustom }: { stop: Stop | "book"; subject: string; busy: boolean; error: string | null; onClose: () => void; onStart: () => void; onCustom: () => void }) {
  const book = stop === "book";
  const look = book ? LOOK.book : LOOK[stop.state === "new" ? "started" : stop.state];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  let line: string;
  let mood: "wave" | "proud" | "curious" | "happy" = "wave";
  if (book) line = `${BOOK_COUNT} questions from every ${subject} chapter — like a mini board paper.`;
  else if (stop.attempted === 0) line = "You haven't tried this chapter yet. Ten questions to see where you stand.";
  else {
    line = `You've answered ${stop.attempted} question${stop.attempted === 1 ? "" : "s"} here and got ${stop.correct} right (${stop.pct}%).`;
    mood = stop.state === "done" ? "proud" : stop.state === "weak" ? "curious" : "happy";
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(32,36,74,.4)", zIndex: 130, animation: "pf-in .2s var(--ease-out) both" }} />
      <div role="dialog" aria-modal="true" aria-label={book ? "Whole-book test" : `Chapter ${stop.seq}`} style={{ position: "fixed", left: 0, right: 0, bottom: 0, margin: "0 auto", maxWidth: 520, zIndex: 140, background: "#fff", borderRadius: "28px 28px 0 0", padding: "14px 20px calc(22px + env(safe-area-inset-bottom))", boxShadow: "0 -12px 40px -10px rgba(32,36,74,.35)", animation: "pf-slide-up .32s var(--ease-out) both" }}>
        <div style={{ width: 46, height: 5, borderRadius: 999, background: C.line, margin: "0 auto 14px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 58, height: 54, flex: "none", borderRadius: 18, background: look.bg, boxShadow: `0 4px 0 ${look.edge}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: FD, fontWeight: 800, fontSize: 26 }}>
            {book ? <StrokeIcon d={ICON.trophy} size={30} width={2.6} stroke="#FFC93C" /> : stop.seq}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: C.muted }}>{book ? subject : `${subject} · Chapter ${stop.seq}`}</div>
            <h3 style={{ margin: 0, fontSize: 22, lineHeight: 1.15 }}>{book ? "Whole-book test" : stop.title}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: 40, height: 40, flex: "none", borderRadius: 14, background: C.sand, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <StrokeIcon d="M6 6l12 12M18 6L6 18" size={18} width={3} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, margin: "16px 0" }}>
          <Mascot mood={mood} size={64} />
          <div style={{ flex: 1, background: C.bg, borderRadius: "18px 18px 18px 6px", padding: "11px 14px", fontSize: 15, lineHeight: 1.45, color: C.ink2 }}>{line}</div>
        </div>

        {error && <div role="alert" style={{ background: C.dangerT, color: "#A82328", borderRadius: 14, padding: "10px 14px", fontSize: 14, fontWeight: 800, marginBottom: 12 }}>{error}</div>}

        <button onClick={onStart} disabled={busy} className="pf-press" style={{ ...btn3d(C.go, C.goD), width: "100%", padding: "15px", fontSize: 21, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {busy ? "Building your test…" : book ? `Start ${BOOK_COUNT} questions` : `Start ${QUICK_COUNT} questions`}
          {!busy && <StrokeIcon d={ICON.arrow} size={22} width={3} stroke="#fff" />}
        </button>
        <button onClick={onCustom} style={{ width: "100%", marginTop: 10, padding: "12px", fontSize: 15.5, fontWeight: 800, color: C.accentD, borderRadius: 14 }}>
          Choose chapters, count and difficulty
        </button>
      </div>
    </>
  );
}

// ---- side panel -------------------------------------------------------------

function SubjectSummary({ subject, st, done, total, demo, onOpen }: { subject: string; st?: SubjectStats; done: number; total: number; demo: boolean; onOpen: () => void }) {
  const look = subjectLook(subject);
  const best = demo ? 78 : st?.bestPct ?? null;
  const tests = demo ? 9 : st?.testsTaken ?? 0;
  return (
    <div style={{ ...card, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 48, height: 48, flex: "none", borderRadius: 16, background: look.wash, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <StrokeIcon d={look.icon} size={26} width={2.4} stroke={look.edge} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 20, lineHeight: 1.1 }}>{subject}</h2>
          <div style={{ fontSize: 13.5, color: C.muted }}>
            {tests === 0 ? "No tests yet" : `${tests} test${tests === 1 ? "" : "s"} taken`} · {done}/{total} chapters gold
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <div style={{ flex: 1, background: C.bg, borderRadius: 16, padding: "10px 12px" }}>
          <div style={{ fontSize: 12.5, fontWeight: 900, color: C.muted }}>Best score</div>
          <div style={{ fontFamily: FD, fontWeight: 800, fontSize: 28, lineHeight: 1.1, color: best === null ? C.muted : best >= 50 ? C.sageD : C.danger }}>{best === null ? "—" : `${best}%`}</div>
        </div>
        <button onClick={onOpen} className="pf-press" style={{ ...btn3d(C.accent, C.accentD), flex: 1, padding: "10px 12px", fontSize: 16.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <StrokeIcon d={ICON.list} size={19} width={2.8} stroke="#fff" />
          All tests
        </button>
      </div>
    </div>
  );
}

function ActionTile({ color, edge, icon, title, note, onClick }: { color: string; edge: string; icon: string; title: string; note: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="pf-press" style={{ ...btn3d(color, edge), textAlign: "left", padding: "14px 14px 12px", borderRadius: 20, display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ width: 40, height: 40, borderRadius: 13, background: "rgba(255,255,255,.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <StrokeIcon d={icon} size={22} width={2.5} stroke="#fff" />
      </span>
      <span>
        <span style={{ display: "block", fontSize: 18, lineHeight: 1.1 }}>{title}</span>
        <span style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, opacity: 0.92 }}>{note}</span>
      </span>
    </button>
  );
}
