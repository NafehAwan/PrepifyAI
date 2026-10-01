-- ---------------------------------------------------------------------------
-- Help & Feedback tickets and the admin portal.
--
-- Students open a ticket (bug, suggestion, question, other) and chat with the
-- owner in it. Admins see every ticket, reply, close them, read question
-- reports and fix questions in place, and see site numbers.
--
-- Who is an admin lives in app_admins, which has RLS on and no policies — NOT
-- in profiles, which students can edit (they'd make themselves admin). Add an
-- admin from the SQL editor:
--   insert into app_admins (user_id)
--   select id from auth.users where email = 'someone@example.com';
--
-- Every read and write goes through the functions below; the tables have no
-- policies. Re-runnable: safe to apply more than once.
-- ---------------------------------------------------------------------------

create table if not exists app_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  added_at   timestamptz not null default now()
);
alter table app_admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from app_admins where user_id = auth.uid());
$$;

create table if not exists tickets (
  id              uuid primary key default gen_random_uuid(),
  number          bigint generated always as identity unique,   -- "#12"
  user_id         uuid not null references auth.users(id) on delete cascade,
  category        text not null check (category in ('bug', 'suggestion', 'question', 'other')),
  title           text not null check (char_length(title) between 3 and 120),
  status          text not null default 'open' check (status in ('open', 'answered', 'closed')),
  context         jsonb,                     -- page and device, to reproduce bugs
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  student_seen_at timestamptz not null default now(),
  admin_seen_at   timestamptz
);
create index if not exists tickets_user_idx on tickets(user_id, updated_at desc);
create index if not exists tickets_status_idx on tickets(status, updated_at desc);
alter table tickets enable row level security;

create table if not exists ticket_messages (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references tickets(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade,
  is_admin   boolean not null default false,
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists ticket_messages_ticket_idx on ticket_messages(ticket_id, created_at);
alter table ticket_messages enable row level security;

-- ---- Students ----------------------------------------------------------------

-- Opens a ticket with its first message. Returns the ticket number, or raises
-- when the input is bad. Ten tickets a day per student is plenty.
create or replace function public.create_ticket(p_category text, p_title text, p_body text, p_context jsonb)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
  v_num bigint;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if p_category not in ('bug', 'suggestion', 'question', 'other') then raise exception 'bad category'; end if;
  if char_length(trim(coalesce(p_title, ''))) < 3 then raise exception 'title too short'; end if;
  if char_length(trim(coalesce(p_body, ''))) < 1 then raise exception 'message empty'; end if;
  if (select count(*) from tickets where user_id = v_uid and created_at > now() - interval '1 day') >= 10 then
    raise exception 'daily ticket limit';
  end if;

  insert into tickets (user_id, category, title, context)
  values (v_uid, p_category, left(trim(p_title), 120), p_context)
  returning id, number into v_id, v_num;
  insert into ticket_messages (ticket_id, author_id, is_admin, body)
  values (v_id, v_uid, false, left(trim(p_body), 4000));
  return v_num;
end;
$$;

-- The caller's tickets, newest activity first, with an unread flag for
-- replies they haven't opened yet.
create or replace function public.my_tickets()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'number',    t.number,
           'category',  t.category,
           'title',     t.title,
           'status',    t.status,
           'createdAt', t.created_at,
           'updatedAt', t.updated_at,
           'unread',    exists (select 1 from ticket_messages m
                                 where m.ticket_id = t.id and m.is_admin and m.created_at > t.student_seen_at),
           'messages',  (select count(*) from ticket_messages m where m.ticket_id = t.id)
         ) order by t.updated_at desc), '[]'::jsonb)
    from tickets t
   where t.user_id = auth.uid();
$$;

-- How many tickets have a reply the caller hasn't seen (the nav badge).
create or replace function public.my_unread_tickets()
returns int
language sql stable security definer set search_path = public
as $$
  select count(*)::int from tickets t
   where t.user_id = auth.uid()
     and exists (select 1 from ticket_messages m
                  where m.ticket_id = t.id and m.is_admin and m.created_at > t.student_seen_at);
$$;

