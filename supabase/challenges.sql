-- ---------------------------------------------------------------------------
-- Friend challenges.
--
-- A student picks a subject, chapters, question count, difficulty, how many
-- friends and a time limit, and gets a link. Friends open the link, join the
-- lobby and tap Ready; when every seat is filled and everyone is ready the
-- server starts one shared clock. Everyone answers the same questions in the
-- same order, and the results page ranks them by marks, then by time taken.
--
-- Fairness is enforced here rather than in the browser:
--   - questions are picked by create_challenge, so nobody's client ever holds
--     the answer key; the key lives in challenge_keys and is only returned by
--     challenge_state once the challenge has finished;
--   - the start and end times are set by the database, and a late submission
--     (past the end plus a short network grace) is marked as blank;
--   - the tables have RLS on and NO policies, so the only way in is through
--     the security-definer functions below.
--
-- Re-runnable: safe to apply more than once.
-- ---------------------------------------------------------------------------

create table if not exists challenges (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,        -- the short code in the invite link
  host_id         uuid not null references auth.users(id) on delete cascade,
  subject_id      uuid not null references subjects(id) on delete cascade,
  scope           text not null default 'Whole book',
  difficulty      text not null,               -- easy | medium | hard | mixed
  question_count  int  not null check (question_count between 1 and 30),
  player_count    int  not null check (player_count between 2 and 10), -- host + friends
  time_limit_sec  int  not null check (time_limit_sec between 60 and 7200),
  questions_json  jsonb not null,              -- [{id, stem, options}] — no answers
  status          text not null default 'lobby'
                  check (status in ('lobby', 'running', 'finished', 'cancelled')),
  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  ends_at         timestamptz
);

-- The answer key, kept apart so no read of `challenges` can leak it.
create table if not exists challenge_keys (
  challenge_id uuid primary key references challenges(id) on delete cascade,
  answers      int[] not null,                 -- correct option index per question
  explanations jsonb                           -- explanation per question, or null
);

