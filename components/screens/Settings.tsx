"use client";

import { useApp } from "@/lib/store";
import { C, pill } from "@/lib/theme";

const ALL_SUBJECTS = [
  "Physics", "Chemistry", "Biology", "Maths", "Computer Science", "English", "Urdu", "Islamiyat", "Pak Studies",
];

export function Settings() {
  const { s, set, patch } = useApp();
  return (
    <div style={{ maxWidth: 820, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, flex: "none", borderRadius: 999, background: C.sage, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Caprasimo", fontSize: 26 }}>AR</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Caprasimo", fontSize: 22 }}>Areeba Rehman</div>
            <div style={{ color: C.muted, fontSize: 14 }}>areeba.r@example.com · Islamabad Model College</div>
          </div>
          <button style={{ borderRadius: 999, background: C.sand, fontWeight: 700, padding: "11px 20px", fontSize: 14 }}>Edit profile</button>
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Class &amp; subjects</div>
        <div style={{ display: "flex", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, marginBottom: 8 }}>Class</div>
            <div style={{ display: "flex", background: C.bg, borderRadius: 999, padding: 4 }}>
              {["9th", "10th", "11th", "12th"].map((name) => (
                <button key={name} onClick={() => set("cls", name)} style={pill(s.cls === name)}>{name}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, marginBottom: 8 }}>Exam date</div>
            <input type="date" value={s.examDate} onChange={(e) => set("examDate", e.target.value)} style={{ borderRadius: 999, border: "1.5px solid #e0d0b4", background: "#fff", padding: "10px 18px", fontSize: 14, fontWeight: 600 }} />
          </div>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, marginBottom: 9 }}>Enrolled subjects — tap to change</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ALL_SUBJECTS.map((name) => {
            const on = s.subs.includes(name);
            return (
              <button key={name} onClick={() => patch({ subs: on ? s.subs.filter((x) => x !== name) : [...s.subs, name] })} style={{ borderRadius: 999, padding: "9px 15px", fontWeight: 600, fontSize: 13.5, background: on ? C.accent : "transparent", color: on ? "#fff" : "#5d5648", border: `1.5px solid ${on ? C.accent : "#dfcfb2"}` }}>
                {on ? "✓ " : "+ "}{name}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: "24px 26px" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Study preferences</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Row title="Study mode" desc="Guided locks topics until mastered. Free roam opens everything.">
            <div style={{ display: "flex", background: C.bg, borderRadius: 999, padding: 4, flex: "none" }}>
              <button onClick={() => set("mode", "guided")} style={pill(s.mode === "guided")}>Guided</button>
              <button onClick={() => set("mode", "free")} style={pill(s.mode === "free")}>Free roam</button>
            </div>
          </Row>
          <Divider />
          <Row title="Language" desc="Tutor explanations and feedback follow this. Textbook stays in the board's language.">
            <div style={{ display: "flex", background: C.bg, borderRadius: 999, padding: 4, flex: "none" }}>
              <button onClick={() => set("lang", "EN")} style={pill(s.lang === "EN")}>English</button>
              <button onClick={() => set("lang", "UR")} style={pill(s.lang === "UR")}>اردو</button>
            </div>
          </Row>
          <Divider />
          <Row title="Data saver" desc="Cache chapters overnight on Wi-Fi, skip images on mobile data.">
            <Toggle on={s.saver} onClick={() => set("saver", !s.saver)} />
          </Row>
          <Divider />
          <Row title="Daily reminder" desc="A nudge at 7:30 pm if you haven't studied.">
            <Toggle on={s.remind} onClick={() => set("remind", !s.remind)} />
          </Row>
        </div>
      </div>
    </div>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "#9a8d78" }}>{desc}</div>
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#ece0c8" }} />;
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 56, height: 32, borderRadius: 999, background: on ? C.sage : "#d8c8ab", position: "relative", flex: "none" }}>
      <div style={{ position: "absolute", top: 4, left: on ? 28 : 4, width: 24, height: 24, borderRadius: 999, background: "#fff", transition: "left .18s ease" }} />
    </button>
  );
}