-- One ticket with all its messages — for its owner or an admin. Opening it
-- marks it seen for whoever opened it.
create or replace function public.ticket_thread(p_number bigint)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_admin boolean := is_admin();
  t       tickets;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select * into t from tickets where number = p_number;
  if t.id is null or (t.user_id <> v_uid and not v_admin) then
    return jsonb_build_object('found', false);
  end if;

  if t.user_id = v_uid then
    update tickets set student_seen_at = now() where id = t.id;
  end if;
  if v_admin then
    update tickets set admin_seen_at = now() where id = t.id;
  end if;

  return jsonb_build_object(
    'found',     true,
    'number',    t.number,
    'category',  t.category,
    'title',     t.title,
    'status',    t.status,
    'context',   case when v_admin then t.context end,
    'createdAt', t.created_at,
    'isMine',    t.user_id = v_uid,
    'viewerIsAdmin', v_admin,
    -- Admins see who wrote it, to follow up; students already know.
    'student',   case when v_admin then jsonb_build_object(
                   'name',  prepify_public_name(t.user_id),
                   'email', (select email from auth.users where id = t.user_id)) end,
    'messages',  coalesce((select jsonb_agg(jsonb_build_object(
                   'isAdmin',   m.is_admin,
                   'isMe',      m.author_id = v_uid,
                   'body',      m.body,
                   'createdAt', m.created_at) order by m.created_at)
                   from ticket_messages m where m.ticket_id = t.id), '[]'::jsonb)
  );
end;
$$;

