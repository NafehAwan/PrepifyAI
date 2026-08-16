-- ============================================================================
-- Prepify AI — Supabase Postgres schema (Part A of the build spec)
--
-- Design goals:
--   * Curriculum tables are PUBLIC-READ (any authenticated student can read the
--     syllabus, textbook chunks and question bank), but writable only by the
--     service role / content pipeline.
--   * Every per-user learning-state table is protected by RLS so a student can
--     only ever see and mutate their own rows (auth.uid() = user_id).
--   * pgvector for RAG retrieval, with an ivfflat index on embeddings.
--   * Hot-path indexes on topic_progress, chapter_progress and the review queue.
--
-- Run inside the Supabase SQL editor (or `supabase db push`). It is idempotent
-- enough to re-run in a fresh project; drop-and-recreate for a clean slate.
-- ============================================================================

create extension if not exists "vector";      -- pgvector
create extension if not exists "pgcrypto";    -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- 1. CURRICULUM  (public read, service-role write)
-- ---------------------------------------------------------------------------

create table if not exists subjects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  name_ur     text,
  track       text                       -- pre_eng | pre_med | ics | general
);

create table if not exists books (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references subjects(id) on delete cascade,
  class_level int  not null,             -- 9 | 10 | 11 | 12
  edition     text
);

create table if not exists chapters (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid not null references books(id) on delete cascade,
  seq         int  not null,
  title       text not null,
  title_ur    text,
  unique (book_id, seq)
);

create table if not exists topics (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  uuid not null references chapters(id) on delete cascade,
  seq         int  not null,
  title       text not null,
  title_ur    text,
  est_minutes int  default 20,
  unique (chapter_id, seq)
);

create table if not exists slos (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references topics(id) on delete cascade,
  code        text not null,             -- e.g. PHY-9-1.1.1
  statement   text not null,
  statement_ur text,
  bloom_level text,                       -- remember|understand|apply|analyse|evaluate|create
  unique (code)
);

create table if not exists content_chunks (
  id          uuid primary key default gen_random_uuid(),
  slo_id      uuid not null references slos(id) on delete cascade,
  seq         int  not null,
  content_md  text not null,
  content_ur_md text,
  embedding   vector(768),
  token_count int
);

-- ---------------------------------------------------------------------------
-- 2. ASSESSMENT  (public read, service-role write)
-- ---------------------------------------------------------------------------

create table if not exists questions (
  id            uuid primary key default gen_random_uuid(),
  slo_id        uuid references slos(id) on delete set null,
  chapter_id    uuid references chapters(id) on delete cascade,
  type          text not null,            -- mcq | short | long
  category      text not null,            -- concept | exercise
  source        text not null,            -- book | exercise | past_paper | authored
  bloom_level   text,
  difficulty    int  default 1,           -- 1..5
  stem_md       text not null,
  stem_ur_md    text,
  options_json  jsonb,                     -- MCQ options ["A","B","C","D"]
  answer_key_md text,                      -- correct option / short key
  marking_scheme_json jsonb,               -- ["point keyword (1)", ...]
  marks         int  default 1
);

create table if not exists model_answers (
  id                 uuid primary key default gen_random_uuid(),
  question_id        uuid not null references questions(id) on delete cascade,
  exemplar_md        text not null,
  mark_breakdown_json jsonb
);

create table if not exists examiner_traps (
  id        uuid primary key default gen_random_uuid(),
  topic_id  uuid not null references topics(id) on delete cascade,
  trap_md   text not null
);

create table if not exists past_papers (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references subjects(id) on delete cascade,
  class_level int  not null,
  year        int,
  session     text,
  tos_json    jsonb                        -- table of specifications
);

create table if not exists past_paper_questions (
  paper_id    uuid not null references past_papers(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  paper_seq   int,
  primary key (paper_id, question_id)
);

create table if not exists slo_frequency (
  slo_id       uuid primary key references slos(id) on delete cascade,
  appearances  int  default 0,
  total_papers int  default 0,
  yield_rank   int
);

-- ---------------------------------------------------------------------------
-- 3. USER & LEARNING STATE  (RLS: owner-only)
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text default 'student',
  class_level int,
  track       text,
  medium      text default 'english',     -- english | urdu
  exam_date   date,
  locale      text default 'en',
  mode        text default 'guided'       -- guided | free | topper
);

create table if not exists enrollments (
  user_id    uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  primary key (user_id, subject_id)
);

create table if not exists placement (
  user_id        uuid not null references auth.users(id) on delete cascade,
  subject_id     uuid not null references subjects(id) on delete cascade,
  level_estimate text,
  taken_at       timestamptz default now(),
  primary key (user_id, subject_id)
);

create table if not exists topic_progress (
  user_id    uuid not null references auth.users(id) on delete cascade,
  topic_id   uuid not null references topics(id) on delete cascade,
  status     text default 'locked',       -- locked | teaching | tested | completed
  taught_at  timestamptz,
  mcq_score  numeric,
  mcq_passed boolean default false,
  attempts   int default 0,
  updated_at timestamptz default now(),
  primary key (user_id, topic_id)
);

create table if not exists chapter_progress (
  user_id       uuid not null references auth.users(id) on delete cascade,
  chapter_id    uuid not null references chapters(id) on delete cascade,
  status        text default 'locked',    -- locked | in_progress | test_ready | passed | failed
  best_score_pct numeric default 0,
  passed        boolean default false,
  unlocked_next boolean default false,
  updated_at    timestamptz default now(),
  primary key (user_id, chapter_id)
);

