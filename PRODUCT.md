# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Phone-first: design for phones, then laptops, desktops and tablets (confirmed by the owner).

## Users
FBISE Class 9 students in Pakistan (roughly 14–15 years old) preparing for their board exams. They open Prepify between school, tuition and home, mostly on a phone, often on a slow or patchy connection, to practise MCQs in short sessions and to race friends.

## Product Purpose
Prepify turns the FBISE syllabus into MCQ tests a student can take in minutes. A student picks a subject, chapters, how many questions (1–30) and how hard, takes the test, and is marked instantly with every right answer shown. Success: students practise often, see their weak chapters improve, and walk into the board paper having already met its question style.

## Positioning
Built on real FBISE question banks (thousands of chapter-tagged MCQs, board-style scenario questions included), marked on the server so scores can't be faked, and free to use. Tests cost nothing to run because they come straight from the bank, not from AI.

## Operating Context
- Subjects: Physics, Chemistry, Maths, Computer Science, English.
- Flows: My Subjects → subject → New test (chapters, count, difficulty) → take test → results and answer review → report a wrong question.
- Mock Exam: timed Chemistry papers (chapters 1, 2, 3, 4, 6, 8, 9, 13, 14), up to 60 MCQs, chosen time limit, hands itself in at 0:00.
- Friend challenges: invite code or link, lobby, the same test on a shared clock, results.
- Weak-chapter practice, Progress, Leaderboard (XP, streaks, all-time and monthly), Help & Feedback tickets, Settings, an onboarding flow, and the "Ask Prepi" study chatbot.
- Owner-only Admin portal (reports, tickets, players).

## Capabilities and Constraints
- Next.js 16 / React 19, deployed on Vercel at prepifyaii.vercel.app; Supabase for auth and data.
- Styling is inline styles driven by tokens in `lib/theme.ts`, plus `app/globals.css`; no CSS framework yet.
- Must stay fast on slow mobile networks and low-end Android phones.
- Content is English; the chatbot answers in Urdu or Roman Urdu when the student writes that way.
- Islamic phrases are spelled "Masha'Allah", "In sha' Allah".

## Brand Commitments
- Name: Prepify (written "Prepify AI" in the app).
- The owner chose a fresh start: the current logo, Prepi the owl mascot and the warm orange palette are not binding.
- Rejected directions: the original warm brown/cream look with Caprasimo and Figtree, and a Niyyah-style redesign (off-white, Playfair Display serif headlines, one orange accent). The owner found the Niyyah version too plain and boring, too similar to the old look, wrong in its fonts (serif headlines), and not like Prepify.

## Evidence on Hand
- Real question banks: `content/mcq-bank/` (about 4,250 MCQs across five subjects), including the mock pool in `content/mcq-bank/mock/`.
- Live app usage data in Supabase (tests, XP, streaks, leaderboards).
- No testimonials, ratings, user counts or press exist; do not invent any.

## Product Principles
- Get a student into a test in seconds; every extra tap costs practice.
- Show the truth: marks, right answers and weak chapters, never vanity numbers.
- Make practice feel like progress and a little like a game (streaks, XP, challenges), without hiding the learning.
- Work well on a cheap phone on a slow connection.

## Accessibility & Inclusion
Readable on small phone screens in bright light; tap targets sized for thumbs; works without heavy animation (a "Reduce animations" setting exists).
