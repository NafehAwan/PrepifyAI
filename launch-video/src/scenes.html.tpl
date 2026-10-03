<!-- ======================= background: white + drifting brand blobs ======= -->
<div id="bg" class="layer" data-layout-ignore>
  <div class="blob b1"></div>
  <div class="blob b2"></div>
  <div class="blob b3"></div>
  <div class="blob b4"></div>
</div>

<!-- ======================= the app, in a floating window ==================== -->
<div id="stage" class="layer">
  <div id="rig">
    <div id="lens">
      <div id="win" class="win">
        {{CHROME}}
        <div class="app">
          <aside class="sidebar">
            <div class="brand">{{LOGO_SVG_34}}<div>Prepify <span class="ai">AI</span></div></div>
            <div class="nav"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg><span>Home</span></div>
            <div class="nav" id="nav-subjects"><div class="nav-on"></div><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2z"/></svg><span>My Subjects</span></div>
            <div class="nav"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg><span>Progress</span></div>
            <div class="nav" id="nav-board"><div class="nav-on"></div><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/></svg><span>Leaderboard</span></div>
            <div class="nav"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5M12 16.5h.01"/></svg><span>Help &amp; Feedback</span></div>
            <div class="nav"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M20.5 13l1.3-.8-1.7-3-1.5.6-1.7-1-.3-1.6h-3.4l-.3 1.6-1.7 1-1.5-.6-1.7 3 1.3.8v2l-1.3.8 1.7 3 1.5-.6 1.7 1 .3 1.6h3.4l.3-1.6 1.7-1 1.5.6 1.7-3-1.3-.8z"/></svg><span>Settings</span></div>
          </aside>

          <div class="main">
            <div class="topbar">
              <div class="menu-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5d5648" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></div>
              <div class="tb-titles">
                <div class="tb-title" id="tb-subjects">My Subjects</div>
                <div class="tb-title" id="tb-newtest">New Test</div>
                <div class="tb-title" id="tb-test">Test</div>
                <div class="tb-title" id="tb-results">Test Review</div>
                <div class="tb-title" id="tb-challenge">Challenge</div>
                <div class="tb-title" id="tb-board">Leaderboard</div>
              </div>
              <div class="chip c-tint"><svg width="16" height="16" viewBox="0 0 24 24" fill="#c67139"><path d="M12 2c3 4 6 6 6 10a6 6 0 0 1-12 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 1-6 2-9z"/></svg>12 day streak</div>
              <div class="chip c-sage"><svg width="15" height="15" viewBox="0 0 24 24" fill="#7a8a5e"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>240 XP this week</div>
              <div class="chip c-sand"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7a6f5d" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2"/></svg>164 days to boards</div>
              <div class="avatar">AK</div>
            </div>

            <div class="screens">
              <!-- ============ My Subjects ============ -->
              <section class="screen" id="scr-subjects">
                <div class="intro-row">
                  <div class="muted">Pick a subject to start a new test, challenge friends, or look back at the ones you&#39;ve taken.</div>
                  <div class="join"><div class="field">Challenge code</div><div class="pill-btn btn-accent">Join</div></div>
                </div>
                <div class="subj-grid">
                  <div class="card subj strong" id="subj-physics">
                    <div class="subj-head"><div class="subj-badge">P</div><div><div class="subj-name">Physics</div><div class="subj-sub">6 tests taken</div></div><div class="subj-grade">A</div></div>
                    <div class="bar"><i style="width:92%"></i></div>
                    <div class="subj-foot"><span>Best 92%</span><span>avg 81%</span></div>
                  </div>
                  <div class="card subj strong">
                    <div class="subj-head"><div class="subj-badge">C</div><div><div class="subj-name">Chemistry</div><div class="subj-sub">4 tests taken</div></div><div class="subj-grade">B</div></div>
                    <div class="bar"><i style="width:78%"></i></div>
                    <div class="subj-foot"><span>Best 78%</span><span>avg 71%</span></div>
                  </div>
                  <div class="card subj weak">
                    <div class="subj-head"><div class="subj-badge">M</div><div><div class="subj-name">Maths</div><div class="subj-sub">3 tests taken</div></div><div class="subj-grade">C</div></div>
                    <div class="bar"><i style="width:68%"></i></div>
                    <div class="subj-foot"><span>Best 68%</span><span>avg 62%</span></div>
                  </div>
                  <div class="card subj strong">
                    <div class="subj-head"><div class="subj-badge">C</div><div><div class="subj-name">Computer Science</div><div class="subj-sub">5 tests taken</div></div><div class="subj-grade">A</div></div>
                    <div class="bar"><i style="width:88%"></i></div>
                    <div class="subj-foot"><span>Best 88%</span><span>avg 80%</span></div>
                  </div>
                  <div class="card subj weak">
                    <div class="subj-head"><div class="subj-badge">E</div><div><div class="subj-name">English</div><div class="subj-sub">2 tests taken</div></div><div class="subj-grade">B</div></div>
                    <div class="bar"><i style="width:74%"></i></div>
                    <div class="subj-foot"><span>Best 74%</span><span>avg 70%</span></div>
                  </div>
                </div>
              </section>

              <!-- ============ New Test ============ -->
              <section class="screen" id="scr-newtest">
                <div class="scroller" id="newtest-scroll">
                  <div style="margin-bottom:20px"><div class="back">← Physics</div><div class="frame-title">New Physics test</div></div>
                  <div class="col">
                    <div class="card name-card"><div><div class="lbl">Test name</div><div class="val">Test #04</div></div><div class="note">Named automatically so your results stay in order.</div></div>
                    <div class="card opt">
                      <div class="opt-title">Which chapters?</div>
                      <div class="opt-hint">The whole book, or pick one or more chapters to focus on.</div>
                      <div class="chap whole" id="chap-whole"><div class="sel-fill" style="opacity:1"></div><div class="check"><div class="on" style="opacity:1"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div></div><div class="t">Whole book</div><div class="n">947 questions</div></div>
                      <div class="chap"><div class="check"></div><div class="seq">1</div><div class="t">Physical Quantities and Measurement</div><div class="n">146</div></div>
                      <div class="chap"><div class="check"></div><div class="seq">2</div><div class="t">Kinematics</div><div class="n">173</div></div>
                      <div class="chap" id="chap-3"><div class="sel-fill"></div><div class="check"><div class="on"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div></div><div class="seq">3</div><div class="t">Dynamics - I</div><div class="n">122</div></div>
                      <div class="chap"><div class="check"></div><div class="seq">4</div><div class="t">Dynamics - II</div><div class="n">112</div></div>
                      <div class="chap"><div class="check"></div><div class="seq">5</div><div class="t">Pressure and Deformation in Solids</div><div class="n">99</div></div>
                    </div>
                    <div class="card opt" id="count-card">
                      <div class="opt-title">How many questions?</div>
                      <div class="opt-hint">Anywhere from 1 to 30.</div>
                      <div class="presets">
                        <div class="preset"><span>5</span></div><div class="preset"><span>10</span></div>
                        <div class="preset" id="preset-15"><div class="sel-fill" style="opacity:1"></div><span>15</span></div>
                        <div class="preset"><span>20</span></div>
                        <div class="preset" id="preset-25"><div class="sel-fill"></div><span>25</span></div>
                        <div class="preset"><span>30</span></div>
                      </div>
                      <div class="slider-row"><div class="track"><div class="fill" id="count-fill"></div><div class="knob" id="count-knob"></div></div><div class="count-val"><span id="count-15">15</span><span id="count-25" style="opacity:0">25</span></div></div>
                    </div>
                    <div class="card opt" id="level-card">
                      <div class="opt-title">How hard?</div>
                      <div class="opt-hint">Easy all the way to hard.</div>
                      <div class="levels">
                        <div class="level"><div class="lt">Easy</div><div class="lb">Direct recall — definitions, units, one-step facts.</div></div>
                        <div class="level"><div class="lt">Medium</div><div class="lb">A mix, leaning on understanding. Some scenarios.</div></div>
                        <div class="level" id="level-hard"><div class="sel-fill"></div><div class="lt">Hard</div><div class="lb">Mostly scenario questions, like the board paper.</div></div>
                        <div class="level" id="level-mixed"><div class="sel-fill" style="opacity:1"></div><div class="lt">Mixed</div><div class="lb">Everything jumbled together — closest to a real paper.</div></div>
                      </div>
                    </div>
                    <div class="start-row">
                      <div class="start-btn" id="start-btn">Start test →</div>
                      <div class="start-sum"><span id="sum-0">15 questions · mixed · Whole book</span><span id="sum-1">15 questions · mixed · Chapter 3</span><span id="sum-2">25 questions · mixed · Chapter 3</span><span id="sum-3">25 questions · hard · Chapter 3</span></div>
                      <div class="toast" data-layout-allow-occlusion id="toast-ready"><div class="tick"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div><div><b>Test #04 ready</b><small>25 questions · Hard · Ch 3</small></div></div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- ============ Test runner ============ -->
              <section class="screen" id="scr-test">
                <div class="scroller" id="test-scroll">
                  <div class="runner-head"><div><div class="back">← Physics</div><div class="frame-title">Test #04</div><div class="frame-sub">Chapter 3 · 25 questions · hard</div></div><div class="meta">2/25 answered · pass ≥ 50%</div></div>
                  <div class="card qcard">
                    <div class="q">
                      <div class="q-stem">1. If you want to change the state of rest or uniform motion of any object, what type of force is required?</div>
                      <div class="opts">
                        <div class="optn"><div class="letter">A</div><div class="txt">Balanced force</div></div>
                        <div class="optn picked"><div class="sel-fill"></div><div class="letter">B<div class="on">B</div></div><div class="txt">Unbalanced force</div></div>
                        <div class="optn"><div class="letter">C</div><div class="txt">Internal force</div></div>
                        <div class="optn"><div class="letter">D</div><div class="txt">Zero force</div></div>
                      </div>
                    </div>
                    <div class="q">
                      <div class="q-stem">2. Which physical quantity is the direct, fundamental measure of a body&#39;s inertia?</div>
                      <div class="opts">
                        <div class="optn"><div class="letter">A</div><div class="txt">Weight</div></div>
                        <div class="optn"><div class="letter">B</div><div class="txt">Speed</div></div>
                        <div class="optn picked"><div class="sel-fill"></div><div class="letter">C<div class="on">C</div></div><div class="txt">Mass</div></div>
                        <div class="optn"><div class="letter">D</div><div class="txt">Volume</div></div>
                      </div>
                    </div>
                    <div class="q" id="q3">
                      <div class="q-stem">3. A passenger falls backward when a bus accelerates rapidly from rest. Which property explains this?</div>
                      <div class="opts">
                        <div class="optn"><div class="letter">A</div><div class="txt">Weight</div></div>
                        <div class="optn"><div class="letter">B</div><div class="txt">Velocity</div></div>
                        <div class="optn"><div class="letter">C</div><div class="txt">Friction</div></div>
                        <div class="optn" id="opt-inertia"><div class="sel-fill"></div><div class="letter">D<div class="on">D</div></div><div class="txt">Inertia</div></div>
                      </div>
                    </div>
                  </div>
                  <div class="submit-bar"><div class="submit-btn" id="submit-btn">Submit test</div><div class="muted" style="font-size:12.5px">Unanswered questions count as wrong.</div></div>
                </div>
              </section>

              <!-- ============ Results ============ -->
              <section class="screen" id="scr-results">
                <div style="margin-bottom:18px"><div class="back">← Physics</div><div class="frame-title">Test #04</div><div class="frame-sub">Chapter 3 · 25 questions · hard</div></div>
                <div class="res-hero" id="res-hero">
                  <div class="mascot"><img src="assets/img/prepi-celebrate.png" alt="" /></div>
                  <div class="res-pct"><span id="res-pct">0</span>%</div>
                  <div class="res-txt"><div class="rk" id="res-remark">Very good</div><div class="rs">22 of 25 correct · pass ≥ 50%.</div></div>
                  <div class="res-btns"><div class="pill-btn btn-white">Another test</div><div class="pill-btn btn-accent">Back</div></div>
                </div>
                <div class="card review">
                  <h4>Answer review</h4>
                  <div class="rrow"><div class="top"><div class="stem">3. A passenger falls backward when a bus accelerates rapidly from rest. Which property explains this?</div><div class="verdict ok">Correct</div></div><div class="ans">Correct answer: <strong>D. Inertia</strong></div></div>
                  <div class="rrow"><div class="top"><div class="stem">4. A heavy truck and a bicycle move at the same speed. Which is harder to stop?</div><div class="verdict ok">Correct</div></div><div class="ans">Correct answer: <strong>A. The truck</strong></div></div>
                </div>
              </section>

              <!-- ============ Challenge lobby ============ -->
              <section class="screen" id="scr-challenge">
                <div style="margin-bottom:18px"><div class="back">← Physics</div><div class="frame-title">Physics challenge</div><div class="frame-sub">Dynamics - I · 15 questions · hard · 10 min</div></div>
                <div class="lobby">
                  <div class="card invite">
                    <div class="it">Invite your friends</div>
                    <div class="ih">Send them this link. They sign in, tap Join, then Ready. Code: <strong>K7Q2MX</strong></div>
                    <div class="inv-row"><div class="inv-link" data-layout-allow-overflow>{{INVITE_LINK}}</div><div class="pill-btn btn-sand">Copy link</div><div class="pill-btn btn-wa">WhatsApp</div></div>
                  </div>
                  <div class="stats-row">
                    <div class="stat"><div class="sl">Joined</div><div class="sv"><span id="joined-1">1/3</span><span id="joined-2" style="opacity:0">2/3</span><span id="joined-3" style="opacity:0">3/3</span></div></div>
                    <div class="stat" id="ready-stat"><div class="sl">Ready</div><div class="sv"><span id="ready-1">1/3</span><span id="ready-2" style="opacity:0">2/3</span><span id="ready-3" style="opacity:0">3/3</span></div></div>
                  </div>
                  <div class="card seats" id="seats">
                    <div class="seat"><div class="av">A</div><div class="who">Ali <span class="you">(you)</span><span class="host-chip">host</span></div><div class="ready-pill"><span class="rp-yes">Ready</span></div></div>
                    <div class="seat" id="seat-2"><div class="av">A</div><div class="who">Ayesha</div><div class="ready-pill"><span class="rp-no" id="seat-2-no">Not ready</span><span class="rp-yes" id="seat-2-yes" style="opacity:0">Ready</span></div><div class="seat-empty" id="seat-2-empty"><div class="ring"></div><span data-layout-allow-overlap>Waiting for a friend…</span></div></div>
                    <div class="seat" id="seat-3"><div class="av">H</div><div class="who">Hamza</div><div class="ready-pill"><span class="rp-no" id="seat-3-no">Not ready</span><span class="rp-yes" id="seat-3-yes" style="opacity:0">Ready</span></div><div class="seat-empty" id="seat-3-empty"><div class="ring"></div><span data-layout-allow-overlap>Waiting for a friend…</span></div></div>
                  </div>
                  <div class="ready-btn">Ready ✓ (tap to undo)</div>
                </div>
                <div class="countdown" data-layout-allow-occlusion id="countdown"><div class="cl">Everyone&#39;s ready — get set!</div><div class="cn"><span id="cd-3">3</span><span id="cd-2">2</span></div></div>
              </section>

              <!-- ============ Leaderboard ============ -->
              <section class="screen" id="scr-board">
                <div class="lb">
                  <div class="lb-top"><div class="seg"><span class="on">All time</span><span>Monthly</span></div><div class="lb-hint">Every test and challenge since you joined.</div></div>
                  <div class="me-card">
                    <div class="big"><div class="bl">Your rank</div><div class="bv"><span>2nd</span></div></div>
                    <div class="big"><div class="bl">XP all time</div><div class="bv"><span id="me-xp">2,315</span></div></div>
                    <div class="big"><div class="bl">Streak</div><div class="bv"><span>🔥 12 days</span></div></div>
                    <div class="big"><div class="bl">Challenge wins</div><div class="bv"><span>7</span></div></div>
                    <div class="me-note">Shown to others as <strong>Ali</strong>.</div>
                  </div>
                  <div class="card table-card">
                    <div class="trow head"><div>#</div><div>Student</div><div>XP</div><div>Streak</div><div class="c-wins">Wins</div><div class="c-papers">Papers</div></div>
                    <div class="trow lrow"><div class="rank top3">🥇</div><div class="name">Ayesha</div><div class="xp"><span data-xp="2480">2,480</span></div><div>🔥 21</div><div class="c-wins">9</div><div class="c-papers">64</div></div>
                    <div class="trow lrow" id="row-me"><div class="me-hl"></div><div class="rank top3">🥈</div><div class="name">Ali (you)</div><div class="xp"><span data-xp="2315">2,315</span></div><div>🔥 12</div><div class="c-wins">7</div><div class="c-papers">58</div></div>
                    <div class="trow lrow"><div class="rank top3">🥉</div><div class="name">Hamza</div><div class="xp"><span data-xp="1960">1,960</span></div><div>🔥 9</div><div class="c-wins">5</div><div class="c-papers">47</div></div>
                    <div class="trow lrow"><div class="rank">4</div><div class="name">Zainab</div><div class="xp"><span data-xp="1720">1,720</span></div><div>🔥 6</div><div class="c-wins">3</div><div class="c-papers">41</div></div>
                    <div class="trow lrow"><div class="rank">5</div><div class="name">Muhammad H</div><div class="xp"><span data-xp="1540">1,540</span></div><div>—</div><div class="c-wins">2</div><div class="c-papers">39</div></div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <!-- in-app cursor: lives in window space so it follows the camera -->
        <div id="app-cursor"><div class="cscale" id="app-cursor-scale">{{CURSOR_SVG}}<div class="ripple" id="app-ripple"></div></div></div>
      </div>
    </div>
  </div>
