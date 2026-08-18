#!/usr/bin/env python3
"""Ingest an FBISE textbook .docx into a Prepify curriculum seed JSON.

Extracts chapters -> topics -> textbook text (the grounding the tutor and the
AI quiz-generator run on). Questions are NOT pre-generated: they are produced at
runtime from this text. Real per-chapter SLO bullets ("After completing this
lesson, you will be able to...") are captured when present.

Usage:
  python3 scripts/ingest_docx.py <book.docx> <Subject> <class_level> <out.json>
Example:
  python3 scripts/ingest_docx.py Chemistry_9th.docx Chemistry 9 content/chemistry-9.curriculum.json

Heuristic and best-effort: FBISE Word files are irregular (duplicated runs,
header bleed, mis-styled notes), so review the output before seeding.
"""
import zipfile, xml.etree.ElementTree as ET, re, json, sys

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

# Chemistry-9 chapter titles (extend/adjust per book; falls back to "Chapter N").
KNOWN_TITLES = {
    ("Chemistry", 9): {
        1: "Fundamentals of Chemistry", 2: "Structure of Atoms",
        3: "Periodic Table and Periodicity of Properties", 4: "Structure of Molecules",
        5: "Physical States of Matter", 6: "Solutions",
        7: "Electrochemistry", 8: "Chemical Reactivity",
    },
}

NOISE = re.compile(r"^(a?\s*teacher may|teacher may|do you know\??|reading|this is a \d+ days? lesson|after completing this lesson|solution:?|example\b)", re.I)

def dedupe(s):
    s = s.strip()
    n = len(s)
    if n >= 8 and n % 2 == 0 and s[:n // 2] == s[n // 2:]:
        s = s[:n // 2].strip()
    m = re.fullmatch(r"(.{6,}?)\s+\1", s)
    if m:
        s = m.group(1).strip()
    return s

def clean(s):
    s = dedupe(s).replace("National Book Foundation", "")
    return re.sub(r"\s+", " ", s).strip()

def is_noise(s):
    return (not s) or s.isdigit() or len(s) <= 2 or bool(NOISE.match(s))

def is_topic_title(s):
    # Real section heading: short, and not lowercase-leading prose.
    if not s or len(s) > 70:
        return False
    first = next((c for c in s if c.isalpha()), "")
    return not (first and first.islower())

def load_paras(path):
    root = ET.fromstring(zipfile.ZipFile(path).read("word/document.xml"))
    body = root.find(W + "body")
    out = []
    for p in body.iter(W + "p"):
        style = None
        ppr = p.find(W + "pPr")
        if ppr is not None:
            ps = ppr.find(W + "pStyle")
            if ps is not None:
                style = ps.get(W + "val")
        out.append((style, "".join(t.text or "" for t in p.iter(W + "t"))))
    return out

def extract(path, subject, class_level):
    paras = load_paras(path)
    titles = KNOWN_TITLES.get((subject, class_level), {})

    openers = [i for i, (s, t) in enumerate(paras)
               if re.fullmatch(r"\s*after completing this lesson, you will be able to:?\s*", t, re.I)]
    starts = []
    for o in openers:
        if not starts or o - starts[-1] > 60:
            starts.append(o)
    bounds = list(zip(starts, starts[1:] + [len(paras)]))

    chapters = []
    for ci, (a, b) in enumerate(bounds, start=1):
        seg = paras[a:b]
        slos = []
        for s, t in seg[1:40]:
            if s == "ListParagraph":
                c = clean(t)
                if c and not is_noise(c):
                    slos.append(c)
            elif slos and s not in ("ListParagraph", "None"):
                break

        topics, cur = [], None
        for s, t in seg:
            c = clean(t)
            if s == "Heading2" and is_topic_title(re.sub(r"^(reading|do you know\??)+", "", c, flags=re.I).strip()):
                cur = {"title": re.sub(r"^(reading|do you know\??)+", "", c, flags=re.I).strip()[:80], "content": []}
                topics.append(cur)
            elif cur is not None:
                if s == "Heading3" and c and not is_noise(c):
                    cur["content"].append("### " + c)
                elif s in ("BodyText", "ListParagraph", "None") and not is_noise(c):
                    cur["content"].append(("- " + c) if s == "ListParagraph" else c)

        if not topics:
            continue

        # Fold the real learning outcomes into the first topic's grounding text.
        if slos:
            lo = "Chapter learning outcomes:\n" + "\n".join("- " + x for x in slos)
            topics[0]["content"].insert(0, lo)

        out_topics = []
        for ti, tp in enumerate(topics, start=1):
            md = "\n\n".join(tp["content"]).strip()
            if len(md) < 40:
                continue
            out_topics.append({
                "seq": ti,
                "title": tp["title"],
                "est_minutes": 20,
                "slos": [{
                    "code": f"{subject[:3].upper()}-{class_level}-{ci}.{ti}.1",
                    "statement": tp["title"],
                    "content_md": md,
                }],
            })
        chapters.append({"seq": ci, "title": titles.get(ci, f"Chapter {ci}"), "topics": out_topics})

    return {"subject": subject, "class_level": int(class_level),
            "_meta": {"note": "AI-ingested from FBISE .docx; human-verify before showing students.",
                      "source": path.split("/")[-1]},
            "chapters": chapters}

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print(__doc__); sys.exit(1)
    _, src, subject, cls, out = sys.argv
    doc = extract(src, subject, int(cls))
    json.dump(doc, open(out, "w"), ensure_ascii=False, indent=2)
    nt = sum(len(c["topics"]) for c in doc["chapters"])
    print(f"Wrote {out}: {len(doc['chapters'])} chapters, {nt} topics")
    for c in doc["chapters"]:
        print(f"  Ch{c['seq']} {c['title']}: {len(c['topics'])} topics")
        for t in c["topics"]:
            print(f"      - {t['title']} ({len(t['slos'][0]['content_md'])} chars)")
