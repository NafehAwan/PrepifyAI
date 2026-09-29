-- ---------------------------------------------------------------------------
-- Usernames: register with one, then sign in with it instead of the email.
--
-- Supabase Auth still needs an email (the project confirms new accounts by
-- email), so a username is an extra, unique handle on the profile. Signing in
-- with it means finding the account's email — done by login_email(), which
-- only reveals the email once the password has checked out, so nobody can
-- collect students' emails by trying usernames. Repeated failures for one
-- username are throttled.
--
-- Re-runnable: safe to apply more than once.
-- ---------------------------------------------------------------------------

alter table profiles add column if not exists username text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_username_format') then
    -- 3-20 characters: lowercase letters, digits, underscore and dot.
    alter table profiles add constraint profiles_username_format
      check (username ~ '^[a-z0-9_.]{3,20}$');
  end if;
end $$;
create unique index if not exists profiles_username_idx on profiles(username);

-- Failed username sign-ins, for throttling. RLS on with no policies: only the
-- function below touches it.
create table if not exists login_failures (
  username text not null,
  at       timestamptz not null default now()
);
create index if not exists login_failures_idx on login_failures(username, at);
alter table login_failures enable row level security;

-- New accounts get their profile row with the username chosen at sign-up.
-- A taken username makes the sign-up fail here (unique index), which the app
-- reports as "that username is taken".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_username text := lower(trim(new.raw_user_meta_data ->> 'username'));
begin
  insert into public.profiles (id, role, username)
  values (new.id, 'student', case when v_username ~ '^[a-z0-9_.]{3,20}$' then v_username end)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.username_available(p_username text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select lower(trim(p_username)) ~ '^[a-z0-9_.]{3,20}$'
     and not exists (select 1 from profiles where username = lower(trim(p_username)));
$$;

-- The email for a username — returned only when the password is right.
-- Ten wrong tries in 15 minutes locks that username out for a while.
create or replace function public.login_email(p_username text, p_password text)
returns text
language plpgsql volatile security definer set search_path = public, extensions
as $$
declare
  v_name  text := lower(trim(p_username));
  v_email text;
  v_hash  text;
begin
  if (select count(*) from login_failures
       where username = v_name and at > now() - interval '15 minutes') >= 10 then
    return null;
  end if;

  select u.email, u.encrypted_password into v_email, v_hash
    from profiles p join auth.users u on u.id = p.id
   where p.username = v_name;

  if v_hash is not null and v_hash <> '' and v_hash = crypt(coalesce(p_password, ''), v_hash) then
    return v_email;
  end if;

  insert into login_failures (username) values (v_name);
  delete from login_failures where at < now() - interval '1 day';
  return null;
end;
$$;

-- Choose or change your own username (e.g. accounts made with Google).
-- Returns 'ok', 'invalid' or 'taken'.
create or replace function public.set_username(p_username text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_name text := lower(trim(p_username));
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if v_name !~ '^[a-z0-9_.]{3,20}$' then return 'invalid'; end if;
  begin
    insert into profiles (id, role, username) values (v_uid, 'student', v_name)
    on conflict (id) do update set username = excluded.username;
  exception when unique_violation then
    return 'taken';
  end;
  return 'ok';
end;
$$;

revoke all on function public.username_available(text)    from public;
revoke all on function public.login_email(text, text)     from public;
revoke all on function public.set_username(text)          from public, anon;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.login_email(text, text)  to anon, authenticated;
grant execute on function public.set_username(text)       to authenticated;
