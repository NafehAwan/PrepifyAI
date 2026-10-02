-- ---------------------------------------------------------------------------
-- Leaderboard periods and admin player tools.
--
--  1. Two locked tables only admins change (through the functions below):
--     player_overrides (a name shown instead of the student's own, removal
--     from the leaderboard, a score reset) and xp_adjustments (XP added or
--     taken away by an admin). Students can't read or write either.
--  2. prepify_scored: every scored paper plus adjustments, after any reset —
--     what XP, the leaderboard and the top bar are counted from.
--  3. The leaderboard: All time (default) or This month, names cut to their
--     first 10 characters.
--  4. Admin functions: list/search players, rename, remove from the
--     leaderboard, set XP, reset scores (nothing is deleted).
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
             'xpWeek',  greatest(coalesce(sum(e.pts) filter (where e.at >= v_week), 0), 0),
             'xpTotal', greatest(coalesce(sum(e.pts), 0), 0),
             'wins',    coalesce(sum(e.wins), 0))
      from prepify_scored(v_uid) e
  );
end;
$$;

-- 3. Leaderboard ---------------------------------------------------------------------

-- Top 50 all time (default) or this calendar month (Pakistan time), plus the
-- caller's own row even if they're further down or hidden. Names are cut to
-- their first 10 characters.
create or replace function public.leaderboard(p_period text default 'all')
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_month boolean := p_period = 'month';
  v_from  timestamptz := case when v_month
                              then date_trunc('month', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi'
                              else '-infinity'::timestamptz end;
  v_rows  jsonb;
  v_me    jsonb;
begin
  if v_uid is null then raise exception 'not signed in'; end if;

  with totals as (
    select e.user_id, sum(e.pts)::int as xp, sum(e.wins)::int as wins,
           (count(*) filter (where e.is_paper))::int as papers,
           coalesce(p.hide_from_leaderboard, false) or coalesce(o.removed, false) as hidden
      from prepify_scored(null) e
      join profiles p on p.id = e.user_id
      left join player_overrides o on o.user_id = e.user_id
     where e.at >= v_from
     group by e.user_id, p.hide_from_leaderboard, o.removed
  ),
  visible as (
    select t.*, rank() over (order by t.xp desc) as rnk from totals t where not t.hidden and t.xp > 0
  ),
  top as (
    select * from visible order by rnk, xp desc limit 50
  )
  select
    coalesce((select jsonb_agg(jsonb_build_object(
                       'rank',   top.rnk,
                       'name',   left(prepify_public_name(top.user_id), 10),
                       'xp',     top.xp,
                       'wins',   top.wins,
                       'papers', top.papers,
                       'streak', prepify_streak(top.user_id),
                       'isMe',   top.user_id = v_uid) order by top.rnk, top.xp desc)
                from top), '[]'::jsonb),
    (select jsonb_build_object(
              'rank',    case when t.user_id is null or t.xp <= 0 then null
                              else 1 + (select count(*) from visible o where o.xp > t.xp) end,
              'name',    left(prepify_public_name(v_uid), 10),
              'xp',      greatest(coalesce(t.xp, 0), 0),
              'wins',    coalesce(t.wins, 0),
              'papers',  coalesce(t.papers, 0),
              'streak',  prepify_streak(v_uid),
              'hidden',  coalesce((select hide_from_leaderboard from profiles where id = v_uid), false),
              'removed', coalesce((select removed from player_overrides where user_id = v_uid), false))
       from (select 1) one
       left join totals t on t.user_id = v_uid)
    into v_rows, v_me;

  return jsonb_build_object('period', case when v_month then 'month' else 'all' end,
                            'rows', v_rows, 'me', v_me);
end;
$$;

-- 4. Admin player tools -------------------------------------------------------------

-- Every student (or those matching a search on username, email or name), with
-- their XP all time and this month, newest scores first. Up to 200.
create or replace function public.admin_players(p_query text default '')
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_q     text := nullif(left(trim(coalesce(p_query, '')), 100), '');
  v_like  text;
  v_month timestamptz := date_trunc('month', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi';
begin
  if not is_admin() then raise exception 'admins only'; end if;
  -- Match the text literally: "_" and "%" are common in usernames.
  v_like := '%' || replace(replace(replace(coalesce(v_q, ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';

  return coalesce((
    select jsonb_agg(to_jsonb(x) order by x.xp desc, x.joined desc)
      from (
        select u.id,
               p.username,
               prepify_public_name(u.id)                         as name,
               o.display_name                                    as "customName",
               u.email,
               u.created_at                                      as joined,
               s.last_at                                         as "lastActive",
               coalesce(s.papers, 0)                             as papers,
               greatest(coalesce(s.xp, 0), 0)                    as xp,
               greatest(coalesce(s.xp_month, 0), 0)              as "xpMonth",
               coalesce(p.hide_from_leaderboard, false)          as hidden,
               coalesce(o.removed, false)                        as removed,
               o.reset_at                                        as "resetAt",
               exists (select 1 from app_admins a where a.user_id = u.id) as "isAdmin",
               u.id = v_uid                                      as "isMe"
          from auth.users u
          left join profiles p on p.id = u.id
          left join player_overrides o on o.user_id = u.id
          left join (
            select e.user_id,
                   sum(e.pts)::int                                   as xp,
                   (sum(e.pts) filter (where e.at >= v_month))::int  as xp_month,
                   (count(*) filter (where e.is_paper))::int         as papers,
                   max(e.at) filter (where e.is_paper)               as last_at
              from prepify_scored(null) e
             group by e.user_id
          ) s on s.user_id = u.id
         where v_q is null
            or p.username ilike v_like
            or u.email ilike v_like
            or prepify_public_name(u.id) ilike v_like
         order by coalesce(s.xp, 0) desc, u.created_at desc
         limit 200
      ) x
  ), '[]'::jsonb);
end;
$$;

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

-- Resets a player's scores to zero from now on (p_on true), or undoes that
-- (false). Nothing is deleted: their tests stay, they just stop counting.
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
     set reset_at   = case when p_on then clock_timestamp() end,
         updated_at = now(),
         updated_by = auth.uid();
  return 'ok';
end;
$$;

-- Grants ------------------------------------------------------------------------------

revoke all on function public.prepify_scored(uuid)                     from public, anon, authenticated;
revoke all on function public.prepify_public_name(uuid)                from public, anon, authenticated;
revoke all on function public.my_stats()                               from public, anon;
revoke all on function public.leaderboard(text)                        from public, anon;
revoke all on function public.admin_players(text)                      from public, anon;
revoke all on function public.admin_update_player(uuid, text, boolean) from public, anon;
revoke all on function public.admin_set_xp(uuid, int)                  from public, anon;
revoke all on function public.admin_reset_scores(uuid, boolean)        from public, anon;
grant execute on function public.my_stats()                               to authenticated;
grant execute on function public.leaderboard(text)                        to authenticated;
grant execute on function public.admin_players(text)                      to authenticated;
grant execute on function public.admin_update_player(uuid, text, boolean) to authenticated;
grant execute on function public.admin_set_xp(uuid, int)                  to authenticated;
grant execute on function public.admin_reset_scores(uuid, boolean)        to authenticated;
