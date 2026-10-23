# Expertise Niche Pathfinder — sandbox only

Baseline `b1c02bc7669b216f460572c3930c90276dc0f312`. Stable lesson `expertise-niche-preparation-expertise-33`, module 4 Expertise / section 4.3 Expertise Pathfinder: Niche. No production/master changes.

## Source and approved override

Used source-faithful-course-lessons skill. Current rich read-only workbook headers and A32:Z33 are preserved in `content/journey/expertise-pathfinder-source-2026-10-23.json`; refresh script `scripts/fetch-journey-expertise-pathfinder-source.mjs`. Workbook `1GTyYUL883YogJ9n46WyUyhQBZpQuU9nCrMtRlbfP1l4`, sheetId0/current title DYDD Journey Course. A–H map Module, Section, Lesson, Lesson Title, Lesson Focus, Content, Image URL, CARE. Requested sheet row33 is the sparse next-module header with no lesson text; current sheet row32 is “Niche Preperation: Expertise”, focus Expertise, no teaching/image/CARE. Retain existing app row33/slug rather than inventing a new identity. User-approved opening, transition, two refined parts, closing and supplied business-team Squarespace image supersede the blank source fields.

Learner copy emphasizes God-given talent, faithful practice, reliable competence, deeper wisdom, identity in Christ rather than earned worth, and energy/rest/growth/partnership. The two parts remain Talents and skills; Competency and expertise. Stem is “Which will allow me to use my…”. The paired section8.2 title/heading uses allow too; unrelated Identity stems remain enable. No future companion/build implementation copy is rendered.

## Single saved source and presentation

Original IDs `expertise-talents-skills` and `expertise-declaration` are preserved; early lesson and section8.2 render the same prompt objects, answers and history, not duplicate controls. Current-round metadata refresh now includes those two IDs without rewriting entries/revisions/archives or touching old answer keys. Existing recovery/conflict handling and Field Kit/history/export stay shared. No schema, policies, scoring, auth or assessment changes.

Uses the established burnt-orange non-CARE numbered Pathfinder waypoints and approved floating-image template, target-only opt-in. Closing follows the two controls. Existing original audio across all lessons remains unchanged (this target did not have a separate companion recording). No Connected Trail is added; established forward boundary remains enforced.

## Verification and release

`npm run build`; `npm run typecheck`; `node tests/journey-expertise-pathfinder-source.cjs`; catalog/export/discussion/environment regressions. `tests/journey-expertise-pathfinder-browser.mjs` covers target lesson, paired section8.2, retained original niche audio and builder at1920/1280/768/390/320, loaded exact image, exact copy, canonical IDs, no duplicates/CARE/Connected Trail, no overflow/runtime errors, neighboring CARE and owner `/sandbox-review`→sidebar Trailheads→Journey entry. Screenshots and logs use `tmp/expertise-pathfinder-{local,published}-*`.

Existing `tests/journey-pathfinder-sync.mjs` with `JOURNEY_TEST_QUESTION_ID=expertise-declaration` verifies actual isolated signed-in sandbox DB saves at1280/390/320, both Expertise pieces early→8.2→early (and other canonical shared pieces), pause autosave, immediate Next, reopen, Field Kit editing, append-only revisions/history, round/course/all text exports, original source picker/declaration builder, separately intercepted failure/retry, in-flight and stale-tab protection. `tests/journey-pathfinder-legacy.mjs` covers actual isolated current-round upgrade, original revisions/archive preservation, canonical nonoverwrite and concurrent recovery. Synthetic users/rounds/entries cleaned by finally. Published suites set `JOURNEY_TEST_BASE=https://dydd-online-school-sandbox.vercel.app`.

Release: `node tests/journey-expertise-pathfinder-release.mjs baseline` records actual production master/alias read-only. Push sandbox only; `node scripts/deploy-sandbox.mjs`. `node tests/journey-expertise-pathfinder-release.mjs` proves READY, project `prj_5EC6sfJe9DpGYW59L94iwppeMYUg`, exact HEAD/remote/GitSHA/expectedSHA and stable alias; compares untouched production master/alias. Receipt `tmp/expertise-pathfinder-release-proof.json`.

Review: https://dydd-online-school-sandbox.vercel.app/sandbox-review
Lesson: https://dydd-online-school-sandbox.vercel.app/journey?lesson=expertise-niche-preparation-expertise-33
Shared section8.2: https://dydd-online-school-sandbox.vercel.app/journey?lesson=niche-which-will-enable-me-to-use-my-70
