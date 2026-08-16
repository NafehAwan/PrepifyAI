// Static demo data ported verbatim from the design prototype so the dashboard
// renders with the exact same content as the mockup. In production these come
// from Supabase (see supabase/schema.sql).

export const NAV: ReadonlyArray<readonly [id: string, label: string, iconPath: string]> = [
  ["home", "Home", "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"],
  ["subjects", "My Subjects", "M4 4a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2z"],
  ["plan", "Study Plan", "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M8 2v4M16 2v4"],
  ["practice", "Practice", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8"],
  ["mock", "Mock Exams", "M6 2h8l5 5v15H6zM14 2v5h5"],
  ["progress", "Progress", "M4 20V10M10 20V4M16 20v-7M22 20H2"],
  ["reviews", "Reviews", "M4 9a5 5 0 0 1 5-5h11M20 15a5 5 0 0 1-5 5H4M17 1l3 3-3 3M7 17l-3 3 3 3"],
  [
    "settings",
    "Settings",
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M20.5 13l1.3-.8-1.7-3-1.5.6-1.7-1-.3-1.6h-3.4l-.3 1.6-1.7 1-1.5-.6-1.7 3 1.3.8v2l-1.3.8 1.7 3 1.5-.6 1.7 1 .3 1.6h3.4l.3-1.6 1.7-1 1.5.6 1.7-3-1.3-.8z",
  ],
];

export const TITLES: Record<string, string> = {
  home: "Dashboard",
  subjects: "My Subjects",
  chapters: "Physics · Chapters",
  topic: "Topic Workspace",
  practice: "Practice & Feedback",
  mock: "Mock Exam",
  progress: "Progress",
  plan: "Study Plan",
  reviews: "Reviews Due",
  settings: "Settings",
};

// [name, mastery %, predicted grade, reviews due]
export const SUBJECTS: ReadonlyArray<readonly [string, number, string, number]> = [
  ["Physics", 62, "B", 8],
  ["Chemistry", 71, "B+", 5],
  ["Biology", 84, "A", 2],
  ["Maths", 48, "C+", 11],
  ["Computer Science", 77, "A-", 3],
  ["English", 66, "B", 4],
  ["Urdu", 58, "B-", 6],
  ["Islamiyat", 90, "A+", 1],
  ["Pak Studies", 73, "B+", 3],
];

// [num, title, topics[], status: m|p|n (mastered/progress/not-started)]
export const CH: ReadonlyArray<readonly [string, string, readonly string[], "m" | "p" | "n"]> = [
  ["1", "Measurements", ["Physical quantities & SI units", "Errors and uncertainties", "Significant figures", "Dimensional analysis"], "m"],
  ["2", "Vectors and Equilibrium", ["Vector addition by rectangular components", "Product of two vectors", "Torque", "Equilibrium of forces"], "m"],
  ["3", "Forces and Motion", ["Newton’s laws revisited", "Momentum and impulse", "Elastic & inelastic collisions", "Projectile motion"], "m"],
  ["4", "Work and Energy", ["Work done by a variable force", "Power and efficiency", "Conservation of energy", "Absolute PE"], "p"],
  ["5", "Rotational and Circular Motion", ["Angular displacement & velocity", "Relation between linear and angular", "Centripetal force", "Moment of inertia", "Artificial satellites"], "p"],
  ["6", "Fluid Dynamics", ["Viscosity and Stokes’ law", "Terminal velocity", "Equation of continuity", "Bernoulli’s equation"], "n"],
  ["7", "Oscillations", ["Simple harmonic motion", "SHM and uniform circular motion", "Simple pendulum", "Damped oscillations"], "n"],
  ["8", "Waves", ["Progressive waves", "Stationary waves", "Doppler effect", "Beats"], "n"],
];

// [title, meta, done(1/0), time]
export const TASKS: ReadonlyArray<readonly [string, string, number, string]> = [
  ["Review 23 flashcards", "Ch 1–4 · spaced repetition", 1, "9 min"],
  ["Read 5.3 Centripetal Force", "Physics · textbook + tutor", 1, "12 min"],
  ["Pass quiz 5.3", "Need 70% to master", 1, "6 min"],
  ["Drill 8 short questions", "Chemistry · Ch 3 weak spot", 0, "15 min"],
  ["Log tomorrow’s plan", "Optional", 0, "1 min"],
];

// [topic, subject, score]
export const WEAK: ReadonlyArray<readonly [string, string, string]> = [
  ["Centripetal & centrifugal confusion", "Physics · Ch 5", "31%"],
  ["Balancing redox equations", "Chemistry · Ch 3", "38%"],
  ["Integration by substitution", "Maths · Ch 9", "42%"],
];

// Placement diagnostic questions: [subject, stem, options[], answerIndex]
export const DQ: ReadonlyArray<readonly [string, string, readonly string[], number]> = [
  ["Physics", "A body moves in a circle of radius 2 m at constant speed. Which quantity stays constant?", ["Velocity", "Speed", "Acceleration", "Net force"], 1],
  ["Chemistry", "Which of these is an example of a buffer solution?", ["HCl + NaCl", "CH3COOH + CH3COONa", "NaOH + KOH", "H2SO4 + water"], 1],
  ["Biology", "The site of aerobic respiration in a eukaryotic cell is the", ["Ribosome", "Mitochondrion", "Golgi body", "Lysosome"], 1],
  ["Maths", "The derivative of sin(2x) with respect to x is", ["cos(2x)", "2cos(2x)", "-2cos(2x)", "2sin(2x)"], 1],
  ["Physics", "SI unit of torque is", ["N", "N m", "N/m", "J/s"], 1],
  ["Biology", "Which vessel carries oxygenated blood to the body?", ["Pulmonary artery", "Vena cava", "Aorta", "Pulmonary vein"], 2],
];

// Predicted-grade gauges on the home screen: [name, pct, grade]
export const GAUGES: ReadonlyArray<readonly [string, number, string]> = [
  ["Physics", 62, "B"],
  ["Chemistry", 71, "B+"],
  ["Biology", 84, "A"],
  ["Maths", 48, "C+"],
];

export const REFERENCE_TODAY = "2026-08-15";

export function daysUntil(examDate: string): number {
  const d = Math.round(
    (new Date(examDate).getTime() - new Date(REFERENCE_TODAY).getTime()) / 86400000,
  );
  return d > 0 ? d : 118;
}
