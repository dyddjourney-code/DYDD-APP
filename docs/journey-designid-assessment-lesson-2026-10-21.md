# Assessment Time: DesignID — sandbox content load

## Authorized scope

Load John's revised lesson text into Module 3 / Section 3.2 Identity Assessment / Lesson 1, stable slug `identity-assessment-time-designid` (row 18). This supersedes the unwritten slot recorded in the October 20 spreadsheet import; the read-only spreadsheet snapshot is unchanged.

## Changes

- Replace the draft placeholder with the supplied paragraphs, Ephesians 2:10 quotation, headings, three next steps, reflection bullets and closing instruction.
- Adapt the launch instruction to the actual existing **Open Connected Trail** control, which opens `/trailheads?from=journey#designid` and preserves owner-review access. No new assessment launch button is implied.
- Retain the existing Identity badge artwork, two-column lesson layout, lesson ID, focus, section and neighboring lessons. No new wheel image was supplied or substituted.
- Remove the draft status so existing assessment-introduction navigation is displayed; provide a useful duration instead of “Coming soon.”

## Deliberately unchanged

No gating, result-personalization, assessment/scoring, saved question IDs, reflection prompts, workbook persistence, production, spreadsheet, schema or customer database changes. Completion guidance is learner copy, not a new progression gate.

## Verification

Typecheck, production build, authored-content fidelity, reflection catalog/export, environment isolation, Circle scheduling and diff whitespace checks. Exact-lesson browser checks at 1280/390/320px validate all authored blocks and Scripture, Module/Section/Lesson location, loaded original artwork, existing review-aware Trailhead navigation, neighboring lessons, no overflow and no runtime errors. Snapshot comparison verifies all other 70 lessons unchanged.

Deployment follows `node scripts/deploy-sandbox.mjs` after pushing the sandbox branch. Stable production is outside this task.
