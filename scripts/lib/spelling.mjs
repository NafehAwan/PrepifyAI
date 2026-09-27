// Unambiguous typos in the source documents, fixed at ingest so a student's
// test never shows "Screw Guage" or "Scaler quantity". Applied before question
// ids are computed, so the fixes are stable across re-runs.
//
// Deliberately small: only words that are wrong in every context they appear
// in. Anything that could be a real word elsewhere is scoped to one subject
// ("drive" is correct in Computer Science, but means "derived" in the Physics
// set).

const ALL = [
  [/\bGuage\b/g, "Gauge"],
  [/\bguage\b/g, "gauge"],
  [/\bScaler\b/g, "Scalar"],
  [/\bscaler\b/g, "scalar"],
  [/\bRendom\b/g, "Random"],
  [/\brendom\b/g, "random"],
  [/\bCrammer rule\b/g, "Cramer's rule"],
  [/\bHurtz\b/g, "Hertz"],
  [/\bneather\b/g, "neither"],
  [/\bStrom\b/g, "Storm"],
  [/\bwaers\b/g, "wears"],
  [/\bCrud oil\b/g, "Crude oil"],
  [/\bDepover rating\b/g, "Power rating"],
  [/\bHight liquid\b/g, "High liquid"],
  [/\bRoh\b/g, "Rho"],
  [/\bUsain bolt\b/g, "Usain Bolt"],
  [/\bJos inglis\b/g, "Josh Inglis"],
  [/\bSangakara\b/g, "Sangakkara"],
  [/\bJP duminy\b/g, "JP Duminy"],
  [/\b(is|are|rule|device) use to\b/g, "$1 used to"],
  [/\bSommetimes\b/g, "Sometimes"],
  [/^L if /, "If "], // a stray keystroke before one stem
  [/^Studio of motion\b/, "Study of motion"],
];

const BY_SUBJECT = {
  Physics: [
    [/\bdrive quantities\b/gi, "derived quantities"],
    [/^Drive$/, "Derived"],
    [/^Submission$/, "Subtraction"],
  ],
};

// Whole-stem repairs for questions whose physics is sound but whose wording is
// garbled in the source. Keyed by the exact original stem, so nothing else is
// touched by accident.
const STEM_REWRITES = new Map([
  ["If a scuba diver died deep in a sea to experience the marine life he also experiences high pressure due to",
   "A scuba diver goes deep into the sea to see marine life. The high pressure the diver experiences is due to"],
  ["If you are driving in a sea the force exerted by the pressure of liquid is",
   "When you dive in the sea, the force exerted on you by the pressure of the water acts"],
  ["A section cup is a stick on a wall easily due to", "A suction cup sticks to a wall easily due to"],
  ["A female teacher waers a heel shoes one day and a flat shoes at the second day . Which shoes has a large pressure on floor",
   "A teacher wears high-heeled shoes one day and flat shoes the next day. Which shoes exert more pressure on the floor?"],
  ["A flat shoes has very less pressure as compared to heel shoes due to Area",
   "Flat shoes exert much less pressure than high heels because their area is"],
  ["Take a can filled with water drill 3 holes at different height water will spurt out faster and furthest from which of the whole",
   "Three holes are drilled at different heights in a can full of water. Water spurts out fastest and furthest from which hole?"],
  ["Take a can filled with water drill 3 holes at different height water will spurt out slow and nearest from which of the whole",
   "Three holes are drilled at different heights in a can full of water. Water spurts out slowest and nearest from which hole?"],
  ["If we place a barometer on a smooth surface so are falling barometer maybe indicate as",
   "A sudden fall in the reading of a barometer usually indicates"],
  ["If we doubled the applied force on a gear pedal of car what would be the effect on pressure",
   "If the force applied on the brake pedal of a car is doubled over the same area, the pressure"],
  ["Demotion of a bodies that continues forever in an unperturbed system",
   "The motion of a body that continues forever in an undisturbed system is called"],
  ["I and natural gas is often extracted from reservoirs by the process of",
   "Oil and natural gas are usually extracted from underground reservoirs by"],
  ["Rate of doing work with respect to kind is called", "The rate of doing work with respect to time is called"],
]);

export function fixSpelling(text, subject) {
  const rewritten = STEM_REWRITES.get(text.trim());
  if (rewritten) return rewritten;
  let out = text;
  for (const [re, to] of [...ALL, ...(BY_SUBJECT[subject] ?? [])]) out = out.replace(re, to);
  return out;
}