create table if not exists challenge_players (
  challenge_id   uuid not null references challenges(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  subject_id     uuid not null references subjects(id) on delete cascade,
  display_name   text not null,
  ready          boolean not null default false,
  joined_at      timestamptz not null default now(),
  seq            int,                          -- "Challenge #01", per user+subject, set at start
  answers_json   jsonb,
  correct_count  int,
  score_pct      int,
  remarks        text,
  time_taken_sec int,
  submitted_at   timestamptz,
  primary key (challenge_id, user_id)
);
create unique index if not exists challenge_players_seq_idx
  on challenge_players(user_id, subject_id, seq) where seq is not null;
create index if not exists challenge_players_user_idx on challenge_players(user_id, subject_id);

alter table challenges        enable row level security;
alter table challenge_keys    enable row level security;
alter table challenge_players enable row level security;
-- Deliberately no policies: all access goes through the functions below.

-- Score → remark, matching remarkFor() in lib/tests/build.ts.
create or replace function public.prepify_remark(p int)
returns text language sql immutable
as $$
  select case
    when p >= 90 then 'Excellent'
    when p >= 75 then 'Very good'
    when p >= 60 then 'Good'
    when p >= 50 then 'Passed — revise weak areas'
    else 'Needs work'
  end;
$$;

-- Closes a running challenge once everyone has submitted or the clock (plus a
-- 30-second grace for slow connections) has run out. Anyone who never
-- submitted scores zero. Called from the other functions, never directly.
create or replace function public.prepify_challenge_settle(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  c challenges;
begin
  select * into c from challenges where id = p_id for update;
  if c.id is null or c.status <> 'running' then return; end if;
  if now() > c.ends_at + interval '30 seconds'
     or not exists (select 1 from challenge_players
                    where challenge_id = p_id and submitted_at is null) then
    update challenge_players
       set correct_count = 0, score_pct = 0, remarks = 'Did not submit',
           answers_json = '[]'::jsonb, time_taken_sec = c.time_limit_sec
     where challenge_id = p_id and submitted_at is null;
    update challenges set status = 'finished' where id = p_id;
  end if;
end;
$$;

-- Creates a challenge and seats the host. Picks the questions server-side:
-- one per question family (so no two versions of the same question), in the
-- chosen difficulty band first and topped up from any difficulty if the band
-- is thin. Options are shuffled unless they refer to each other by position
-- ("All of the above", "Both A and B"). Returns the invite code.
create or replace function public.create_challenge(
  p_subject_id     uuid,
  p_chapter_ids    uuid[],
  p_scope          text,
  p_difficulty     text,
  p_question_count int,
  p_friends        int,
  p_time_limit_sec int,
  p_display_name   text
)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_lo       int;
  v_hi       int;
  v_chapters uuid[];
  v_qs       jsonb := '[]'::jsonb;
  v_keys     int[] := '{}';
  v_expl     jsonb := '[]'::jsonb;
  v_perm     int[];
  v_opts     jsonb;
  v_answer   int;
  v_code     text;
  v_id       uuid;
  r          record;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if p_question_count is null or p_question_count not between 1 and 30 then
    raise exception 'question count must be 1-30';
  end if;
  if p_friends is null or p_friends not between 1 and 9 then
    raise exception 'friends must be 1-9';
  end if;
  if p_time_limit_sec is null or p_time_limit_sec not between 60 and 7200 then
    raise exception 'time limit must be 1-120 minutes';
  end if;

  select d.lo, d.hi into v_lo, v_hi
    from (values ('easy', 1, 2), ('medium', 2, 4), ('hard', 4, 5), ('mixed', 1, 5)) as d(k, lo, hi)
   where d.k = p_difficulty;
  if v_lo is null then raise exception 'unknown difficulty'; end if;

  select array_agg(c.id) into v_chapters
    from chapters c join books b on b.id = c.book_id
   where b.subject_id = p_subject_id
     and (coalesce(array_length(p_chapter_ids, 1), 0) = 0 or c.id = any(p_chapter_ids));
  if v_chapters is null then raise exception 'no chapters for this subject'; end if;

  for r in
    select * from (
      select * from (
        select distinct on (fam) *
          from (
            select q.id, q.stem_md, q.options_json, q.answer_key_md, q.explanation_md,
                   coalesce(q.family, q.id::text) as fam,
                   (q.difficulty between v_lo and v_hi) as in_band
              from questions q
             where q.chapter_id = any(v_chapters)
               and q.type = 'mcq'
               and q.answer_key_md in ('A', 'B', 'C', 'D')
               and jsonb_typeof(q.options_json) = 'array'
               and jsonb_array_length(q.options_json) = 4
          ) pool
         order by fam, in_band desc, random()
      ) one
      order by in_band desc, random()
      limit p_question_count
    ) picked
    order by random()
  loop
    v_answer := position(r.answer_key_md in 'ABCD') - 1;   -- 0..3
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

    v_qs   := v_qs || jsonb_build_array(jsonb_build_object('id', r.id, 'stem', r.stem_md, 'options', v_opts));
    v_keys := v_keys || v_answer;
    v_expl := v_expl || jsonb_build_array(r.explanation_md);
  end loop;

  if jsonb_array_length(v_qs) = 0 then raise exception 'no questions available for this choice'; end if;

  -- Six characters without look-alikes (no 0/O, 1/I/L), easy to read aloud.
  loop
    select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
      into v_code from generate_series(1, 6);
    exit when not exists (select 1 from challenges where code = v_code);
  end loop;

  insert into challenges (code, host_id, subject_id, scope, difficulty, question_count,
                          player_count, time_limit_sec, questions_json)
  values (v_code, v_uid, p_subject_id, coalesce(nullif(trim(p_scope), ''), 'Whole book'),
          p_difficulty, jsonb_array_length(v_qs), p_friends + 1, p_time_limit_sec, v_qs)
  returning id into v_id;

  insert into challenge_keys (challenge_id, answers, explanations) values (v_id, v_keys, v_expl);
  insert into challenge_players (challenge_id, user_id, subject_id, display_name)
  values (v_id, v_uid, p_subject_id, left(coalesce(nullif(trim(p_display_name), ''), 'Player'), 40));

  return v_code;
end;
$$;

-- Takes a seat in a waiting challenge. Returns {ok} or {ok:false, reason}.
create or replace function public.join_challenge(p_code text, p_display_name text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  c     challenges;
  n     int;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into c from challenges where code = upper(trim(p_code)) for update;
  if c.id is null then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if exists (select 1 from challenge_players where challenge_id = c.id and user_id = v_uid) then
    return jsonb_build_object('ok', true);
  end if;
  if c.status <> 'lobby' then return jsonb_build_object('ok', false, 'reason', c.status); end if;
  select count(*) into n from challenge_players where challenge_id = c.id;
  if n >= c.player_count then return jsonb_build_object('ok', false, 'reason', 'full'); end if;

  insert into challenge_players (challenge_id, user_id, subject_id, display_name)
  values (c.id, v_uid, c.subject_id, left(coalesce(nullif(trim(p_display_name), ''), 'Player'), 40));
  return jsonb_build_object('ok', true);
end;
$$;

-- Starts a waiting challenge: the shared clock begins after a 5-second
-- countdown, the seats shrink to whoever is actually in (so a force start
-- doesn't wait on empty seats), and each player's challenge is numbered
-- ("Challenge #01" per subject). Internal — called by the two functions below.
create or replace function public.prepify_challenge_start(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  c challenges;
  n int;
begin
  select * into c from challenges where id = p_id for update;
  if c.id is null or c.status <> 'lobby' then return; end if;
  select count(*) into n from challenge_players where challenge_id = p_id;
  if n < 2 then return; end if;

  update challenges
     set status       = 'running',
         player_count = n,
         started_at   = now() + interval '5 seconds',
         ends_at      = now() + interval '5 seconds' + make_interval(secs => c.time_limit_sec)
   where id = p_id;
  update challenge_players set ready = true where challenge_id = p_id;
  update challenge_players p
     set seq = coalesce((select max(p2.seq) from challenge_players p2
                          where p2.user_id = p.user_id and p2.subject_id = p.subject_id), 0) + 1
   where p.challenge_id = p_id;
end;
$$;

-- Marks the caller ready (or not). When every seat is taken and everyone is
-- ready, the challenge starts.
create or replace function public.set_challenge_ready(p_code text, p_ready boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  c       challenges;
  n       int;
  n_ready int;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into c from challenges where code = upper(trim(p_code)) for update;
  if c.id is null or c.status <> 'lobby' then return; end if;

  update challenge_players set ready = coalesce(p_ready, false)
   where challenge_id = c.id and user_id = v_uid;

  select count(*), count(*) filter (where ready) into n, n_ready
    from challenge_players where challenge_id = c.id;

  if n = c.player_count and n_ready = n then
    perform prepify_challenge_start(c.id);
  end if;
end;
$$;

-- The host starts now with whoever has joined, without waiting for empty
-- seats or for everyone to tap Ready. Needs at least one friend in.
-- Returns 'ok', 'not_host', 'need_friend' or 'not_waiting'.
create or replace function public.force_start_challenge(p_code text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  c     challenges;
  n     int;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into c from challenges where code = upper(trim(p_code)) for update;
  if c.id is null or c.status <> 'lobby' then return 'not_waiting'; end if;
  if c.host_id <> v_uid then return 'not_host'; end if;
  select count(*) into n from challenge_players where challenge_id = c.id;
  if n < 2 then return 'need_friend'; end if;
  perform prepify_challenge_start(c.id);
  return 'ok';
end;
$$;

-- Leaves a challenge that hasn't started. The host leaving cancels it.
create or replace function public.leave_challenge(p_code text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  c     challenges;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into c from challenges where code = upper(trim(p_code)) for update;
  if c.id is null or c.status <> 'lobby' then return; end if;
  if c.host_id = v_uid then
    update challenges set status = 'cancelled' where id = c.id;
  else
    delete from challenge_players where challenge_id = c.id and user_id = v_uid;
  end if;
end;
$$;

-- Grades and stores the caller's answers against the hidden key.
create or replace function public.submit_challenge(p_code text, p_answers jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  c         challenges;
  me        challenge_players;
  k         int[];
  v_answers jsonb;
  v_correct int := 0;
  v_pct     int;
  i         int;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into c from challenges where code = upper(trim(p_code)) for update;
  if c.id is null or c.status <> 'running' then return; end if;
  select * into me from challenge_players where challenge_id = c.id and user_id = v_uid;
  if me.user_id is null or me.submitted_at is not null then return; end if;

  -- Past the clock plus grace, the paper is taken in blank.
  v_answers := case when now() > c.ends_at + interval '30 seconds' then '[]'::jsonb
                    else coalesce(p_answers, '[]'::jsonb) end;
  if jsonb_typeof(v_answers) <> 'array' then v_answers := '[]'::jsonb; end if;

  select answers into k from challenge_keys where challenge_id = c.id;
  for i in 1 .. coalesce(array_length(k, 1), 0) loop
    if jsonb_typeof(v_answers -> (i - 1)) = 'number'
       and (v_answers ->> (i - 1))::numeric = k[i] then
      v_correct := v_correct + 1;
    end if;
  end loop;
  v_pct := round(100.0 * v_correct / greatest(coalesce(array_length(k, 1), 0), 1));

  update challenge_players
     set answers_json   = v_answers,
         correct_count  = v_correct,
         score_pct      = v_pct,
         remarks        = prepify_remark(v_pct),
         submitted_at   = now(),
         time_taken_sec = greatest(0, least(
                            extract(epoch from (least(now(), c.ends_at) - c.started_at))::int,
                            c.time_limit_sec))
   where challenge_id = c.id and user_id = v_uid;

  perform prepify_challenge_settle(c.id);
end;
$$;

-- Everything the challenge screen needs, in one call. Questions appear only
-- once the clock has started, others' scores and the answer key only once the
-- whole challenge has finished.
create or replace function public.challenge_state(p_code text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  c           challenges;
  me          challenge_players;
  k           challenge_keys;
  v_players   jsonb;
  v_subject   text;
  v_host      text;
  v_finished  boolean;
  v_show_qs   boolean;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into c from challenges where code = upper(trim(p_code));
  if c.id is null then return jsonb_build_object('found', false); end if;

  perform prepify_challenge_settle(c.id);
  select * into c from challenges where id = c.id;
  select * into me from challenge_players where challenge_id = c.id and user_id = v_uid;
  select name into v_subject from subjects where id = c.subject_id;
  select display_name into v_host from challenge_players where challenge_id = c.id and user_id = c.host_id;

  v_finished := c.status = 'finished';
  v_show_qs  := me.user_id is not null and c.status in ('running', 'finished') and now() >= c.started_at;
  if v_finished and me.user_id is not null then
    select * into k from challenge_keys where challenge_id = c.id;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'name',         p.display_name,
           'isMe',         p.user_id = v_uid,
           'isHost',       p.user_id = c.host_id,
           'ready',        p.ready,
           'submitted',    p.submitted_at is not null,
           'correct',      case when v_finished or p.user_id = v_uid then p.correct_count end,
           'scorePct',     case when v_finished or p.user_id = v_uid then p.score_pct end,
           'remarks',      case when v_finished or p.user_id = v_uid then p.remarks end,
           'timeTakenSec', case when v_finished or p.user_id = v_uid then p.time_taken_sec end
         ) order by p.joined_at), '[]'::jsonb)
    into v_players
    from challenge_players p where p.challenge_id = c.id;

  return jsonb_build_object(
    'found',         true,
    'code',          c.code,
    'subjectId',     c.subject_id,
    'subjectName',   v_subject,
    'hostName',      v_host,
    'isHost',        c.host_id = v_uid,
    'joined',        me.user_id is not null,
    'scope',         c.scope,
    'difficulty',    c.difficulty,
    'questionCount', c.question_count,
    'playerCount',   c.player_count,
    'timeLimitSec',  c.time_limit_sec,
    'status',        c.status,
    'serverNow',     now(),
    'startedAt',     c.started_at,
    'endsAt',        c.ends_at,
    'createdAt',     c.created_at,
    'seq',           me.seq,
    'players',       v_players,
    'questions',     case when v_show_qs then c.questions_json end,
    'myAnswers',     me.answers_json,
    'key',           case when k.challenge_id is not null then to_jsonb(k.answers) end,
    'explanations',  case when k.challenge_id is not null then k.explanations end
  );
end;
$$;

-- The caller's challenges in one subject, newest first, for the cards on the
-- subject screen. Settles any whose clock has run out so the cards are current.
create or replace function public.my_challenges(p_subject_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r     record;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  for r in
    select c.id from challenges c
      join challenge_players p on p.challenge_id = c.id and p.user_id = v_uid
     where c.subject_id = p_subject_id and c.status = 'running'
  loop
    perform prepify_challenge_settle(r.id);
  end loop;

  return (
    select coalesce(jsonb_agg(x order by created_at desc), '[]'::jsonb)
      from (
        select c.created_at, jsonb_build_object(
                 'code',          c.code,
                 'seq',           p.seq,
                 'status',        c.status,
                 'scope',         c.scope,
                 'difficulty',    c.difficulty,
                 'questionCount', c.question_count,
                 'playerCount',   c.player_count,
                 'joinedCount',   (select count(*) from challenge_players j where j.challenge_id = c.id),
                 'submitted',     p.submitted_at is not null,
                 'correct',       p.correct_count,
                 'scorePct',      p.score_pct,
                 'remarks',       p.remarks,
                 -- Rank: more correct first, then faster.
                 'rank', case when c.status = 'finished' then 1 + (
                           select count(*) from challenge_players o
                            where o.challenge_id = c.id
                              and (coalesce(o.correct_count, 0) > coalesce(p.correct_count, 0)
                                   or (coalesce(o.correct_count, 0) = coalesce(p.correct_count, 0)
                                       and coalesce(o.time_taken_sec, 1000000) < coalesce(p.time_taken_sec, 1000000))))
                         end,
                 'createdAt',     c.created_at
               ) as x
          from challenges c
          join challenge_players p on p.challenge_id = c.id and p.user_id = v_uid
         where c.subject_id = p_subject_id and c.status <> 'cancelled'
      ) t
  );
end;
$$;

-- True while the caller is mid-challenge. The chat route checks this, so the
-- chatbot can't be used for answers even from another tab.
create or replace function public.in_active_challenge()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from challenge_players p join challenges c on c.id = p.challenge_id
     where p.user_id = auth.uid()
       and p.submitted_at is null
       and c.status = 'running'
       and now() < c.ends_at + interval '30 seconds'
  );
$$;

-- Only signed-in students may call the public functions; the helpers are
-- internal and callable by nobody directly.
revoke all on function public.prepify_remark(int)                  from public, anon, authenticated;
revoke all on function public.prepify_challenge_settle(uuid)       from public, anon, authenticated;
revoke all on function public.prepify_challenge_start(uuid)        from public, anon, authenticated;
revoke all on function public.force_start_challenge(text)          from public, anon;
revoke all on function public.create_challenge(uuid, uuid[], text, text, int, int, int, text) from public, anon;
revoke all on function public.join_challenge(text, text)           from public, anon;
revoke all on function public.set_challenge_ready(text, boolean)   from public, anon;
revoke all on function public.leave_challenge(text)                from public, anon;
revoke all on function public.submit_challenge(text, jsonb)        from public, anon;
revoke all on function public.challenge_state(text)                from public, anon;
revoke all on function public.my_challenges(uuid)                  from public, anon;
revoke all on function public.in_active_challenge()                from public, anon;
grant execute on function public.create_challenge(uuid, uuid[], text, text, int, int, int, text) to authenticated;
grant execute on function public.join_challenge(text, text)         to authenticated;
grant execute on function public.set_challenge_ready(text, boolean) to authenticated;
grant execute on function public.force_start_challenge(text)        to authenticated;
grant execute on function public.leave_challenge(text)              to authenticated;
grant execute on function public.submit_challenge(text, jsonb)      to authenticated;
grant execute on function public.challenge_state(text)              to authenticated;
grant execute on function public.my_challenges(uuid)                to authenticated;
grant execute on function public.in_active_challenge()              to authenticated;
