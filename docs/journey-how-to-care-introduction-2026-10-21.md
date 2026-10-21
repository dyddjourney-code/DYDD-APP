# How to CARE — sandbox-only introduction layout

## Scope and source map

John authorized a sandbox-only rebuild of Journey Module 2 / Section 2.1 / Lesson 5, stable slug `what-is-dydd-how-to-c-a-r-e-10`. Built on `aa6b995`; the revised DesignID introduction is retained. Production is outside scope.

`lib/journey/dydd-course-outline.ts` row 10 remains unchanged: block 0 is the introductory paragraph, block 1 is the four Connect / Act / Reflect / Explore explanatory bullets in authored order, and block 2 is the compass/rhythm closing explanation. No definitions or other teaching copy were created or rewritten.

The slug-scoped `JourneyCareIntroduction` renders the introduction below the retained Lesson focus and CARE Rhythm audio, then reuses Who Vs. Whose's existing `journey-care-divider` four-green-shade visual and `journey-care-process` boxes. The four existing bullets fill the respective boxes. The remaining paragraph appears in one off-white `reflection-answer`-styled informational aside, with no reflection component, question, input, submit or discussion controls. The right-side artwork is omitted only for this slug; source media is retained for fidelity/history.

No other lesson data or CARE workbook renderer was changed. No schema, auth, database policy, service configuration or system repair changes.

## Verification

- `npm run typecheck`, `npm run build`, `git diff --check`.
- `node tests/journey-authored-content.cjs`, `node tests/reflection-catalog.cjs`, `node tests/reflection-export.cjs`, `node tests/environment-isolation.cjs`, `node tests/journey-discussion-access.cjs`.
- `node tests/journey-care-introduction.mjs` checks the exact lesson route at 1280/768/390/320px, original full prose/definitions/focus/order, four-green divider, one informational box, loaded/playable original audio, no activity UI or artwork, no overflow/runtime errors. It then opens three actual CARE lessons (including Who Vs. Whose) and verifies editable reflections and Bring to discussion remain.
- Re-run browser verification with `JOURNEY_TEST_BASE=https://dydd-online-school-sandbox.vercel.app` after explicit sandbox deployment. Screenshots are temporary local QA artifacts, not curriculum.

Publication uses the existing `scripts/deploy-sandbox.mjs` after push; verify exact deployment SHA/project/READY and the stable sandbox alias. Production master remains `728e88b7681067c9e78b18aa023ba689c502602a`.

## Full-width prose follow-up — October 21

The global readable-lesson paragraph cap (`74ch`) still constrained the introductory paragraph and informational prose on wide desktops. A selector scoped to `.journey-care-introduction` removes only that cap; both areas now fill the available CARE panel width, with the information box retaining its internal padding. No wording, audio, focus, green-panel markup or other lesson styles changed.

The actual Chromium regression now measures both text areas against the panel and the information box inner width at 1920/1280/768/390/320px. The new wide-desktop assertion fails against the prior published release and passes with the fix. Build, typecheck, authored-content fidelity and diff checks pass. Re-run the same five-width browser checks after the explicit sandbox release and verify its exact SHA and alias; production remains untouched.


## Personal record callout and audio badge follow-up — October 21

Only this lesson suppresses the companion audio duration badge through an opt-in `showDuration` prop; the original audio source, controls, speakers and transcript stay intact. Every other audio card defaults to showing its duration.

A separate, read-only sage/green callout follows the original beige compass explanation. It introduces later CARE reflections, private workbook saving (not group posting), the growing record used to discover divine design/write a niche, and Field Kit review/earlier walkthroughs/text download. It adds no entry, submit, discussion or navigation controls. Full-width authored paragraphs and the original green/beige panels are unchanged.

Capability evidence: `reflection-session.tsx` shares the same saved answers in Journey/Field Kit, exposes dated history and actual Download text; `course-reflections` API scopes reads/writes by authenticated user and the reflection tables have owner-only RLS; entries append revisions. Export emits saved latest answers and original questions, not unsaved drafts or automatic growth analysis. Owner-review preview saves to an isolated preview workbook, not a personal learner account. No absolute confidentiality, automatic analysis or PDF export is promised. Sandbox email remains disabled; copy promises text download only.

Verification: build/typecheck/authored-content/catalog/text-export/environment-isolation/discussion-access; exact-route actual Chromium desktop1920/1280/tablet768/phone390/320 verifies one additional informational callout, no duration badge here, loaded/playable original audio, no answer/activity controls, original full-width text/four green panels/beige box, no overflow/runtime errors, and other CARE lessons retain their reflection/discussion controls and duration badges. Published save/review/history/text-download/access checks and exact deployment receipt recorded in release notes below.
