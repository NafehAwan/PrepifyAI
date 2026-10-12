// =============================================================================
//  PREPIFY AI — UGC-STYLE AD (9:16, faceless "screen recording" + captions)
//  Everything for the ad lives here. Times are seconds from the start.
//  After editing run:  npm run build   (then npm run render:ugc)
//
//  Each voice line is spoken by Kokoro (cached in assets/vo/). `caption` is
//  what appears on screen, word by word; it can differ from the spoken text.
// =============================================================================

globalThis.LAUNCH = globalThis.LAUNCH || {};
globalThis.LAUNCH.ugc = {
  total: 22.3,
  fps: 30,

  // the song from video-reference/, low under the voice (placeholder if absent)
  musicFrom: 15.2,     // start on the song's drop, so it has energy from frame 1
  musicVolume: 0.3,
  tapVolume: 0.3,      // soft click on every tap; 0 for none

  voice: "af_heart",
  speed: 1.15,
  lines: [
    { at: 0.15, text: "Class 9 boards are coming, and MCQs keep eating your marks?",
      caption: "Class 9 boards are coming and MCQs keep eating your marks? 😭" },
    { at: 3.8, text: "Okay, try this. It's called Prepify, and it's free.",
      caption: "okay try this. it's called Prepify and it's FREE" },
    { at: 6.65, text: "Pick the chapters you're weak in, how many questions, and how hard.",
      caption: "pick your weak chapters, how many questions, how hard" },
    { at: 10.1, text: "You get real board-style MCQs,",
      caption: "you get real board-style MCQs" },
    { at: 12.15, text: "and it marks you the second you submit, with every right answer.",
      caption: "and it marks you the second you submit, with every right answer" },
    { at: 15.3, text: "Then send your friends a code, and see who actually studied.",
      caption: "then send your friends a code and see who actually studied 👀",
      captionTop: 1450 },  // below the seat list on the challenge screen
    { at: 18.25, text: "Prepify A I dot vercel dot app. Go try it.",
      caption: "prepifyaii.vercel.app go try it" },
  ],

  // what happens on screen
  t: {
    hookEnd: 3.75,      // the dimmed "My Subjects" screen clears
    physicsTap: 5.7,
    newTestIn: 5.85,
    chapterTap: 7.4,
    scroll: 7.75,
    countTap: 8.5,
    hardTap: 9.35,
    startTap: 10.1,
    testIn: 10.85,
    inertiaTap: 11.5,
    submitTap: 12.3,
    resultsIn: 12.45,
    countUp: 12.7,
    remark: 13.85,
    reviewScroll: 14.6,
    challengeIn: 15.3,
    join1: 15.9,
    join2: 16.7,
    ready: 17.45,
    endCard: 18.2,
  },
};
