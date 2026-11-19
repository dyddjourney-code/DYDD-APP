"""Create John's editable first-pass manuscript from the integrated course content."""
import json
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
ROOT = Path(__file__).resolve().parents[1]
OUT = Path("/home/openclaw/.openclaw/workspace/outputs/dydd-journey-four-sections-2026-11-19")
OUT.mkdir(parents=True, exist_ok=True)
drafts = {}
for name in ["story-desire-review", "gifts-niche-review"]:
    drafts.update(json.loads((ROOT / f"content/journey/{name}-2026-11-19.json").read_text()))
baseline = json.loads((ROOT / "content/journey/four-sections-baseline-2026-11-19.json").read_text())
active = json.loads((OUT / "integrated-lessons.json").read_text())
doc = Document()
sec = doc.sections[0]
sec.header.paragraphs[0].text = "Discover Your Divine Design • Journey lesson review"
sec.top_margin = Inches(.75)
sec.bottom_margin = Inches(.7)
normal = doc.styles["Normal"]
normal.font.name = "Calibri"
normal.font.size = Pt(11)
normal.paragraph_format.space_after = Pt(8)
for name in ["Title", "Heading 1", "Heading 2", "Heading 3"]:
    doc.styles[name].font.color.rgb = RGBColor.from_string("31532C")
doc.add_heading("DYDD Journey", 0)
doc.add_paragraph("Story • Desire • Gifts • Niche", style="Subtitle")
doc.add_paragraph("Complete editable first pass for John’s review • November 19, 2026")
intro = ("This manuscript contains every one of the 40 existing lessons in these four sections, "
         "in the established course order. New teaching and prayers are drafted from your book, "
         "leader materials and existing course pattern; they are editorial proposals, not represented "
         "as your previously approved wording. Identity, Expertise and the other neighboring lessons "
         "are unchanged. Scripture references identify biblical grounding. Pathfinder retains your "
         "declaration stems and saved fields rather than adopting CARE. Images are provisional stock "
         "photographs in the review course; existing companion audio has not been rerecorded.")
doc.add_paragraph(intro)
doc.add_paragraph("Review environment: https://dydd-online-school-sandbox.vercel.app/sandbox-review")
doc.add_heading("Suggested review rhythm", 1)
doc.add_paragraph("Read one section at a time. Edit freely in this document; use Word comments for questions, preferred stories, theological emphasis, or image replacements. No source spreadsheet or customer production content has been changed.")
txt = ["DYDD JOURNEY — COMPLETE EDITABLE FIRST PASS", "Story / Desire / Gifts / Niche", "November 19, 2026", "", intro, ""]
mapping = ["# Source and editorial map — November 19, 2026", "", "All 40 target lessons are new editorial drafts for John’s review. Existing app titles/order/stable IDs control the lesson inventory; current rich Sheets source was fetched read-only. Target sheet teaching is blank, not overwritten.", ""]
current_module = None
for n, item in enumerate(baseline, 1):
    u = item["unit"]; slug = u["slug"]; a = active[slug]; d = drafts[slug]
    if current_module != item["module"]:
        current_module = item["module"]
        doc.add_page_break()
        doc.add_heading(current_module.title(), 1)
        txt += ["", "=" * 70, current_module.upper(), "=" * 70, ""]
    doc.add_heading(u["title"], 2)
    doc.add_paragraph("Lesson focus: " + " • ".join(d["focus"]))
    txt += ["", f"{n:02d}. {u['title']}", "Focus: " + " / ".join(d["focus"]), ""]
    for b in d["lessonBody"]:
        if b["type"] == "heading":
            doc.add_heading(b["text"], 3); txt += ["", b["text"]]
        elif b["type"] == "scripture":
            p = doc.add_paragraph(style="Quote")
            p.add_run("“" + b["text"] + "”").italic = True
            p.add_run(" — " + b["reference"])
            txt += ["“" + b["text"] + "” — " + b["reference"], ""]
        elif b["type"] == "list":
            for text in b["items"]:
                doc.add_paragraph(text, style="List Bullet"); txt += ["• " + text]
        elif b["type"] == "paragraph":
            doc.add_paragraph(b["text"]); txt += [b["text"], ""]
        elif b["type"] == "link":
            doc.add_paragraph(b["text"] + ": " + b["href"]); txt += [b["text"] + ": " + b["href"], ""]
        elif b["type"] == "table":
            table = doc.add_table(rows=1, cols=len(b["headers"]))
            for cell, text in zip(table.rows[0].cells, b["headers"]): cell.text = text
            for row in b["rows"]:
                for cell, text in zip(table.add_row().cells, row): cell.text = text
            txt += [" | ".join(b["headers"])] + [" | ".join(row) for row in b["rows"]]
    if a["kind"] == "care":
        doc.add_heading("CARE reflection", 3); doc.add_paragraph(d["careIntro"])
        txt += ["", "CARE REFLECTION", d["careIntro"]]
        for c in d["care"]:
            doc.add_heading(c["stage"].title(), 3); doc.add_paragraph(c["explanation"])
            txt += ["", c["stage"].title(), c["explanation"]]
            for p in a["prompts"]:
                if p.get("careStep") == c["stage"]:
                    doc.add_paragraph(p["label"]); txt += [p["label"]]
    elif a["kind"] == "pathfinder":
        doc.add_heading("Pathfinder", 3); txt += ["", "PATHFINDER"]
        for p in a["prompts"]:
            doc.add_paragraph(p["label"]); txt += [p["label"]]
            if p.get("helper"): doc.add_paragraph(p["helper"]); txt += [p["helper"]]
    if d.get("prayer"):
        doc.add_heading("Prayer", 3); doc.add_paragraph(d["prayer"])
        txt += ["", "PRAYER", d["prayer"]]
    if d.get("nextStep"):
        doc.add_paragraph(d["nextStep"]); txt += ["", "NEXT STEP", d["nextStep"]]
    doc.add_paragraph("John’s review notes: _________________________________________________")
    mapping += [f"## {n:02d}. {current_module.title()} — {u['title']}", "", f"- Stable lesson: `{slug}`", f"- Review: https://dydd-online-school-sandbox.vercel.app/journey?lesson={slug}", f"- Activity: {a['kind']}; saved fields: {', '.join(p['id'] for p in a['prompts']) or 'none'}", "- Sources:"] + ["  - " + s for s in d["sources"]] + [""]
doc.add_page_break()
doc.add_heading("Source and editorial notes", 1)
doc.add_paragraph("Primary source: Discover Your Divine Design, March 26, 2026 edition, Chapters Three through Six. Existing class titles, source-book page references, workbook prompts, Leaders Playbook and supplied workshop/process materials informed this expansion. Exact lesson-by-lesson references are listed below.")
for item in baseline:
    u=item["unit"]; d=drafts[u["slug"]]
    doc.add_heading(u["title"], 3)
    for source in d["sources"]: doc.add_paragraph(source)
footer = sec.footer.paragraphs[0]
footer.text = "Owner review draft • Editable first pass • Not customer production"
doc.save(OUT / "DYDD-Journey-40-Lessons-First-Pass.docx")
(OUT / "DYDD-Journey-40-Lessons-First-Pass.txt").write_text("\n".join(txt) + "\n")
(OUT / "SOURCE-MAP.md").write_text("\n".join(mapping) + "\n")
print("Created editable DOCX, TXT, and exact source/lesson map:", OUT)
