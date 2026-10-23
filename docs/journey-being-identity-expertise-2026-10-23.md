# Being Vs. Doing / Connecting Identity & Expertise — sandbox only

Baseline `6d2c50f825d48d897cc33331ba533d83750c33da`. Source-faithful lesson workflow; never promote sandbox environment configuration to production.

Current source: workbook `1GTyYUL883YogJ9n46WyUyhQBZpQuU9nCrMtRlbfP1l4`, sheetId0 / **DYDD Journey Course**. Fresh rich headers and rows29/31 are in `content/journey/identity-expertise-source-2026-10-23.json`; read-only fetch script `scripts/fetch-journey-identity-expertise-source.mjs`. AModule/BSection/CLesson/DTitle/EFocus/FContent/GImage/HCARE. Row29 section4.2/lesson1, exact title **Being Vs. Doing**, existing app row30/slug`expertise-being-vs-doing-30`. Row31 lesson3/title **Connecting Identity & Expertise**, existing app row32/slug`expertise-connecting-identity-and-expertise-32`; its current E–H cells are EMPTY. Wait for John's supplied row31 copy; no invented teaching or matrix.

## Being Vs. Doing

Exact authored focus, all teaching, image URL, CARE introduction and four full response stages, Scripture, prayer loaded. Authored typos retained (including “Write out eh first prayer that comes to mind..”). No added learner copy. Shared approved top-right image/full-width prose, green-bar Scripture, compact focus,2×2 CARE desktop/stacked phone. Existing `busy-taking-stage` Connect and `being-rhythm` Explore IDs retained; additive `expertise-being-vs-doing-30-care-act` and `expertise-being-vs-doing-30-care-reflect`. Existing current-round `withExpertise` migration includes the new canonical lesson; old entries/revisions/archived rounds never rewritten. Existing shared Field Kit/history/plaintext export/private reminders and saving directions retained.

Applied Capacity and every other lesson/audio are unchanged. `tests/journey-being-source.cjs` compares all neighbors byte-equivalent to baseline (including pending row31); prior four-expertise source test remains scoped to its four original rows, while checking updated canonical total.

## Verification commands

- `node tests/journey-being-source.cjs`
- `node tests/journey-expertise-source.cjs`
- `node tests/reflection-catalog.cjs`; `node tests/reflection-export.cjs`; `node tests/environment-isolation.cjs`; `node tests/journey-discussion-access.cjs`
- `npm run build`; `npm run typecheck`
- `node tests/journey-being-browser.mjs` (1920/1280/768/390/320, actual source/image/focus/prose/CARE/nooverflow; neighboring CARE/audio/owner route)
- `JOURNEY_TEST_QUESTION_ID=expertise-being-vs-doing-30-care-act node tests/journey-fieldkit-sync.mjs` (real isolated sandbox auth/database autosave/blur/Next/FieldKit/history/export/reminder/reopen; separately intercepted failure/retry/concurrency)

Published commands use `JOURNEY_TEST_BASE=https://dydd-online-school-sandbox.vercel.app`. Deploy pushed sandbox only using `node scripts/deploy-sandbox.mjs`; exact receipt verifies READY/project/GitSHA/expectedSHA/stablealias and actual production baseline. Parent owns Telegram progress/delivery; no email.
