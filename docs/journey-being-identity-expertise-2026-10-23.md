# Being Vs. Doing / Connecting Identity & Expertise — sandbox only

Baseline `6d2c50f825d48d897cc33331ba533d83750c33da`. Source-faithful lesson workflow; never promote sandbox environment configuration to production.

Current source: workbook `1GTyYUL883YogJ9n46WyUyhQBZpQuU9nCrMtRlbfP1l4`, sheetId0 / **DYDD Journey Course**. Fresh rich headers and rows29/31 are in `content/journey/identity-expertise-source-2026-10-23.json`; read-only fetch script `scripts/fetch-journey-identity-expertise-source.mjs`. AModule/BSection/CLesson/DTitle/EFocus/FContent/GImage/HCARE. Row29 section4.2/lesson1, exact title **Being Vs. Doing**, existing app row30/slug`expertise-being-vs-doing-30`. Row31 lesson3/title **Connecting Identity & Expertise**, existing app row32/slug`expertise-connecting-identity-and-expertise-32`; its current E–H cells are EMPTY. John's subsequent direct paste is authoritative for row31; see the continuation section below.

## Being Vs. Doing

Exact authored focus, all teaching, image URL, CARE introduction and four full response stages, Scripture, prayer loaded. Authored typos retained (including “Write out eh first prayer that comes to mind..”). No added learner copy. Shared approved top-right image/full-width prose, green-bar Scripture, compact focus,2×2 CARE desktop/stacked phone. Existing `busy-taking-stage` Connect and `being-rhythm` Explore IDs retained; additive `expertise-being-vs-doing-30-care-act` and `expertise-being-vs-doing-30-care-reflect`. Existing current-round `withExpertise` migration includes the new canonical lesson; old entries/revisions/archived rounds never rewritten. Existing shared Field Kit/history/plaintext export/private reminders and saving directions retained.

Applied Capacity and every unrequested lesson/audio are unchanged. `tests/journey-being-source.cjs` compares all neighbors byte-equivalent to baseline (excluding the separately authorized row31 update); prior four-expertise source test remains scoped to its four original rows, while checking updated canonical total.

## Verification commands

- `node tests/journey-being-source.cjs`
- `node tests/journey-expertise-source.cjs`
- `node tests/reflection-catalog.cjs`; `node tests/reflection-export.cjs`; `node tests/environment-isolation.cjs`; `node tests/journey-discussion-access.cjs`
- `npm run build`; `npm run typecheck`
- `node tests/journey-being-browser.mjs` (1920/1280/768/390/320, actual source/image/focus/prose/CARE/nooverflow; neighboring CARE/audio/owner route)
- `JOURNEY_TEST_QUESTION_ID=expertise-being-vs-doing-30-care-act node tests/journey-fieldkit-sync.mjs` (real isolated sandbox auth/database autosave/blur/Next/FieldKit/history/export/reminder/reopen; separately intercepted failure/retry/concurrency)

Published commands use `JOURNEY_TEST_BASE=https://dydd-online-school-sandbox.vercel.app`. Deploy pushed sandbox only using `node scripts/deploy-sandbox.mjs`; exact receipt verifies READY/project/GitSHA/expectedSHA/stablealias and actual production baseline. Parent owns Telegram progress/delivery; no email.

## Connecting Identity & Expertise (user-pasted source)

John supplied row31 teaching/matrix directly after the empty spreadsheet cells were confirmed. The source is now available, not pending. Authoritative archived learner copy: `content/journey/identity-expertise-user-source-2026-10-23.json`; raw handoff: `output/journey-identity-expertise-2026-10-23/row31-user-source.txt` in the workspace. Do not write this back to the workbook. Stable app row32/slug `expertise-connecting-identity-and-expertise-32`; source row31. All three supplied paragraphs are preserved, with only `not**_ _**who` cleaned to `not who`. No Scripture/prayer or other CARE stages invented. Existing Expertise chapter artwork/audio behavior retained.

Exact supplied four reflections × three continuum cells are rendered as a full desktop table and equivalent stacked cards ≤700px. Approved added CARE introduction: “Your identity is the root; expertise is its growing expression. Use the matrix below to notice how talent develops into competency and expertise in your primary and secondary reflections, then choose a faithful next step for each.” Single improved Reflect question: “Where do you currently see talent, competency, and expertise expressed in your primary and secondary reflections, and what is one next step that would help each grow?”

Two independent responses retain BOTH original stored IDs: `expertise-connecting-identity-and-expertise-32-designid-connect` = Primary and `expertise-connecting-identity-and-expertise-32-designid-reflect` = Secondary. The historical connect suffix is a storage identifier, not a rendered Connect stage. Catalog/current-round prompt metadata updates through the existing `withExpertise` path; entries/revisions/archived-round history are not rewritten. Field Kit/extract/history/private reminders use the established shared controls and APIs.

Server page projects Primary/Secondary from the same authenticated saved DesignID report used in the snapshot (including historical `reportPayload`-only records). It passes only the two names to the lesson. JSX escapes labels. Missing report/individual fields show “Not available in your saved report” with a short explanation; no demo or inferred scores replace missing fields. Authorized owner-preview retains the established explicit preview-report path. Real account-path QA uses disposable signed-in accounts with engine-scored reports stored in the sandbox, NOT fixtures intercepting successful saves and NOT real owner answers.

### Row31 verification / release

- `node tests/journey-identity-expertise-source.cjs`: exact prose and 12 matrix cells, stable two keys, profile extraction variants/unavailable states, every neighbor/audio (including already-published Being and Applied Capacity) unchanged from `64e1f1e`.
- `node tests/journey-identity-expertise-browser.mjs`:1920/1280/768/390/320, full matrix or mobile cards, one Reflect/two editable controls/private reminders, no overflow/runtime errors; owner recovery/sidebar route. Screenshots `tmp/connecting-{local,published}-{care,teaching}-{width}.png`.
- `node tests/journey-identity-expertise-profile.mjs`: two different real isolated signed-in saved profiles (normal summary + reportPayload-only),1280/390/320 labels; two distinct persisted responses; immediate Next/reopen; cross-account answer isolation; partial/absent report states without answer loss; all synthetic users/reports/workbooks removed.
- `JOURNEY_TEST_QUESTION_ID=expertise-connecting-identity-and-expertise-32-designid-connect node tests/journey-fieldkit-sync.mjs`: actual sandbox DB saves1280/390/320; pause/blur/Next, Field Kit edit/reopen/history, all text export scopes, private mark/note/unmark. Separately intercepted503 failure/retry/in-flight edit/stale-tab protection.
- Same harness with `...-designid-reflect` tests the separate Secondary path. Repeat critical browser/profile/persistence checks against `JOURNEY_TEST_BASE=https://dydd-online-school-sandbox.vercel.app`.
- Existing Being/four-Expertise source/catalog/export/environment/discussion tests plus typecheck/optimized build/diff checks. Supabase changelog inspected; no schema/auth/RLS/storage/scoring architecture changes.
- Explicit sandbox-only deploy: `node scripts/deploy-sandbox.mjs`. `node tests/journey-identity-expertise-release.mjs baseline` captures actual production alias/master before publication; `node tests/journey-identity-expertise-release.mjs` checks READY/project/exactGitSHA/expectedSHA/stablealias and unchanged production, writes `tmp/connecting-release-proof.json` with BOTH URLs.