create table if not exists chapter_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  chapter_id  uuid not null references chapters(id) on delete cascade,
  score_pct   numeric,
  passed      boolean,
  report_json jsonb,                       -- full per-question breakdown
  taken_at    timestamptz default now()
);

create table if not exists slo_performance (
  user_id       uuid not null references auth.users(id) on delete cascade,
  slo_id        uuid not null references slos(id) on delete cascade,
  correct       int default 0,
  total         int default 0,
  last_accuracy numeric,
  primary key (user_id, slo_id)
);

create table if not exists review_queue (
  user_id       uuid not null references auth.users(id) on delete cascade,
  slo_id        uuid not null references slos(id) on delete cascade,
  due_at        timestamptz not null default now(),
  interval_days int default 1,
  ease          numeric default 2.5,
  primary key (user_id, slo_id)
);

create table if not exists daily_plan (
  user_id        uuid not null references auth.users(id) on delete cascade,
  date           date not null,
  tasks_json     jsonb,
  completed_json jsonb,
  primary key (user_id, date)
);

create table if not exists attempts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  question_id    uuid not null references questions(id) on delete cascade,
  response_md    text,
  awarded_marks  numeric,
  out_of         numeric,
  ai_feedback_json jsonb,                  -- {awarded,outOf,hits[],missed[],keyword_gaps[],feedback_md,slo_code}
  created_at     timestamptz default now()
);

create table if not exists mistake_book (
  user_id     uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  added_at    timestamptz default now(),
  resolved    boolean default false,
  primary key (user_id, question_id)
);

create table if not exists mock_exams (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  subject_id      uuid not null references subjects(id) on delete cascade,
  score_pct       numeric,
  predicted_grade text,
  taken_at        timestamptz default now(),
  report_json     jsonb
);

create table if not exists predicted_score (
  user_id    uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  pct        numeric,
  confidence numeric,
  updated_at timestamptz default now(),
  primary key (user_id, subject_id)
);

create table if not exists streaks (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  current          int default 0,
  longest          int default 0,
  last_active_date date
);

create table if not exists xp_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  delta      int not null,
  reason     text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 4. COST / OBSERVABILITY  (owner-only read; edge functions write via service role)
-- ---------------------------------------------------------------------------

create table if not exists ai_calls (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,
  route             text,
  model             text,
  prompt_tokens     int,
  completion_tokens int,
  cost_usd          numeric,
  cached            boolean default false,
  created_at        timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 5. INDEXES
-- ---------------------------------------------------------------------------

-- Vector similarity for RAG retrieval (retrieve only the current topic's chunks).
create index if not exists content_chunks_embedding_idx
  on content_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create index if not exists content_chunks_slo_idx     on content_chunks(slo_id);
create index if not exists slos_topic_idx             on slos(topic_id);
create index if not exists questions_chapter_idx      on questions(chapter_id);
create index if not exists questions_slo_idx          on questions(slo_id);
create index if not exists topic_progress_user_idx    on topic_progress(user_id);
create index if not exists chapter_progress_user_idx  on chapter_progress(user_id);
create index if not exists review_queue_due_idx       on review_queue(user_id, due_at);
create index if not exists attempts_user_idx          on attempts(user_id, created_at desc);
create index if not exists ai_calls_user_idx          on ai_calls(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

-- 6a. Curriculum + assessment: public read for any authenticated user; writes
--     go through the service role (which bypasses RLS), so we add read-only policies.
do $$
declare t text;
begin
  foreach t in array array[
    'subjects','books','chapters','topics','slos','content_chunks',
    'questions','model_answers','examiner_traps','past_papers',
    'past_paper_questions','slo_frequency'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy %1$I_read on %1$I
      for select to authenticated using (true);
    $f$, t);
  end loop;
end $$;

-- 6b. Per-user tables: owner-only for every operation (auth.uid() = user_id).
do $$
declare t text;
begin
  foreach t in array array[
    'enrollments','placement','topic_progress','chapter_progress',
    'chapter_attempts','slo_performance','review_queue','daily_plan',
    'attempts','mistake_book','mock_exams','predicted_score','streaks',
    'xp_ledger','ai_calls'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy %1$I_owner on %1$I
      for all to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;

-- 6c. profiles keyed on id (= auth.users.id), owner-only.
alter table profiles enable row level security;
create policy profiles_owner on profiles
  for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 8. Auto-create a profile row whenever a new auth user signs up, so the app
--    always has a profile to read/update (onboarding fills in the details).
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role) values (new.id, 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 9. RAG retrieval helper — return the top-k chunks for the CURRENT topic only,
--    so the tutor is grounded strictly in the syllabus scope it is teaching.
-- ---------------------------------------------------------------------------

create or replace function match_topic_chunks(
  p_topic_id uuid,
  p_query    vector(768),
  p_k        int default 6
)
returns table (id uuid, slo_id uuid, slo_code text, content_md text, similarity float)
language sql stable
as $$
  select c.id, c.slo_id, s.code,
         c.content_md,
         1 - (c.embedding <=> p_query) as similarity
  from content_chunks c
  join slos s on s.id = c.slo_id
  where s.topic_id = p_topic_id
  order by c.embedding <=> p_query
  limit p_k;
$$;
