-- ---------------------------------------------------------------------------
-- Leaderboard periods and admin player tools.
--
--  1. Locked tables only admins change (through the functions below):
--     player_overrides (a name shown instead of the student's own, removal
--     from the leaderboard, a score reset, wins/papers/streak changes),
--     xp_adjustments (XP added or taken away) and fake_players (made-up
--     leaderboard players). Students can't read or write any of them.
--  2. prepify_scored: every scored paper plus XP adjustments, after any
--     reset; prepify_player_totals: a player's numbers as everyone sees them.
--  3. The leaderboard: All time (default) or This month, real and fake
--     players together, names cut to their first 10 characters.
--  4. Admin functions: list/search players with their details, rename,
--     remove from the leaderboard, set XP/wins/papers/streak, reset scores,
--     create and edit fake players. Nothing is deleted.
--
-- Run after engagement.sql and support.sql. Re-runnable.
-- ---------------------------------------------------------------------------

-- 1. Tables ---------------------------------------------------------------------

create table if not exists player_overrides (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 30),
  removed      boolean not null default false,  -- kept off the leaderboard
  reset_at     timestamptz,                     -- scores before this don't count
  updated_at   timestamptz not null default now(),
  updated_by   uuid
);
alter table player_overrides enable row level security;

create table if not exists xp_adjustments (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  pts        int not null check (pts between -1000000 and 1000000),
  note       text,
  created_by uuid,
  at         timestamptz not null default clock_timestamp()
);
alter table xp_adjustments alter column at set default clock_timestamp();
create index if not exists xp_adjustments_user_idx on xp_adjustments(user_id, at);
alter table xp_adjustments enable row level security;

revoke all on player_overrides from anon, authenticated;
revoke all on xp_adjustments   from anon, authenticated;

-- 2. What counts towards XP ---------------------------------------------------------

-- Scored papers (prepify_events) and admin adjustments, leaving out anything
-- from before an admin reset. p_uid null = everyone. The streak still counts
-- every day the student actually practised (prepify_events).
create or replace function public.prepify_scored(p_uid uuid)
returns table (user_id uuid, at timestamptz, pts int, wins int, is_paper boolean)
language sql stable security definer set search_path = public
as $$
  select e.user_id, e.at, e.pts, e.wins, true
    from prepify_events(p_uid) e
    left join player_overrides o on o.user_id = e.user_id
   where o.reset_at is null or e.at >= o.reset_at
  union all
  select a.user_id, a.at, a.pts, 0, false
    from xp_adjustments a
    left join player_overrides o on o.user_id = a.user_id
   where (p_uid is null or a.user_id = p_uid)
     and (o.reset_at is null or a.at > o.reset_at);
$$;

