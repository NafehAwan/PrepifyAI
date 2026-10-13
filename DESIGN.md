# Prepify design system: "Level Map"

The owner picked this world from fourteen picture directions (option O). Practice is a journey: each subject is a map of chapter stops, finished chapters turn gold with stars, and Prepi, a purple blob with a gold antenna star, walks it with the student. The old warm brown/cream look (Caprasimo, Figtree, the owl) and the Niyyah-style redesign are retired; don't bring them back.

Source of truth in code: `lib/theme.ts` (tokens and button helpers), `app/globals.css` (fonts, motion, browser surfaces), `lib/subjects.ts` (subject colours and icons), `components/Mascot.tsx` (Prepi), `components/Icon.tsx` (icons).

## Colour

| Token | Hex | Use |
|---|---|---|
| `C.bg` | #EAF6FF | page background, pale sky |
| `C.card` | #FFFFFF | surfaces |
| `C.ink` / `C.ink2` | #20244A / #3E4370 | text |
| `C.muted` | #5C6185 | secondary text (6:1 on white) |
| `C.accent` | #6C4CF5 | Prepi purple: primary actions, selection, links (white text 5.3:1) |
| `C.accentD` / `C.tint` | #4F31D6 / #EFEAFF | purple edge, text on tint / purple wash |
| `C.go` / `C.goD` | #E85D0C / #B8470A | orange play buttons (Start, Next, Submit). Large text only: white on it is 3.5:1 |
| `C.gold` / `C.goldD` | #FFC93C / #D99A00 | stars, finished map stops |
| `C.sage` / `C.sageD` / `C.sageT` | #1FA855 / #137A3C / #DDF7E6 | right answers, passed |
| `C.danger` / `C.dangerT` | #D93A3F / #FDE8E8 | wrong answers, low scores, errors |
| `C.line` / `C.sand` | #DCE3F2 / #EEF1FA | dividers, neutral chips and tracks |

Map scenery: sky #7FD3FF fading to #E9FFE6, hills #7EE07A and #66D464, white clouds.

Subjects each own a colour, icon and darker edge (`subjectLook()`): Physics orange #FF7A2F (atom), Chemistry teal #14A99A (flask), Maths pink #F2539A (sigma), Computer Science blue #2F8CFF (code brackets), English green #22B35E (open book).

Map stop states: gold (done, 60%+ with 5+ answers, with 1–3 stars at 60/75/90%), coral #FF6B6B (weak: under 60%), blue #41A6F6 (started), white (not tried), orange glowing (the next stop), purple trophy (whole-book test at the end).

## Type

- **Baloo 2** (`var(--font-display)`, `FD`) for headings, buttons, numbers, labels on the map. Weight 700–800.
- **Nunito** (`var(--font-body)`) for everything you read. Body weight 600, 15px base.
- Both are self-hosted latin subsets in `/public/fonts`, preloaded in `app/layout.tsx`. No Google Fonts request.
- Numbers are tabular everywhere. No uppercase eyebrow labels and no letter-spaced kickers.

## Shape and depth

- Elevation is a **solid edge, not a blur**: surfaces use `boxShadow: 0 4px 0 #D3DAEC`, and coloured blocks use their own darker edge. One elevation per element: no border plus shadow.
- Buttons: `btn3d(bg, edge)` gives a solid colour on a darker 4px edge, radius 16, Baloo 2. Add `className="pf-press"` so it sinks onto its edge when pressed.
- Radii: cards 20–22, buttons 14–16, map panel 28, pills 999 for small toggles only.
- Overlays (the "More" sheet, a map stop's sheet) are bottom sheets that slide up, with a navy scrim.

## Layout

- Phone (≤820px): a slim sticky top bar (logo or screen title, streak, weekly XP, avatar to Settings), and a bottom tab bar: Home, Subjects, Mock, Ranks, More. The tab bar hides during a test or challenge.
- Laptop, desktop and tablet: a white sidebar with every section, content up to 1180px wide. Home splits into the map and a 340px side panel.
- Taking a test is one question at a time: a progress bar, numbered jump buttons, Prepi asking the question in a speech bubble, four chunky options, and a fixed bottom bar with Back and Next (Submit on the last question).

## Prepi

`<Mascot mood size />`, inline SVG with no image download. Moods: idle, happy, celebrate, thinking, sad, wave, wink, proud, curious, sleepy, book. Prepi stands beside the next map stop, asks test questions, reacts on results, and fronts the chat ("Ask Prepi").

## Motion

- The one authored moment is the **reward**: the result score counts up (NumberTicker), stars pop in one by one, and gold star confetti bursts on a pass (Confetti "Stars"). Both pieces are from the 21st.dev registry (Magic UI), adapted in `components/fx.tsx`. The springy pop easing (`--ease-soft`) is kept for these game rewards on purpose; the detector flags it as advisory.
- The map's next stop floats with a ripple ring; Prepi bobs and blinks; clouds drift.
- Screen changes fade (opacity only, so fixed bars and sheets stay anchored).
- Everything respects `prefers-reduced-motion` and the Settings → "Reduce animations" switch, which also skips the confetti.

## Icons

Stroke icons on a 24px grid at 2.4–3 stroke (`StrokeIcon`, `Glyph`, `Medal`). No emoji or Unicode glyphs as icons.

## Browser surfaces

Selection is gold on navy, the caret and form controls are purple, focus rings are a 3px purple outline, and scrollbars are soft blue-grey. The theme colour is sky blue.
