// Client-safe constants shared by the UI and the AI routes. These describe the
// demo topic (5.3 Centripetal Force) so the tutor is grounded and the examiner
// has a real question + marking scheme to grade against.

export interface GradeResult {
  awarded: number;
  outOf: number;
  hits: string[];
  missed: string[];
  keyword_gaps: string[];
  feedback_md: string;
  slo_code: string;
}

// Ground truth handed to /api/ai/teach so the tutor answers from the syllabus.
export const DEMO_TEACH = {
  subject: "Physics",
  classLevel: 11,
  medium: "English",
  level: "Developing (C+ range)",
  sloList:
    "PHY-11-5.3.1 Define centripetal acceleration and force; PHY-11-5.3.2 Apply F = mv²/r = m r ω²; PHY-11-5.3.3 Distinguish the real inward (centripetal) force from the fictitious centrifugal force.",
  groundTruth: `(SLO PHY-11-5.3.1) When a body moves along a circular path with uniform speed, its direction of motion changes continuously. A change in direction is a change in velocity, so the body is accelerating even though its speed is constant. This acceleration is directed towards the centre of the circle and is called centripetal acceleration, a_c = v²/r.
(SLO PHY-11-5.3.2) The force needed to produce this acceleration is the centripetal force: F_c = m v² / r = m r ω². It is not a new kind of force — it is whatever real force acts towards the centre: tension in a string, friction between tyre and road, or gravitational pull on a satellite.
(SLO PHY-11-5.3.3) A common board-exam error is to call the outward "centrifugal force" a real force. It is a fictitious force that appears only when motion is described from a rotating (non-inertial) frame of reference. FBISE marking schemes award marks for identifying the real inward force. For a car on a level bend the maximum safe speed is v_max = √(μ g r); banking the road lets a higher safe speed be reached without relying on friction.`,
} as const;

// The Practice question graded by /api/ai/grade.
export const DEMO_GRADE = {
  sloCode: "PHY-11-5.3.3",
  marks: 5,
  question:
    "Explain why a passenger in a car taking a sharp turn feels pushed outwards. Is any outward force acting on the passenger? Justify with reference to Newton's laws.",
  markingScheme: [
    "States no real outward force acts on the passenger (1)",
    "Explains inertia / Newton's first law — the body tends to continue in a straight line (1)",
    "Identifies the real inward force as centripetal — friction between tyres and road (1)",
    "Explains the door supplies the inward force that makes the passenger follow the circular path (1)",
    "States the outward 'centrifugal force' is fictitious, seen only in the rotating frame (1)",
  ],
  modelAnswer:
    "No real outward force acts on the passenger. By Newton's first law the passenger's body tends to continue moving in a straight line because of its inertia, while the car is turned by a real centripetal force — the friction between the tyres and the road — directed towards the centre. Relative to the turning car the passenger appears to move outwards and presses against the door; the door then supplies the inward force that makes the passenger follow the circular path. The apparent outward 'centrifugal force' is a fictitious force, observed only in the rotating (non-inertial) frame of the car.",
} as const;

// Fallback tutor reply when the AI backend isn't configured or a call fails.
export const CANNED_TUTOR_REPLY =
  "Here's the short version from your book: Fᴄ = mv²/r. For a 1000 kg car at 20 m s⁻¹ on a 50 m bend that's 8000 N of friction — more than dry tyres can usually give, which is exactly why the road is banked. (SLO PHY-11-5.3.2) Want me to set you two numericals on this?";