-- The name shown on the leaderboard: a name an admin set, else the username,
-- else first name + initial ("Ali K."), never the email.
create or replace function public.prepify_public_name(p_uid uuid)
returns text
language sql stable security definer set search_path = public
as $$
  select coalesce(
           o.display_name,
           p.username,
           nullif(trim(
             split_part(n.fullname, ' ', 1) ||
             case when split_part(n.fullname, ' ', 2) <> '' then ' ' || left(split_part(n.fullname, ' ', 2), 1) || '.' else '' end
           ), ''),
           'Student')
    from profiles p
    join auth.users u on u.id = p.id
    left join player_overrides o on o.user_id = p.id
    cross join lateral (select trim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')) as fullname) n
   where p.id = p_uid;
$$;

-- 3. Admin player tools: names and XP --------------------------------------------

-- Sets the name shown on the leaderboard (empty = back to their own) and
-- whether they're kept off it.
create or replace function public.admin_update_player(p_user uuid, p_name text, p_removed boolean)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_name text := nullif(regexp_replace(trim(coalesce(p_name, '')), '[[:cntrl:]]|\s+', ' ', 'g'), '');
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if not exists (select 1 from auth.users where id = p_user) then return 'not_found'; end if;
  v_name := nullif(trim(v_name), '');
  if v_name is not null and char_length(v_name) > 30 then return 'bad_name'; end if;
  insert into player_overrides (user_id, display_name, removed, updated_at, updated_by)
  values (p_user, v_name, coalesce(p_removed, false), now(), auth.uid())
  on conflict (user_id) do update
     set display_name = excluded.display_name,
         removed      = excluded.removed,
         updated_at   = now(),
         updated_by   = auth.uid();
  return 'ok';
end;
$$;

-- Sets a player's all-time XP to a number, by adding the difference as an
-- adjustment dated now (so it also shows in this month's total).
create or replace function public.admin_set_xp(p_user uuid, p_target int)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_now int;
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if not exists (select 1 from auth.users where id = p_user) then return 'not_found'; end if;
  if p_target is null or p_target not between 0 and 1000000 then return 'bad_value'; end if;
  select coalesce(sum(pts), 0) into v_now from prepify_scored(p_user);
  if p_target <> v_now then
    insert into xp_adjustments (user_id, pts, note, created_by)
    values (p_user, p_target - v_now, 'Set to ' || p_target || ' by an admin', auth.uid());
  end if;
  return 'ok';
end;
$$;

-- Grants ------------------------------------------------------------------------------

revoke all on function public.prepify_scored(uuid)                     from public, anon, authenticated;
revoke all on function public.prepify_public_name(uuid)                from public, anon, authenticated;
revoke all on function public.admin_update_player(uuid, text, boolean) from public, anon;
revoke all on function public.admin_set_xp(uuid, int)                  from public, anon;
grant execute on function public.admin_update_player(uuid, text, boolean) to authenticated;
grant execute on function public.admin_set_xp(uuid, int)                  to authenticated;

-- 4. Player numbers, the leaderboard and fake players ----------------------------

-- Wins and papers an admin set: stored as the difference from the real count
-- at the time, so new games still add on top. Streak: a fixed number shown
-- instead of the real one (null = the real streak).
alter table player_overrides add column if not exists wins_adj        int not null default 0;
alter table player_overrides add column if not exists papers_adj      int not null default 0;
alter table player_overrides add column if not exists streak_override int check (streak_override is null or streak_override between 0 and 10000);

-- Leaderboard-only players the admin makes up. Every number is set by hand;
-- monthly XP only counts in the month it was set. "Removing" one just turns
-- it off (active = false).
create table if not exists fake_players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 30),
  xp         int  not null default 0 check (xp between 0 and 1000000),
  month_xp   int  not null default 0 check (month_xp between 0 and 1000000),
  month_of   date not null default (date_trunc('month', now() at time zone 'Asia/Karachi'))::date,
  wins       int  not null default 0 check (wins between 0 and 100000),
  papers     int  not null default 0 check (papers between 0 and 100000),
  streak     int  not null default 0 check (streak between 0 and 10000),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid
);
alter table fake_players enable row level security;
revoke all on fake_players from anon, authenticated;

-- This month's first day (Pakistan time), as a date.
create or replace function public.prepify_month_start()
returns date language sql stable set search_path = public
as $$ select (date_trunc('month', now() at time zone 'Asia/Karachi'))::date; $$;

