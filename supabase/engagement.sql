-- ---------------------------------------------------------------------------
-- Question reports, weak-chapter stats, XP, streaks and the global leaderboard.
--
-- Everything here is worked out from what students actually did (submitted
-- tests and finished challenges), so streaks and XP can't drift out of step
-- with the record. Day boundaries use Pakistan time (Asia/Karachi).
--
-- Re-runnable: safe to apply more than once.
-- ---------------------------------------------------------------------------

-- 1. Question reports ---------------------------------------------------------

-- A student flags a question from a test or challenge review. `shown` keeps
-- exactly what they saw (options are shuffled per test), so a report can be
-- checked without guessing. One report per student per question; reporting
-- again updates it.
create table if not exists question_reports (
  id          uuid primary key default gen_random_uuid(),
  question_id text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  reason      text not null check (reason in ('wrong_answer', 'typo', 'unclear', 'other')),
  note        text check (char_length(note) <= 500),
  shown       jsonb,                      -- {stem, options, markedAnswer, picked}
  source      text check (source in ('test', 'challenge')),
  status      text not null default 'open' check (status in ('open', 'fixed', 'dismissed')),
  created_at  timestamptz not null default now(),
  unique (user_id, question_id)
);
create index if not exists question_reports_open_idx on question_reports(status, created_at desc);
alter table question_reports enable row level security;
-- No policies: students report through report_question(); the owner reads
-- them in the Supabase dashboard (see the question_report_summary view).

create or replace function public.report_question(
  p_question_id text,
  p_reason      text,
  p_note        text,
  p_shown       jsonb,
  p_source      text
)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if p_reason not in ('wrong_answer', 'typo', 'unclear', 'other') then return 'invalid'; end if;
  if coalesce(trim(p_question_id), '') = '' then return 'invalid'; end if;
  -- A light brake on spam: 40 reports a day is far more than honest use.
  if (select count(*) from question_reports
       where user_id = v_uid and created_at > now() - interval '1 day') >= 40 then
    return 'limit';
  end if;

  insert into question_reports (question_id, user_id, reason, note, shown, source)
  values (p_question_id, v_uid, p_reason, left(nullif(trim(p_note), ''), 500), p_shown,
          case when p_source in ('test', 'challenge') then p_source end)
  on conflict (user_id, question_id) do update
     set reason = excluded.reason, note = excluded.note, shown = excluded.shown,
         status = 'open', created_at = now();
  return 'ok';
end;
$$;

-- For the owner, in the Supabase dashboard (Table editor → question_report_summary,
-- or SQL: select * from question_report_summary). Most-reported first, with the
-- question as stored and the answer key, so a fix is one edit to `questions`.
-- Then mark the reports: update question_reports set status = 'fixed'
--   where question_id = '<id>';
create or replace view question_report_summary as
  select r.question_id,
         count(*)                                      as reports,
         array_agg(distinct r.reason)                  as reasons,
         array_remove(array_agg(r.note), null)         as notes,
         s.name                                        as subject,
         ch.seq                                        as chapter,
         q.stem_md                                     as stem,
         q.options_json                                as options,
         q.answer_key_md                               as answer_key,
         max(r.created_at)                             as last_reported
    from question_reports r
    left join questions q on q.id::text = r.question_id
    left join chapters ch on ch.id = q.chapter_id
    left join books b on b.id = ch.book_id
    left join subjects s on s.id = b.subject_id
   where r.status = 'open'
   group by r.question_id, s.name, ch.seq, q.stem_md, q.options_json, q.answer_key_md
   order by count(*) desc, max(r.created_at) desc;
-- The view runs with its owner's rights, so keep it away from the public API.
revoke all on question_report_summary from public, anon, authenticated;

-- 2. Per-chapter results (for "Practise my weak chapters") -------------------

