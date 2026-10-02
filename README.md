# Prepify AI

An AI study platform that takes any FBISE student (Class 9–12) from wherever they are to the top of the board. Built around a strict **teach → test → grade → unlock** core learning loop, wrapped in a warm "board year" dashboard.

This repo contains a **working Next.js + TypeScript port of the full design prototype** (`Prepify AI.dc.html`), plus the database foundation and seed content.

## What's here

| Path | What it is |
| --- | --- |
| `app/`, `components/`, `lib/` | The dashboard app — every screen from the design, pixel-faithful, fully interactive |
| `lib/supabase/`, `middleware.ts` | Supabase auth (SSR clients, session middleware, query + persistence layer) |
| `app/login/` | Email/password sign in / sign up UI + server actions |
| `app/api/ai/`, `lib/ai/` | AI backend — grounded tutor (`/api/ai/teach`) + brutally-honest examiner (`/api/ai/grade`) via the Claude API |
| `supabase/schema.sql` | Postgres schema + RLS + pgvector, indexes, `handle_new_user` trigger and a RAG retrieval helper (Part A of the spec) |
| `supabase/players.sql` | Leaderboard periods (All time / Monthly, names cut to 10 characters) and the admin Players tools: player details, rename, remove from the leaderboard, set XP / wins / papers / streak, reset scores, and fake leaderboard players (re-runnable) |
| `supabase/security.sql` | Server-side test building and marking (answer keys never reach the browser), the API rate limiter, and the table lockdown (re-runnable) |
| `supabase/support.sql` | Help & Feedback tickets and the /admin portal; admins live in the locked `app_admins` table (re-runnable) |
| `supabase/engagement.sql` | Question reports (read them via the `question_report_summary` view), per-chapter results, XP, streaks and the global leaderboard (re-runnable) |
| `supabase/usernames.sql` | Usernames on profiles, plus sign-in by username without exposing emails (re-runnable) |
| `supabase/challenges.sql` | Friend challenges: tables with no RLS policies plus the security-definer functions that are the only way in (re-runnable) |
| `content/physics-9.curriculum.json` | Curriculum JSON seed — Physics IX chapters + topics + textbook text (tests are generated from that text at runtime, not pre-seeded) |
| `scripts/seed.mjs` | Loads the curriculum into Supabase (`npm run seed`) |
| `Prepify AI.dc.html` | The original design prototype this app reproduces |

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

With no configuration the app runs in **demo mode** — every screen works with sample data, no login required.

Other scripts:

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit (strict, zero `any`)
npm run seed       # load the curriculum into Supabase (needs env, see below)
```

## Accounts + saved data (Supabase)

The app has real email/password auth and persists your profile. To turn it on:

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (creates tables, RLS, pgvector, the `handle_new_user` trigger and the RAG helper), then `supabase/challenges.sql` for friend challenges `supabase/usernames.sql` for username sign-in, `supabase/engagement.sql` for question reports, weak-chapter stats, XP, streaks and the leaderboard, `supabase/support.sql` for Help & Feedback tickets and the admin portal (then add yourself as admin — see the top of that file), `supabase/players.sql` for the leaderboard periods and admin player tools, and finally `supabase/security.sql` (then its LOCKDOWN section) so tests are built and marked on the server.
3. Copy `.env.local.example` → `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. `npm run seed` to load the Physics IX curriculum (also creates all nine subject rows so enrolments resolve).
5. For the smoothest local dev, disable “Confirm email” in Supabase → Authentication → Providers → Email (otherwise new sign-ups must confirm before signing in).
6. `npm run dev`.

**What's real once configured:**

- **Auth** — sign up / sign in / sign out with cookie-based sessions; middleware refreshes the session and redirects unauthenticated users to `/login`. A profile row is auto-created on sign-up.
- **Onboarding → DB** — finishing (or skipping) onboarding writes class, track, exam date, study mode and subject enrolments to `profiles` + `enrollments` (owner-only under RLS).
- **Settings → DB** — changing class, exam date, study mode, language or subjects persists immediately.
- **Read-back** — on load, the dashboard hydrates from your real profile: greeting, top-bar avatar, class/track, exam-day countdown, study mode, and the Subjects grid reflect your saved data and enrolments.

If Supabase isn't configured, all of the above degrade gracefully to the demo experience — the persistence calls are no-ops and `/` renders without a login gate.

### Supabase MCP (optional, for Claude Code)

