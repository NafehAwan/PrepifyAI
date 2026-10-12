---
version: alpha
name: Niyyah — Web
description: >
  Design system of niyyah.app, the marketing site for the Niyyah app ("Live Islam practically in
  <5 mins a day"). Warm off-white paper, a single warm-orange voltage (#E8854A) with a coral
  partner for gradients, a muted jewel set (teal, purple, gold) used only as 6–8% tints with a
  matching hairline, Playfair Display for every headline with an italic orange <em> phrase,
  DM Sans for everything else, and Scheherazade New for Arabic. Hairline (0.5px) borders,
  soft low shadows, 14–20px radii, generous 120–140px section padding, a near-black footer.
  Calm, trustworthy, scholarly — never loud.
source: https://niyyah.app/ (stylesheet /static/css/main.d09b6c60.css, captured 2026-10-12)
unit: the web page — content max-width 1160px, 24px side gutter

colors:
  # brand
  orange: "#E8854A"          # the one accent: CTAs, eyebrows, <em> in headings, active dots; also <meta theme-color>
  orange-strong: "#C56A35"   # primary button hover
  orange-soft: "#E8854A14"   # 8% tint fill
  orange-border: "#E8854A38" # 22% hairline
  coral: "#D4607A"           # gradient partner only (orange → coral)
  coral-soft: "#D4607A0F"
  coral-border: "#D4607A2E"
  # supporting jewel tones — tints and small icon tiles only
  teal: "#3CB89A"
  teal-soft: "#3CB89A14"
  teal-border: "#3CB89A38"
  teal-deep: "#1A8A50"       # "Verified" badge text, savings pills
  purple: "#7B6BAE"
  purple-soft: "#7B6BAE0F"
  purple-border: "#7B6BAE2E"
  gold: "#C8A84E"            # stars, streak ring
  gold-soft: "#C8A84E14"
  gold-border: "#C8A84E38"
  gold-deep: "#8A7234"       # Arabic verse text, specialism chips
  # surfaces
  bg1: "#F9F8F4"             # page / default section
  bg2: "#F1F0EB"             # recessed, phone-frame halo
  cream: "#FAF8F0"           # alternate sections (scholars, FAQ, final CTA), verse card
  card: "#FFFFFF"
  hero-dark: "#0C0B09"       # defined token (dark hero variant)
  footer: "#141310"
  # text
  fg1: "#1A1A18"             # headings, body emphasis
  fg2: "#4A4A42"             # body copy
  fg3: "#8A8A80"             # muted, meta, captions
  fg4: "#B0B0A4"             # faintest (store name under reviews)
  fg-dark: "#E8E6DF"         # text on dark
  # lines
  border: "#E6E5DE"
  border-soft: "#EEEDEA"
  border-strong: "#D4D3CB"

gradients:
  accent-text: "linear-gradient(110deg, #E8854A 0, #D4607A 65%)"   # hero <em>, clipped to text
  accent-fill: "linear-gradient(120deg, #E8854A, #D4607A)"         # 'next prayer' card
  hero-glow: "radial-gradient(420px circle at var(--mx) var(--my), #E8854A2E, #D4607A14 35%, transparent 70%)"  # follows the cursor, mix-blend multiply
  gold-glow: "radial-gradient(circle, #C8A84E1F, transparent 70%)" # 560px blob behind the scholars section
  featured-card: "linear-gradient(180deg, #FFFFFF, #E8854A14)"

shadows:
  s1: "0 1px 3px #0000000A"
  s2: "0 2px 8px #0000000A"
  s3: "0 4px 14px #0000000F"        # card hover
  cta: "0 4px 20px #E8854A59"       # orange glow under primary buttons
  cta-hover: "0 6px 28px #E8854A73"
  phone: "0 0 0 6px #F1F0EB, 0 40px 80px #0000001A, 0 8px 24px #0000000D"
  portrait: "0 24px 60px #8A72342E" # warm gold-tinted drop under scholar photo

typography:
  # Google Fonts: DM Sans (opsz 9..40; 400/500/600/700; italic 400), Playfair Display (400–700, italic 400/500),
  # Scheherazade New (400/700). Mulish is also loaded but only used by a legacy section — don't use it.
  ui:      { fontFamily: "DM Sans", fallback: "system-ui, sans-serif" }
  display: { fontFamily: "Playfair Display", fallback: "Georgia, serif" }
  arabic:  { fontFamily: "Scheherazade New", fallback: "Amiri, Georgia, serif", direction: rtl }
  hero-h1:      { fontFamily: "Playfair Display", size: "clamp(44px, 5.6vw, 72px)", weight: 400, lineHeight: 1.04, tracking: "-0.025em" }
  hero-h1-em:   { fontFamily: "Playfair Display", size: "0.84em", italic: true, display: block, fill: "{gradients.accent-text}" }
  h2-large:     { fontFamily: "Playfair Display", size: "clamp(34px, 5vw, 60px)", weight: 400, lineHeight: 1.1, tracking: "-0.02em" }   # final CTA
  h2:           { fontFamily: "Playfair Display", size: "clamp(30px, 3.6vw, 46px)", weight: 400, lineHeight: 1.15, tracking: "-0.02em" } # section heads
  h2-small:     { fontFamily: "Playfair Display", size: "clamp(24px, 2.8vw, 38px)", weight: 400, lineHeight: 1.18, tracking: "-0.015em" }
  h2-em:        { italic: true, color: "{colors.orange}" }
  name:         { fontFamily: "Playfair Display", size: "clamp(28px, 3.4vw, 42px)", weight: 400, lineHeight: 1.15, tracking: "-0.018em" }
  quote-display: { fontFamily: "Playfair Display", size: "clamp(30px, 4vw, 46px)", weight: 400, italic: true, lineHeight: 1.25, tracking: "-0.015em" }
  pull-quote:   { fontFamily: "Playfair Display", size: "clamp(17px, 1.8vw, 20px)", italic: true, lineHeight: 1.5 }
  stat-number:  { fontFamily: "Playfair Display", size: "clamp(32px, 3.6vw, 48px)", weight: 500, lineHeight: 1, numeric: tabular }
  price:        { fontFamily: "Playfair Display", size: "46px", weight: 500, numeric: tabular }
  lede:         { fontFamily: "DM Sans", size: "17–18px", weight: 400, lineHeight: 1.6–1.7, color: "{colors.fg2}" }
  body:         { fontFamily: "DM Sans", size: "15–16px", weight: 400, lineHeight: 1.65–1.75, color: "{colors.fg2}" }
  faq-question: { fontFamily: "DM Sans", size: "17px", weight: 500 }
  card-title:   { fontFamily: "DM Sans", size: "15px", weight: 600, lineHeight: 1.3 }
  button:       { fontFamily: "DM Sans", size: "16px", weight: 600 }
  eyebrow:      { fontFamily: "DM Sans", size: "12px", weight: 600, tracking: "0.1em", upper: true, color: "{colors.orange}" }
  eyebrow-pill: { fontFamily: "DM Sans", size: "11px", weight: 600, tracking: "0.14em", upper: true }
  meta:         { fontFamily: "DM Sans", size: "12–14px", color: "{colors.fg3}" }
  verse-arabic: { fontFamily: "Scheherazade New", size: "18px (in a 300px phone)", lineHeight: 1.9, color: "{colors.gold-deep}", align: right }

spacing:
  container: "1160px"
  gutter: "24px"
  section: "120px 24px"          # standard section padding
  section-hero: "140px 24px 88px"
  section-tall: "140px 24px"     # problem + final CTA
  section-header-gap: "56–64px"
  grid-gap: "14px (tiles) · 18–20px (cards) · 64–80px (two-column splits)"
  hairline: "0.5px"
  radius-sm: "8px"
  radius-md: "10px"
  radius-lg: "14px"    # buttons, credential boxes, small cards
  radius-xl: "16px"
  radius-2xl: "20px"   # testimonial + pricing cards, stats strip
  radius-tile: "18px"  # topic tiles
  radius-portrait: "24px"
  radius-phone: "52px"
  radius-full: "999px"
  nav-height: "68px"

motion:
  ease: "cubic-bezier(.16, 1, .3, 1)"   # one ease for everything (expo-out)
  reveal: "opacity 0→1, translateY 12px→0, 0.7s ease; staggered 0.08s steps (delay-1…6)"
  hover-lift: "translateY(-1px) on buttons, -3px on cards, 0.15–0.25s; shadow grows to {shadows.s3}/{shadows.cta-hover}"
  phone-float: "translateY 0 → -12px → 0, 7s ease-in-out infinite"
  hero-pattern-drift: "khatam SVG pattern background-position 0 → 560px 560px, 90s linear infinite, opacity .06"
  hero-glow: "cursor-following radial glow fades in over 0.8s"
  carousel: "slides cross-fade 0.55s with 8px rise; active dot widens (0.35s)"
  faq: "answer max-height opens 0.4s; + icon rotates"
  cta-pulse: "pulse-once: orange ring expands to 12px and fades"
  reduced-motion: "all animation and transition durations collapse to 0.001ms"

components:
  nav:
    layout: "fixed, 68px, logo left · links (Scholars, Topics, FAQ) gap 32px · 'Start now' button right"
    scrolled: "background #F9F8F4F2 + blur(20px) + 1px bottom line #EEEDEA"
    mobile: "38px burger with 0.5px border, full-screen blurred drawer"
  button-primary:
    backgroundColor: "{colors.orange}"
    textColor: "#FFFFFF"
    rounded: "{spacing.radius-lg}"
    padding: "16px 30px (final CTA 18px 40px, 17px text)"
    shadow: "{shadows.cta}"
    hover: "background {colors.orange-strong}, shadow {shadows.cta-hover}, lift 1px"
  button-ghost:
    border: "1px solid {colors.border-strong}"
    rounded: "{spacing.radius-lg}"
    textColor: "{colors.fg1}"
    padding: "15px 28px"
  eyebrow-pill:
    backgroundColor: "{colors.orange-soft}"
    border: "0.5px solid {colors.orange-border}"
    rounded: "{spacing.radius-full}"
    padding: "6px 12px"
    typography: "{typography.eyebrow-pill}, orange"
    description: "Sits above the hero headline. Elsewhere the eyebrow is plain orange uppercase text, no pill."
  trust-strip:
    description: "Under the hero CTA, after a 0.5px top rule: '★ 4.8 on the App Store | 200K+ Muslims | Built with scholars and experts'. 13px fg2 with fg1 bold figures, gold star, 1×14px dividers."
  tint-chip:
    description: "The jewel-tone pattern used everywhere: fill = colour at 6–8% (…-soft), border = 0.5px of the same colour at 18–22% (…-border), text in the deep variant. Used for the Verified badge (teal), specialism chip (gold), streak pill (orange), topic and feature icons."
  badge-verified:
    backgroundColor: "{colors.teal-soft}"
    border: "0.5px solid {colors.teal-border}"
    textColor: "{colors.teal-deep}"
    rounded: "{spacing.radius-sm}"
    typography: "10px, 600, 0.06em"
  topic-tile:
    backgroundColor: "{colors.card}"
    rounded: "{spacing.radius-tile}"
    padding: "22px 20px"
    icon: "42×42 rounded-12 solid colour square (orange / coral / teal / purple / gold-deep) with a white emoji glyph"
    hover: "lift 3px + {shadows.s3}"
    layout: "2-column grid, 14px gap"
  testimonial-card:
    backgroundColor: "{colors.bg1}"
    border: "0.5px solid {colors.border}"
    rounded: "{spacing.radius-2xl}"
    padding: "26px"
    parts: "gold ★★★★★ (2px tracking) · 15px quote with a 42px Playfair “ in orange-border colour · hairline · round initial avatar (orange tint) + name 14/600 + store 12px fg4"
    layout: "3-column grid, 18px gap"
  stats-strip:
    description: "3 white cells joined by 2px gaps on a #EEEDEA backing, radius 20px — reads as one card with hairline dividers. Playfair 500 tabular numbers that count up, 14px fg3 label."
  scholar-slide:
    layout: "two columns (0.8fr portrait / 1fr text), 72px gap; carousel with round 44px arrows and 8px dots"
    portrait: "4:5, radius 24px, gradient purple-soft → orange-soft → cream, 0.5px gold border, {shadows.portrait}"
    text: "gold specialism chip · Playfair name · 14px role · white-55% credentials box (gold hairline, radius 14) · pull-quote with 3px orange left bar, radius 0 14 14 0"
  phone-mockup:
    size: "300×616, radius 52px, white, 1.5px border-strong, halo + deep soft shadow {shadows.phone}, floats"
    screens: "rotates 3 screens (home with Quran verse card + topic tiles, lesson 'Scholar's Take', prayer times) with orange dots below"
    description: "Built in HTML, not a screenshot — the in-app UI uses the same tokens at small sizes (9–11px labels, 12–16px radii)."
  verse-card:
    backgroundColor: "{colors.cream}"
    border: "0.5px solid {colors.gold-border}"
    rounded: "16px"
    parts: "orange tinted 'TODAY'S VERSE' tag + reference · Arabic in Scheherazade New, gold-deep, RTL · italic English translation in fg2"
  pricing-card:
    backgroundColor: "{colors.card}"
    border: "0.5px solid {colors.border}"
    rounded: "{spacing.radius-2xl}"
    featured: "1.5px orange border, white → orange-soft gradient, orange pill badge on the top edge"
    toggle: "white pill segmented control; active segment fill {colors.fg1} with white text; teal 'save' pill"
  faq:
    layout: "single 800px column, 0.5px rules between items, question 17/500 left, 28px round '+' button right (bg1 fill, hairline)"
  footer:
    backgroundColor: "{colors.footer}"
    description: "Near-black, white logo, 4-column top (brand 2fr + Product/Company), white-at-40% text and uppercase 12px column titles, 34px social squares at 5% white, 1px rule at 6% white."
---

# Niyyah — design.md

## Overview

Niyyah sells a daily five-minute Islamic practice, so the site has to feel **trustworthy, warm and
calm** — closer to a well-made book than a tech product. It does that with three moves:

1. **Paper, not white.** Pages sit on warm off-white (`#F9F8F4`) and cream (`#FAF8F0`), alternating
   by section. Pure white is reserved for cards and the phone, so they lift off the page.
2. **A serif voice with one orange word.** Every headline is Playfair Display at weight 400, tight
   tracking, and carries one *italic phrase* in orange (`#E8854A`) — "Built with *scholars and
   leaders* in their fields.", "Everything *worth asking.*", "Live Islam, not just *learn it.*" In the
   hero that phrase drops onto its own line in an orange→coral gradient.
3. **Hairlines and tints instead of weight.** Borders are 0.5px; colour appears as 6–8% tints with a
   matching 22% hairline; shadows are low and soft. Nothing is heavy except the one orange button.

Islamic identity comes through content and one quiet ornament — a *khatam* (eight-point star)
SVG pattern drifting behind the hero at 6% opacity — plus real Arabic set in Scheherazade New. No
domes, crescents or green-and-gold clichés.

## Colors

- **Orange `#E8854A` is the only accent.** It marks what to do (buttons, the streak, active dots)
  and what to read (eyebrows, the italic phrase). One orange focal point per view; hover darkens to
  `#C56A35`.
- **Coral `#D4607A`** never appears alone — only as the far end of an orange gradient.
- **Teal, purple and gold are categorisers, not accents.** They appear as soft tints and as solid
  42px icon squares on topic tiles. Teal means *verified / good* (badge, savings, ticks); gold means
  *reverence and quality* (stars, the Quran verse, scholar chips, the streak ring).
- **Text is warm grey, never pure black**: `#1A1A18` headings, `#4A4A42` body, `#8A8A80` meta.
- **Dark only at the bottom**: the footer is `#141310`.

## Typography

- **Playfair Display** for every headline, name, stat number, price and quote. Weight 400 (500 for
  numbers), tracking −0.015 to −0.025em, line-height 1.04–1.25. Italic is the emphasis device —
  never bold.
- **DM Sans** for everything else: 16–18px body at line-height 1.6–1.75, 600 for buttons and card
  titles, and small uppercase eyebrows (12px, 0.1em tracking, orange).
- **Scheherazade New** for Arabic, right-to-left, generous 1.9 line-height, in gold-deep.
- Headlines are sentence case and short, often ending in a full stop.

## Layout

- 1160px container, 24px gutter. Sections are tall (120px padding; hero and final CTA 140px), with
  centred headers 56–64px above their content.
- Common splits: hero 1.05fr / 1fr (copy left, floating phone right, 72px gap); topics 0.85fr /
  1.15fr; prayer 1fr / 1fr (80px gap); scholar slide 0.8fr portrait / 1fr text.
- Cards in 2- or 3-column grids with 14–20px gaps. FAQ is a single 800px column.
- Below 1024px the splits stack, with the phone moving *above* the copy.

### Page order

1. **Hero** — pill eyebrow "The app to live Islam, not just learn it", H1 "Live Islam practically.
   / *in <5 mins a day.*", lede, one orange CTA "Start your 7 day free trial", trust strip; floating
   phone cycling three app screens; khatam pattern + cursor glow behind.
2. **The Gap** (problem) — centred italic Playfair quote "“I'll learn more about my deen when life
   slows down.”", a 48×2px orange rule, the orange italic answer "It never slows down.", then a short
   paragraph.
3. **Scholars** (cream) — "Built with *scholars and leaders* in their fields." Carousel of three
   people: portrait, specialism chip, credentials, pull-quote.
4. **Topics** — "Over 1,000,000 Muslims asked us their hardest questions… *We turned the answers
   into lessons.*" Text left, 2×2 grid of topic tiles right.
5. **Stats + Reviews** — three-cell stats strip (Muslims · average rating · verified reviews,
   counting up), then "Real Muslims. *Real practice.*" with six testimonial cards.
6. **FAQ** (cream) — "Everything *worth asking.*" Accordion of six questions.
7. **Final CTA** (cream, gold hairline on top, faint pattern) — "Live Islam, not just *learn it.*",
   orange button "Start now", note "7 days free · Cancel anytime".
8. **Footer** (near-black).

## Components

The frontmatter lists exact values. The patterns that make it recognisably Niyyah:

- **Tint chip**: colour at 6–8% fill, 0.5px border of the same colour at ~22%, text in the deep
  shade. Reuse it for every badge, chip and icon background.
- **Primary button**: orange, radius 14px, white 16/600 text, *orange-tinted* glow underneath (not a
  grey shadow), 1px lift on hover.
- **Card**: white or `#F9F8F4`, 0.5px `#E6E5DE` border, radius 18–20px, no resting shadow; on hover
  it lifts 3px and gains `0 4px 14px #0000000F`.
- **Pull-quote**: italic Playfair on half-white, 3px orange left bar, square left corners and 14px
  right corners.
- **Phone mockup**: a 300×616 white device with a 52px radius, a 6px `#F1F0EB` halo ring and a
  long soft shadow, floating 12px over 7s. The screens inside are live HTML in the same design
  language.

## Motion

One easing everywhere, `cubic-bezier(.16, 1, .3, 1)`: fast out, long settle. Content **reveals**
as it scrolls in (fade + 12px rise, 0.7s, staggered 80ms). Ambient motion is slow and constant: the
phone floats, the hero pattern drifts over 90s, and the hero glow follows the cursor. Interaction is
small: 1–3px lifts, an FAQ that slides open, carousel cross-fades. With reduced motion turned on,
every animation is disabled.

## Imagery

- Real photographs only for scholars, cropped 4:5 with the face high (`object-position: center
  25%`), on a soft purple→orange→cream gradient card.
- Emoji as icons (❤️ 💰 🌿 🕌 🏠 🔥), always inside a coloured square or tint, never loose.
- Product shown through the HTML phone, never through stock photos.
- Ornament limited to the khatam star pattern, masked to fade at the edges.

## Voice & copy

Direct, warm and practical. Speaks to busy people ("built for the day you actually live", "It never
slows down."). Trust is stated with specifics: 200K+ Muslims, 4.8★, named scholars with
credentials, "every lesson reviewed". Islamic terms (deen, insha'Allah, tawakkul) are used
naturally, without explanation. CTAs are short and low-friction: "Start now", "7 days free · Cancel
anytime".

## Do's and Don'ts

**Do**
- Keep one orange focal point per view, and put the orange in the italic phrase of the headline.
- Use Playfair 400 for headlines and italic for emphasis; DM Sans for everything else.
- Use 0.5px hairlines, tints at 6–8%, and soft low shadows.
- Alternate `#F9F8F4` and `#FAF8F0` sections; save white for cards.
- Set Arabic in Scheherazade New, right-to-left, in gold-deep.

**Don't**
- Don't use bold serif headlines, all-caps headlines, or more than one italic phrase per heading.
- Don't use saturated teal, purple or gold as backgrounds or buttons — they are tints and icon
  squares only.
- Don't use pure white pages, pure black text, or heavy grey drop shadows.
- Don't use Islamic visual clichés (domes, crescents, green-and-gold) or stock photography.
- Don't use Mulish: it's loaded only for a legacy section.
