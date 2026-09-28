-- Adds the `tests` table to an already-created database.
--
-- supabase/schema.sql is the source of truth for a fresh install, but its RLS
-- block uses bare `create policy` and is therefore not re-runnable. This script
-- is idempotent, so it is the safe way to apply the table to the live project.

create table if not exists tests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  subject_id     uuid not null references subjects(id) on delete cascade,
  seq            int  not null,
  title          text not null,
  difficulty     text not null,
  question_count int  not null check (question_count between 1 and 30),
  questions_json jsonb not null,
  answers_json   jsonb,
  correct_count  int,
  score_pct      numeric,
  remarks        text,
  status         text not null default 'in_progress',
  created_at     timestamptz default now(),
  submitted_at   timestamptz,
  unique (user_id, subject_id, seq)
);

create index if not exists tests_user_subject_idx
  on tests(user_id, subject_id, created_at desc);

alter table tests enable row level security;

-- Owner-only, matching the policy the schema generator creates for every other
-- per-user table. Dropped first so re-running this file is safe.
drop policy if exists tests_owner on tests;
create policy tests_owner on tests
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
