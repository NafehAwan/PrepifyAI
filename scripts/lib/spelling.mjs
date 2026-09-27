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
];

const BY_SUBJECT = {
  Physics: [
    [/\bdrive quantities\b/gi, "derived quantities"],
    [/^Drive$/, "Derived"],
    [/^Submission$/, "Subtraction"],
  ],
};

export function fixSpelling(text, subject) {
  let out = text;
  for (const [re, to] of [...ALL, ...(BY_SUBJECT[subject] ?? [])]) out = out.replace(re, to);
  return out;
}
