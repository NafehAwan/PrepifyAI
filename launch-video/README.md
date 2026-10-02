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

Drop your track at `../video-reference/music.mp3` (that is
`PrepifyAI/video-reference/music.mp3`) and run `npm run build`. It is copied
in and used automatically, fading in over the first 0.5 s and out over the
last 1.4 s (`musicFadeAt` in `timing.js`).

Until then a placeholder plays: "Happy Beats / Business Moves vol. 11" from
[ende.app](https://ende.app/en). **Check that track's licence before
publishing**, or use your own. Moments marked ♪ in `timing.js` are locked to
the placeholder's beats; with your own track, move them freely.

Sound effects are CC0: [Kenney.nl](https://kenney.nl/) clicks and drops, and
keypresses from "Keyboard Soundpack #1" by unicae_games. The two whooshes were
generated from filtered noise.

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