`.mcp.json` registers the [Supabase MCP server](https://supabase.com/docs/guides/getting-started/mcp) for this project so a local Claude Code session can apply migrations, run SQL, and manage the linked project directly (it authorises over OAuth on first use). Open the project in Claude Code and approve the `supabase` server when prompted.

## AI backend — one shared Groq key

The "Ask Prepify" chatbot calls **Groq** (OpenAI-compatible Chat Completions) through server-side
Next.js route handlers under `app/api/ai/`:

- **`POST /api/ai/chat`** — the study assistant behind the chat bubble.
- **`POST /api/ai/ping`** — a tiny request that confirms the key works, behind the Settings button.

Both need a signed-in student (401 otherwise), refuse cross-site requests, cap the request size,
and are rate-limited per student in the database (`rate_limit_hit` in `supabase/security.sql`;
chat: 12 a minute and 200 a day) because the shared key's rate limit is per key. Errors from Groq
are logged on the server and the browser gets a plain message instead.

**The owner sets one `GROQ_API_KEY` on the server** and every student gets the chatbot with zero
setup. `isAiConfigured()` surfaces this to the UI as `AppState.aiConfigured`, which suppresses all
"connect your key" prompts. A browser may still override with its own key via the `x-groq-key`
header, which is handy for local development; that key is never stored server-side.

`PREPIFY_MODEL` is optional — leave it unset and `pickModel()` discovers the best model the key can
actually reach (Groq retires model ids, so pinning one is a liability).

### What this costs at ~100 students

Tests cost **nothing**: questions are sampled from the `questions` table in Postgres, so test-taking
scales independently of any API limit and keeps working with no key at all. The chatbot is the only
runtime consumer. Groq's free tier is rate-limited per key, so a class chatting at once will hit it;
the per-student throttle softens that, and Groq's pay-as-you-go tier costs a few dollars a month at
this scale.

## Tests (DB-driven)

When Supabase is configured, a test is built on the server by `create_test`
(`supabase/security.sql`) from the `questions` bank: one version per question family, in the
chosen difficulty band first, avoiding what the student met in their last five tests, with
questions and options shuffled. The browser receives the questions without answers;
`submit_test` marks them against the hidden key, saves the score and only then releases the
answers and explanations for the review. Nothing here calls the AI.

In demo mode (no Supabase) the screens fall back to sample data, so everything still runs with
zero setup.

## The dashboard

Every screen in the prototype is reproduced as a real React component and reachable from the sidebar / top bar:

- **Onboarding** — 5-step wizard (class → track → subjects → exam date → placement diagnostic) with the two layout variants (Focused / Split).
- **Home** — bento and focus-rail variants: Continue-where-you-left-off, Reviews due, Today's Plan, predicted-grade gauges, weak spots.
- **My Subjects** — subject grid with mastery + predicted grade.
- **Chapter tree** — guided vs free-roam mode, per-topic lock/mastery states.
- **Topic workspace** — grounded reading pane + AI tutor chat + SLO-based mastery quiz (3-pane and reading+tabs variants).
- **Practice & feedback** — the "brutally-honest examiner": marks awarded point-by-point, missed keywords named, model answer shown (side-by-side and annotated variants).
- **Mock exam** — timed simulator (intro → running with paper map → results with predicted grade).
- **Progress** — SLO coverage heat-map + predicted aggregate.
- **Study Plan** — high-ROI ranked queue + spaced-repetition reviews.
- **Reviews** — spaced-repetition card session.
- **Settings** — class, subjects, mode, language, data saver, reminders.
- **Mobile preview** — phone-frame overlay (tap the phone icon in the top bar) with dedicated Home / Subjects / Chapters / Topic layouts.

The colour system, typography (Caprasimo + Figtree) and every layout come straight from the design prototype and live in `lib/theme.ts`.

## Architecture

- **State** — a single typed store (`lib/store.tsx`, React context) mirrors the prototype's state machine: current screen, layout variants, study mode, chat, quiz, mock timer, settings.
- **Data** — the demo content lives in `lib/data.ts`; in production these tables come from Supabase (`supabase/schema.sql`).
- **Screens** — one component per screen under `components/screens/`, composed by `components/AppShell.tsx`.

The dashboard UI plus **real Supabase auth and profile/onboarding/settings persistence** are done (Phase 0–1). Auth uses `@supabase/ssr` (`lib/supabase/{client,server,middleware}.ts`), the query layer lives in `lib/supabase/queries.ts`, and browser-side writes are in `lib/supabase/persist.ts`. The AI edge functions (`/ai/teach`, `/ai/topic-quiz`, `/ai/chapter-test`, `/ai/grade`, …), RAG chunk embedding, and DB-backed progress/analytics are the next phase.

## Database & grounding

`supabase/schema.sql` defines the full curriculum, assessment, learning-state and observability tables with:

- **RLS** — curriculum + question bank are public-read; every per-user table is owner-only (`auth.uid() = user_id`).
- **pgvector** — `content_chunks.embedding vector(768)` with an ivfflat index, and a `match_topic_chunks()` helper that retrieves **only the current topic's chunks** so the tutor stays inside syllabus scope.
- Hot-path indexes on `topic_progress`, `chapter_progress` and `review_queue(user_id, due_at)`.

## Content note

The seed in `content/physics-9.curriculum.json` is **AI-drafted** and, per the content pipeline, must be **human-verified before it is shown to students** — never ship unverified exam content.

## Security

- **Secrets** — `GROQ_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-only (no `NEXT_PUBLIC_`
  prefix) and `.env*` files are git-ignored. Only the Supabase URL and anon key reach the browser,
  which is what they're designed for: every table is behind row-level security.
- **Data access** — students read and write only their own rows. Tests are created and marked by
  `create_test` / `submit_test` on the server, so answers stay hidden until submitting and scores
  can't be forged; challenges, tickets, reports and the leaderboard go through security-definer
  functions too. The question bank itself isn't readable from the browser.
- **Admin** — admins are listed in the locked `app_admins` table; every admin function checks it,
  and `/admin` redirects anyone else home. Admin → Players shows each student's details and renames
  them on the leaderboard, takes them off it, sets their XP, wins, papers or streak, or resets
  their scores; it also makes and edits fake leaderboard players (`player_overrides`,
  `xp_adjustments` and `fake_players`, which students can't read or write). Nothing is deleted,
  so every change can be undone.
- **Passwords** — handled entirely by Supabase Auth (bcrypt-hashed; the app never stores one).
  Sign-up asks for 8+ characters.
- **Headers** — a Content-Security-Policy, `X-Frame-Options: DENY`, `nosniff`, HSTS, a strict
  referrer policy and a Permissions-Policy are set in `next.config.mjs`; `X-Powered-By` is off.