-- How the caller has done in each chapter, across submitted tests and
-- finished challenges. Questions without a bank id (rare AI top-ups) are
-- left out, since they don't belong to a chapter.
create or replace function public.my_chapter_stats()
returns table (subject_id uuid, chapter_id uuid, seq int, title text, attempted int, correct int)
language sql stable security definer set search_path = public
as $$
  with answered as (
    select e.q ->> 'id' as qid,
           t.answers_json -> (e.i - 1)::int as pick,
           (e.q ->> 'answer')::int as answer
      from tests t,
           jsonb_array_elements(t.questions_json) with ordinality as e(q, i)
     where t.user_id = auth.uid() and t.status = 'submitted'
    union all
    select e.q ->> 'id',
           cp.answers_json -> (e.i - 1)::int,
           k.answers[e.i]
      from challenge_players cp
      join challenges c on c.id = cp.challenge_id
      join challenge_keys k on k.challenge_id = c.id,
           jsonb_array_elements(c.questions_json) with ordinality as e(q, i)
     where cp.user_id = auth.uid() and c.status = 'finished' and cp.submitted_at is not null
  )
  select b.subject_id, ch.id, ch.seq, ch.title,
         count(*)::int,
         count(*) filter (where jsonb_typeof(a.pick) = 'number' and (a.pick #>> '{}')::numeric = a.answer)::int
    from answered a
    join questions q on q.id::text = a.qid
    join chapters ch on ch.id = q.chapter_id
    join books b on b.id = ch.book_id
   group by b.subject_id, ch.id, ch.seq, ch.title;
$$;

-- 3. XP, streaks, leaderboard -------------------------------------------------

alter table profiles add column if not exists hide_from_leaderboard boolean not null default false;

-- XP for a paper: per correct answer, 1 easy / 2 medium or mixed / 3 hard.
create or replace function public.prepify_points(p_difficulty text, p_correct int)
returns int language sql immutable
as $$
  select coalesce(p_correct, 0) * case p_difficulty when 'easy' then 1 when 'hard' then 3 else 2 end;
$$;

-- Every scored paper: tests, and challenges (+10 XP for a win; ties share it).
-- p_uid null = everyone.
create or replace function public.prepify_events(p_uid uuid)
returns table (user_id uuid, at timestamptz, pts int, wins int)
language sql stable security definer set search_path = public
as $$
  select t.user_id, t.submitted_at, prepify_points(t.difficulty, t.correct_count), 0
    from tests t
   where t.status = 'submitted' and t.submitted_at is not null
     and (p_uid is null or t.user_id = p_uid)
  union all
  select x.user_id, x.submitted_at,
         prepify_points(x.difficulty, x.correct_count) + case when x.won then 10 else 0 end,
         case when x.won then 1 else 0 end
    from (
      select cp.user_id, cp.submitted_at, c.difficulty, cp.correct_count,
             coalesce(cp.correct_count, 0) > 0
               and rank() over (partition by c.id
                                order by coalesce(cp.correct_count, 0) desc,
                                         coalesce(cp.time_taken_sec, 1000000)) = 1 as won
        from challenge_players cp
        join challenges c on c.id = cp.challenge_id
       where c.status = 'finished'
         and (p_uid is null or c.id in (select challenge_id from challenge_players where challenge_players.user_id = p_uid))
    ) x
   where x.submitted_at is not null
     and (p_uid is null or x.user_id = p_uid);
$$;

-- Days in a row (Pakistan time) with at least one finished test or challenge.
-- Today not done yet doesn't break it — the streak runs to yesterday.
create or replace function public.prepify_streak(p_uid uuid)
returns int
language plpgsql stable security definer set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Karachi')::date;
  v_days  date[];
  v_day   date;
  v_n     int := 0;
begin
  select array_agg(distinct (e.at at time zone 'Asia/Karachi')::date) into v_days
    from prepify_events(p_uid) e;
  if v_days is null then return 0; end if;
  v_day := case when v_today = any(v_days) then v_today else v_today - 1 end;
  while v_day = any(v_days) loop
    v_n := v_n + 1;
    v_day := v_day - 1;
  end loop;
  return v_n;
end;
$$;

-- The name shown on the leaderboard: the username, else first name + initial
-- ("Ali K."), never the email.
create or replace function public.prepify_public_name(p_uid uuid)
returns text
language sql stable security definer set search_path = public
as $$
  select coalesce(
           p.username,
           nullif(trim(
             split_part(n.fullname, ' ', 1) ||
             case when split_part(n.fullname, ' ', 2) <> '' then ' ' || left(split_part(n.fullname, ' ', 2), 1) || '.' else '' end
           ), ''),
           'Student')
    from profiles p
    join auth.users u on u.id = p.id
    cross join lateral (select trim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')) as fullname) n
   where p.id = p_uid;
$$;

-- The caller's own numbers, for the top bar and Home.
create or replace function public.my_stats()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_week timestamptz := date_trunc('week', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi';
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  return (
    select jsonb_build_object(
             'streak',  prepify_streak(v_uid),
             'xpWeek',  coalesce(sum(e.pts) filter (where e.at >= v_week), 0),
             'xpTotal', coalesce(sum(e.pts), 0),
             'wins',    coalesce(sum(e.wins), 0))
      from prepify_events(v_uid) e
  );
end;
$$;

-- Top 50 for this week (Monday, Pakistan time) or all time, plus the caller's
-- own row even if they're further down or hidden.
create or replace function public.leaderboard(p_period text default 'week')
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_from timestamptz := case when p_period = 'all' then '-infinity'::timestamptz
                             else date_trunc('week', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi' end;
  v_rows jsonb;
  v_me   jsonb;
begin
  if v_uid is null then raise exception 'not signed in'; end if;

  with totals as (
    select e.user_id, sum(e.pts)::int as xp, sum(e.wins)::int as wins, count(*)::int as papers,
           coalesce(p.hide_from_leaderboard, false) as hidden
      from prepify_events(null) e
      join profiles p on p.id = e.user_id
     where e.at >= v_from
     group by e.user_id, p.hide_from_leaderboard
  ),
  visible as (
    select t.*, rank() over (order by t.xp desc) as rnk from totals t where not t.hidden
  ),
  top as (
    select * from visible order by rnk, xp desc limit 50
  )
  select
    coalesce((select jsonb_agg(jsonb_build_object(
                       'rank',   top.rnk,
                       'name',   prepify_public_name(top.user_id),
                       'xp',     top.xp,
                       'wins',   top.wins,
                       'papers', top.papers,
                       'streak', prepify_streak(top.user_id),
                       'isMe',   top.user_id = v_uid) order by top.rnk, top.xp desc)
                from top), '[]'::jsonb),
    (select jsonb_build_object(
              'rank',   case when t.user_id is null then null
                             else 1 + (select count(*) from visible o where o.xp > t.xp) end,
              'name',   prepify_public_name(v_uid),
              'xp',     coalesce(t.xp, 0),
              'wins',   coalesce(t.wins, 0),
              'papers', coalesce(t.papers, 0),
              'streak', prepify_streak(v_uid),
              'hidden', coalesce((select hide_from_leaderboard from profiles where id = v_uid), false))
       from (select 1) one
       left join totals t on t.user_id = v_uid)
    into v_rows, v_me;

  return jsonb_build_object('period', case when p_period = 'all' then 'all' else 'week' end,
                            'rows', v_rows, 'me', v_me);
end;
$$;

revoke all on function public.prepify_points(text, int)       from public, anon, authenticated;
revoke all on function public.prepify_events(uuid)            from public, anon, authenticated;
revoke all on function public.prepify_streak(uuid)            from public, anon, authenticated;
revoke all on function public.prepify_public_name(uuid)       from public, anon, authenticated;
revoke all on function public.report_question(text, text, text, jsonb, text) from public, anon;
revoke all on function public.my_chapter_stats()              from public, anon;
revoke all on function public.my_stats()                      from public, anon;
revoke all on function public.leaderboard(text)               from public, anon;
grant execute on function public.report_question(text, text, text, jsonb, text) to authenticated;
grant execute on function public.my_chapter_stats()           to authenticated;
grant execute on function public.my_stats()                   to authenticated;
grant execute on function public.leaderboard(text)            to authenticated;
