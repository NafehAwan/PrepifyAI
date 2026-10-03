// =============================================================================
//  Prepify AI — UGC-style ad. A flat "screen recording" of the app on a phone
//  with TikTok-style captions. All times come from ugc.timing.js
//  (globalThis.LAUNCH.ugc). One paused GSAP timeline at window.__timelines.main.
// =============================================================================
(function () {
  const U = globalThis.LAUNCH.ugc;
  const T = U.t;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  function rel(el, anc) {
    let x = 0, y = 0, n = el;
    while (n && n !== anc) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }

  function build() {
    const tl = gsap.timeline({ paused: true });
    const win = $("#win"), rig = $("#rig"), lens = $("#lens");
    const WW = win.offsetWidth, WH = win.offsetHeight;
    const S = 1080 / WW; // the phone screen fills the frame edge to edge

    // ---- camera: flat and full screen, like a real screen recording
    tl.set(rig, { x: 0, y: 0, scale: S, rotationX: 0, rotationY: 0, rotationZ: 0 }, 0);
    tl.set(lens, { x: 0, y: 0, scale: 1, transformOrigin: "0 0" }, 0);

    // ---- a phone touch indicator, in window space so it follows punch-ins
    const dot = document.createElement("div");
    dot.id = "touch";
    lens.appendChild(dot);
    const center = (el, scroll = 0) => { const r = rel(typeof el === "string" ? $(el) : el, win); return { x: r.x + r.w / 2, y: r.y + r.h / 2 - scroll }; };
    function tap(at, el, scroll = 0) {
      const p = center(el, scroll);
      tl.set(dot, { x: p.x, y: p.y, scale: 1.25, opacity: 0 }, at - 0.12);
      tl.to(dot, { opacity: 1, scale: 1, duration: 0.1, ease: "power2.out" }, at - 0.12);
      tl.to(typeof el === "string" ? el : [el], { scale: 0.96, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.in" }, at);
      tl.to(dot, { opacity: 0, scale: 0.7, duration: 0.18, ease: "power2.in" }, at + 0.14);
    }

    // ---- screens: a quick app-style push between them
    const show = (at, id) => { tl.set(`#scr-${id}`, { autoAlpha: 1, x: 0 }, at); tl.set(`#tb-${id}`, { opacity: 1 }, at); };
    function go(at, from, to) {
      tl.to(`#scr-${from}`, { x: -40, autoAlpha: 0, duration: 0.18, ease: "power2.in" }, at);
      tl.fromTo(`#scr-${to}`, { x: 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.24, ease: "power3.out", immediateRender: false }, at + 0.06);
      tl.to(`#tb-${from}`, { opacity: 0, duration: 0.12 }, at);
      tl.fromTo(`#tb-${to}`, { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, at + 0.08);
    }
    const select = (at, on, off) => { if (on) tl.to(on, { opacity: 1, duration: 0.12 }, at); if (off) tl.to(off, { opacity: 0, duration: 0.12 }, at); };
    function countUp(el, to, at, dur) {
      const st = { v: 0 };
      tl.to(st, { v: to, duration: dur, ease: "power2.out", onUpdate: () => { el.textContent = String(Math.round(st.v)); } }, at);
    }

    // ---- initial app state
    tl.set("#preset-15 span", { color: "#ffffff" }, 0);
    tl.set("#level-mixed .lt", { color: "#8f4a20" }, 0);
    const TW = $(".track").offsetWidth;
    tl.set("#count-fill", { scaleX: 0.5 }, 0);
    tl.set("#count-knob", { x: TW * 0.5 }, 0);
    show(0, "subjects");

    // ---- 1. hook: My Subjects, dimmed under a big caption
    // the hook caption sits on a dark backdrop; the app fades in after it
    tl.set("#stage", { autoAlpha: 0 }, 0);
    tl.fromTo(lens, { scale: 1.12, x: -WW * 0.06, y: -WH * 0.04 }, { scale: 1, x: 0, y: 0, duration: T.hookEnd, ease: "sine.out" }, 0);
    tl.to("#stage", { autoAlpha: 1, duration: 0.25 }, T.hookEnd);

    // ---- 2. Physics → New test
    tap(T.physicsTap, "#subj-physics");
    go(T.newTestIn, "subjects", "newtest");

    // ---- 3. chapter, count, difficulty
    const nts = $("#newtest-scroll");
    tap(T.chapterTap, "#chap-3");
    select(T.chapterTap + 0.04, "#chap-3 .sel-fill, #chap-3 .check .on", "#chap-whole .sel-fill, #chap-whole .check .on");
    const sumTo = (i, at) => { tl.to(`#sum-${i - 1}`, { opacity: 0, duration: 0.12 }, at); tl.to(`#sum-${i}`, { opacity: 1, duration: 0.12 }, at); };
    sumTo(1, T.chapterTap + 0.04);
    const rCount = rel($("#count-card"), nts);
    const scroll1 = Math.max(0, rCount.y - 12);
    tl.to(nts, { y: -scroll1, duration: 0.4, ease: "power2.inOut" }, T.scroll);
    tap(T.countTap, "#preset-25", scroll1);
    select(T.countTap + 0.04, "#preset-25 .sel-fill", "#preset-15 .sel-fill");
    tl.to("#preset-25 span", { color: "#ffffff", duration: 0.12 }, T.countTap + 0.04);
    tl.to("#preset-15 span", { color: "#5d5648", duration: 0.12 }, T.countTap + 0.04);
    tl.to("#count-fill", { scaleX: 25 / 30, duration: 0.35, ease: "power3.out" }, T.countTap + 0.04);
    tl.to("#count-knob", { x: TW * (25 / 30), duration: 0.35, ease: "power3.out" }, T.countTap + 0.04);
    tl.to("#count-15", { opacity: 0, duration: 0.15 }, T.countTap + 0.04);
    tl.fromTo("#count-25", { opacity: 0 }, { opacity: 1, duration: 0.2 }, T.countTap + 0.1);
    sumTo(2, T.countTap + 0.04);
    tap(T.hardTap, "#level-hard", scroll1);
    select(T.hardTap + 0.04, "#level-hard .sel-fill", "#level-mixed .sel-fill");
    tl.to("#level-hard .lt", { color: "#8f4a20", duration: 0.12 }, T.hardTap + 0.04);
    tl.to("#level-mixed .lt", { color: "#201e1d", duration: 0.12 }, T.hardTap + 0.04);
    sumTo(3, T.hardTap + 0.04);

    // ---- 4. start → "Test #04 ready" → the question
    const rStart = rel($(".start-row"), nts);
    const scroll2 = Math.max(scroll1, rStart.y + rStart.h - WH * 0.55);
    tl.to(nts, { y: -scroll2, duration: 0.3, ease: "power2.inOut" }, T.hardTap + 0.3);
    tap(T.startTap, "#start-btn", scroll2);
    tl.to("#start-btn", { opacity: 0, duration: 0.15 }, T.startTap + 0.08);
    tl.to(".start-sum", { opacity: 0, duration: 0.15 }, T.startTap + 0.08);
    tl.fromTo("#toast-ready", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.8)" }, T.startTap + 0.1);
    const ts = $("#test-scroll");
    const rQ3 = rel($("#q3"), ts);
    const tScroll = Math.max(0, rQ3.y - 20);
    tl.set(ts, { y: -tScroll }, T.testIn - 0.01);
    go(T.testIn, "newtest", "test");
    tap(T.inertiaTap, "#opt-inertia", tScroll);
    select(T.inertiaTap + 0.04, "#opt-inertia .sel-fill, #opt-inertia .letter .on");
    tap(T.submitTap, "#submit-btn", tScroll);

    // ---- 5. instant result: punch in on the score
    go(T.resultsIn, "test", "results");
    // no camera punch here: on a full-width screen it would crop text at the sides; the score pops instead
    tl.fromTo("#res-hero .res-pct", { scale: 1 }, { scale: 1.12, duration: 0.18, ease: "power2.out", yoyo: true, repeat: 1, transformOrigin: "30% 50%" }, T.countUp + 1.0);
    countUp($("#res-pct"), 88, T.countUp, 1.0);
    tl.fromTo("#res-remark", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.2)" }, T.remark);
    tl.fromTo("#res-hero .mascot", { y: 0, rotation: 0 }, { y: -6, rotation: -4, duration: 0.35, ease: "sine.inOut", yoyo: true, repeat: 3 }, T.countUp);

    // ---- 6. challenge friends
    go(T.challengeIn, "results", "challenge");
    const join = (n, at) => {
      tl.to(`#seat-${n}-empty`, { opacity: 0, duration: 0.2 }, at);
      tl.fromTo(`#seat-${n} .av`, { scale: 0 }, { scale: 1, duration: 0.4, ease: "back.out(2)" }, at + 0.05);
    };
    const swapText = (off, on, at) => { tl.to(off, { opacity: 0, duration: 0.15 }, at); tl.fromTo(on, { opacity: 0 }, { opacity: 1, duration: 0.2 }, at + 0.05); };
    join(2, T.join1); swapText("#joined-1", "#joined-2", T.join1);
    tl.fromTo("#toast-1", { opacity: 0, y: -60 }, { opacity: 1, y: 0, duration: 0.45, ease: "expo.out" }, T.join1);
    join(3, T.join2); swapText("#joined-2", "#joined-3", T.join2);
    swapText("#seat-2-no", "#seat-2-yes", T.ready); swapText("#ready-1", "#ready-2", T.ready);
    tl.fromTo("#toast-2", { opacity: 0, y: -60 }, { opacity: 1, y: 0, duration: 0.45, ease: "expo.out" }, T.ready);
    tl.to(["#toast-1", "#toast-2"], { opacity: 0, duration: 0.25 }, T.endCard - 0.2);

    // ---- 7. end card over the dimmed app
    tl.to("#stage", { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, T.endCard - 0.2);
    tl.fromTo("#endcard", { opacity: 0, scale: 0.8, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }, T.endCard + 0.02);

    // ---- captions: each chunk shows while spoken, the current word lit
    $$(".ucap").forEach((c) => {
      const a = +c.dataset.capIn, b = +c.dataset.capOut;
      tl.fromTo(c, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.12, ease: "back.out(2)", immediateRender: false }, a);
      tl.set(c, { opacity: 0 }, b);
      const ws = Array.from(c.querySelectorAll(".w"));
      ws.forEach((w, i) => {
        tl.set(w, { color: "#FFD23F" }, +w.dataset.t);
        tl.set(w, { color: "#ffffff" }, i + 1 < ws.length ? +ws[i + 1].dataset.t : b);
      });
    });
    tl.set(".ucap", { opacity: 0 }, 0);

    window.__timelines = window.__timelines || {};
    window.__timelines["main"] = tl;
    if (typeof window.__hfForceTimelineRebind === "function") window.__hfForceTimelineRebind();
  }

  document.fonts.ready.then(build);
})();
