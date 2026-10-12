-- ---------------------------------------------------------------------------
-- Mock exams.
--
-- A mock is a timed paper the student sets up themselves: which chapters, how
-- many MCQs (up to 60) and how long. It is drawn only from the mock pool —
-- questions flagged `mock` (the Chemistry set in content/mcq-bank/mock/). Those
-- questions are ordinary bank questions too, so normal tests can ask them.
--
-- Mocks are rows in `tests` with kind = 'mock', so marking, the answer review,
-- XP, streaks and chapter stats all work for them unchanged. The clock is kept
-- on the server: create_mock stores a deadline, and submit_test (security.sql)
-- refuses the answers of a mock handed in well after it.
--
-- Re-runnable: safe to apply more than once. Needs schema.sql and
-- security.sql first.
-- ---------------------------------------------------------------------------

alter table questions add column if not exists mock boolean not null default false;
create index if not exists questions_mock_idx on questions(chapter_id) where mock;

-- tests.kind, time_limit_min and deadline are added in security.sql, whose
-- submit_test reads them.
do $$ begin
  alter table tests add constraint tests_kind_check check (kind in ('test', 'mock'));
exception when duplicate_object then null; end $$;

-- A mock can have up to 60 questions; normal tests stay at 30 (create_test).
alter table tests drop constraint if exists tests_question_count_check;
alter table tests add constraint tests_question_count_check check (question_count between 1 and 60);

-- "Test #NN" and "Mock #NN" are numbered separately.
create unique index if not exists tests_user_subject_kind_seq_key on tests(user_id, subject_id, kind, seq);
alter table tests drop constraint if exists tests_user_id_subject_id_seq_key;

-- The chapters a mock can cover, with how many different questions each has
-- (one per family, since a paper asks at most one version of a question).
create or replace function public.mock_pool()
returns table (subject_id uuid, subject_name text, chapter_id uuid, seq int, title text, mcq_count int)
language sql stable security definer set search_path = public
as $$
  select s.id, s.name, c.id, c.seq, c.title, count(distinct coalesce(q.family, q.id::text))::int
    from questions q
    join chapters c on c.id = q.chapter_id
    join books b on b.id = c.book_id
    join subjects s on s.id = b.subject_id
   where q.mock and q.type = 'mcq' and q.answer_key_md in ('A', 'B', 'C', 'D')
   group by s.id, s.name, c.id, c.seq, c.title
   order by s.name, c.seq;
$$;

-- Builds a mock: p_count questions (1-60) from the mock pool of the chosen
-- chapters (all pool chapters if none are given), one per family, preferring
-- questions the student didn't meet in their last three mocks. The clock
-- starts now: the deadline is p_minutes away. Like create_test, the student
-- gets the questions without answers and the key goes to test_keys.
create or replace function public.create_mock(
  p_subject_id  uuid,
  p_chapter_ids uuid[],
  p_count       int,
  p_minutes     int
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid        uuid := auth.uid();
  v_chapters   uuid[];
  v_recent_ids text[];
  v_qs         jsonb := '[]'::jsonb;
  v_keys       int[] := '{}';
  v_expl       jsonb := '[]'::jsonb;
  v_perm       int[];
  v_opts       jsonb;
  v_answer     int;
  v_seq        int;
  v_id         uuid;
  v_n          int;
  v_scope      text;
  v_deadline   timestamptz;
  r            record;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if p_count is null or p_count not between 1 and 60 then raise exception 'question count must be 1-60'; end if;
  if p_minutes is null or p_minutes not between 5 and 180 then raise exception 'time must be 5-180 minutes'; end if;
  if (select count(*) from tests where user_id = v_uid and created_at > now() - interval '1 day') >= 100 then
    raise exception 'daily test limit';
  end if;

  -- Only chapters of this subject that have mock questions.
  select array_agg(distinct c.id) into v_chapters
    from chapters c
    join books b on b.id = c.book_id
   where b.subject_id = p_subject_id
     and (coalesce(array_length(p_chapter_ids, 1), 0) = 0 or c.id = any(p_chapter_ids))
     and exists (select 1 from questions q where q.chapter_id = c.id and q.mock);
  if v_chapters is null then raise exception 'no questions available for this choice'; end if;

  select coalesce(array_agg(distinct e ->> 'id'), '{}') into v_recent_ids
    from (select questions_json from tests
           where user_id = v_uid and subject_id = p_subject_id and kind = 'mock'
           order by created_at desc limit 3) t,
         jsonb_array_elements(t.questions_json) e;

  for r in
    select * from (
      select * from (
        select distinct on (fam) *
          from (
            select q.id, q.stem_md, q.options_json, q.answer_key_md, q.explanation_md,
                   coalesce(q.family, q.id::text) as fam,
                   (q.id::text = any(v_recent_ids)) as seen
              from questions q
             where q.mock
               and q.chapter_id = any(v_chapters)
               and q.type = 'mcq'
               and q.answer_key_md in ('A', 'B', 'C', 'D')
               and jsonb_typeof(q.options_json) = 'array'
               and jsonb_array_length(q.options_json) = 4
          ) pool
         order by fam, seen asc, random()
      ) one
      order by seen asc, random()
      limit p_count
    ) picked
    order by random()
  loop
    v_answer := position(r.answer_key_md in 'ABCD') - 1;
    -- Same rule as create_test: options that point at each other by position
    -- ("Both A and B", "All of the above") keep their order.
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

  -- "Ch 1, 2, 3" for a few chapters, otherwise a count.
  select case when count(*) = (select count(distinct q.chapter_id) from questions q
                                 join chapters c2 on c2.id = q.chapter_id join books b2 on b2.id = c2.book_id
                                where q.mock and b2.subject_id = p_subject_id)
              then 'All mock chapters'
              when count(*) = 1 then 'Chapter ' || min(c.seq)
              when count(*) <= 4 then 'Ch ' || string_agg(c.seq::text, ', ' order by c.seq)
              else count(*) || ' chapters' end
    into v_scope
    from chapters c where c.id = any(v_chapters);

  v_deadline := now() + make_interval(mins => p_minutes);
  for attempt in 1 .. 3 loop
    select coalesce(max(seq), 0) + 1 into v_seq from tests where user_id = v_uid and subject_id = p_subject_id and kind = 'mock';
    begin
      insert into tests (user_id, subject_id, kind, seq, title, difficulty, question_count, questions_json,
                         status, scope, time_limit_min, deadline)
      values (v_uid, p_subject_id, 'mock', v_seq, 'Mock #' || lpad(v_seq::text, 2, '0'), 'mixed', v_n, v_qs,
              'in_progress', v_scope, p_minutes, v_deadline)
      returning id into v_id;
      exit;
    exception when unique_violation then
      if attempt = 3 then raise; end if;
    end;
  end loop;

  insert into test_keys (test_id, answers, explanations) values (v_id, v_keys, v_expl);
  return jsonb_build_object('id', v_id, 'questionCount', v_n, 'requested', p_count, 'deadline', v_deadline);
end;
$$;

revoke all on function public.mock_pool()                          from public, anon;
revoke all on function public.create_mock(uuid, uuid[], int, int)  from public, anon;
grant execute on function public.mock_pool()                         to authenticated;
grant execute on function public.create_mock(uuid, uuid[], int, int) to authenticated;
