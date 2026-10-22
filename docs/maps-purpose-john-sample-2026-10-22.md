# John MAPS Purpose review sample — October22,2026

## Scope and source

Local John-only draft; no production/sandbox application edits, commit, push, deployment, email, workbook/database/schema writes. The live `/api/command-center/maps-report` generator is `lib/maps-report/report.ts`; its vocabulary comes from `lib/maps-report/content.ts`, not the stored native definition at render time.

John's real DC3 participant was disambiguated from other same-name/test records using the existing35/33/29/3 profile (Artisan/Shepherd/Architect/Steward). Only this person's current DesignID and DesignPD snapshots are used. DesignPD: Strong Dreamer18, Moderate Feel It12, Moderate Solo14. Raw inputs remain private under `tmp/maps-purpose-sample/`.

## Exact Purpose-only changes

- Preserve simple definition, project demand question, core capacity need, common use, Reflection Capacity Lens and Plan/Decide/Do Lens.
- Shorten strength/gap/support and generic explanatory text; address John directly rather than saying what a report should do.
- Keep all scores/bands/tendencies. Shorten capacity and action-support explanations; remove repeated generic Plan movement paragraph from eachABC card.
- Remove bottom Reflection Space on this sample only.
- Preserve Calling/Direction/Kingdom Impact definitions, biblical lens, design capacity, scripture references and summaries word-for-word. EnlargeABC body from6.55px to12px (about4.9pt→9pt), increase line-height1.02→1.35 and inner spacing; alignABC headings.

## Circle vocabulary verified—no rename needed

Downloaded current live Drive workbook `DesignID Journey Mapping.xlsx`, ID`1wsM19c2KRkq5ofqcXypYvp9v41lfnhKc`, version299, modified2026-10-16T17:03:23.930Z, read-only. MAPS rows1/2/3 match all4phase,12subcategory and36term labels in current app content and live native database definition (`maps_personal_roadmap`, version2026-10-09). The rendered cover circle was visually inspected. `Direction` remains a Purpose term; `Development` remains the Approach subcategory. Full evidence: `tmp/maps-purpose-sample/terminology-verification.json`.

## PDF verification and download

Current local generator + current real John inputs create18page baseline. Only page3(Purpose) is replaced. Chromium global page-fit changes can otherwise rescale unrelated pages even with scopedCSS; final PDF therefore assembles the17original baseline pages unchanged around the new one-page Purpose PDF. Text and60dpi raster comparisons confirm exactly page3changed and all17otherpages identical, including cover circle and all4section-opening pages/Mission scatterplot. One-page sample matches full report page3exactly. JSON proof: `tmp/maps-purpose-sample/pdf-verification.json`.

Deliverable folder: workspace `output/maps-purpose-sample-2026-10-22/`. Parent delivers both PDFs directly to John in Telegram. Existing Command Center route is admin-only or accepts existing owner-preview credentials. Stored local owner-token probe returned307(login redirect); no authentication changes were made and no live downloadable revised URL is claimed. Existing normal UI download remains unchanged; attached draft is the review copy.

Reproduction uses scoped scripts in `tmp/maps-purpose-sample/` (`read-sources.cjs`, `build-sample.cjs`, `refine-purpose.cjs`, `assemble-final.py`, `verify-labels.py`, `verify-pdfs.py`). Production code and allotherparticipants remain unchanged.
