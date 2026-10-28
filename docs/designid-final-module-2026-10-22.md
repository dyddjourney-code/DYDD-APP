# Final DesignID Module 3 — sandbox-only source release

Baseline: `da7b59f23192a191383b5ed32542786f3e5bfc80`. Only final Module 3 lessons1–3 are changed.
Workbook `1GTyYUL883YogJ9n46WyUyhQBZpQuU9nCrMtRlbfP1l4`, DesignID Course / sheet271274217,
current rich headers A1:Z1 and rows12–14 fetched read-only. Full rich snapshot:
`content/designid-foundations/final-module-source-2026-10-22.json`.
Columns: A sparse module, B lesson, C title, D focus, E teaching/build notes, F rich image hyperlink,
G reflection. Row12 establishes Module3; rows13/14 inherit it.

| Row | Stable slug | Current answer key |
| --- | --- | --- |
| 12 | beautiful-journey | beautiful-journey-respond |
| 13 | exploring-the-dydd-ecosystem | none; historical key retained |
| 14 | call-to-arms | call-to-arms |

Exact authored wording/focus and original image URLs are preserved. Scripture uses the existing
indented green-rule callout; prayer is retained in full. The ecosystem build note becomes a
semantic two-column/six-data-row table with column headers DYDD Journey / How DesignID Fits.
Identity, Expertise, Story, Desire, Gifts and Niche remain in source order; both Gifts paragraphs
are retained. Build notes and 'no reflection for this lesson' are not printed as learner copy.

Row13 has no current canonical reflection, therefore the existing player and standalone route
omit its entire reflection section: no answer input, Save or discussion controls. Historical
round question metadata and saved entries are not deleted; Field Kit/history/text export retain
them. Beautiful Journey retains its matching respond key; its older reflect/notice keys also
remain historical. Current prompt metadata version is2026-10-22. No storage or Save behavior changes.
All earlier authored lesson objects, audio, preserved source, player, catalog and neighboring
course navigation remain unchanged. New ecosystem CSS is table-scoped and preserves prior colors.

## Verification and deployment

Run `npm run build`, `npm run typecheck`, source tests `designid-final-module-source.cjs`,
`designid-lessons-4-6-source.cjs`, `designid-authored-source.cjs`, `designid-welcome-source.cjs`,
`reflection-catalog.cjs`, `reflection-export.cjs`, `environment-isolation.cjs`,
`designid-owner-preview-access.cjs`, and `git diff --check`.

`tests/designid-authored-browser.mjs` verifies all12 authored lessons at1920/1280/768/390/320,
images, available audio playback, exact focus/reflection counts, prose widths and no overflow,
plus standalone/neighbors and an honestly in-memory Save-failure/retry contract.
`tests/designid-final-module-browser.mjs` uses two isolated signed-in sandbox accounts with saved
report fixtures; real auth/report/reflection APIs are unmocked. It checks20 reflective lesson/width
cases,10 ecosystem no-reflection/navigation cases,6 real DB Save/FieldKit edit/reopen/export/navigation
cases and2 unsaved navigation-draft/failure/retry cases. Each newly-created test round receives one
legacy ecosystem question and actual saved answer to prove historical answers survive while
current lesson controls stay absent. Fixture users, snapshots and cascading rounds/entries are
removed in finally; original preview storage checked byte-identical. No customer rows or emails.

Known inherited sandbox BaseCamp preview-prefetch is blocked in real-account QA and only its preview
cookie cleared before bounded page navigations; authentication/report/save routes are not mocked.
Known report fixtures prove signed-in paths, not real customer assessment submission or email delivery.

Push origin sandbox only with John Willoughby/dyddjourney@gmail.com then
`node scripts/deploy-sandbox.mjs`. Require READY/exactGitSHA/expectedCommitSha/project
`prj_5EC6sfJe9DpGYW59L94iwppeMYUg` and stable alias
https://dydd-online-school-sandbox.vercel.app. Re-run published browser QA and inspect all five-width
screenshots. Receipt/QA logs/screenshots/final outcome: `tmp/final-module-*`.
Production master728e88b7681067c9e78b18aa023ba689c502602a and production
aliasdpl_6Cc63HvDtSydhUoxbXxi4MHSzF3p must remain unchanged. No production deploys, sheet writes,
scoring, migrations, email or learner-data changes.