-- Adds a message. A student's reply reopens the ticket; an admin's reply marks
-- it answered. A closed ticket can't be replied to by the student (they open
-- a new one), but an admin may still write.
create or replace function public.reply_ticket(p_number bigint, p_body text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_admin boolean := is_admin();
  t       tickets;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if char_length(trim(coalesce(p_body, ''))) < 1 then return 'empty'; end if;
  select * into t from tickets where number = p_number for update;
  if t.id is null or (t.user_id <> v_uid and not v_admin) then return 'not_found'; end if;
  if t.status = 'closed' and not v_admin then return 'closed'; end if;
  if not v_admin and (select count(*) from ticket_messages
                       where author_id = v_uid and created_at > now() - interval '1 hour') >= 30 then
    return 'limit';
  end if;

  insert into ticket_messages (ticket_id, author_id, is_admin, body)
  values (t.id, v_uid, v_admin and t.user_id <> v_uid, left(trim(p_body), 4000));

  update tickets
     set updated_at = now(),
         status = case when v_admin and t.user_id <> v_uid then 'answered' else 'open' end,
         student_seen_at = case when t.user_id = v_uid then now() else student_seen_at end,
         admin_seen_at   = case when v_admin then now() else admin_seen_at end
   where id = t.id;
  return 'ok';
end;
$$;

-- Close or reopen. Students may close their own ticket; admins may set any status.
create or replace function public.set_ticket_status(p_number bigint, p_status text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_admin boolean := is_admin();
  t       tickets;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if p_status not in ('open', 'answered', 'closed') then return 'invalid'; end if;
  select * into t from tickets where number = p_number for update;
  if t.id is null or (t.user_id <> v_uid and not v_admin) then return 'not_found'; end if;
  if not v_admin and p_status <> 'closed' then return 'not_allowed'; end if;
  update tickets set status = p_status, updated_at = now() where id = t.id;
  return 'ok';
end;
$$;

-- ---- Admin portal --------------------------------------------------------------

create or replace function public.admin_overview()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_today timestamptz := date_trunc('day', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi';
  v_week  timestamptz := date_trunc('week', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi';
begin
  if not is_admin() then raise exception 'admins only'; end if;
  return jsonb_build_object(
    'students',        (select count(*) from auth.users),
    'newStudentsWeek', (select count(*) from auth.users where created_at >= v_week),
    'activeToday',     (select count(distinct user_id) from prepify_events(null) where at >= v_today),
    'activeWeek',      (select count(distinct user_id) from prepify_events(null) where at >= v_week),
    'testsToday',      (select count(*) from tests where status = 'submitted' and submitted_at >= v_today),
    'testsWeek',       (select count(*) from tests where status = 'submitted' and submitted_at >= v_week),
    'testsTotal',      (select count(*) from tests where status = 'submitted'),
    'challengesWeek',  (select count(*) from challenges where status = 'finished' and created_at >= v_week),
    'openTickets',     (select count(*) from tickets where status = 'open'),
    'openReports',     (select count(distinct question_id) from question_reports where status = 'open'),
    'questions',       (select count(*) from questions where type = 'mcq' and answer_key_md in ('A','B','C','D'))
  );
end;
$$;

-- Tickets for the admin list. p_status: 'open' | 'answered' | 'closed' | 'all'.
create or replace function public.admin_tickets(p_status text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
             'number',    t.number,
             'category',  t.category,
             'title',     t.title,
             'status',    t.status,
             'student',   prepify_public_name(t.user_id),
             'createdAt', t.created_at,
             'updatedAt', t.updated_at,
             'unread',    exists (select 1 from ticket_messages m
                                   where m.ticket_id = t.id and not m.is_admin
                                     and m.created_at > coalesce(t.admin_seen_at, '-infinity'::timestamptz)),
             'messages',  (select count(*) from ticket_messages m where m.ticket_id = t.id),
             'preview',   (select left(m.body, 140) from ticket_messages m
                            where m.ticket_id = t.id order by m.created_at desc limit 1)
           ) order by (t.status = 'open') desc, t.updated_at desc), '[]'::jsonb)
      from (select * from tickets
             where p_status = 'all' or status = p_status
             order by updated_at desc limit 200) t
  );
end;
$$;

-- Reported questions with every report's reason and note, worst first.
create or replace function public.admin_reports(p_status text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  return (
    select coalesce(jsonb_agg(x order by (x ->> 'reports')::int desc, x ->> 'lastReported' desc), '[]'::jsonb)
      from (
        select jsonb_build_object(
                 'questionId',   r.question_id,
                 'reports',      count(*),
                 'subject',      s.name,
                 'chapter',      ch.seq,
                 'stem',         q.stem_md,
                 'options',      q.options_json,
                 'answerKey',    q.answer_key_md,
                 'explanation',  q.explanation_md,
                 'editable',     q.id is not null,
                 'lastReported', max(r.created_at),
                 'details',      jsonb_agg(jsonb_build_object(
                                   'reason', r.reason, 'note', r.note, 'shown', r.shown,
                                   'source', r.source, 'at', r.created_at,
                                   'by', prepify_public_name(r.user_id)) order by r.created_at desc)
               ) as x
          from question_reports r
          left join questions q on q.id::text = r.question_id
          left join chapters ch on ch.id = q.chapter_id
          left join books b on b.id = ch.book_id
          left join subjects s on s.id = b.subject_id
         where p_status = 'all' or r.status = p_status
         group by r.question_id, s.name, ch.seq, q.id, q.stem_md, q.options_json, q.answer_key_md, q.explanation_md
         limit 200
      ) y
  );
end;
$$;

-- Mark every report of a question fixed / dismissed / open again.
create or replace function public.admin_set_report_status(p_question_id text, p_status text)
returns text
language plpgsql security definer set search_path = public
as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if p_status not in ('open', 'fixed', 'dismissed') then return 'invalid'; end if;
  update question_reports set status = p_status where question_id = p_question_id;
  return 'ok';
end;
$$;

-- Fix a question in the bank: its wording, the four options, the correct
-- letter and the explanation. Every future test uses the corrected version.
-- Its open reports are marked fixed.
create or replace function public.admin_update_question(
  p_question_id text,
  p_stem        text,
  p_options     jsonb,
  p_answer_key  text,
  p_explanation text
)
returns text
language plpgsql security definer set search_path = public
as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if p_answer_key not in ('A', 'B', 'C', 'D') then return 'bad_answer'; end if;
  if jsonb_typeof(p_options) <> 'array' or jsonb_array_length(p_options) <> 4 then return 'bad_options'; end if;
  if exists (select 1 from jsonb_array_elements_text(p_options) o where trim(o) = '') then return 'bad_options'; end if;
  if char_length(trim(coalesce(p_stem, ''))) < 3 then return 'bad_stem'; end if;

  update questions
     set stem_md = trim(p_stem),
         options_json = p_options,
         answer_key_md = p_answer_key,
         explanation_md = nullif(trim(coalesce(p_explanation, '')), '')
   where id::text = p_question_id;
  if not found then return 'not_found'; end if;

  update question_reports set status = 'fixed' where question_id = p_question_id and status = 'open';
  return 'ok';
end;
$$;

revoke all on function public.is_admin()                          from public, anon;
revoke all on function public.create_ticket(text, text, text, jsonb) from public, anon;
revoke all on function public.my_tickets()                        from public, anon;
revoke all on function public.my_unread_tickets()                 from public, anon;
revoke all on function public.ticket_thread(bigint)               from public, anon;
revoke all on function public.reply_ticket(bigint, text)          from public, anon;
revoke all on function public.set_ticket_status(bigint, text)     from public, anon;
revoke all on function public.admin_overview()                    from public, anon;
revoke all on function public.admin_tickets(text)                 from public, anon;
revoke all on function public.admin_reports(text)                 from public, anon;
revoke all on function public.admin_set_report_status(text, text) from public, anon;
revoke all on function public.admin_update_question(text, text, jsonb, text, text) from public, anon;
grant execute on function public.is_admin()                          to authenticated;
grant execute on function public.create_ticket(text, text, text, jsonb) to authenticated;
grant execute on function public.my_tickets()                        to authenticated;
grant execute on function public.my_unread_tickets()                 to authenticated;
grant execute on function public.ticket_thread(bigint)               to authenticated;
grant execute on function public.reply_ticket(bigint, text)          to authenticated;
grant execute on function public.set_ticket_status(bigint, text)     to authenticated;
grant execute on function public.admin_overview()                    to authenticated;
grant execute on function public.admin_tickets(text)                 to authenticated;
grant execute on function public.admin_reports(text)                 to authenticated;
grant execute on function public.admin_set_report_status(text, text) to authenticated;
grant execute on function public.admin_update_question(text, text, jsonb, text, text) to authenticated;
