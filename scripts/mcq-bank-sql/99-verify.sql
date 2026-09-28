select s.name as subject, c.seq, count(*) as count,
       md5(string_agg(x, '' order by x collate "C")) as md5
  from (select q.chapter_id, md5(q.stem_md || '|' || (q.options_json->>0) || '|' || (q.options_json->>1) || '|' || (q.options_json->>2) || '|' || (q.options_json->>3)) || q.answer_key_md || q.family as x
          from questions q where q.source = 'bank') q
  join chapters c on c.id = q.chapter_id join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
 group by s.name, c.seq order by s.name, c.seq;
drop function if exists public.prepify_load_bank(text, int, jsonb, boolean);
