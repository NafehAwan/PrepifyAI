# Prepify AI

Board-style MCQ practice for FBISE Class 9. A student picks a subject and chapters, gets a
test built from a real question bank, and sees their score and the right answers the moment
they submit. They can also challenge friends to the same test and climb a leaderboard.

Live: [prepifyaii.vercel.app](https://prepifyaii.vercel.app). Stack: Next.js 16 + React 19 +
TypeScript, Supabase (Postgres + Auth), Groq for the chatbot, hosted on Vercel.

## What students can do

| Feature | Where | Notes |
| --- | --- | --- |
| Sign up / sign in | `/login` | Email or username + password (8+ characters), via Supabase Auth |
| Five subjects | `/subjects` | Physics, Chemistry, Maths, Computer Science, English |
| New test | `/subjects/<subject>/new-test` | Whole book or chosen chapters, 1–30 questions, Easy / Medium / Hard / Mixed |
| Take and review a test | `/tests/<id>` | Marked on the server; answers and explanations appear only after submitting |
| Practise weak chapters | Subject page | Builds a test from the chapters the student scores lowest in |
| Report a question | Test review | Flags a wrong or unclear question for the admin |
| Friend challenges | `/subjects/<subject>/challenge`, `/challenges/<CODE>` | Invite link or code, lobby, same test on a shared clock, results |
| Leaderboard, XP, streaks | `/leaderboard` | All time (default) or Monthly; names shown to 10 characters |
| Progress | `/progress` | Tests taken and scores per subject |
| "Ask Prepi" chatbot | Chat bubble | Study help, powered by Groq; locked during a challenge |
| Help & Feedback | `/support` | Tickets the admin answers |

Owner tools at `/admin`: question reports, support tickets, and Players (see each student,
rename or hide them on the leaderboard, adjust or reset XP, wins, papers and streaks, add
fake leaderboard players).

Not built: past papers, written-answer marking, spaced repetition, account deletion and a
privacy page. The `past_papers`, `slo_frequency`, `review_queue` and `content_chunks` tables
in `supabase/schema.sql` are reserved for later and unused by the app.

## The question bank

About 3,970 MCQs are loaded into the `questions` table (Chemistry 1,210, Physics 965, Maths 787,
Computer Science 541, English 468). Their source files are in `content/mcq-bank/`. Each
question records in its file where its answer came from:

| Answer source | Count | Checked by a person? |
| --- | --- | --- |
| `file`: the answer key in the source document | about 920 | Yes, from the original source |
| `computed`: numerical variants recalculated by script | about 920 | Calculated, not reviewed |
| `derived`: no key in the file, so AI worked the answer out | about 970 | **No** |
| `authored`: questions written by AI (all of English, plus variants) | about 1,070 | **No** |

So roughly half the bank still needs a human check before it can be trusted. List the
AI-derived ones with `node scripts/check-bank.mjs --derived --sample=50`. The answer source
is not yet stored in the database, so the app can't hide unchecked questions; adding that is
the next content task.

| Script | What it does |
| --- | --- |
| `scripts/ingest-mcqs.mjs`, `scripts/ingest_docx.py` | Turn the source .docx / .pdf files into `content/mcq-bank/*.json` |
| `scripts/derive-answers.mjs` | Fills in answers the source files left out (marks them `derived`) |
| `scripts/generate-variants.mjs`, `scripts/compile-authored.mjs`, `scripts/generate-english-bank.mjs` | Reworded and re-valued variants, and the English bank |
| `scripts/check-bank.mjs` | Validates the bank, prints samples, checks test variety |
| `scripts/load-mcq-bank.mjs` | Loads the bank into Supabase (re-runnable; replaces a chapter's bank rows) |

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # strict TypeScript
```

With no Supabase settings the app opens in demo mode with sample data.

### Set up Supabase

1. Create a Supabase project and run, in the SQL editor, in this order: `supabase/schema.sql`,
   `challenges.sql`, `usernames.sql`, `engagement.sql`, `support.sql` (then add yourself to
   `app_admins`, as the top of the file explains), `players.sql`, `security.sql` and its
   LOCKDOWN section last.
2. Copy `.env.local.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
3. `npm run seed` for the subjects and chapters, then `node scripts/load-mcq-bank.mjs` for the
   questions.
4. Set `GROQ_API_KEY` (free at console.groq.com) for the chatbot. Tests work without it.
5. In Supabase → Authentication: keep **Confirm email on** once real students sign up (turn it
   off only for local testing), turn on **Leaked Password Protection**, and set the minimum
   password length to 8.

On Vercel, set the same environment variables under Project → Settings → Environment Variables.

`.mcp.json` registers the Supabase MCP server so a local Claude Code session can run SQL and
migrations against the project.

## How it works

- **Tests** are built by the `create_test` database function (`supabase/security.sql`): one
  version per question family, in the chosen difficulty first, avoiding questions from the
  student's last five tests, with questions and options shuffled. The browser gets the
  questions without answers; `submit_test` marks them, saves the score and only then returns
  the answers. No AI is involved, so tests cost nothing to run.
- **Challenges, reports, tickets, XP and the leaderboard** go through security-definer
  functions in `supabase/*.sql`; students can't read or write those tables directly.
- **Chatbot**: `POST /api/ai/chat` and `POST /api/ai/ping` (`app/api/ai/`, `lib/ai/`). They need
  a signed-in student, refuse cross-site requests, cap request size, and are rate-limited per
  student in the database (`rate_limit_hit`: 12 messages a minute, 200 a day). If
  `PREPIFY_MODEL` is unset, the best model the key can reach is picked automatically.
- **Screens**: one component per screen in `components/screens/`, put together by
  `components/AppShell.tsx`; state lives in `lib/store.tsx`; `lib/routes.ts` maps every screen
  to a real URL so Back, refresh and shared links work.

## Security

- `GROQ_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` stay on the server; `.env*` files are
  git-ignored. Only the Supabase URL and anon key reach the browser, and every table is behind
  row-level security.
- Students see only their own data. Answer keys never reach the browser before submitting.
- Admins are listed in the locked `app_admins` table; every admin function checks it.
- Passwords are handled by Supabase Auth; the app never stores one.
- `next.config.mjs` sets a Content-Security-Policy, `X-Frame-Options: DENY`, `nosniff`, HSTS,
  a strict referrer policy and a Permissions-Policy.

## Launch video

`launch-video/` builds the 29-second promo in 16:9 and 9:16 with HyperFrames. See
`launch-video/README.md`.
