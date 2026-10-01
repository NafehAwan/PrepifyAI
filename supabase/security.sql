-- ---------------------------------------------------------------------------
-- Security hardening.
--
--  1. Tests are built and marked on the server. The browser never sees an
--     answer key before submitting, and can't write its own score — before
--     this, a student could set correct_count on their own test row and top
--     the leaderboard, or read any answer through the API mid-challenge.
--  2. A database-backed rate limiter for the API routes (works across every
--     serverless instance, unlike an in-memory counter).
--  3. Fixes from Supabase's security advisor.
--  4. LOCKDOWN (bottom section): tests become read-only for students and the
--     answer columns of `questions` are hidden. Apply it only after the app
--     version that uses create_test/submit_test is live, or the old app's
--     test flow breaks.
--
-- Re-runnable: safe to apply more than once.
-- ---------------------------------------------------------------------------

-- 1. Server-side tests ---------------------------------------------------------

-- The answer key for each test, kept apart from `tests` (which the student can
-- read) until the test is submitted. RLS on, no policies.
create table if not exists test_keys (
  test_id      uuid primary key references tests(id) on delete cascade,
  answers      int[] not null,       -- correct option index per question
  explanations jsonb                 -- explanation per question, or null
);
alter table test_keys enable row level security;

-- Builds a test: one question per family (no two versions of the same
-- question), in the difficulty band first, preferring questions the student
-- hasn't met in their last five tests of this subject, topped up from any
-- difficulty if the band is thin. Options are shuffled unless they point at
-- each other by position ("All of the above", "Both A and B"). The student
-- gets the questions without answers; the key goes to test_keys.
create or replace function public.create_test(
  p_subject_id  uuid,
  p_chapter_ids uuid[],
  p_difficulty  text,
  p_count       int,
  p_scope       text
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid         uuid := auth.uid();
  v_lo          int;
  v_hi          int;
  v_chapters    uuid[];
  v_recent_ids  text[];
  v_recent_fams text[];
  v_qs          jsonb := '[]'::jsonb;
  v_keys        int[] := '{}';
  v_expl        jsonb := '[]'::jsonb;
  v_perm        int[];
  v_opts        jsonb;
  v_answer      int;
  v_seq         int;
  v_id          uuid;
  v_n           int;
  r             record;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if p_count is null or p_count not between 1 and 30 then raise exception 'question count must be 1-30'; end if;
  select d.lo, d.hi into v_lo, v_hi
    from (values ('easy', 1, 2), ('medium', 2, 4), ('hard', 4, 5), ('mixed', 1, 5)) as d(k, lo, hi)
   where d.k = p_difficulty;
  if v_lo is null then raise exception 'unknown difficulty'; end if;
  -- Far more than anyone takes in a day; stops a script filling the table.
  if (select count(*) from tests where user_id = v_uid and created_at > now() - interval '1 day') >= 100 then
    raise exception 'daily test limit';
  end if;

  select array_agg(c.id) into v_chapters
    from chapters c join books b on b.id = c.book_id
   where b.subject_id = p_subject_id
     and (coalesce(array_length(p_chapter_ids, 1), 0) = 0 or c.id = any(p_chapter_ids));
  if v_chapters is null then raise exception 'no chapters for this subject'; end if;

  -- What the student met in their last five tests of this subject.
  select coalesce(array_agg(distinct e ->> 'id'), '{}') into v_recent_ids
    from (select questions_json from tests
           where user_id = v_uid and subject_id = p_subject_id
           order by created_at desc limit 5) t,
         jsonb_array_elements(t.questions_json) e;
  select coalesce(array_agg(distinct coalesce(q.family, q.id::text)), '{}') into v_recent_fams
    from questions q where q.id::text = any(v_recent_ids);

  for r in
    select * from (
      select * from (
        select distinct on (fam) *
          from (
            select q.id, q.stem_md, q.options_json, q.answer_key_md, q.explanation_md,
                   coalesce(q.family, q.id::text) as fam,
                   (q.difficulty between v_lo and v_hi) as in_band,
                   (q.id::text = any(v_recent_ids)) as seen
              from questions q
             where q.chapter_id = any(v_chapters)
               and q.type = 'mcq'
               and q.answer_key_md in ('A', 'B', 'C', 'D')
               and jsonb_typeof(q.options_json) = 'array'
               and jsonb_array_length(q.options_json) = 4
          ) pool
         -- Per family: an in-band version the student hasn't seen, if any.
         order by fam, in_band desc, seen asc, random()
      ) one
      -- In band first; then families they haven't met recently.
      order by in_band desc, (fam = any(v_recent_fams)) asc, seen asc, random()
      limit p_count
    ) picked
    order by random()
  loop
    v_answer := position(r.answer_key_md in 'ABCD') - 1;
    if exists (
      select 1 from jsonb_array_elements_text(r.options_json) o
       where o ~* '\y(above|below)\y|\y(both|either|neither)\y[^.]*\y(\(?[a-d]\)?)\s*(and|or|nor|&)\s*\(?[a-d]\)?(?![a-z])'
    ) then
      v_opts := r.options_json;
    else
      select array_agg(i order by random()) into v_perm from generate_series(0, 3) as i;
      v_opts := jsonb_build_array(r.options_json -> v_perm[1], r.options_json -> v_perm[2],
                                  r.options_json -> v_perm[3], r.options_json -> v_perm[4]);
      v_answer := array_position(v_perm, v_answer) - 1;
    end if;
    v_qs   := v_qs || jsonb_build_array(jsonb_build_object('id', r.id, 'stem', r.stem_md, 'options', v_opts, 'family', r.fam));
    v_keys := v_keys || v_answer;
    v_expl := v_expl || jsonb_build_array(r.explanation_md);
  end loop;

  v_n := jsonb_array_length(v_qs);
  if v_n = 0 then raise exception 'no questions available for this choice'; end if;

  -- "Test #NN" per subject; a unique index makes two racing tabs retry.
  for attempt in 1 .. 3 loop
    select coalesce(max(seq), 0) + 1 into v_seq from tests where user_id = v_uid and subject_id = p_subject_id;
    begin
      insert into tests (user_id, subject_id, seq, title, difficulty, question_count, questions_json, status, scope)
      values (v_uid, p_subject_id, v_seq, 'Test #' || lpad(v_seq::text, 2, '0'), p_difficulty, v_n, v_qs,
              'in_progress', left(coalesce(nullif(trim(p_scope), ''), 'Whole book'), 80))
      returning id into v_id;
      exit;
    exception when unique_violation then
      if attempt = 3 then raise; end if;
    end;
  end loop;

  insert into test_keys (test_id, answers, explanations) values (v_id, v_keys, v_expl);
  return jsonb_build_object('id', v_id, 'questionCount', v_n, 'requested', p_count);
end;
$$;

-- Marks a test against its hidden key, saves the result, and only now puts
-- the answers and explanations into the test so the review can show them.
-- Submitting twice returns the first result. Tests made before this change
-- (key inside questions_json) are marked from that snapshot.
create or replace function public.submit_test(p_test_id uuid, p_answers jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  t         tests;
  k         test_keys;
  v_n       int;
  v_picks   jsonb := '[]'::jsonb;
  v_pick    jsonb;
  v_key     int[];
  v_correct int := 0;
  v_pct     int;
  v_remarks text;
  v_merged  jsonb;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into t from tests where id = p_test_id and user_id = v_uid for update;
  if t.id is null then raise exception 'test not found'; end if;
  if t.status = 'submitted' then
    return jsonb_build_object('correctCount', t.correct_count, 'scorePct', t.score_pct, 'remarks', t.remarks);
  end if;

  v_n := jsonb_array_length(t.questions_json);
  select * into k from test_keys where test_id = t.id;
  if k.test_id is not null then
    v_key := k.answers;
  else
    select array_agg(coalesce((x.e ->> 'answer')::int, -1) order by x.i) into v_key
      from jsonb_array_elements(t.questions_json) with ordinality as x(e, i);
  end if;

  -- Keep only real picks: an option index 0-3 for each question, else blank.
  for i in 0 .. v_n - 1 loop
    v_pick := case when jsonb_typeof(p_answers) = 'array' then p_answers -> i end;
    if v_pick is not null and jsonb_typeof(v_pick) = 'number'
       and (v_pick #>> '{}')::numeric in (0, 1, 2, 3) then
      v_picks := v_picks || jsonb_build_array((v_pick #>> '{}')::numeric::int);
      if (v_pick #>> '{}')::numeric::int = v_key[i + 1] then v_correct := v_correct + 1; end if;
    else
      v_picks := v_picks || jsonb_build_array(null);
    end if;
  end loop;

  v_pct := round(100.0 * v_correct / greatest(v_n, 1));
  v_remarks := prepify_remark(v_pct);

  select jsonb_agg(
           x.e || jsonb_build_object('answer', v_key[x.i])
               || case when k.explanations -> (x.i::int - 1) is not null
                            and jsonb_typeof(k.explanations -> (x.i::int - 1)) = 'string'
                       then jsonb_build_object('explanation', k.explanations -> (x.i::int - 1))
                       else '{}'::jsonb end
           order by x.i)
    into v_merged
    from jsonb_array_elements(t.questions_json) with ordinality as x(e, i);

  update tests
     set answers_json   = v_picks,
         correct_count  = v_correct,
         score_pct      = v_pct,
         remarks        = v_remarks,
         status         = 'submitted',
         submitted_at   = now(),
         questions_json = coalesce(v_merged, questions_json)
   where id = t.id;

  return jsonb_build_object('correctCount', v_correct, 'scorePct', v_pct, 'remarks', v_remarks);
end;
$$;

-- 2. Rate limiter -----------------------------------------------------------------

create table if not exists rate_limit_hits (
  user_id uuid not null,
  bucket  text not null,
  at      timestamptz not null default now()
);
create index if not exists rate_limit_hits_idx on rate_limit_hits(user_id, bucket, at);
alter table rate_limit_hits enable row level security;

-- Records one use of `p_bucket` by the caller and returns whether it is within
-- `p_max` uses per `p_window_seconds`. Called by the API routes with their own
-- limits; a student calling it directly only counts against themselves.
create or replace function public.rate_limit_hit(p_bucket text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then return false; end if;
  if p_bucket is null or char_length(p_bucket) > 40 then return false; end if;
  if (select count(*) from rate_limit_hits
       where user_id = v_uid and bucket = p_bucket
         and at > now() - make_interval(secs => least(greatest(p_window_seconds, 1), 86400)))
     >= least(greatest(p_max, 1), 10000) then
    return false;
  end if;
  insert into rate_limit_hits (user_id, bucket) values (v_uid, p_bucket);
  -- Keep the table small: drop this user's day-old hits now and then.
  if random() < 0.05 then
    delete from rate_limit_hits where user_id = v_uid and at < now() - interval '1 day';
  end if;
  return true;
end;
$$;

-- 3. Security advisor fixes --------------------------------------------------------

alter function public.prepify_remark(int) set search_path = public;
alter function public.prepify_points(text, int) set search_path = public;
alter function public.match_topic_chunks(uuid, vector, int) set search_path = public, extensions;

-- The sign-up trigger runs as a trigger only; nobody should call it directly.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Answerable MCQs per chapter, for the chapter pickers. A function rather than
-- a security-definer view, so it keeps working once students can't read the
-- questions table, without exposing anything but the counts.
create or replace function public.chapter_question_counts(p_chapter_ids uuid[])
returns table (chapter_id uuid, mcq_count int)
language sql stable security definer set search_path = public
as $$
  select q.chapter_id, count(*)::int
    from questions q
   where q.chapter_id = any(p_chapter_ids)
     and q.type = 'mcq'
     and q.answer_key_md in ('A', 'B', 'C', 'D')
   group by q.chapter_id;
$$;
revoke all on function public.chapter_question_counts(uuid[]) from public, anon;
grant execute on function public.chapter_question_counts(uuid[]) to authenticated;
alter view chapter_mcq_counts set (security_invoker = true);

revoke all on function public.create_test(uuid, uuid[], text, int, text) from public, anon;
revoke all on function public.submit_test(uuid, jsonb)                   from public, anon;
revoke all on function public.rate_limit_hit(text, int, int)             from public, anon;
grant execute on function public.create_test(uuid, uuid[], text, int, text) to authenticated;
grant execute on function public.submit_test(uuid, jsonb)                   to authenticated;
grant execute on function public.rate_limit_hit(text, int, int)             to authenticated;

-- 4. LOCKDOWN — apply after the app that uses create_test/submit_test is live.
-- ---------------------------------------------------------------------------------
-- (Kept here as the record; applied as its own migration.)
--
-- Tests: students may read their own, but every write goes through
-- create_test / submit_test, so scores can't be forged.
--   drop policy if exists tests_owner on tests;
--   drop policy if exists tests_owner_read on tests;
--   create policy tests_owner_read on tests for select to authenticated using (auth.uid() = user_id);
--   revoke insert, update, delete on tests from anon, authenticated;
--
-- Questions: answers, explanations and the rest of the bank are only read
-- through the functions above (tests, challenges, chapter counts, admin).
--   revoke all on questions from anon, authenticated;
