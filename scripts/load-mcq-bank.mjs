// Loads content/mcq-bank/*.json (plus extra/, variants/ and generated/) into the
// `questions` table.
//
//   node scripts/load-mcq-bank.mjs                 # write via the service role
//   node scripts/load-mcq-bank.mjs --sql           # emit batched SQL for a SQL console instead
//   node scripts/load-mcq-bank.mjs --subject=Physics
//
// Idempotent: every run first deletes the chapter's existing source='bank' rows,
// so re-running after a bank edit replaces rather than duplicates.
//
// Questions whose answer is still null are skipped — they cannot be asked until
// scripts/derive-answers.mjs has filled them in.

import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { readBank, usableQuestions, familyOf } from "./lib/bank-read.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const bankDir = join(root, "content", "mcq-bank");

function loadEnv() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

// difficulty word -> the `questions.difficulty` 1..5 scale the schema uses.
const DIFFICULTY_INT = { easy: 1, medium: 3, hard: 5 };
const SLUG = { Chemistry: "chemistry", Physics: "physics", Maths: "maths", "Computer Science": "computer-science", English: "english" };

function readBankForLoad() {
  if (!existsSync(bankDir)) {
    console.error(`No bank at ${bankDir} — run scripts/ingest-mcqs.mjs first.`);
    process.exit(1);
  }
  return readBank(bankDir)
    .filter((c) => !args.subject || c.subject === args.subject)
    .map((c) => {
      const usable = usableQuestions(c);
      return {
        file: `${SLUG[c.subject]}-u${String(c.chapter_seq).padStart(2, "0")}.json`,
        subject: c.subject,
        chapter_seq: c.chapter_seq,
        questions: usable,
        total: c.questions.length,
        variants: usable.filter((q) => q.kind === "variant" || q.kind === "generated").length,
      };
    });
}

// One row as the `questions` table wants it. answer_key_md is a bare A-D letter
// because lib/curriculum.ts letterToIndex() silently falls back to index 0 for
// anything it cannot parse — a wrong-answer hazard, so keep it strict.
function toRow(q, chapterId) {
  const letter = "ABCD"[q.answer];
  if (!letter) throw new Error(`unmappable answer ${q.answer} for: ${q.stem.slice(0, 60)}`);
  return {
    chapter_id: chapterId,
    type: "mcq",
    category: q.scenario ? "scenario" : "concept",
    source: "bank",
    difficulty: DIFFICULTY_INT[q.difficulty] ?? 3,
    stem_md: q.stem,
    options_json: q.options,
    answer_key_md: letter,
    marks: 1,
    // Every version of one original question shares a family; the builder asks
    // at most one member per family in a test.
    family: familyOf(q),
    explanation_md: q.explanation ?? null,
  };
}

const banks = readBankForLoad();
const skipped = banks.reduce((a, b) => a + (b.total - b.questions.length), 0); // rejected or unanswered
console.log(
  `Bank: ${banks.length} chapter files · ${banks.reduce((a, b) => a + b.questions.length, 0)} loadable questions ` +
    `(${banks.reduce((a, b) => a + b.variants, 0)} of them variants)` +
    (skipped ? ` · ${skipped} not loadable (rejected or unanswered)` : ""),
);

