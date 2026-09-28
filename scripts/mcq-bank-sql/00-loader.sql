create or replace function public.prepify_load_bank(p_subject text, p_seq int, p_rows jsonb, p_replace boolean)
returns int language plpgsql security definer set search_path = public as $$
declare ch uuid; n int;
begin
  select c.id into ch from chapters c join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
   where s.name = p_subject and c.seq = p_seq;
  if ch is null then raise exception 'no chapter % %', p_subject, p_seq; end if;
  if p_replace then delete from questions where chapter_id = ch and source = 'bank'; end if;
  insert into questions (chapter_id, type, category, source, difficulty, stem_md, options_json, answer_key_md, marks, family)
  select ch, 'mcq', case when (r->>4)::int = 1 then 'scenario' else 'concept' end, 'bank', (r->>3)::int,
         r->>0, r->1, r->>2, 1, r->>5
    from jsonb_array_elements(p_rows) r;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.prepify_load_bank(text, int, jsonb, boolean) from public, anon, authenticated;
