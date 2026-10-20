# Journey authored spreadsheet content — October 20, 2026

## Authorized scope

John shared **DYDD Journey Course Content**, spreadsheet `1GTyYUL883YogJ9n46WyUyhQBZpQuU9nCrMtRlbfP1l4`, and requested all authored lesson titles, focus, content and images through Handiwork, using the established course format in the **sandbox**. Spreadsheet access was read-only. Snapshot: `content/journey/course-content-2026-10-20.json` (rows 1–18).

## Imported content

13 authored lessons, sheet rows 2–14: Welcome; Course Outline & Objectives; How This Journey Works; Course Resources; What is DYDD?; Grace; On Purpose For Purpose; D.E.S.I.G.N; How to C.A.R.E; DYDD Assessments; Pathfinder (Niche); On Purpose; Handiwork.

- Replaced authoring-style summaries for the first two modules with learner-facing summaries drawn from the authored content; removed a repeated DESIGN heading already supplied by the lesson title.
- Preserved authored wording and focus; represented headings, bullet lists and Scripture as semantic content blocks, not executable HTML.
- Converted book-cover instruction into an inline book image and Gear instruction into a working review-aware `/gear#books` link. Rendered both assessment logos vertically, as requested.
- Updated Handiwork with the additional authored treasure paragraph. Preserved its established portrait, original 86-second WAV, nineteen statements, after-teaching position and closing Psalm.
- Changed the previous Purpose display title to On Purpose without changing its slug. Existing lesson slugs/URLs, workbook question IDs, prompts and versions remain intact.
- Reconciled Identity Overview sheet row metadata 13–17; never renumbered the suffixes in stable lesson slugs.
- Added **Assessment Time: DesignID**, row18, as the first Identity Assessment lesson (Module3/Section3.2/Lesson1). Its content is explicitly pending; no teaching or assessment instructions were invented. All existing lessons remain in their original order around the new slot. Draft has no assessment launch CTA until authored content is available.
- Narrow course-index labels now put lesson counts below the title, avoiding single-character wrapping in the existing desktop sidebar. Scoped to Journey only.
- Later unwritten lessons and assessment behavior are unchanged. No database/schema/auth/scoring modifications; no client emails or production deployment.

## Verification

- `tests/journey-authored-content.cjs` verifies complete source text, focus, primary/additional image URLs, book/Gear handling, new draft slot and stable IDs. With the pre-edit local snapshot, also verifies all existing saved-question IDs/prompts/versions, untouched later lessons and exact preserved Dydi recording metadata.
- Existing reflection catalog/export and environment isolation checks, TypeScript and production build.
- Browser harness `tmp/course-content-qa.mjs`: thirteen authored lessons plus new slot at1280/390/320; all rendered text/focus, actual image loading, Gear URL, correct draft location and neighbor navigation labels, no horizontal overflow/runtime errors, actual Handiwork audio playback and reading/player/closing-Scripture ordering. Executed locally and again against published sandbox.

Production checkout remains `728e88b`. Deployment receipt and exact sandbox alias/SHA verification are recorded in local deployment logs and daily memory.
