// Static demo data ported verbatim from the design prototype so the dashboard
// renders with the exact same content as the mockup. In production these come
// from Supabase (see supabase/schema.sql).

export const NAV: ReadonlyArray<readonly [id: string, label: string, iconPath: string]> = [
  ["home", "Home", "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"],
  ["subjects", "My Subjects", "M4 4a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2z"],
  ["progress", "Progress", "M4 20V10M10 20V4M16 20v-7M22 20H2"],
  ["leaderboard", "Leaderboard", "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"],
  [
    "settings",
    "Settings",
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M20.5 13l1.3-.8-1.7-3-1.5.6-1.7-1-.3-1.6h-3.4l-.3 1.6-1.7 1-1.5-.6-1.7 3 1.3.8v2l-1.3.8 1.7 3 1.5-.6 1.7 1 .3 1.6h3.4l.3-1.6 1.7-1 1.5.6 1.7-3-1.3-.8z",
  ],
];

export const TITLES: Record<string, string> = {
  home: "Dashboard",
  subjects: "My Subjects",
  subjectTests: "Tests",
  newTest: "New Test",
  testRun: "Test",
  testReview: "Test Review",
  newChallenge: "Challenge Friends",
  challengeRoom: "Challenge",
  progress: "Progress",
  leaderboard: "Leaderboard",
  settings: "Settings",
};

// The subjects Prepify offers right now (Class 9 only). Single source of truth —
// Onboarding and Settings both render from this list.
export const OFFERED_SUBJECTS = ["Physics", "Chemistry", "Maths", "Computer Science", "English"] as const;

// Placement diagnostic — a small bank per subject. The onboarding diagnostic
// draws only from the subjects the student picked (see buildDiagnostic).
export interface DiagQ {
  subject: string;
  stem: string;
  options: string[];
  answer: number; // index of the correct option
}

type BankItem = readonly [stem: string, options: readonly string[], answer: number];

export const DQ_BANK: Record<string, ReadonlyArray<BankItem>> = {
  Physics: [
    ["A body moves in a circle at constant speed. Which quantity stays constant?", ["Velocity", "Speed", "Acceleration", "Net force"], 1],
    ["The SI unit of force is the", ["joule", "newton", "watt", "pascal"], 1],
    ["Acceleration due to gravity near Earth's surface is about", ["1 m s⁻²", "10 m s⁻²", "100 m s⁻²", "0 m s⁻²"], 1],
  ],
  Chemistry: [
    ["Which of these is an example of a buffer solution?", ["HCl + NaCl", "CH₃COOH + CH₃COONa", "NaOH + KOH", "H₂SO₄ + water"], 1],
    ["The atomic number of an element equals the number of", ["neutrons", "protons", "protons + neutrons", "molecules"], 1],
    ["The pH of a neutral solution at 25 °C is", ["0", "7", "14", "1"], 1],
  ],
  Biology: [
    ["The site of aerobic respiration in a eukaryotic cell is the", ["ribosome", "mitochondrion", "Golgi body", "lysosome"], 1],
    ["Which vessel carries oxygenated blood to the body?", ["pulmonary artery", "vena cava", "aorta", "pulmonary vein"], 2],
    ["The basic structural and functional unit of life is the", ["tissue", "organ", "cell", "atom"], 2],
  ],
  Maths: [
    ["The derivative of sin(2x) with respect to x is", ["cos(2x)", "2cos(2x)", "−2cos(2x)", "2sin(2x)"], 1],
    ["The value of 0! (zero factorial) is", ["0", "1", "undefined", "infinity"], 1],
    ["If 2x = 10, then x =", ["4", "5", "8", "20"], 1],
  ],
  "Computer Science": [
    ["Which of these is a programming language?", ["HTTP", "Python", "HTML tag", "USB"], 1],
    ["One byte equals how many bits?", ["4", "8", "16", "1024"], 1],
    ["The part of a computer that executes instructions is the", ["RAM", "CPU", "monitor", "SSD"], 1],
  ],
  English: [
    ["Choose the correctly spelled word:", ["recieve", "receive", "receeve", "receve"], 1],
    ["Identify the noun in: 'The dog ran quickly.'", ["ran", "quickly", "dog", "the"], 2],
    ["The antonym of 'ancient' is", ["old", "modern", "historic", "aged"], 1],
  ],
  Urdu: [
    ["'خوشی' کا متضاد کیا ہے؟", ["مسرت", "غم", "شادمانی", "راحت"], 1],
    ["'آفتاب' کا مترادف ہے", ["چاند", "سورج", "ستارہ", "زمین"], 1],
    ["'قلم' کی جمع ہے", ["قلمیں", "اقلام", "قلموں", "قلمہ"], 1],
  ],
  Islamiyat: [
    ["How many pillars of Islam are there?", ["three", "four", "five", "seven"], 2],
    ["The first month of the Islamic calendar is", ["Ramadan", "Muharram", "Shawwal", "Rajab"], 1],
    ["The Holy Quran was revealed to Prophet", ["Musa (AS)", "Isa (AS)", "Muhammad (SAW)", "Ibrahim (AS)"], 2],
  ],
  "Pak Studies": [
    ["Pakistan came into being on", ["14 August 1947", "23 March 1940", "15 August 1947", "6 September 1965"], 0],
    ["The capital of Pakistan is", ["Karachi", "Lahore", "Islamabad", "Peshawar"], 2],
    ["The national language of Pakistan is", ["Punjabi", "Urdu", "Sindhi", "English"], 1],
  ],
};

// Canonical order for presenting the diagnostic.
const DIAGNOSTIC_ORDER = [
  "Physics", "Chemistry", "Biology", "Maths", "Computer Science", "English", "Urdu", "Islamiyat", "Pak Studies",
];

// Build the placement diagnostic from the chosen subjects: up to 2 questions per
// selected subject, capped at 8 total.
export function buildDiagnostic(subs: string[]): DiagQ[] {
  const out: DiagQ[] = [];
  for (const subject of DIAGNOSTIC_ORDER) {
    if (!subs.includes(subject)) continue;
    const bank = DQ_BANK[subject];
    if (!bank) continue;
    for (let i = 0; i < Math.min(2, bank.length); i++) {
      const [stem, options, answer] = bank[i];
      out.push({ subject, stem, options: [...options], answer });
    }
    if (out.length >= 8) break;
  }
  return out.slice(0, 8);
}

// Real days from today until the exam date. 0 once the date has passed.
export function daysUntil(examDate: string): number {
  if (!examDate) return 0;
  const d = Math.round((new Date(examDate).getTime() - Date.now()) / 86400000);
  return d > 0 ? d : 0;
}
