// Seed the curriculum from content/*.curriculum.json into Supabase.
//
//   node scripts/seed.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (from .env.local
// or the environment). Uses the service role, so it bypasses RLS. Idempotent:
// re-running replaces the subject's book tree.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// --- tiny .env.local loader (no dependency) ---------------------------------
function loadEnv() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. See .env.local.example.");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const ALL_SUBJECTS = [
  "Physics", "Chemistry", "Biology", "Maths", "Computer Science", "English", "Urdu", "Islamiyat", "Pak Studies",
];

async function upsertSubjectByName(name, track) {
  const { data: existing } = await db.from("subjects").select("id").eq("name", name).maybeSingle();
  if (existing) {
    if (track) await db.from("subjects").update({ track }).eq("id", existing.id);
    return existing.id;
  }
  const { data, error } = await db.from("subjects").insert({ name, track }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function insert(table, row) {
  const { data, error } = await db.from(table).insert(row).select("id").single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data.id;
}

function mcqRow(q, chapterId, sloId) {
  return {
    slo_id: sloId ?? null,
    chapter_id: chapterId,
    type: "mcq",
    category: q.category ?? "concept",
    source: "authored",
    bloom_level: q.bloom ?? null,
    difficulty: q.difficulty ?? 1,
    stem_md: q.stem,
    options_json: q.options,
    answer_key_md: q.answer,
    marks: q.marks ?? 1,
  };
}

async function seedCurriculum(file) {
  const doc = JSON.parse(readFileSync(join(root, "content", file), "utf8"));
  console.log(`\nSeeding ${doc.subject} class ${doc.class_level} from ${file}`);

  const subjectId = await upsertSubjectByName(doc.subject, doc.track);

  // Replace this subject's book tree so re-runs stay clean (cascades down).
  await db.from("books").delete().eq("subject_id", subjectId).eq("class_level", doc.class_level);
  const bookId = await insert("books", { subject_id: subjectId, class_level: doc.class_level, edition: "FBISE" });

  let nChapters = 0, nTopics = 0, nSlos = 0, nQuestions = 0;

  for (const ch of doc.chapters) {
    const chapterId = await insert("chapters", { book_id: bookId, seq: ch.seq, title: ch.title, title_ur: ch.title_ur ?? null });
    nChapters++;
    const codeToSlo = {};

    for (const topic of ch.topics) {
      const topicId = await insert("topics", { chapter_id: chapterId, seq: topic.seq, title: topic.title, est_minutes: topic.est_minutes ?? 20 });
      nTopics++;

      for (const slo of topic.slos) {
        const sloId = await insert("slos", { topic_id: topicId, code: slo.code, statement: slo.statement, bloom_level: slo.bloom_level ?? null });
        codeToSlo[slo.code] = sloId;
        nSlos++;

        await insert("content_chunks", {
          slo_id: sloId,
          seq: 1,
          content_md: slo.content_md,
          token_count: Math.ceil((slo.content_md ?? "").split(/\s+/).length * 1.3),
        });

        for (const q of slo.topic_mcqs ?? []) {
          await insert("questions", mcqRow(q, chapterId, sloId));
          nQuestions++;
        }
      }
    }

    // Chapter-test bank ----------------------------------------------------
    const test = ch.chapter_test ?? {};
    for (const q of test.mcqs ?? []) {
      await insert("questions", mcqRow(q, chapterId, codeToSlo[q.slo] ?? null));
      nQuestions++;
    }
    for (const q of [...(test.short_questions ?? []), ...(test.long_questions ?? [])]) {
      const type = (test.long_questions ?? []).includes(q) ? "long" : "short";
      const qid = await insert("questions", {
        slo_id: codeToSlo[q.slo] ?? null,
        chapter_id: chapterId,
        type,
        category: q.category ?? "concept",
        source: q.category === "exercise" ? "exercise" : "authored",
        stem_md: q.stem,
        marking_scheme_json: q.marking_scheme ?? null,
        marks: q.marks ?? (type === "long" ? 5 : 2),
      });
      nQuestions++;
      if (q.model_answer) {
        await insert("model_answers", { question_id: qid, exemplar_md: q.model_answer });
      }
    }
  }

  console.log(`  ✓ ${nChapters} chapters, ${nTopics} topics, ${nSlos} SLOs, ${nQuestions} questions`);
}

async function main() {
  // Ensure all nine dashboard subjects exist so enrolments resolve, even though
  // only Physics carries full content in this seed.
  console.log("Ensuring subject rows exist…");
  for (const name of ALL_SUBJECTS) {
    await upsertSubjectByName(name, name === "Physics" ? "pre_eng" : null);
  }

  await seedCurriculum("physics-9.curriculum.json");
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