if (args.sql) {
  // SQL mode, for when only a SQL console is available (the Supabase SQL editor
  // or the MCP execute_sql tool). Writes:
  //   00-loader.sql   a helper function that maps subject + chapter seq to the
  //                   chapter row and inserts compact JSON rows
  //   batch-NN.sql    ~40 KB each: calls to the helper, a chapter's first call
  //                   deleting its old source='bank' rows
  //   99-verify.sql   per-chapter count and checksum, to compare with
  //                   expected.json, then drops the helper
  // Every row is [stem, options, answer letter, difficulty 1-5, scenario 0/1, family].
  const outDir = join(root, "scripts", "mcq-bank-sql");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const lit = (v) => `'${String(v).replace(/'/g, "''")}'`;
  writeFileSync(
    join(outDir, "00-loader.sql"),
    `create or replace function public.prepify_load_bank(p_subject text, p_seq int, p_rows jsonb, p_replace boolean)
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
`,
  );

  const LIMIT = 40_000;
  const batches = [];
  let current = [];
  let size = 0;
  const expected = {};
  for (const bank of banks) {
    if (bank.questions.length === 0) continue;
    const rows = bank.questions.map((x) => {
      const r = toRow(x, null);
      return [r.stem_md, r.options_json, r.answer_key_md, r.difficulty, r.category === "scenario" ? 1 : 0, r.family];
    });
    // Checksum the database can reproduce: md5 over sorted md5(stem|A|B|C|D) || letter || family.
    const parts = rows.map((r) => createHash("md5").update([r[0], ...r[1]].join("|")).digest("hex") + r[2] + r[5]).sort();
    expected[`${bank.subject}::${bank.chapter_seq}`] = { count: rows.length, md5: createHash("md5").update(parts.join("")).digest("hex") };
    let chunk = [];
    let first = true;
    const flush = () => {
      if (!chunk.length) return;
      const json = JSON.stringify(chunk);
      if (json.includes("$j$")) throw new Error("row text contains the dollar-quote tag");
      const call = `select public.prepify_load_bank(${lit(bank.subject)}, ${bank.chapter_seq}, $j$${json}$j$::jsonb, ${first});`;
      if (size + call.length > LIMIT && current.length) {
        batches.push(current);
        current = [];
        size = 0;
      }
      current.push(call);
      size += call.length;
      first = false;
      chunk = [];
    };
    let chunkSize = 0;
    for (const r of rows) {
      const len = JSON.stringify(r).length;
      if (chunkSize + len > LIMIT - 200) {
        flush();
        chunkSize = 0;
      }
      chunk.push(r);
      chunkSize += len;
    }
    flush();
  }
  if (current.length) batches.push(current);
  batches.forEach((b, i) => writeFileSync(join(outDir, `batch-${String(i + 1).padStart(2, "0")}.sql`), b.join("\n") + "\n"));
  writeFileSync(join(outDir, "expected.json"), JSON.stringify(expected, null, 2) + "\n");
  writeFileSync(
    join(outDir, "99-verify.sql"),
    `select s.name as subject, c.seq, count(*) as count,
       md5(string_agg(x, '' order by x collate "C")) as md5
  from (select q.chapter_id, md5(q.stem_md || '|' || (q.options_json->>0) || '|' || (q.options_json->>1) || '|' || (q.options_json->>2) || '|' || (q.options_json->>3)) || q.answer_key_md || q.family as x
          from questions q where q.source = 'bank') q
  join chapters c on c.id = q.chapter_id join books b on b.id = c.book_id join subjects s on s.id = b.subject_id
 group by s.name, c.seq order by s.name, c.seq;
drop function if exists public.prepify_load_bank(text, int, jsonb, boolean);
`,
  );
  console.log(`Wrote 00-loader.sql, ${batches.length} batch files, 99-verify.sql and expected.json to ${outDir}`);
  process.exit(0);
}

// Direct mode: needs the service role, which bypasses RLS.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (in .env.local or the environment),\n" +
      "or re-run with --sql to generate SQL you can paste into the Supabase SQL editor.",
  );
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

// subject name -> chapter seq -> chapter id
const { data: chapterRows, error: chapterErr } = await db
  .from("chapters")
  .select("id, seq, books(subjects(name))");
if (chapterErr) {
  console.error("Could not read chapters:", chapterErr.message);
  process.exit(1);
}
const chapterIndex = new Map();
for (const row of chapterRows ?? []) {
  const book = Array.isArray(row.books) ? row.books[0] : row.books;
  const subj = Array.isArray(book?.subjects) ? book.subjects[0] : book?.subjects;
  if (!subj?.name) continue;
  chapterIndex.set(`${subj.name}::${row.seq}`, row.id);
}

let inserted = 0;
let missing = [];
for (const bank of banks) {
  const chapterId = chapterIndex.get(`${bank.subject}::${bank.chapter_seq}`);
  if (!chapterId) {
    missing.push(`${bank.subject} ch${bank.chapter_seq}`);
    continue;
  }
  if (bank.questions.length === 0) continue;

  const { error: delErr } = await db.from("questions").delete().eq("chapter_id", chapterId).eq("source", "bank");
  if (delErr) {
    console.error(`  delete failed for ${bank.file}: ${delErr.message}`);
    continue;
  }
  const rows = bank.questions.map((q) => toRow(q, chapterId));
  // Chunked so a chapter with 100 questions doesn't make one oversized request.
  for (let i = 0; i < rows.length; i += 50) {
    const { error } = await db.from("questions").insert(rows.slice(i, i + 50));
    if (error) {
      console.error(`  insert failed for ${bank.file}: ${error.message}`);
      break;
    }
    inserted += Math.min(50, rows.length - i);
  }
  console.log(`  ${String(bank.questions.length).padStart(4)}  ${bank.subject} ch${bank.chapter_seq}`);
}

console.log(`\nInserted ${inserted} questions.`);
if (missing.length) console.log(`No chapter row for: ${missing.join(", ")}`);
