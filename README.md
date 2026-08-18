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
| `content/physics-9.curriculum.json` | Curriculum JSON seed — Physics IX, 2 chapters, each with a complete chapter-test bank (Part B) |
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
2. Run `supabase/schema.sql` in the SQL editor (creates tables, RLS, pgvector, the `handle_new_user` trigger and the RAG helper).
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

## AI backend — bring your own Groq key

The tutor chat and the practice examiner call **Groq** (OpenAI-compatible Chat Completions) through server-side Next.js route handlers (`app/api/ai/`), using the grounded teaching + strict-grading system prompts from the spec:

- **`POST /api/ai/teach`** — the grounded tutor. Answers only from the supplied ground-truth chunks + SLOs and cites SLO codes. Powers the Topic-workspace chat.
- **`POST /api/ai/grade`** — the brutally-honest examiner. Grades a written answer point-by-point against the marking scheme and returns structured JSON (`{awarded, outOf, hits[], missed[], keyword_gaps[], feedback_md, slo_code}`) via Groq's JSON mode. Powers the Practice screen's live feedback.
- **`POST /api/ai/ping`** — validates a key for the Settings "Test connection" button.

**Each student brings their own free Groq key.** In the app, go to **Settings → Connect your AI**, follow the one-minute guide to create a free key at [console.groq.com](https://console.groq.com/keys), and paste it in. The key is stored **only in that browser** (localStorage) and sent per-request in the `x-groq-key` header straight to Groq — it is never written to our database or logged server-side.

For local dev you can instead set a shared fallback `GROQ_API_KEY` in `.env.local` (server-side only). Optionally set `PREPIFY_MODEL` — it defaults to `llama-3.3-70b-versatile`; use `llama-3.1-8b-instant` for faster/cheaper, or any current Groq model id.

Without any key all routes return `{configured:false}` and the UI falls back to canned tutor replies / static examiner feedback, so the demo keeps working with zero setup.

## Live curriculum (DB-driven loop)

When Supabase is configured, the core loop reads real content from the database (`lib/curriculum.ts`, browser client under public-read RLS):

- **My Subjects → Chapters** — opening a subject loads its real chapter tree (chapters + topics) from the DB. Subjects without seeded content show a friendly "still ingesting" state; Physics IX is fully seeded.
- **Topic workspace** — the reading pane renders the topic's real SLOs and textbook `content_md`, SLO by SLO. The **AI tutor is RAG-grounded on that topic's real content chunks** (the teach route receives the topic's SLO text as ground truth), and the **quiz is the topic's real MCQ bank** from `questions`, scored against a 70% pass bar.
- **Mastery persistence + unlocking** — passing a topic quiz writes to `topic_progress`. The chapter tree then shows real mastery states, and in guided mode a topic stays locked until every earlier topic is passed. (`lib/supabase/persist.ts`, `computeTopicStates`.)
- **Live analytics** — for a signed-in student the My Subjects grid, Progress coverage heat-map + predicted grades, and Home gauges/weak-spots are computed from saved mastery (`lib/analytics.ts`), not hardcoded.
- **Chapter tests** — each chapter's real FBISE-style paper (25 MCQ + 7 short + 2 long) is assembled from the question bank (`getChapterTest`). MCQs auto-mark; the written section is graded by the Groq examiner when a key is connected (otherwise the paper scores on its MCQ section and shows model answers for self-review). Results roll into `chapter_attempts` + `chapter_progress`, and the chapter tree shows a passed badge with your best score.

In demo mode (no Supabase) these screens fall back to the static Physics sample, so everything still runs with zero setup. All persistence + analytics are gated on being signed in.

Still on demo data (pending further build-out): spaced-repetition reviews, streak/XP, the study-plan queue, DB-backed mock-exam scoring, and RAG retrieval of chunks from the DB (the tutor currently grounds on the topic's supplied text; the `match_topic_chunks()` helper + embeddings are ready to wire in).

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
