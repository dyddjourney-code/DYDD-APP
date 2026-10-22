# Journey row19 image and row20 authored lesson

Integration note: the original local handoff below was completed before row21 arrived. These changes are now released together with row21; see `journey-design-reflections-love-2026-10-22.md` for the batch release and verification contract. Historical local-only statements below describe the first worker’s scope, not the final delivery.

Scope: `identity-the-designid-lens-what-is-in-the-report-19` (Module3 / Section3.2 / Lesson2) image only; `identity-identity-among-believers-20` (Module3 / Section3.2 / Lesson3) complete teaching and non-DesignID CARE. No deployment, production writes, assessments, report generation, spreadsheet writes, or email. Row21 Design Reflections and Love is deliberately unchanged pending John's document.

## Current source mapping

Read-only Google Sheets API snapshot `content/journey/identity-believers-source-2026-10-22.json`: spreadsheet `1GTyYUL883YogJ9n46WyUyhQBZpQuU9nCrMtRlbfP1l4` titled **DYDD Journey Course Content**, actual tab **DYDD Journey Course**, ranges A1:Z1 and A19:Z20, includeGridData. Current headers A Module / B Section / C Lesson / D Lesson Title / E Lesson Focus / F Content / G Image URL / H CARE. Sparse module/section cells remain sparse; stable slugs retained. Rich URL/hyperlink/run metadata preserved in source snapshot.

- Row19 G only → existing `media.image`; no changes to approved Lens teaching, snapshot/data, CARE, layout, or audio. F/H do not replace approved Lens copy.
- Row20 D → existing title. E → focus pills (Heart, Mind, Soul, Strength). F → exact paragraph text, Heart/Soul/Mind/Strength headings, original three-item list, Mark12:28–31 Scripture callout. All wording retained, including embedded Scripture quotations and punctuation.
- Row20 G rich URL → floating top-right authored image within established approved lesson layout.
- Row20 H → four explicit CARE stages, prayer, private reminders and existing autosave controls. Reflect retains all four authored questions together in its comprehensive response prompt. Connect retains both authored questions together. Act is an authored action invitation with a saved response, without adding invented learner-facing questions. No DesignID badge, assessment requirement, detached acronym, or connected-trail panel.

Existing answer IDs `believer-community-placement` and `love-god-four-ways` retain their storage keys. New Act/Explore IDs `believer-love-freely` / `believer-flourishing` are catalogued for workbook, Field Kit, history and text export. `withIdentityBelievers` refreshes only current-round canonical metadata and adds missing keys; retired questions, entries/revisions and archived snapshots remain untouched. Both authenticated GET and owner-preview load use it. Shared storage/auth/access/save implementations are unchanged. Owner profile, preview cookie/key, reports and workbook object paths are unchanged.

## Checks

- `node tests/journey-identity-believers-source.cjs`: exact current teaching/focus/images/CARE/prayer, stable IDs, idempotent/non-mutating upgrade, all neighboring units/audio unchanged, row19 image-only scope.
- `npm run build`, `npm run typecheck`, `node tests/reflection-catalog.cjs`, `node tests/reflection-export.cjs`, `node tests/environment-isolation.cjs`, `node tests/journey-discussion-access.cjs`, `node tests/designid-owner-preview-access.cjs`, `node tests/designid-final-module-source.cjs`, `git diff --check`.
- `node tests/journey-identity-believers-browser.mjs`: owner entry for both lessons, 1920/1280/768/390/320, exact learner copy, both new images loaded, stage ordering/readable controls, no assessment marker, Scripture green bar, uncapped prose, no overflow/runtime errors. Screenshots and geometry under untracked `tmp/identity-believers-*`.
- `JOURNEY_TEST_QUESTION_ID=believer-flourishing node tests/journey-fieldkit-sync.mjs`: isolated real sandbox auth/database saves, pause autosave, immediateNext, FieldKit edit/reopen/history, text exports, reminder eligibility; intercepted transport failure/retry, in-flight edits and conflict behavior. Harness removes synthetic user/entries/reminders in finally. Not fixture-only save success, no customer data writes.

No release command was executed. Parent coordinates row21 and the eventual authorized sandbox deployment; local changes are not a delivered sandbox release.

QA found two scoped issues and fixed them before release: inherited 768px prose max-width now removed only on `.journey-identity-believers-lesson`; the reusable fieldkit test's navigation interception teardown could emit an uncaught late-request rejection, so its test-only handler catches retired interception operations and detaches before disabling. An interrupted synthetic fixture was explicitly identified and cleaned; no owner workbook was reset. Existing estimated row20 duration remains 6–9 minutes; no replacement companion audio was authored.

Final local acceptance passed: both lessons at all five widths with real owner access; new Explore real-database persistence/Field Kit/history/exports at 1280/390/320 and immediateNext/failure-retry/conflict at1280; no runtime errors. Synthetic fixtures removed. Desktop and phone screenshots inspected. Source/copy/unchanged-neighbor checks and shared regressions passed. Source and app tests are tracked files; screenshots/logs are untracked evidence. Local dev server stopped after verification.
