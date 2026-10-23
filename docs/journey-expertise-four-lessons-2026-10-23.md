# Unit 4 / 4.1 Expertise Journey — sandbox only

Requested lessons: The Journey to Expertise, Talent, Competence, Expertise. Baseline `d1a1f814b98521ddec209780334142f9c443ad97`. Only these four lessons are implemented; remaining Expertise lessons and all other lessons/audio remain unchanged. Never promote this branch/environment configuration to production.

## Current read-only source / stable identity

Spreadsheet `1GTyYUL883YogJ9n46WyUyhQBZpQuU9nCrMtRlbfP1l4`, stable **sheetId 0**, current title **DYDD Journey Course**. The separate **DesignID Course** tab is not the target. Current rich A1:Z1 and A25:Z28, workbook/tab metadata, formatted values, actual hyperlinks, rich-text runs and sparse cells are preserved in `content/journey/expertise-source-2026-10-23.json`; no spreadsheet writes. Re-fetch only when a future content request calls for it using `node scripts/fetch-journey-expertise-source.mjs`. Do not silently sync future edits.

Current headers: A Module, B Section, C Lesson, D Lesson Title, E Lesson Focus, F Content, G Image URL, H CARE. A25/B25 carry Unit4/section4.1; subsequent empty parent cells inherit that context.

| Sheet row | Authored title | Existing stable lesson slug | Existing app row |
| --- | --- | --- | --- |
| 25 | The Journey To Expertise | `expertise-the-journey-to-expertise-26` | 26 |
| 26 | Talent | `expertise-talent-27` | 27 |
| 27 | Competence | `expertise-competence-28` | 28 |
| 28 | Expertise | `expertise-expertise-29` | 29 |

The user listed rows in reverse order; titles reconcile unambiguously to the ascending lesson sequence above. Legacy row suffixes must not be regenerated from current sheet rows. Exact authored focus, teaching, CARE wording, prayer, Scripture citations and source images are used. Existing spelling/word choice, including “A Biblical Principal,” “Knowledge tuns into Wisdom,” and “Peter 4:10,” is not silently edited. Bullets/headings and verse callouts change presentation only.

## Expertise build note and sole authored addition

H28 contains `*Build note: Please add an appropriate intro text block here.` immediately beneath **Care**, before **Connect**. It is an implementation instruction, not learner copy. It is replaced by this short introduction at the top of the Expertise CARE panel (after the CARE title, before the shared saving directions/stages):

> Expertise grows through faithful practice, humble learning, and time spent with Jesus. Use CARE to notice where He is forming wisdom in you and choose a next step that serves others.

No other narrative was authored or personalized. Teaching's rhetorical questions remain teaching copy; the sixteen authored CARE response stages each have an editable saved field. Instruction-form Act/Explore responses receive fields too. Both authored prayers remain after the grid; Talent/Competence do not receive invented prayers.

## Layout and persistence

Four-lesson-only opt-in to the approved forward template: image top-right on desktop, uncapped text using the full width below it; narrow-screen image rules retained; compact separate focus pills; Scripture uses dark-green left bars and preserves authored quote/citation rather than adding NIV; stage heading/explanation/prompt/control kept together, Connect/Act/Reflect/Explore as 2×2 desktop and stacked phone. No duplicate summary/teaching title or assessment personalization. Original companion audio and timing metadata retained.

Six existing visible answer keys retained: `growth-signs`, `success-struggle-formation`, `expertise-talent-27-workbook-response`, `expertise-competence-28-workbook-response`, `competent-to-expert`, `next-learning-stretch`. Ten additional IDs are the relevant stable lesson slug plus `-care-{stage}`. `withExpertise` upgrades only current-round prompt metadata, idempotently and without mutation; never deletes old question metadata, responses, dated revisions or archived rounds. Both real authenticated and owner-preview current-workbook loaders invoke it. Field Kit/history/export resolve the same catalog; discussion eligibility is derived from the same workbook resolver. No schema/auth/policy change.

Shared `JourneyCareDirections` documents actual pause/blur autosave, Next flushing, visible saved/error/retry state, Field Kit review/text downloads and optional private Take to Class reminders. Marks are not posts, notifications or external messages.

## Verification / release contract

- `node tests/journey-expertise-source.cjs`: rich headers/identity and exact current copy, images, focus, all 16 question mappings, six retained keys, current-only upgrade/history/idempotence, all neighboring units and companion audio byte-equivalent to baseline.
- `node tests/reflection-catalog.cjs`, `node tests/reflection-export.cjs`, `node tests/environment-isolation.cjs`, `node tests/journey-discussion-access.cjs`.
- `npm run typecheck`; `npm run build`.
- `node tests/journey-expertise-browser.mjs`: 20 rendered lesson/viewport cases at1920/1280/768/390/320; exact source copy, loaded images, full-width paragraph geometry, green Scripture bars, ordered two-column/stacked CARE,16 rendered inputs and reminder controls, no overflow/runtime errors, actual retained audio playback, neighboring One Anothering controls, owner `/sandbox-review`→sidebar Trailheads→Journey.
- `JOURNEY_TEST_QUESTION_ID=expertise-expertise-29-care-act node tests/journey-fieldkit-sync.mjs`: existing full real isolated sandbox auth/database harness: pause/blur save, immediate Next, reopen, Field Kit edit/revisions/text export, private reminders, transport failure/retry/concurrent-edit protections and cleanup. This is not merely intercepted successful-save evidence.
- Repeat browser and persistence commands using `JOURNEY_TEST_BASE=https://dydd-online-school-sandbox.vercel.app` after explicit publication.

Untracked `tmp/expertise-{local,published}-row{25,26,27,28}-{width}.png` and layout JSON retain screenshots/geometry; logs are `tmp/expertise-{local,published}-{browser,sync}.log`, `tmp/expertise-build.log`, `tmp/expertise-typecheck.log`. Actual source URLs are tested against source hyperlinks, not image labels.

Publish only pushed `sandbox` using `node scripts/deploy-sandbox.mjs`; it validates sandbox project/database and expected SHA. Release receipt `tmp/expertise-release-proof.json` verifies READY + exact SHA in Git/expected metadata + project + stable alias, and compares actual production master/alias with a fresh baseline (not obsolete production commit assumptions). Owner entry `https://dydd-online-school-sandbox.vercel.app/sandbox-review`; lesson links are `/journey?lesson={stable slug}` above. Parent owns visible Telegram progress/delivery.

## Local acceptance completed before publication

All source/catalog/export/environment/discussion regressions passed. Optimized production build and standalone typecheck passed. Local browser completed all20cases, real original audio playback, neighboring CARE and owner sidebar routing with zero browser errors. Existing full persistence harness passed1280/390/320 against an isolated real sandbox account, including exact prompts/revisions/round-course-all exports/reminders, immediateNext and failure/retry/concurrent edits; synthetic account and reminder objects removed in finally. Desktop screenshots visually inspected; published run additionally captures isolated teaching/CARE surfaces for all20cases. The precise publication receipt is generated by `node tests/journey-expertise-release.mjs` after deploy; `baseline` records actual production master/alias before it.
