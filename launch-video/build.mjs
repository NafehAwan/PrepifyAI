#!/usr/bin/env node
// Builds the two renderable compositions from one source:
//   timing.js  (all times, copy, sound cues)  +  src/ (markup, styles, timeline)
//   → index.html     1920×1080 (16:9)
//   → vertical/index.html  1080×1920 (9:16)
// Run after editing timing.js or anything in src/:   npm run build
//
// Music slot: if ../video-reference/music.mp3 exists it is copied to
// assets/music/music.mp3 and used instead of the placeholder in timing.js.

import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync, statSync, symlinkSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(DIR, p), "utf8");

await import(pathToFileURL(join(DIR, "timing.js")).href);
const { config: C, timing: T, sfx: sfxCues } = globalThis.LAUNCH;

// ---------------------------------------------------------------- music slot
let music = C.music;
const userMusic = join(DIR, "..", "video-reference", "music.mp3");
if (existsSync(userMusic)) {
  copyFileSync(userMusic, join(DIR, "assets", "music", "music.mp3"));
  music = "assets/music/music.mp3";
  console.log("♪ using your music: video-reference/music.mp3");
} else {
  console.log(`♪ music slot empty — using placeholder ${music}`);
}

// ------------------------------------------------------------------ helpers
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Typewriter markup: words are inline-blocks (so lines wrap between words),
// every character is its own span with a global index (spaces count as a
// beat of typing time but are real text gaps so wrapping still works).
function typeLine(rows, opts = {}) {
  let i = 0;
  const rowHtml = rows.map((row) => {
    const out = [];
    row.forEach((part) => {
      const words = part.text.split(" ");
      words.forEach((w, wi) => {
        if (w.length) {
          const chars = [...w].map((c) => `<span class="ch${part.kw ? " kw" : ""}" data-i="${i++}">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
          const cls = ["word", part.kw ? "kw-wrap" : opts.markOthers ? "other" : ""].filter(Boolean).join(" ");
          const id = part.kw && part.id ? ` id="${part.id}"` : "";
          out.push(`<span class="${cls}"${id}>${chars}</span>`);
        }
        if (wi < words.length - 1) { out.push(" "); i++; }
      });
    });
    return rows.length > 1 ? `<div class="type-row">${out.join("")}</div>` : out.join("");
  });
  return `<div class="type-line">${rowHtml.join("")}<span class="caret"></span></div>`;
}

const hookLead = C.hook.lead.replace("Class 9", "Class 9");
const HOOK = typeLine([[{ text: hookLead.trimEnd() + " " }, { text: C.hook.keyword, kw: true, id: "hook-kw" }]], { markOthers: true });
const HEADLINE = typeLine([
  [{ text: C.headline.line1 }],
  [{ text: C.headline.line2Lead }, { text: C.headline.line2Keyword, kw: true }],
]);

const [w1, ...rest] = C.productName.split(" ");
const WORDMARK = [...w1].map((c) => `<span class="ch">${esc(c)}</span>`).join("") +
  (rest.length ? `<span class="ch">&nbsp;</span>` + [...rest.join(" ")].map((c) => `<span class="ch ai">${esc(c)}</span>`).join("") : "");

const LOGO_SVG_34 = `<svg width="34" height="34" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="32" fill="#C67139"/><rect x="19" y="17" width="8" height="30" rx="4" fill="#fff"/><rect x="23" y="17" width="21" height="17" rx="8.5" fill="#fff"/><path d="M33 21.5c-2.6-1.5-5.4-1.5-8 0v8c2.6-1.5 5.4-1.5 8 0z" fill="#C67139"/><path d="M35 21.5c2.6-1.5 5.4-1.5 8 0v8c-2.6-1.5-5.4-1.5-8 0z" fill="#C67139"/></svg>`;
const LOGO_GLYPH = `<svg id="logo-glyph" viewBox="0 0 64 64" fill="none"><rect x="19" y="17" width="8" height="30" rx="4" fill="#fff"/><rect x="23" y="17" width="21" height="17" rx="8.5" fill="#fff"/><path d="M33 21.5c-2.6-1.5-5.4-1.5-8 0v8c2.6-1.5 5.4-1.5 8 0z" fill="#C67139"/><path d="M35 21.5c2.6-1.5 5.4-1.5 8 0v8c-2.6-1.5-5.4-1.5-8 0z" fill="#C67139"/></svg>`;
const CURSOR = (cls = "") => `<svg class="cursor-svg${cls}" viewBox="0 0 50 56" fill="none"><path d="M15 4c-2.2 0-4 1.8-4 4v22.5l-3.3-3.4c-1.6-1.6-4.2-1.6-5.7 0-1.4 1.4-1.5 3.7-.2 5.2l9.9 11.6C15.1 48.6 19.4 52 25.5 52H30c8.3 0 15-6.7 15-15V25.5c0-2.2-1.8-4-4-4-.9 0-1.7.3-2.4.8v-.3c0-2.2-1.8-4-4-4-1 0-1.9.4-2.6 1v-.5c0-2.2-1.8-4-4-4-.9 0-1.8.3-2.4.8V8c0-2.2-1.8-4-4-4z" fill="#fff" stroke="#201e1d" stroke-width="2.6" stroke-linejoin="round"/><path d="M23.6 22v10M30.6 23.6V32M37.6 26v6" stroke="#201e1d" stroke-width="2.4" stroke-linecap="round"/></svg>`;

const urlLabel = C.ctaUrl || C.productName;
const LOCK = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7a6f5d" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
const CHROME = {
  landscape: `<div class="chrome"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><div class="url">${LOCK}<span>${esc(urlLabel)}</span></div><div style="width:58px"></div></div>`,
  portrait: `<div class="chrome"><span>9:41</span><span class="status-icons"><svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#201e1d"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="#201e1d"/><rect x="10" y="3" width="3" height="9" rx="1" fill="#201e1d"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#201e1d"/></svg><svg width="26" height="13" viewBox="0 0 26 13"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="#201e1d" fill="none"/><rect x="2.5" y="2.5" width="16" height="8" rx="2" fill="#201e1d"/><rect x="23.5" y="4" width="2" height="5" rx="1" fill="#201e1d"/></svg></span></div>`,
};

// ------------------------------------------------------------------- audio
function durationOf(file) {
  try {
    const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", join(DIR, file)], { encoding: "utf8" });
    return Math.max(0.05, Math.round(parseFloat(out) * 1000) / 1000);
  } catch {
    return 0.8;
  }
}
function audioTags() {
  const total = T.total;
  const vol = C.musicVolume;
  const fadeOutAt = Math.min(T.outro.musicFadeAt, total - 0.3);
  const lane = { version: 1, lanes: [{ target: "volume", points: [{ t: 0, v: 0 }, { t: 0.5, v: vol }, { t: fadeOutAt, v: vol }, { t: total, v: 0 }] }] };
  const tags = [`<audio id="music" src="${music}" data-start="0" data-duration="${total}" data-track-index="10" data-volume="1" data-automation='${JSON.stringify(lane)}'></audio>`];
  // give overlapping cues their own track (never share a track between overlaps)
  const cues = sfxCues(T, C).sort((a, b) => a.at - b.at);
  const trackEnds = [];
  cues.forEach((c, n) => {
    const file = `assets/sfx/${c.file}`;
    const d = Math.min(durationOf(file), total - c.at);
    if (d <= 0) return;
    let k = trackEnds.findIndex((end) => end <= c.at - 0.01);
    if (k === -1) { k = trackEnds.length; trackEnds.push(0); }
    trackEnds[k] = c.at + d;
    tags.push(`<audio id="sfx-${String(n + 1).padStart(2, "0")}" src="${file}" data-start="${c.at}" data-duration="${d}" data-track-index="${11 + k}" data-volume="${c.vol}"></audio>`);
  });
  return tags.join("\n    ");
}

// ------------------------------------------------------------------- build
const css = read("src/styles.css");
const mainJs = read("src/main.js");
const timingJs = read("timing.js");
const AUDIO = audioTags();

function compose(fmt) {
  const W = fmt === "portrait" ? 1080 : 1920;
  const H = fmt === "portrait" ? 1920 : 1080;
  const scenes = read("src/scenes.html.tpl")
    .replace("{{CHROME}}", CHROME[fmt])
    .replace("{{LOGO_SVG_34}}", LOGO_SVG_34)
    .replace("{{LOGO_GLYPH}}", LOGO_GLYPH)
    .replace("{{CURSOR_SVG}}", CURSOR())
    .replace("{{CURSOR_SVG_HOOK}}", CURSOR())
    .replace("{{HOOK_LINE}}", HOOK)
    .replace("{{HEADLINE_LINE}}", HEADLINE)
    .replace("{{WORDMARK}}", WORDMARK)
    .replace("{{PRODUCT}}", esc(C.productName))
    .replace("{{TAGLINE}}", esc(C.tagline))
    .replace("{{CTA_TEXT}}", esc(C.ctaText))
    .replace("{{CTA_URL}}", C.ctaUrl ? `<div class="cta-url">${esc(C.ctaUrl)}</div>` : "")
    .replace("{{INVITE_LINK}}", esc(C.ctaUrl ? `${C.ctaUrl.replace(/\/$/, "")}/c/K7Q2MX` : "…/c/K7Q2MX"));
  const left = scenes.match(/\{\{[A-Z_0-9]+\}\}/);
  if (left) throw new Error(`unfilled placeholder ${left[0]}`);
  return `<!doctype html>
<!-- GENERATED by build.mjs from timing.js + src/ — edit those, then run: node build.mjs -->
<html lang="en" data-resolution="${fmt}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${esc(C.productName)} — launch video (${fmt === "portrait" ? "9:16" : "16:9"})</title>
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      html, body { width: ${W}px; height: ${H}px; }
${css}
    </style>
  </head>
  <body>
    <div id="root" class="fmt-${fmt}" data-format="${fmt}" data-composition-id="main" data-start="0" data-duration="${T.total}" data-fps="${T.fps}" data-width="${W}" data-height="${H}">
${scenes}
    ${AUDIO}
    </div>
    <script>
${timingJs}
    </script>
    <script>
${mainJs}
    </script>
  </body>
</html>
`;
}

// 16:9 lives here; 9:16 is its own tiny project in vertical/ (HyperFrames
// wants exactly one root composition per project). It shares ../assets via a
// link made here (a junction on Windows), so nothing is duplicated.
writeFileSync(join(DIR, "index.html"), compose("landscape"));
const VDIR = join(DIR, "vertical");
mkdirSync(VDIR, { recursive: true });
writeFileSync(join(VDIR, "index.html"), compose("portrait"));
const VASSETS = join(VDIR, "assets");
let linked = false;
try { linked = statSync(VASSETS).isDirectory(); } catch {}
if (!linked) {
  try { unlinkSync(VASSETS); } catch {} // a stale link, or a plain file from a symlink-less checkout
  if (process.platform === "win32") symlinkSync(join(DIR, "assets"), VASSETS, "junction");
  else symlinkSync("../assets", VASSETS, "dir");
}
mkdirSync(join(DIR, "..", "out"), { recursive: true }); // where npm run render writes the MP4s
for (const f of ["hyperframes.json", "meta.json"]) {
  if (!existsSync(join(VDIR, f))) {
    const j = JSON.parse(read(f));
    if (f === "meta.json") { j.id = "launch-video-vertical"; j.name = "launch-video-vertical"; }
    writeFileSync(join(VDIR, f), JSON.stringify(j, null, 2) + "\n");
  }
}
if (existsSync(join(DIR, "vertical.html"))) unlinkSync(join(DIR, "vertical.html"));
console.log(`built index.html (1920×1080) + vertical/index.html (1080×1920) — ${T.total}s @ ${T.fps}fps, ${AUDIO.split("<audio").length - 1} audio clips`);
