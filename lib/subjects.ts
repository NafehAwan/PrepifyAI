// How each subject looks on the map (icon, colour) and, for the demo build
// only, the chapter lists the map draws when there is no database to read.

export interface SubjectLook {
  icon: string; // a 24×24 stroke path (several sub-paths allowed)
  color: string; // tile colour, white icon on top
  edge: string; // darker edge under the tile
  wash: string; // pale background tint
}

const ATOM =
  "M13 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0M20.2 20.2c2-2 0-7.4-4.5-11.9S5.8 1.8 3.8 3.8s0 7.4 4.5 11.9 9.9 6.5 11.9 4.5ZM15.7 15.7c4.5-4.5 6.5-9.9 4.5-11.9s-7.4 0-11.9 4.5-6.5 9.9-4.5 11.9 7.4 0 11.9-4.5Z";
const FLASK = "M10 2v7.5a2 2 0 0 1-.2.9L4.7 20.5a1 1 0 0 0 .9 1.5h12.8a1 1 0 0 0 .9-1.5l-5.1-10.1a2 2 0 0 1-.2-.9V2M8.5 2h7M7 16h10";
const SIGMA = "M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8l4.5 6a2 2 0 0 1 0 2.4l-4.5 6a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2";
const CODE = "M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16";
const BOOK = "M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z";

const LOOKS: Record<string, SubjectLook> = {
  Physics: { icon: ATOM, color: "#FF7A2F", edge: "#D45A12", wash: "#FFEBDD" },
  Chemistry: { icon: FLASK, color: "#14A99A", edge: "#0B8074", wash: "#DDF6F2" },
  Maths: { icon: SIGMA, color: "#F2539A", edge: "#C4357A", wash: "#FDE6F1" },
  "Computer Science": { icon: CODE, color: "#2F8CFF", edge: "#1C66CF", wash: "#E3EFFF" },
  English: { icon: BOOK, color: "#22B35E", edge: "#178C46", wash: "#DDF7E6" },
};

export function subjectLook(name: string): SubjectLook {
  return LOOKS[name] ?? { icon: BOOK, color: "#6C4CF5", edge: "#4F31D6", wash: "#EFEAFF" };
}

// Short names for tight spaces (tab pills on a phone).
export function shortSubject(name: string): string {
  return name === "Computer Science" ? "Computer" : name;
}

// Demo build only: the real chapter titles, so the map is drawn from the
// actual syllabus even without a database.
export const DEMO_CHAPTERS: Record<string, string[]> = {
  Physics: [
    "Physical Quantities and Measurement",
    "Kinematics",
    "Dynamics - I",
    "Dynamics - II",
    "Pressure and Deformation in Solids",
    "Work and Energy",
    "Density and Temperature",
    "Magnetism",
    "Nature of Science and Physics",
  ],
  Chemistry: [
    "Nature of Science in Chemistry",
    "Matter",
    "Atomic Structure",
    "Periodic Table and Periodicity of Properties",
    "Chemical Bonding",
    "Stoichiometry",
    "Electrochemistry",
    "Energetics",
    "Chemical Equilibrium",
    "Acids, Bases and Salts",
    "Environmental Chemistry — Air",
    "Environmental Chemistry — Water",
    "Organic Chemistry",
    "Hydrocarbons",
    "Biochemistry",
  ],
  Maths: [
    "Real Numbers",
    "Logarithms",
    "Sets and Relations",
    "Factorization and Algebraic Manipulation",
    "Linear Equations and Inequalities",
    "Trigonometry and Bearing",
    "Coordinate Geometry",
    "Geometry of Straight Lines",
    "Geometry and Polygons",
    "Practical Geometry",
    "Basic Statistics",
  ],
  "Computer Science": [
    "Computer Systems",
    "Computational Thinking and Algorithms",
    "Programming Fundamentals",
    "Data and Analysis",
    "Application of Computer Science",
    "Impacts of Computing",
    "Entrepreneurship",
  ],
  English: [
    "Hazrat Muhammad ﷺ – A Mercy for All Creation",
    "The Art of Muslim Women's Entrepreneurship",
    "Modern World and Age of Digital Globalization",
    "Nothing is Impossible – The Brooklyn Bridge",
    "5 of Jeff Bezos's Best Lessons",
    "Say No to Drugs",
    "Mowing",
    "The Eagle",
    "Travel and Tourism",
    "Two Mothers Remembered",
    "The Metamorphosis",
    "Good Health and Well Being",
  ],
};

// Demo build only: sample per-chapter results, labelled as sample data on screen.
export const DEMO_RESULTS: Record<number, { attempted: number; correct: number }> = {
  1: { attempted: 20, correct: 19 },
  2: { attempted: 15, correct: 12 },
  3: { attempted: 12, correct: 6 },
};
