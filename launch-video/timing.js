// =============================================================================
//  PREPIFY AI — LAUNCH VIDEO: TIMING & COPY
//  This is the ONE place to change the video. Every time below is in seconds
//  from the start of the video. After editing, run:   npm run build
//  (it rebuilds index.html = 16:9 and vertical/index.html = 9:16, sounds included).
//
//  ♪ = locked to a beat of the music in video-reference/ (106 BPM, starting
//      musicFrom seconds into the song). Its two drops land on the product
//      reveal (3.18s) and the end card (25.75s). New song? Re-time freely.
// =============================================================================

globalThis.LAUNCH = {
  // ---------------------------------------------------------------------------
  //  COPY & LINKS
  // ---------------------------------------------------------------------------
  config: {
    productName: "Prepify AI",
    hook: { lead: "Ace your Class 9 ", keyword: "boards" },
    headline: { line1: "Real board questions.", line2Lead: "Marked ", line2Keyword: "instantly." },
    tagline: "Real board questions. Real results.",
    ctaText: "Start practising free",
    // Your website, e.g. "yourdomain.com". Shown under the button; hidden while empty.
    ctaUrl: "prepifyaii.vercel.app",
    // MUSIC SLOT — ../video-reference/music.(mp3|m4a|wav) is used from
    // musicFrom seconds in (never committed). Without it, this placeholder
    // plays: "Happy Beats / Business Moves vol. 11" from ende.app.
    music: "assets/music/placeholder-happy-beats-vol-11.mp3",
    musicFrom: 12.02,   // seconds into your track where the video starts
    musicVolume: 0.75,  // the export is then mastered to -14 LUFS (master.mjs)
    sfxVolume: 0.6,     // scales every click/whoosh; 0 = song + voice only

    // VOICE-OVER — spoken locally by Kokoro (npx hyperframes tts), cached in
    // assets/vo/. Change a line or the voice and `npm run build` re-speaks it.
    // Voices: af_heart, af_nova, af_sky, am_adam, am_michael, bf_emma, bm_george…
    voiceover: {
      enabled: true,
      voice: "af_heart",
      speed: 1.12,
      volume: 1,
      duck: 0.4,         // music level under the voice (share of musicVolume)
      lines: [
        { at: 0.35, text: "Ace your Class 9 boards." },
        { at: 3.45, text: "Meet Prepify A I." },
        { at: 6.6, text: "Build a board-style test in seconds." },
        { at: 10.65, text: "Real board questions. Marked instantly." },
        { at: 15.45, text: "See your score the moment you submit." },
        { at: 18.4, text: "Challenge your friends," },
        { at: 21.3, text: "and climb the leaderboard." },
        { at: 23.75, text: "Nearly four thousand practice questions." },
        { at: 26.85, text: "Prepify A I. Start practising free." },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  //  SCENES (start → end) and the moments inside them
  // ---------------------------------------------------------------------------
  timing: {
    total: 29.0,
    fps: 30,

    // 1. Hook — typewriter headline, cursor clicks the keyword
    hook: {
      start: 0.0,
      typeStart: 0.25,
      charStep: 0.03,     // seconds per typed character
      dimOthersAt: 2.15,  // every word except the keyword blurs away
      cursorAt: 2.05,     // cursor starts gliding to the keyword
      clickAt: 2.72,
      zoomAt: 2.8,        // keyword zooms through the camera
      end: 3.25,
    },

    // 2. Product reveal — the app window swings in, subject cards drop in
    reveal: {
      start: 3.1,
      windowAt: 3.18,     // ♪ first drop
      cardsAt: 3.85,
      cardStagger: 0.1,
      captionAt: 3.95,
      captionOut: 6.05,
      end: 6.3,
    },

    // 3. Build a test — cursor picks chapter, count and difficulty
    build: {
      start: 5.8,
      cursorAt: 5.85,
      subjectClickAt: 6.34,
      screenAt: 6.42,       // My Subjects → New Test
      cameraAt: 6.45,
      captionAt: 6.65,
      captionOut: 8.75,
      chapterClickAt: 7.3,
      scrollAt: 7.42,
      countClickAt: 7.9,
      hardClickAt: 8.44,
      end: 8.85,
    },

    // 4. Start → the button becomes a "✓ Test #04 ready" toast
    start: {
      start: 8.6,
      scrollAt: 8.6,
      clickAt: 9.36,        // ♪
      toastAt: 9.42,
      exitAt: 10.3,
      end: 10.75,
    },

    // 5. Typewriter headline between features
    headline: {
      start: 10.45,
      typeStart: 10.62,
      charStep: 0.02,
      exitAt: 12.95,
      end: 13.35,
    },

    // 6. A real board question — pick an answer, submit
    question: {
      start: 13.05,
      windowAt: 13.08,
      cursorAt: 13.75,
      pickAt: 14.22,
      submitClickAt: 15.0,
      end: 15.45,
    },

    // 7. Instant result — score counts up, remark pops
    results: {
      start: 15.3,
      screenAt: 15.32,
      countAt: 15.62,
      countDur: 1.15,
      remarkAt: 16.71,      // ♪
      end: 18.25,
    },

    // 8. Challenge friends — players join, toasts slide in, countdown
    challenge: {
      start: 18.15,
      screenAt: 18.2,
      captionAt: 18.4,
      captionOut: 20.95,
      join1At: 18.6,
      ready1At: 19.15,
      join2At: 19.53,       // ♪
      ready2At: 20.1,       // ♪
      countdownAt: 20.54,
      end: 21.15,
    },

    // 9. Leaderboard — rows drop in, camera pushes into your row
    board: {
      start: 21.05,
      screenAt: 21.1,
      captionAt: 21.3,
      captionOut: 23.45,
      rowsAt: 21.59,
      rowStagger: 0.1,
      pushAt: 22.65,
      end: 23.7,
    },

    // 10. Stats — three cards drop in and count up
    stats: {
      start: 23.62,
      cardsAt: 23.7,
      cardStagger: 0.53,
      countDur: 0.85,
      end: 25.8,
    },

    // 11. Outro — bar grows, becomes the logo, wordmark types, CTA
    outro: {
      start: 25.7,
      barAt: 25.75,         // ♪ second drop
      morphAt: 26.31,       // ♪ logo lands
      wordAt: 26.85,
      taglineAt: 27.44,     // ♪
      ctaAt: 28.01,         // ♪
      musicFadeAt: 27.6,
    },
  },
};

// -----------------------------------------------------------------------------
//  SOUND CUES — derived from the times above, so moving a moment moves its
//  sound too. file: assets/sfx/…   vol: 0–1
// -----------------------------------------------------------------------------
globalThis.LAUNCH.sfx = (T, C) => {
  const cues = [];
  const g = C.sfxVolume ?? 1;
  const add = (file, at, vol) => { if (g > 0) cues.push({ file, at: Math.round(at * 1000) / 1000, vol: Math.round(vol * g * 100) / 100 }); };

  // hook: soft key ticks on every 3rd typed character, click, whoosh
  const hookLen = (C.hook.lead + C.hook.keyword).length;
  const keys = ["key-001.wav", "key-004.wav", "key-007.wav", "key-010.wav"];
  for (let i = 0, k = 0; i < hookLen; i += 4, k++) add(keys[k % 4], T.hook.typeStart + i * T.hook.charStep, 0.22);
  add("click.ogg", T.hook.clickAt, 0.5);
  add("whoosh.wav", T.hook.zoomAt, 0.55);

  // reveal: window swing-in, first and last subject card
  add("whoosh-soft.wav", T.reveal.windowAt, 0.5);
  add("drop-1.ogg", T.reveal.cardsAt, 0.45);
  add("drop-2.ogg", T.reveal.cardsAt + 4 * T.reveal.cardStagger, 0.4);

  // build: clicks
  add("click.ogg", T.build.subjectClickAt, 0.5);
  add("whoosh-soft.wav", T.build.cameraAt, 0.35);
  add("click.ogg", T.build.chapterClickAt, 0.5);
  add("click.ogg", T.build.countClickAt, 0.5);
  add("click.ogg", T.build.hardClickAt, 0.5);

  // start: click → toast
  add("click.ogg", T.start.clickAt, 0.55);
  add("toast.ogg", T.start.toastAt, 0.55);
  add("whoosh.wav", T.start.exitAt, 0.45);

  // headline: sparse key ticks
  const headLen = (C.headline.line1 + C.headline.line2Lead + C.headline.line2Keyword).length;
  for (let i = 0, k = 0; i < headLen; i += 6, k++) add(keys[(k + 1) % 4], T.headline.typeStart + i * T.headline.charStep, 0.18);

  // question + results
  add("whoosh-soft.wav", T.question.windowAt, 0.4);
  add("click.ogg", T.question.pickAt, 0.5);
  add("click.ogg", T.question.submitClickAt, 0.5);
  add("chime.ogg", T.results.remarkAt, 0.32);

  // challenge
  add("toast.ogg", T.challenge.join1At, 0.5);
  add("toast.ogg", T.challenge.join2At, 0.5);
  add("drop-1.ogg", T.challenge.countdownAt, 0.5);

  // leaderboard + stats
  add("drop-1.ogg", T.board.rowsAt, 0.45);
  add("drop-2.ogg", T.board.rowsAt + 4 * T.board.rowStagger, 0.4);
  add("whoosh-soft.wav", T.board.pushAt, 0.35);
  for (let i = 0; i < 3; i++) add(i === 2 ? "drop-2.ogg" : "drop-1.ogg", T.stats.cardsAt + i * T.stats.cardStagger, 0.45);

  // outro: bar, logo chime
  add("whoosh-soft.wav", T.outro.barAt, 0.4);
  add("chime.ogg", T.outro.morphAt, 0.45);
  add("toast.ogg", T.outro.ctaAt, 0.45);
  return cues;
};
