// =============================================================================
//  Prepify AI launch video — the timeline. All times come from timing.js
//  (globalThis.LAUNCH.timing); nothing below hard-codes when things happen.
//  One paused GSAP timeline, registered as window.__timelines.main.
// =============================================================================
(function () {
  const L = globalThis.LAUNCH;
  const T = L.timing;
  const root = document.getElementById("root");
  const P = root.dataset.format === "portrait";
  const CW = P ? 1080 : 1920; // canvas
  const CH = P ? 1920 : 1080;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // Layout position of an element relative to an ancestor, from the offset
  // chain (ignores transforms, so it is stable whatever the camera does).
  function rel(el, anc) {
    let x = 0, y = 0, n = el;
    while (n && n !== anc) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }
  function mid(el, anc) { const r = rel(el, anc); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }

  function build() {
    const tl = gsap.timeline({ paused: true });

    const win = $("#win"), rig = $("#rig"), lens = $("#lens");
    const WW = win.offsetWidth, WH = win.offsetHeight;
    const BASE = P ? 1.6 : 1.0;      // window size on screen
    const RIG_Y = P ? 110 : 18;      // portrait: phone sits lower, captions above
    const CUR_K = P ? 0.78 : 1;      // cursor size on screen ≈ CUR_K × 50px at any zoom

    // ------------------------------------------------------------- helpers
    const fadeIn = (sel, at, d = 0.4, extra = {}) =>
      tl.fromTo(sel, { opacity: 0, ...extra.from }, { opacity: 1, duration: d, ease: "power2.out", ...extra.to }, at);

    // Blur in on its own non-overshooting tween. Never put a blur on a back.out
    // ease: it overshoots below 0, blur(<0px) is invalid CSS, and the browser
    // then holds the last positive blur until the tween ends.
    function unblur(target, at, px, dur = 0.3) {
      tl.fromTo(target, { filter: `blur(${px}px)` }, { filter: "blur(0px)", duration: dur, ease: "power2.out" }, at);
      tl.set(target, { filter: "none" }, at + dur + 0.02);
    }

    // blink a caret (deterministic square wave) between two times
    function blink(caret, from, to) {
      let on = true;
      for (let t = from; t < to - 0.01; t += 0.27, on = !on) tl.set(caret, { opacity: on ? 1 : 0 }, t);
    }

    // typewriter with a motion-blur reveal per character + following caret
    function typewrite(container, start, step, opts = {}) {
      const line = container.querySelector(".type-line");
      const chars = Array.from(line.querySelectorAll(".ch"));
      const caret = line.querySelector(".caret");
      const fs = parseFloat(getComputedStyle(line).fontSize);
      const ch = Math.round(fs * 0.92);
      gsap.set(caret, { height: ch });
      const at = (i) => start + i * step;
      const idx = (c) => Number(c.dataset.i);
      const caretPos = (c, after) => ({ x: c.offsetLeft + (after ? c.offsetWidth : 0) + (after ? 6 : -10), y: c.offsetTop + (c.offsetHeight - ch) / 2 });
      // caret waits at the start, blinking
      tl.set(caret, { ...caretPos(chars[0], false), opacity: 0 }, 0);
      blink(caret, start - 0.55, start);
      let kwSeen = false;
      chars.forEach((c) => {
        const t = at(idx(c));
        tl.fromTo(c, { opacity: 0, filter: "blur(12px)", x: -10 }, { opacity: 1, filter: "blur(0px)", x: 0, duration: 0.24, ease: "power2.out" }, t);
        tl.set(c, { filter: "none" }, t + 0.25);
        tl.set(caret, { ...caretPos(c, true), opacity: 1 }, t);
        if (c.classList.contains("kw") && !kwSeen) { kwSeen = true; tl.set(caret, { backgroundColor: "#c67139" }, t); }
      });
      tl.set(caret, { backgroundColor: "#201e1d" }, 0);
      const done = at(idx(chars[chars.length - 1]) + 1);
      blink(caret, done + 0.2, opts.caretUntil ?? done + 1);
      tl.set(caret, { opacity: 0 }, opts.caretUntil ?? done + 1);
      return { done, chars };
    }

    // ---- camera: #rig tilts/floats the window, #lens zooms to a focal point
    let lensS = 1;
    function lensTo(at, f, s, dur = 0.9, ease = "power3.inOut") {
      tl.to(lens, { x: WW / 2 - f.x * s, y: WH / 2 - f.y * s, scale: s, duration: dur, ease }, at);
      tl.to("#app-cursor-scale", { scale: CUR_K / s, duration: dur, ease }, at);
      lensS = s;
    }
    function lensSet(at, f, s) {
      tl.set(lens, { x: WW / 2 - f.x * s, y: WH / 2 - f.y * s, scale: s }, at);
      tl.set("#app-cursor-scale", { scale: CUR_K / s }, at);
      lensS = s;
    }
    function rigTo(at, o, dur = 0.9, ease = "power3.inOut") {
      const v = {};
      if (o.rx !== undefined) v.rotationX = o.rx;
      if (o.ry !== undefined) v.rotationY = o.ry;
      if (o.rz !== undefined) v.rotationZ = o.rz;
      if (o.x !== undefined) v.x = o.x;
      if (o.y !== undefined) v.y = RIG_Y + o.y;
      if (o.sc !== undefined) v.scale = BASE * o.sc;
      if (o.blur !== undefined) v.filter = `blur(${o.blur}px)`;
      if (o.blur > 0) tl.set(rig, { filter: "blur(0px)" }, at);
      tl.to(rig, { ...v, duration: dur, ease }, at);
      if (o.blur === 0) tl.set(rig, { filter: "none" }, at + dur);
    }

    // focal points in window space (subtract the screen's scroll)
    const fp = (el, scroll = 0, dx = 0, dy = 0) => { const m = mid(typeof el === "string" ? $(el) : el, win); return { x: m.x + dx, y: m.y - scroll + dy }; };

    // ---- in-app cursor (window space, so it follows the camera)
    const cur = $("#app-cursor");
    function curShow(at, p) { tl.set(cur, { x: p.x, y: p.y }, at); tl.to(cur, { opacity: 1, duration: 0.25, ease: "power2.out" }, at); }
    function curMove(at, p, dur = 0.45, ease = "power3.inOut") { tl.to(cur, { x: p.x, y: p.y, duration: dur, ease }, at); }
    function curHide(at) { tl.to(cur, { opacity: 0, duration: 0.25, ease: "power2.in" }, at); }
    function click(at, target) {
      tl.to("#app-cursor .cursor-svg", { scale: 0.8, duration: 0.07, ease: "power2.in", yoyo: true, repeat: 1 }, at);
      if (target) tl.to(target, { scale: 0.95, duration: 0.07, ease: "power2.in", yoyo: true, repeat: 1 }, at);
      tl.fromTo("#app-ripple", { scale: 0.25, opacity: 0.95 }, { scale: 2.8, opacity: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, at + 0.02);
    }

    // ---- screens inside the window
    function swap(at, from, to) {
      tl.set(`#scr-${from}`, { filter: "blur(0px)" }, at);
      tl.to(`#scr-${from}`, { autoAlpha: 0, filter: "blur(8px)", scale: 0.985, duration: 0.3, ease: "power2.in" }, at);
      tl.fromTo(`#scr-${to}`, { autoAlpha: 0, filter: "blur(10px)", y: 18, scale: 1 }, { autoAlpha: 1, filter: "blur(0px)", y: 0, duration: 0.45, ease: "power3.out", immediateRender: false }, at + 0.12);
      tl.set(`#scr-${to}`, { filter: "none" }, at + 0.58);
      tl.to(`#tb-${from}`, { opacity: 0, duration: 0.22 }, at);
      tl.fromTo(`#tb-${to}`, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", immediateRender: false }, at + 0.14);
    }
    function showScreen(at, id) { tl.set(`#scr-${id}`, { autoAlpha: 1, filter: "blur(0px)", y: 0, scale: 1 }, at); tl.set(`#tb-${id}`, { opacity: 1, y: 0 }, at); }
    function hideScreen(at, id) { tl.set(`#scr-${id}`, { autoAlpha: 0 }, at); tl.set(`#tb-${id}`, { opacity: 0 }, at); }

    // ---- captions & counters
    function caption(sel, inAt, outAt) {
      tl.fromTo(sel, { opacity: 0, y: 28, filter: "blur(14px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out" }, inAt);
      tl.to(sel, { opacity: 0, y: -16, filter: "blur(12px)", duration: 0.4, ease: "power2.in" }, outAt);
    }
    function countUp(el, to, at, dur, sep = true) {
      const st = { v: 0 };
      tl.to(st, { v: to, duration: dur, ease: "power2.out", onUpdate: () => { const n = Math.round(st.v); el.textContent = sep ? n.toLocaleString("en-US") : String(n); } }, at);
    }
    function select(at, onSel, offSel) {
      if (onSel) tl.to(onSel, { opacity: 1, duration: 0.18, ease: "power2.out" }, at);
      if (offSel) tl.to(offSel, { opacity: 0, duration: 0.18, ease: "power2.out" }, at);
    }

    // =====================================================================
    //  INITIAL STATE (t = 0)
    // =====================================================================
    tl.set(lens, { x: 0, y: 0, scale: 1, transformOrigin: "0 0" }, 0);
    tl.set(rig, { x: 0, y: RIG_Y, scale: BASE, rotationX: 0, rotationY: 0, rotationZ: 0, filter: "none" }, 0);
    tl.set("#app-cursor-scale", { scale: CUR_K }, 0);
    tl.set("#preset-15 span", { color: "#ffffff" }, 0);
    tl.set("#level-mixed .lt", { color: "#8f4a20" }, 0);
    const track = $(".track");
    const TW = track.offsetWidth;
    tl.set("#count-fill", { scaleX: 15 / 30 }, 0);
    tl.set("#count-knob", { x: TW * (15 / 30) }, 0);
    tl.set("#nav-subjects .nav-on", { opacity: 1 }, 0);
    tl.set("#nav-subjects", { color: "#ffffff" }, 0);

    // =====================================================================
    //  BACKGROUND — blobs bloom after the hook, then drift all video long
    // =====================================================================
    const blobs = $$(".blob");
    const drift = P
      ? [[140, 180, 1.12], [-160, -200, 1.1], [-120, 160, 1.08], [150, -140, 1.1]]
      : [[220, 120, 1.12], [-200, -90, 1.1], [-160, 110, 1.08], [180, -100, 1.1]];
    blobs.forEach((b, i) => tl.fromTo(b, { x: 0, y: 0, scale: 1 }, { x: drift[i][0], y: drift[i][1], scale: drift[i][2], duration: T.total, ease: "sine.inOut" }, 0));
    tl.fromTo(blobs, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: "sine.out", stagger: 0.08 }, T.hook.zoomAt - 0.05);
    tl.to(blobs, { opacity: 0.55, duration: 0.6, ease: "sine.inOut" }, T.headline.start);   // calmer behind the headline
    tl.to(blobs, { opacity: 1, duration: 0.6, ease: "sine.inOut" }, T.question.start);
    tl.to(blobs, { opacity: 0.4, duration: 0.8, ease: "sine.inOut" }, T.outro.start);      // clean end card

    // =====================================================================
    //  1. HOOK — "Ace your Class 9 boards"
    // =====================================================================
    const H = T.hook;
    typewrite($("#hook"), H.typeStart, H.charStep, { caretUntil: H.dimOthersAt });
    // every word but the keyword blurs away
    tl.fromTo("#hook .word.other", { opacity: 1, filter: "blur(0px)", x: 0 }, { opacity: 0, filter: "blur(16px)", x: -26, duration: 0.45, ease: "power2.in", stagger: 0.03, immediateRender: false }, H.dimOthersAt);
    // the cursor glides in and clicks the keyword
    const kw = $("#hook-kw");
    const kwC = mid(kw, root);
    const hc = $("#hook-cursor");
    tl.set(hc, { x: CW * 0.86, y: CH * 1.04 }, 0);
    tl.to(hc, { opacity: 1, duration: 0.2 }, H.cursorAt);
    tl.to(hc, { x: kwC.x + 14, y: kwC.y + 22, duration: H.clickAt - H.cursorAt - 0.06, ease: "power3.out" }, H.cursorAt);
    tl.to("#hook-cursor .cursor-svg", { scale: 0.8, duration: 0.07, ease: "power2.in", yoyo: true, repeat: 1 }, H.clickAt);
    tl.to(kw, { scale: 0.94, duration: 0.06, ease: "power2.in", yoyo: true, repeat: 1 }, H.clickAt);
    tl.fromTo("#hook-ripple", { scale: 0.25, opacity: 0.95 }, { scale: 2.6, opacity: 0, duration: 0.55, ease: "power2.out" }, H.clickAt + 0.02);
    // zoom through the keyword into the product
    const zoomAt = Math.max(H.zoomAt, H.clickAt + 0.13);
    tl.to(kw, { scale: P ? 7 : 9, opacity: 0, duration: 0.5, ease: "power3.in" }, zoomAt);
    tl.fromTo(kw, { filter: "blur(0px)" }, { filter: "blur(18px)", duration: 0.5, ease: "power3.in", immediateRender: false }, zoomAt);
    tl.to(hc, { opacity: 0, duration: 0.2 }, zoomAt);

    // =====================================================================
    //  2. REVEAL — the window swings in; subject cards drop in
    // =====================================================================
    const R = T.reveal;
    showScreen(R.start, "subjects");
    tl.fromTo("#stage", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power2.out" }, R.windowAt - 0.04);
    tl.fromTo(rig,
      { x: 0, y: RIG_Y + (P ? 760 : 560), rotationX: 44, rotationY: P ? 16 : -26, rotationZ: P ? -5 : 5, scale: BASE * 0.76, filter: "blur(16px)" },
      { x: 0, y: RIG_Y, rotationX: 14, rotationY: P ? 10 : -16, rotationZ: 0, scale: BASE * 0.9, filter: "blur(0px)", duration: 1.0, ease: "expo.out", immediateRender: false },
      R.windowAt); // ♪ beat-locked: 3.18s
    tl.set(rig, { filter: "none" }, R.windowAt + 1.0);
    // slow push-in while the cards land
    rigTo(R.windowAt + 1.0, { rx: 8, ry: P ? 6 : -9, sc: 0.97, y: -6 }, T.build.cameraAt - (R.windowAt + 1.0), "sine.inOut");
    $$("#scr-subjects .subj").forEach((c, i) => {
      const at = R.cardsAt + i * R.cardStagger;
      tl.fromTo(c, { y: -50, opacity: 0, scale: 0.93 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)" }, at);
      unblur(c, at, 6);
    });
    caption("#cap-meet", R.captionAt, R.captionOut);

    // =====================================================================
    //  3. BUILD A TEST — subject → chapter → 25 → Hard
    // =====================================================================
    const B = T.build;
    const pPhys = fp("#subj-physics", 0, P ? 40 : 60, 4);
    curShow(B.cursorAt, P ? { x: WW * 0.82, y: WH * 0.62 } : { x: WW * 0.8, y: WH * 0.9 });
    curMove(B.cursorAt + 0.04, pPhys, B.subjectClickAt - B.cursorAt - 0.12, "power3.out");
    click(B.subjectClickAt, "#subj-physics");
    swap(B.screenAt, "subjects", "newtest");

    const scroller = $("#newtest-scroll");
    const viewH = $("#scr-newtest").offsetHeight;
    const chap3 = fp("#chap-3", 0, P ? 30 : 120);
    rigTo(B.cameraAt, { rx: 3, ry: P ? 2 : -4, sc: 1, y: 0 }, 0.85);
    lensTo(B.cameraAt, fp("#chap-3", 0, P ? 0 : 60, P ? -40 : -30), P ? 1.15 : 1.45, 0.85);
    caption("#cap-build", B.captionAt, B.captionOut);
    curMove(B.chapterClickAt - 0.38, chap3, 0.34);
    click(B.chapterClickAt, "#chap-3");
    select(B.chapterClickAt + 0.04, "#chap-3 .sel-fill, #chap-3 .check .on", "#chap-whole .sel-fill, #chap-whole .check .on");
    const sumTo = (i, at) => { tl.to(`#sum-${i - 1}`, { opacity: 0, duration: 0.15 }, at); tl.to(`#sum-${i}`, { opacity: 1, duration: 0.15 }, at); };
    sumTo(1, B.chapterClickAt + 0.04);  // "… · Chapter 3"

    // scroll down to count + difficulty
    const countCard = $("#count-card"), levelCard = $("#level-card");
    const rCount = rel(countCard, scroller), rLevel = rel(levelCard, scroller);
    const scroll1 = Math.max(0, rCount.y - (P ? 20 : 40));
    tl.to(scroller, { y: -scroll1, duration: 0.5, ease: "power2.inOut" }, B.scrollAt);
    const pairMid = { x: rCount.x + rCount.w / 2, y: (rCount.y + rLevel.y + rLevel.h) / 2 };
    const scrOff = rel($("#scr-newtest"), win); // screen origin in window space
    const pairFocus = { x: scrOff.x + pairMid.x + (P ? 0 : -25), y: scrOff.y + pairMid.y - scroll1 };
    lensTo(B.scrollAt, pairFocus, P ? 1.1 : 1.32, 0.6);
    const p25 = fp("#preset-25", scroll1);
    curMove(B.countClickAt - 0.36, p25, 0.32);
    click(B.countClickAt, "#preset-25");
    select(B.countClickAt + 0.04, "#preset-25 .sel-fill", "#preset-15 .sel-fill");
    tl.to("#preset-25 span", { color: "#ffffff", duration: 0.18 }, B.countClickAt + 0.04);
    tl.to("#preset-15 span", { color: "#5d5648", duration: 0.18 }, B.countClickAt + 0.04);
    tl.to("#count-fill", { scaleX: 25 / 30, duration: 0.4, ease: "power3.out" }, B.countClickAt + 0.04);
    tl.to("#count-knob", { x: TW * (25 / 30), duration: 0.4, ease: "power3.out" }, B.countClickAt + 0.04);
    tl.to("#count-15", { opacity: 0, y: -14, duration: 0.2 }, B.countClickAt + 0.04);
    tl.fromTo("#count-25", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, B.countClickAt + 0.1);
    sumTo(2, B.countClickAt + 0.04);    // "25 questions · …"

    const pHard = fp("#level-hard", scroll1);
    curMove(B.hardClickAt - 0.4, pHard, 0.36);
    click(B.hardClickAt, "#level-hard");
    select(B.hardClickAt + 0.04, "#level-hard .sel-fill", "#level-mixed .sel-fill");
    tl.to("#level-hard .lt", { color: "#8f4a20", duration: 0.18 }, B.hardClickAt + 0.04);
    tl.to("#level-mixed .lt", { color: "#201e1d", duration: 0.18 }, B.hardClickAt + 0.04);
    sumTo(3, B.hardClickAt + 0.04);     // "… · hard · …"

    // =====================================================================
    //  4. START → "✓ Test #04 ready"
    // =====================================================================
    const S = T.start;
    const startRow = $(".start-row");
    const rStart = rel(startRow, scroller);
    const scroll2 = Math.max(scroll1, rStart.y + rStart.h - viewH * (P ? 0.62 : 0.66));
    tl.to(scroller, { y: -scroll2, duration: 0.6, ease: "power2.inOut" }, S.scrollAt);
    const pBtn = fp("#start-btn", scroll2);
    lensTo(S.scrollAt, { x: pBtn.x + (P ? 70 : 110), y: pBtn.y - (P ? 12 : 34) }, P ? 1.35 : 1.75, 0.75);
    rigTo(S.scrollAt, { rx: 2, ry: P ? -3 : 3, sc: 1.0 }, 0.75);
    curMove(S.clickAt - 0.5, pBtn, 0.44);
    click(S.clickAt, "#start-btn"); // ♪ beat-locked: 9.50s
    tl.to("#start-btn", { opacity: 0, scale: 0.86, duration: 0.2, ease: "power2.in" }, S.toastAt);
    tl.fromTo("#toast-ready", { opacity: 0, scale: 0.62, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.8)" }, S.toastAt);
    tl.to(".start-sum", { opacity: 0, duration: 0.2, ease: "power2.in" }, S.toastAt); // the toast carries the summary now
    curHide(S.toastAt + 0.35);
    // fly out through the screen
    rigTo(S.exitAt, { sc: 1.14, blur: 16 }, 0.45, "power2.in");
    tl.to("#stage", { autoAlpha: 0, duration: 0.4, ease: "power2.in" }, S.exitAt + 0.05);

    // =====================================================================
    //  5. HEADLINE — "Real board questions. Marked instantly."
    // =====================================================================
    const HD = T.headline;
    const head = typewrite($("#headline"), HD.typeStart, HD.charStep, { caretUntil: HD.exitAt });
    tl.fromTo("#headline .word", { opacity: 1, filter: "blur(0px)", y: 0 }, { opacity: 0, filter: "blur(14px)", y: -18, duration: 0.4, ease: "power2.in", stagger: 0.025, immediateRender: false }, HD.exitAt);

    // =====================================================================
    //  6. QUESTION — pick Inertia, submit
    // =====================================================================
    const Q = T.question;
    hideScreen(Q.start - 0.2, "newtest");
    showScreen(Q.start - 0.2, "test");
    const tScroller = $("#test-scroll");
    const q3 = $("#q3");
    const rQ3 = rel(q3, tScroller), rSub = rel($(".submit-bar"), tScroller);
    const tView = $("#scr-test").offsetHeight;
    const tScroll = Math.max(0, rSub.y + rSub.h + 30 - tView);
    tl.set(tScroller, { y: -tScroll }, Q.start - 0.2);
    const pQ3 = fp(q3, tScroll);
    lensSet(Q.start - 0.2, { x: pQ3.x + (P ? 0 : -60), y: pQ3.y + (P ? 40 : -14) }, P ? 1.12 : 1.5);
    tl.set(rig, { x: 0, y: RIG_Y, scale: BASE * 1.16, rotationX: 7, rotationY: P ? -5 : -7, rotationZ: 0, filter: "blur(16px)" }, Q.start - 0.2);
    tl.to("#stage", { autoAlpha: 1, duration: 0.35, ease: "power2.out" }, Q.windowAt);
    rigTo(Q.windowAt, { sc: 1.0, blur: 0, rx: 4, ry: P ? -3 : -5 }, 0.75, "expo.out");
    // camera slides along the question while the student reads
    lensTo(Q.windowAt + 0.75, { x: pQ3.x + (P ? 0 : -50), y: pQ3.y + (P ? 40 : -14) }, P ? 1.16 : 1.56, Q.submitClickAt - 0.55 - (Q.windowAt + 0.75), "sine.inOut");
    const pIn = fp("#opt-inertia", tScroll);
    curShow(Q.cursorAt, P ? { x: WW * 0.86, y: pIn.y + 120 } : { x: pIn.x + 300, y: pIn.y + 150 });
    curMove(Q.cursorAt + 0.04, pIn, Q.pickAt - Q.cursorAt - 0.12, "power3.out");
    click(Q.pickAt, "#opt-inertia"); // ♪ 14.22s
    select(Q.pickAt + 0.04, "#opt-inertia .sel-fill, #opt-inertia .letter .on");
    const pSubmit = fp("#submit-btn", tScroll);
    lensTo(Q.submitClickAt - 0.55, { x: pSubmit.x + (P ? 60 : 181), y: pSubmit.y - (P ? 120 : 136) }, P ? 1.16 : 1.45, 0.55);
    curMove(Q.submitClickAt - 0.42, pSubmit, 0.38);
    click(Q.submitClickAt, "#submit-btn");
    curHide(Q.submitClickAt + 0.25);

    // =====================================================================
    //  7. RESULTS — 0 → 88%, "Very good"
    // =====================================================================
    const RS = T.results;
    swap(RS.screenAt, "test", "results");
    let pHero = fp("#res-hero", 0, 0, 60);
    if (!P) { // centre on the score card + answer review together
      const rH = rel($("#res-hero"), win), rR = rel($(".review"), win);
      pHero = { x: rH.x + rH.w / 2 + 13, y: (rH.y + rR.y + rR.h) / 2 + 13 };
    }
    lensTo(RS.screenAt + 0.05, pHero, P ? 1.08 : 1.85, 0.7);
    rigTo(RS.screenAt + 0.05, { rx: 5, ry: P ? 5 : 7, sc: 1.0 }, 0.7);
    lensTo(RS.screenAt + 0.75, pHero, P ? 1.12 : 1.92, RS.end - RS.screenAt - 0.8, "sine.inOut");
    countUp($("#res-pct"), 88, RS.countAt, RS.countDur, false);
    tl.fromTo("#res-remark", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2.2)" }, RS.remarkAt); // ♪ 16.86s
    tl.fromTo("#res-hero .mascot", { y: 0, rotation: 0 }, { y: -8, rotation: -4, duration: 0.42, ease: "sine.inOut", yoyo: true, repeat: 5 }, RS.countAt);

    // =====================================================================
    //  8. CHALLENGE — friends join, get ready, countdown
    // =====================================================================
    const CHL = T.challenge;
    swap(CHL.screenAt, "results", "challenge");
    const pSeats = P ? fp("#seats", 0, 0, -40) : { x: WW / 2, y: WH / 2 };
    lensTo(CHL.screenAt + 0.05, pSeats, P ? 1.05 : 1.16, 0.75);
    rigTo(CHL.screenAt + 0.05, { rx: 7, ry: P ? -6 : 9, sc: 1.0 }, 0.75);
    rigTo(CHL.screenAt + 0.8, { rx: 4, ry: P ? -3 : 5, sc: P ? 1.02 : 1.0 }, CHL.end - CHL.screenAt - 0.85, "sine.inOut");
    caption("#cap-challenge", CHL.captionAt, CHL.captionOut);
    const joinSeat = (n, at) => {
      tl.to(`#seat-${n}-empty`, { opacity: 0, duration: 0.25, ease: "power2.out" }, at);
      tl.fromTo(`#seat-${n} .av`, { scale: 0 }, { scale: 1, duration: 0.45, ease: "back.out(2)" }, at + 0.05);
      tl.fromTo(`#seat-${n} .who`, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, at + 0.08);
    };
    const swapText = (offSel, onSel, at) => {
      tl.to(offSel, { opacity: 0, y: -10, duration: 0.2 }, at);
      tl.fromTo(onSel, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, at + 0.06);
    };
    joinSeat(2, CHL.join1At);
    swapText("#joined-1", "#joined-2", CHL.join1At);
    tl.fromTo("#toast-1", P ? { opacity: 0, y: -70, filter: "blur(10px)" } : { opacity: 0, x: 130, filter: "blur(10px)" },
      { opacity: 1, x: 0, y: 0, filter: "blur(0px)", duration: 0.55, ease: "expo.out" }, CHL.join1At);
    swapText("#seat-2-no", "#seat-2-yes", CHL.ready1At);
    swapText("#ready-1", "#ready-2", CHL.ready1At);
    joinSeat(3, CHL.join2At); // ♪ 19.49s
    swapText("#joined-2", "#joined-3", CHL.join2At);
    swapText("#seat-3-no", "#seat-3-yes", CHL.ready2At); // ♪ 20.02s
    swapText("#ready-2", "#ready-3", CHL.ready2At);
    tl.to("#ready-stat", { backgroundColor: "#e6ead9", duration: 0.3 }, CHL.ready2At);
    tl.fromTo("#toast-2", P ? { opacity: 0, y: -70, filter: "blur(10px)" } : { opacity: 0, x: 130, filter: "blur(10px)" },
      { opacity: 1, x: 0, y: 0, filter: "blur(0px)", duration: 0.55, ease: "expo.out" }, CHL.ready2At);
    tl.to(["#toast-1", "#toast-2"], { opacity: 0, filter: "blur(10px)", duration: 0.35, ease: "power2.in", stagger: 0.06 }, CHL.countdownAt + 0.2);
    // countdown — "Everyone's ready — get set!"
    tl.fromTo("#countdown", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power2.out" }, CHL.countdownAt); // ♪ 20.54s
    tl.fromTo("#cd-3", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.2)" }, CHL.countdownAt + 0.05);
    tl.to("#cd-3", { opacity: 0, scale: 1.4, duration: 0.2, ease: "power2.in" }, CHL.countdownAt + 0.5);
    tl.fromTo("#cd-2", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.2)" }, CHL.countdownAt + 0.55);

    // =====================================================================
    //  9. LEADERBOARD — rows drop in, push into your row
    // =====================================================================
    const BD = T.board;
    swap(BD.screenAt, "challenge", "board");
    tl.to("#nav-subjects .nav-on", { opacity: 0, duration: 0.25 }, BD.screenAt);
    tl.to("#nav-subjects", { color: "#5d5648", duration: 0.25 }, BD.screenAt);
    tl.fromTo("#nav-board .nav-on", { opacity: 0 }, { opacity: 1, duration: 0.25 }, BD.screenAt);
    tl.fromTo("#nav-board", { color: "#5d5648" }, { color: "#ffffff", duration: 0.25 }, BD.screenAt);
    const pTable = fp(".table-card", 0, P ? 0 : 0, P ? -60 : -83);
    lensTo(BD.screenAt + 0.05, pTable, P ? 1.02 : 1.16, 0.75);
    rigTo(BD.screenAt + 0.05, { rx: 8, ry: P ? 6 : -10, sc: 1.0 }, 0.75);
    caption("#cap-board", BD.captionAt, BD.captionOut);
    countUp($("#me-xp"), 2315, BD.rowsAt, 0.9);
    $$("#scr-board .lrow").forEach((row, i) => {
      const at = BD.rowsAt + i * BD.rowStagger; // ♪ 21.59s
      tl.fromTo(row, { y: -34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "back.out(1.4)" }, at);
      unblur(row, at, 6);
      const xp = row.querySelector("[data-xp]");
      countUp(xp, Number(xp.dataset.xp), at + 0.05, 0.85);
    });
    const pMe = fp("#row-me", 0, P ? 30 : 84, 0);
    lensTo(BD.pushAt, pMe, P ? 1.45 : 1.9, 0.9); // ♪ 22.65s
    rigTo(BD.pushAt, { rx: 2, ry: P ? 2 : -3, sc: 1.0 }, 0.9);
    tl.to("#row-me .me-hl", { opacity: 1, duration: 0.4, ease: "power2.out" }, BD.pushAt + 0.1);

    // =====================================================================
    //  10. STATS — 3,953 MCQs · 54 chapters · 5 subjects
    // =====================================================================
    const ST = T.stats;
    rigTo(ST.start, { sc: 0.92, blur: 14 }, 0.55, "power2.inOut");
    tl.to("#stage", { autoAlpha: 0, duration: 0.45, ease: "power2.inOut" }, ST.start - 0.05);
    ["#stat-1", "#stat-2", "#stat-3"].forEach((id, i) => {
      const at = ST.cardsAt + i * ST.cardStagger; // ♪ 23.70 / 24.23 / 24.75
      tl.fromTo(id, { opacity: 0, y: -70, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.5)" }, at);
      unblur(id, at, 10, 0.35);
      const span = $(`${id} [data-to]`);
      countUp(span, Number(span.dataset.to), at + 0.08, ST.countDur, true);
    });
    tl.fromTo(["#stat-1", "#stat-2", "#stat-3"], { filter: "blur(0px)" }, { opacity: 0, y: -20, filter: "blur(12px)", duration: 0.4, ease: "power2.in", stagger: 0.05, immediateRender: false }, ST.end - 0.3);

    // =====================================================================
    //  11. OUTRO — bar grows → becomes the badge → wordmark → tagline → CTA
    // =====================================================================
    const O = T.outro;
    const outro = $("#outro");
    const badge = $("#badge");
    const bC = mid(badge, outro);
    const dx = CW / 2 - bC.x, dy = CH / 2 - bC.y; // badge starts dead centre
    tl.fromTo("#bar-grow", { opacity: 1, scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: "expo.out" }, O.barAt);
    tl.to("#bar-grow", { opacity: 0, duration: 0.12, ease: "none" }, O.morphAt + 0.02);
    tl.fromTo(badge, { opacity: 1, x: dx, y: dy, scaleX: 40 / 210, scaleY: 250 / 210 },
      { scaleX: 1, scaleY: 1, duration: 0.55, ease: "back.out(1.6)", immediateRender: false }, O.morphAt); // ♪ 26.33s
    tl.set(badge, { opacity: 0, x: dx, y: dy }, 0);
    tl.fromTo("#logo-glyph", { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)" }, O.morphAt + 0.2);
    tl.to(badge, { x: 0, y: 0, duration: 0.65, ease: "power3.inOut" }, O.wordAt);
    // The wordmark types out from behind the badge (it sits above in z-order).
    // In 16:9 the badge slides left across the word, so typing waits until it
    // has cleared the first letter; in 9:16 it rises out of the word's way.
    const wordStart = O.wordAt + (P ? 0.18 : 0.45);
    $$("#wordmark .ch").forEach((c, i) => {
      const at = wordStart + i * 0.05;
      tl.fromTo(c, { opacity: 0, filter: "blur(12px)", x: -14 }, { opacity: 1, filter: "blur(0px)", x: 0, duration: 0.3, ease: "power2.out" }, at);
      tl.set(c, { filter: "none" }, at + 0.32);
    });
    tl.fromTo("#tagline", { opacity: 0, y: 22, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55, ease: "power3.out" }, O.taglineAt); // ♪ 27.39s
    tl.fromTo("#cta", { opacity: 0, y: 18, scale: 0.86 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.8)" }, O.ctaAt); // ♪ 27.91s

    // register only once everything is on the timeline
    window.__timelines = window.__timelines || {};
    window.__timelines["main"] = tl;
    if (typeof window.__hfForceTimelineRebind === "function") window.__hfForceTimelineRebind();
  }

  document.fonts.ready.then(build);
})();
