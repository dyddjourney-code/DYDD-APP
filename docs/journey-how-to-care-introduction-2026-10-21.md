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
