# Prepify AI — launch video

A 29-second product launch video, built with [HyperFrames](https://hyperframes.heygen.com)
(HTML + GSAP, rendered to MP4). One source produces both cuts:

| Output | Size | Command |
| --- | --- | --- |
| `../out/launch-16x9.mp4` | 1920×1080, 30 fps | `npm run render` |
| `../out/launch-9x16.mp4` | 1080×1920, 30 fps | `npm run render:vertical` |

`npm run render:all` renders both. Each render is then loudness-mastered by
`master.mjs` to -14 LUFS (a common loudness target for social video),
with the picture copied untouched. `../out/` is git-ignored, so the MP4s are
never committed; re-render them from this folder at any time.

Needs Node 22+ and ffmpeg (the build measures the sound files with `ffprobe`,
and mastering uses `ffmpeg`).

## Changing the video

Everything you are likely to change lives in **`timing.js`**:

- **Copy** — hook, headline, tagline, call to action.
- **`ctaUrl`** — your website, shown under the button on the end card. It is
  empty for now, so the line is hidden. Set it, e.g. `ctaUrl: "yourdomain.com"`.
- **Timings** — every scene and moment, in seconds from the start. Sound
  effects are derived from these times, so they move with them.

After any edit run `npm run build`, then preview or render.

## Music

Put your song in `../video-reference/` as `music.mp3`, `music.m4a` or
`music.wav` (song files there are git-ignored, so it is never committed) and
run `npm run build`. The video uses it from `musicFrom` seconds in (see
`timing.js`). The current song is set to start at 12.02s so its two drops land
on the product reveal and on the end card. Moments marked ♪ in `timing.js`
sit on its beats.

With no song in the slot, a placeholder plays ("Happy Beats / Business Moves
vol. 11" from [ende.app](https://ende.app/en); check its licence before
publishing).

Clicks and whooshes are CC0 ([Kenney.nl](https://kenney.nl/) and "Keyboard
Soundpack #1" by unicae_games) plus two generated whooshes. `sfxVolume` in
`timing.js` scales them all; set it to 0 for song and voice only.

## Voice-over

`voiceover.lines` in `timing.js` is the script: each line has a start time and
text. The build speaks it with Kokoro, a free voice that runs locally through
`npx hyperframes tts` (the first run downloads ~27 MB; it needs Python with
`pip install kokoro-onnx soundfile`). Clips are cached in `assets/vo/`, so only
changed lines are re-spoken. The music dips under each line (`duck`). Change
`voice` or `speed`, or set `enabled: false` for no voice-over.

## UGC-style ad

`npm run render:ugc` makes `../out/prepify-ugc-ad-9x16.mp4`: a 22-second faceless ad that looks
like a screen recording of the app on a phone, with TikTok-style word-by-word captions, a
casual voice-over and the song low underneath. Its script, captions and timings live in
`ugc.timing.js`; the animation is `src/ugc.js` and the look `src/ugc.css`. Preview it with
`npm run dev:ugc`.

## Previewing and checking

```bash
npm run dev            # Studio preview of the 16:9 cut
npm run dev:vertical   # Studio preview of the 9:16 cut
npm run check          # lint, runtime, layout and contrast checks, both cuts
```

## Files

| Path | What it is |
| --- | --- |
| `timing.js` | Copy, links, music and every time in the video |
| `src/scenes.html.tpl` | Markup: the app screens rebuilt in HTML, captions, end card |
| `src/styles.css` | Brand tokens and layout for both formats |
| `src/main.js` | The animation: one GSAP timeline driven by `timing.js` |
| `build.mjs` | Generates `index.html` and `vertical/index.html` from the above |
| `master.mjs` | Brings a rendered MP4's audio to -14 LUFS (run by the render scripts) |
| `assets/` | Fonts (Figtree, Caprasimo), logo, mascot, music, sounds, GSAP |

`index.html` and `vertical/` are generated, so edit the sources and rebuild
instead. The app screens are rebuilt by hand from the real components, using
sample data; nothing is captured from the live site.