-- A real player's numbers as everyone sees them: XP from prepify_scored, wins
-- and papers plus any admin change, and the streak (or its override).
create or replace function public.prepify_player_totals(p_uid uuid)
returns table (xp int, xp_month int, xp_week int, wins int, papers int, streak int, real_wins int, real_papers int, real_streak int)
language sql stable security definer set search_path = public
as $$
  with s as (
    select coalesce(sum(e.pts), 0)::int as xp,
           coalesce(sum(e.pts) filter (where e.at >= (prepify_month_start()::timestamp at time zone 'Asia/Karachi')), 0)::int as xp_month,
           coalesce(sum(e.pts) filter (where e.at >= (date_trunc('week', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi')), 0)::int as xp_week,
           coalesce(sum(e.wins), 0)::int as wins,
           (count(*) filter (where e.is_paper))::int as papers
      from prepify_scored(p_uid) e
  ),
  o as (select * from player_overrides where user_id = p_uid),
  st as (select prepify_streak(p_uid) as streak)
  select greatest(s.xp, 0), greatest(s.xp_month, 0), greatest(s.xp_week, 0),
         greatest(s.wins + coalesce((select wins_adj from o), 0), 0),
         greatest(s.papers + coalesce((select papers_adj from o), 0), 0),
         coalesce((select streak_override from o), st.streak),
         s.wins, s.papers, st.streak
    from s, st;
$$;

-- The caller's own numbers, for the top bar and Home.
create or replace function public.my_stats()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  t     record;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into t from prepify_player_totals(v_uid);
  return jsonb_build_object('streak', t.streak, 'xpWeek', t.xp_week, 'xpTotal', t.xp, 'wins', t.wins);
end;
$$;

-- Top 50 all time (default) or this calendar month (Pakistan time), real and
-- fake players together, plus the caller's own row even if they're further
-- down or hidden. Names are cut to their first 10 characters. Admin changes
-- to wins and papers count in the all-time view; the monthly view shows what
-- was actually played this month.
create or replace function public.leaderboard(p_period text default 'all')
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_month boolean := p_period = 'month';
  v_from  timestamptz := case when v_month
                              then prepify_month_start()::timestamp at time zone 'Asia/Karachi'
                              else '-infinity'::timestamptz end;
  v_rows  jsonb;
  v_me    jsonb;
begin
  if v_uid is null then raise exception 'not signed in'; end if;

  with real_totals as (
    select e.user_id as id, sum(e.pts)::int as xp, sum(e.wins)::int as wins,
           (count(*) filter (where e.is_paper))::int as papers
      from prepify_scored(null) e
     where e.at >= v_from
     group by e.user_id
  ),
  board as (
    select r.id, r.xp,
           greatest(r.wins   + case when v_month then 0 else coalesce(o.wins_adj, 0)   end, 0) as wins,
           greatest(r.papers + case when v_month then 0 else coalesce(o.papers_adj, 0) end, 0) as papers,
           o.streak_override as streak,
           coalesce(p.hide_from_leaderboard, false) or coalesce(o.removed, false) as hidden,
           false as fake,
           null::text as fake_name
      from real_totals r
      join profiles p on p.id = r.id
      left join player_overrides o on o.user_id = r.id
    union all
    select f.id,
           case when v_month then (case when f.month_of = prepify_month_start() then f.month_xp else 0 end) else f.xp end,
           f.wins, f.papers, f.streak, false, true, f.name
      from fake_players f
     where f.active
  ),
  visible as (
    select b.*, rank() over (order by b.xp desc) as rnk from board b where not b.hidden and b.xp > 0
  ),
  top as (
    select * from visible order by rnk, xp desc, fake limit 50
  )
  select
    coalesce((select jsonb_agg(jsonb_build_object(
                       'rank',   top.rnk,
                       'name',   left(case when top.fake then top.fake_name else prepify_public_name(top.id) end, 10),
                       'xp',     top.xp,
                       'wins',   top.wins,
                       'papers', top.papers,
                       'streak', coalesce(top.streak, case when top.fake then 0 else prepify_streak(top.id) end),
                       'isMe',   not top.fake and top.id = v_uid) order by top.rnk, top.xp desc, top.fake)
                from top), '[]'::jsonb),
    (select jsonb_build_object(
              'rank',    case when b.id is null or b.xp <= 0 then null
                              else 1 + (select count(*) from visible o where o.xp > b.xp) end,
              'name',    left(prepify_public_name(v_uid), 10),
              'xp',      greatest(coalesce(b.xp, 0), 0),
              'wins',    coalesce(b.wins, 0),
              'papers',  coalesce(b.papers, 0),
              'streak',  coalesce((select streak_override from player_overrides where user_id = v_uid), prepify_streak(v_uid)),
              'hidden',  coalesce((select hide_from_leaderboard from profiles where id = v_uid), false),
              'removed', coalesce((select removed from player_overrides where user_id = v_uid), false))
       from (select 1) one
       left join board b on b.id = v_uid and not b.fake)
    into v_rows, v_me;

  return jsonb_build_object('period', case when v_month then 'month' else 'all' end,
                            'rows', v_rows, 'me', v_me);
end;
$$;

-- Every player for the admin Players tab — real students (with their profile,
-- subjects and results) and fake players — or those matching a search on
-- username, email or name. Highest XP first, up to 300.
create or replace function public.admin_players(p_query text default '')
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_q    text := nullif(left(trim(coalesce(p_query, '')), 100), '');
  v_like text;
begin
  if not is_admin() then raise exception 'admins only'; end if;
  -- Match the text literally: "_" and "%" are common in usernames.
  v_like := '%' || replace(replace(replace(coalesce(v_q, ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';

  return coalesce((
    select jsonb_agg(y.j order by (y.j ->> 'xp')::int desc, y.j ->> 'joined' desc)
      from (
      select x.j from (
        select jsonb_build_object(
                 'id',             u.id,
                 'isFake',         false,
                 'username',       p.username,
                 'name',           prepify_public_name(u.id),
                 'customName',     o.display_name,
                 'email',          u.email,
                 'joined',         u.created_at,
                 'lastSignIn',     u.last_sign_in_at,
                 'lastActive',     (select max(e.at) from prepify_events(u.id) e),
                 'xp',             t.xp,
                 'xpMonth',        t.xp_month,
                 'wins',           t.wins,
                 'papers',         t.papers,
                 'streak',         t.streak,
                 'realWins',       t.real_wins,
                 'realPapers',     t.real_papers,
                 'realStreak',     t.real_streak,
                 'streakOverride', o.streak_override is not null,
                 'hidden',         coalesce(p.hide_from_leaderboard, false),
                 'removed',        coalesce(o.removed, false),
                 'resetAt',        o.reset_at,
                 'isAdmin',        exists (select 1 from app_admins a where a.user_id = u.id),
                 'isMe',           u.id = v_uid,
                 'classLevel',     p.class_level,
                 'track',          p.track,
                 'medium',         p.medium,
                 'examDate',       p.exam_date,
                 'provider',       u.raw_app_meta_data ->> 'provider',
                 'subjects',       coalesce((select jsonb_agg(s.name order by s.name)
                                               from enrollments en join subjects s on s.id = en.subject_id
                                              where en.user_id = u.id), '[]'::jsonb),
                 'tests',          (select count(*) from tests ts where ts.user_id = u.id and ts.status = 'submitted'),
                 'avgScore',       (select round(avg(ts.score_pct)) from tests ts where ts.user_id = u.id and ts.status = 'submitted'),
                 'bestScore',      (select max(ts.score_pct) from tests ts where ts.user_id = u.id and ts.status = 'submitted'),
                 'challenges',     (select count(*) from challenge_players cp where cp.user_id = u.id and cp.submitted_at is not null),
                 'tickets',        (select count(*) from tickets tk where tk.user_id = u.id)
               ) as j
          from auth.users u
          left join profiles p on p.id = u.id
          left join player_overrides o on o.user_id = u.id
          cross join lateral prepify_player_totals(u.id) t
         where v_q is null
            or p.username ilike v_like
            or u.email ilike v_like
            or prepify_public_name(u.id) ilike v_like
        union all
        select jsonb_build_object(
                 'id',       f.id,
                 'isFake',   true,
                 'name',     f.name,
                 'joined',   f.created_at,
                 'xp',       f.xp,
                 'xpMonth',  case when f.month_of = prepify_month_start() then f.month_xp else 0 end,
                 'wins',     f.wins,
                 'papers',   f.papers,
                 'streak',   f.streak,
                 'removed',  not f.active,
                 'hidden',   false,
                 'isAdmin',  false,
                 'isMe',     false)
          from fake_players f
         where v_q is null or f.name ilike v_like
      ) x
      order by (x.j ->> 'xp')::int desc, x.j ->> 'joined' desc
      limit 300
      ) y
  ), '[]'::jsonb);
end;
$$;

-- Sets a real player's numbers. Any argument left null is unchanged.
-- XP is moved by a dated adjustment (so it shows this month too); wins and
-- papers are stored as the difference from their real count; a streak of -1
-- goes back to their real streak.
create or replace function public.admin_set_player_stats(p_user uuid, p_xp int, p_wins int, p_papers int, p_streak int)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  t record;
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if not exists (select 1 from auth.users where id = p_user) then return 'not_found'; end if;
  if (p_xp is not null and p_xp not between 0 and 1000000)
     or (p_wins is not null and p_wins not between 0 and 100000)
     or (p_papers is not null and p_papers not between 0 and 100000)
     or (p_streak is not null and p_streak not between -1 and 10000) then
    return 'bad_value';
  end if;

  if p_xp is not null then
    perform admin_set_xp(p_user, p_xp);
  end if;

  select * into t from prepify_player_totals(p_user);
  insert into player_overrides (user_id, updated_at, updated_by) values (p_user, now(), auth.uid())
  on conflict (user_id) do nothing;
  update player_overrides
     set wins_adj        = case when p_wins   is null then wins_adj   else p_wins   - t.real_wins   end,
         papers_adj      = case when p_papers is null then papers_adj else p_papers - t.real_papers end,
         streak_override = case when p_streak is null then streak_override
                                when p_streak = -1   then null
                                else p_streak end,
         updated_at      = now(),
         updated_by      = auth.uid()
   where user_id = p_user;
  return 'ok';
end;
$$;

-- Resets a player's scores to zero from now on (p_on true), or undoes that
-- (false). Nothing is deleted: their tests stay, they just stop counting.
-- A reset also clears any wins/papers/streak an admin set.
create or replace function public.admin_reset_scores(p_user uuid, p_on boolean)
returns text
language plpgsql security definer set search_path = public
as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if not exists (select 1 from auth.users where id = p_user) then return 'not_found'; end if;
  insert into player_overrides (user_id, reset_at, updated_at, updated_by)
  values (p_user, case when p_on then clock_timestamp() end, now(), auth.uid())
  on conflict (user_id) do update
     set reset_at        = case when p_on then clock_timestamp() end,
         wins_adj        = case when p_on then 0 else player_overrides.wins_adj end,
         papers_adj      = case when p_on then 0 else player_overrides.papers_adj end,
         streak_override = case when p_on then null else player_overrides.streak_override end,
         updated_at      = now(),
         updated_by      = auth.uid();
  return 'ok';
end;
$$;

-- Fake players ------------------------------------------------------------------------

create or replace function public.prepify_clean_name(p_name text)
returns text language sql immutable set search_path = public
as $$ select nullif(trim(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]]|\s+', ' ', 'g')), ''); $$;

-- Makes a fake player and returns its id (or an error word).
create or replace function public.admin_create_fake_player(
  p_name text, p_xp int, p_month_xp int, p_wins int, p_papers int, p_streak int
)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_name text := prepify_clean_name(p_name);
  v_id   uuid;
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if v_name is null or char_length(v_name) > 30 then return 'bad_name'; end if;
  if coalesce(p_xp, 0) not between 0 and 1000000 or coalesce(p_month_xp, 0) not between 0 and 1000000
     or coalesce(p_wins, 0) not between 0 and 100000 or coalesce(p_papers, 0) not between 0 and 100000
     or coalesce(p_streak, 0) not between 0 and 10000 then
    return 'bad_value';
  end if;
  if (select count(*) from fake_players where active) >= 200 then return 'limit'; end if;
  insert into fake_players (name, xp, month_xp, month_of, wins, papers, streak, created_by)
  values (v_name, coalesce(p_xp, 0), coalesce(p_month_xp, 0), prepify_month_start(),
          coalesce(p_wins, 0), coalesce(p_papers, 0), coalesce(p_streak, 0), auth.uid())
  returning id into v_id;
  return v_id::text;
end;
$$;

-- Changes everything about a fake player. p_active false takes it off the
-- leaderboard (and out of the way); true brings it back.
create or replace function public.admin_update_fake_player(
  p_id uuid, p_name text, p_xp int, p_month_xp int, p_wins int, p_papers int, p_streak int, p_active boolean
)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_name text := prepify_clean_name(p_name);
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if not exists (select 1 from fake_players where id = p_id) then return 'not_found'; end if;
  if v_name is null or char_length(v_name) > 30 then return 'bad_name'; end if;
  if coalesce(p_xp, 0) not between 0 and 1000000 or coalesce(p_month_xp, 0) not between 0 and 1000000
     or coalesce(p_wins, 0) not between 0 and 100000 or coalesce(p_papers, 0) not between 0 and 100000
     or coalesce(p_streak, 0) not between 0 and 10000 then
    return 'bad_value';
  end if;
  update fake_players
     set name = v_name, xp = coalesce(p_xp, 0), month_xp = coalesce(p_month_xp, 0),
         month_of = prepify_month_start(), wins = coalesce(p_wins, 0),
         papers = coalesce(p_papers, 0), streak = coalesce(p_streak, 0),
         active = coalesce(p_active, true)
   where id = p_id;
  return 'ok';
end;
$$;

revoke all on function public.prepify_month_start()                     from public, anon, authenticated;
revoke all on function public.prepify_player_totals(uuid)                from public, anon, authenticated;
revoke all on function public.prepify_clean_name(text)                   from public, anon, authenticated;
revoke all on function public.my_stats()                                 from public, anon;
revoke all on function public.leaderboard(text)                          from public, anon;
revoke all on function public.admin_players(text)                        from public, anon;
revoke all on function public.admin_set_player_stats(uuid, int, int, int, int) from public, anon;
revoke all on function public.admin_reset_scores(uuid, boolean)          from public, anon;
revoke all on function public.admin_create_fake_player(text, int, int, int, int, int) from public, anon;
revoke all on function public.admin_update_fake_player(uuid, text, int, int, int, int, int, boolean) from public, anon;
grant execute on function public.my_stats()                                 to authenticated;
grant execute on function public.leaderboard(text)                          to authenticated;
grant execute on function public.admin_players(text)                        to authenticated;
grant execute on function public.admin_set_player_stats(uuid, int, int, int, int) to authenticated;
grant execute on function public.admin_reset_scores(uuid, boolean)          to authenticated;
grant execute on function public.admin_create_fake_player(text, int, int, int, int, int) to authenticated;
grant execute on function public.admin_update_fake_player(uuid, text, int, int, int, int, int, boolean) to authenticated;