</div>

<!-- ======================= screen-space captions & floaters ================= -->
<div id="captions" class="layer">
  <div class="caption" data-layout-allow-occlusion id="cap-meet"><div class="cap-dot"></div><span data-layout-allow-overlap>Meet <span class="kw" data-layout-allow-overlap>{{PRODUCT}}</span></span></div>
  <div class="caption" data-layout-allow-occlusion id="cap-build"><div class="cap-dot"></div><span data-layout-allow-overlap>Build a <span class="kw" data-layout-allow-overlap>board-style</span> test</span></div>
  <div class="caption" data-layout-allow-occlusion id="cap-challenge"><div class="cap-dot"></div><span data-layout-allow-overlap>Challenge your <span class="kw" data-layout-allow-overlap>friends</span></span></div>
  <div class="caption" data-layout-allow-occlusion id="cap-board"><div class="cap-dot"></div><span data-layout-allow-overlap>Climb the <span class="kw" data-layout-allow-overlap>leaderboard</span></span></div>
</div>

<div id="floaters" class="layer">
  <div class="note-toast" data-layout-allow-occlusion id="toast-1"><div class="av" data-layout-allow-overlap>A</div><div data-layout-allow-overlap><b data-layout-allow-overlap>Ayesha</b> joined your challenge</div></div>
  <div class="note-toast" data-layout-allow-occlusion id="toast-2"><div class="av" data-layout-allow-overlap>H</div><div data-layout-allow-overlap><b data-layout-allow-overlap>Hamza</b> is ready <span class="ok" data-layout-allow-overlap>✓</span></div></div>
  <div class="stat-cards">
    <div class="scard" data-layout-allow-occlusion id="stat-1"><div class="num" data-layout-allow-overlap><span data-layout-allow-overlap data-to="3953" data-sep="1">0</span></div><div class="lbl" data-layout-allow-overlap>board-style MCQs</div></div>
    <div class="scard" data-layout-allow-occlusion id="stat-2"><div class="num" data-layout-allow-overlap><span data-layout-allow-overlap data-to="54">0</span></div><div class="lbl" data-layout-allow-overlap>chapters</div></div>
    <div class="scard" data-layout-allow-occlusion id="stat-3"><div class="num" data-layout-allow-overlap><span data-layout-allow-overlap data-to="5">0</span></div><div class="lbl" data-layout-allow-overlap>subjects</div></div>
  </div>
</div>

<!-- ======================= typewriter headlines ============================ -->
<div id="hook" class="typer">{{HOOK_LINE}}</div>
<div id="headline" class="typer">{{HEADLINE_LINE}}</div>

<!-- ======================= outro: bar → logo → wordmark → CTA ============== -->
<div id="outro" class="layer">
  <div class="bar-grow" id="bar-grow"></div>
  <div class="lockup" id="lockup">
    <div class="badge" id="badge"><div class="disc" id="badge-disc"></div>{{LOGO_GLYPH}}</div>
    <div class="wordmark" id="wordmark">{{WORDMARK}}</div>
    <div class="under" id="under">
      <div class="tagline" id="tagline">{{TAGLINE}}</div>
      <div class="cta" id="cta"><div class="cta-btn">{{CTA_TEXT}} <span>→</span></div>{{CTA_URL}}</div>
    </div>
  </div>
</div>

<!-- hook cursor (screen space) -->
<div id="hook-cursor"><div class="cscale">{{CURSOR_SVG_HOOK}}<div class="ripple" id="hook-ripple"></div></div></div>
