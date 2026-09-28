-- Chapter-scoped tests and question variants, for an already-created database.
-- Idempotent; supabase/schema.sql carries the same definitions for a fresh install.

-- Reworded / re-valued versions of one original question share a family, so a
-- test asks at most one of them.
alter table questions add column if not exists family text;
alter table questions add column if not exists explanation_md text;
create index if not exists questions_chapter_type_idx on questions(chapter_id, type);
create index if not exists questions_family_idx on questions(family);

-- Answerable MCQs per chapter, for the chapter picker. security_invoker so the
-- view is read under the caller's RLS, exactly like the table.
create or replace view chapter_mcq_counts with (security_invoker = true) as
  select chapter_id, count(*)::int as mcq_count
  from questions
  where type = 'mcq' and answer_key_md in ('A', 'B', 'C', 'D')
  group by chapter_id;

grant select on chapter_mcq_counts to authenticated, anon;

-- What a test covered, shown on its card.
alter table tests add column if not exists scope text;
