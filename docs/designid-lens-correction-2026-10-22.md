# DesignID Lens correction — sandbox only

Target stable lesson: `identity-the-designid-lens-what-is-in-the-report-19`, Journey Module3 / Section3.2 / Lesson2. Baseline f72a762888dbde22210418bc8b9def21c36f8bc8. Publish only sandbox project prj_5EC6sfJe9DpGYW59L94iwppeMYUg using documented `scripts/deploy-sandbox.mjs`; production untouched.

## Source root cause and correction

The native report generator hardcoded the same invented generic twelve Shadow_Risk/Root/Red_A..D values for every primary reflection. Existing browser tests compared the UI to that generator, establishing internal consistency but not canonical correctness. The saved reportPayload could therefore contain incorrect generic copy; trusting it blindly repeated the defect.

Live read-only workbook Shadow!A1:G5 and Scored/Export_For_Results lookup/split formulas now establish exact content by saved **Primary**, not secondary/integrative/Potential_Shadow. See `designid-lens-canonical-source-2026-10-22.md` and `content/designid-shadow-canonical.json` for exact provenance, raw values/formulas and all48 cells. Canonical Artisan risks are exactly Perfectionism, Overcontrol, Criticism, Analysis Paralysis.

`lib/designid/shadow.ts` centralizes the source lookup; native report generation now supplies exact canonical shadow fields. Authenticated saved-report context reads current sections and reportPayload-only historical records and projects canonical shadow cells by the person's saved Primary. This also corrects the genuine owner historical attachment display without altering the stored assessment, original snapshot/payload, PDF, scores, person, or timestamps. Unknown/missing primary remains unavailable. No customer data migration/enrichment, scoring recalculation, production lookup, source workbook write, assessment submission, email, or report/PDF regeneration.

## Lesson-only presentation

Focus first, single compact `DesignID results` pill. Existing Welcome back introduction preserved with its single image beside it. Removed lower duplicate lesson heading/body/image and connected-trail card for this lesson only. Snapshot then existing Unpack Your Reflections CARE. Three divided Primary/Secondary/Integrative blocks; removed top Shadow/Control label. Compact four-row DesignID Capacity left, scored saved-data doughnut right; stacks readably on narrow screens. Existing audio retained. All approved CARE prompt/answer keys, persistence, discussion marks, Field Kit/history/progress/badges and owner identity/all-course access untouched.

## Verification

`tests/designid-canonical-shadow.cjs` derives the48 expected cells from raw canonical multiline source, checks all4 actual scored native outputs, and proves historical stale generic/summary/payload-only resolution without mutating snapshots. `tests/journey-designid-snapshot.mjs` uses two isolated real signed-in saved score patterns (Artisan and Steward), tests12 exact canonical cells independently from generator, all five widths, missing report and incomplete saved fields, existing CARE actual DB immediateNext/reopen and owner recovery; fixtures cleaned in finally. `tests/john-owner-universal-access.mjs` verifies actual owner/new entry and four courses, original PDF, all12 canonical shadow cells, saved capacities/points and ordinary learner/anonymous boundaries; existing owner profile/CARE/reminder objects checked byte-identical. Five-width screenshots at1920/1280/768/390/320 under untracked tmp; exact release receipt and command output recorded in task status.

Phone reflection blocks stack with dividers and capacity rows use full available width to prevent narrow-word wrapping at320px; desktop/tablet retains three columns and side-by-side capacity/doughnut. Scoped title/intro image count and connected-trail absence are asserted independently from snapshot values.
