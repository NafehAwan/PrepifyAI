#!/usr/bin/env node
// Loudness-masters rendered MP4s for social platforms: two-pass EBU R128
// normalisation to -14 LUFS with a -2 dBTP ceiling (headroom for the AAC
// encoder's overshoot). The video stream is copied untouched; only the audio
// is re-encoded (AAC 192k, 48 kHz) and trimmed back to the video's length.
// The render scripts in package.json run this automatically.
// Usage: node master.mjs <file.mp4> [more.mp4 ...]   (needs ffmpeg on PATH)

import { spawnSync } from "node:child_process";
import { existsSync, renameSync, unlinkSync } from "node:fs";

const TARGET = "I=-14:TP=-2:LRA=11";

function ffmpeg(args) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8", maxBuffer: 64 << 20 });
  if (r.error) throw new Error(`ffmpeg not found (${r.error.message}); install ffmpeg to master the audio`);
  if (r.status !== 0) throw new Error(`ffmpeg failed:\n${r.stderr.slice(-2000)}`);
  return r.stderr;
}

function videoSeconds(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  const s = parseFloat(r.stdout);
  if (r.status !== 0 || !(s > 0)) throw new Error(`ffprobe could not read the video duration of ${file}`);
  return s;
}

// loudnorm prints its measurement as the last JSON object on stderr
function measure(file) {
  const log = ffmpeg(["-i", file, "-map", "0:a", "-af", `loudnorm=${TARGET}:print_format=json`, "-f", "null", "-"]);
  return JSON.parse(log.slice(log.lastIndexOf("{"), log.lastIndexOf("}") + 1));
}

const files = process.argv.slice(2);
if (!files.length) { console.error("usage: node master.mjs <file.mp4> [more.mp4 ...]"); process.exit(1); }

for (const file of files) {
  if (!existsSync(file)) { console.error(`master: ${file} not found`); process.exit(1); }
  const m = measure(file);
  const samples = Math.round(videoSeconds(file) * 48000); // loudnorm pads the tail; trim it back
  const af = `loudnorm=${TARGET}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}` +
    `:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000,atrim=end_sample=${samples}`;
  const tmp = file.replace(/\.mp4$/i, "") + ".mastering.mp4";
  try {
    ffmpeg(["-y", "-i", file, "-map", "0:v", "-map", "0:a", "-c:v", "copy", "-af", af,
      "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", tmp]);
    renameSync(tmp, file);
  } catch (e) {
    if (existsSync(tmp)) unlinkSync(tmp);
    throw e;
  }
  const out = measure(file);
  console.log(`mastered ${file}: ${m.input_i} → ${out.input_i} LUFS, true peak ${out.input_tp} dBTP`);
}
