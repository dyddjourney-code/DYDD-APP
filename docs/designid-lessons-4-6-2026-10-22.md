# DesignID Lessons 4–6 — source-faithful sandbox release

Authorized environment: sandbox ONLY. Baseline `ce4ed94200586c6d9c279112666f95dd216393e2`.
Production master `728e88b7681067c9e78b18aa023ba689c502602a` and production deployment
`dpl_6Cc63HvDtSydhUoxbXxi4MHSzF3p` must remain unchanged.

## Fresh source mapping

Workbook `1GTyYUL883YogJ9n46WyUyhQBZpQuU9nCrMtRlbfP1l4`, tab **DesignID Course**,
sheetId `271274217`, current rich headers A1:Z1 and complete rich rows A9:Z11
fetched read-only on October 22. Snapshot:
`content/designid-foundations/lessons-4-6-source-2026-10-22.json`.
A module carries **Module 2: Understanding Your DesignID Report Results** from earlier sparse rows;
B lesson number, C title, D focus (comma-separated), E authored teaching/build notes,
F original image hyperlink, G exact reflection question. All formatted values,
hyperlinks and any text runs retained in snapshot; no workbook edits.

| Source row / module lesson | Stable slug | Retained stored-answer key |
| --- | --- | --- |
| 9 / 2.4 | integrative-reflections | integrative-reflections-respond |
| 10 / 2.5 | learning-and-contribution | learning-and-contribution-respond |
| 11 / 2.6 | shadow-reflections | shadow-reflections-notice |

These keys already carried the exact authored questions. Retired reflect/notice/respond
keys, existing answer revisions and old rounds remain in history/Field Kit/export;
only current canonical prompt metadata receives version `2026-10-22`. Earlier current
lessons keep `2026-10-21`. No migrations, key renaming, scoring or audio changes.

## Authored build notes implemented

- Integrative: semantic **3 columns × 6 data rows**, with headers Integrative Reflection /
  Blend / Description, in the exact new source order: Visionary, Interpreter, Craftsman,
  Overseer, Guardian, Innovator. Full authored descriptions retained.
- Learning and Contribution: introduction first, then **2 columns × 4 data rows** in
  each section (Architect, Artisan, Shepherd, Steward), headers and source wording.
  Reflection colors are accents/tinted row backgrounds, with dark readable prose.
- Shadow: **4 data rows × 3 columns** Risks / Root Cause / Redemption, read from the
  authenticated learner's latest saved report's `Shadow_Risk_A..D`, `Shadow_Root_A..D`,
  `Shadow_Red_A..D`. Existing canonical summary/profileLanguage/scores/import-root
  compatibility plus native `scores.reportPayload` is retained (confirmed in `app/designid/actions.ts`). HTML escaping on every field. Each absent field says
  **Not available in your saved report.** No library-generated guesses, sample report
  values, hardcoded scores, or assessment/report regeneration.

Build notes are not learner copy. Scripture is indented with the existing dark-green
left rule; no new translation suffix/footer. Shared authored body serves player and
standalone. Existing sidebar, hero, gold review bar, compact focus pills, report gate,
authentication, explicit **Save reflection** behavior, and neighboring lessons remain.

## Palette provenance (no invented colors)

Canonical palette found in preserved `lib/courses/designid-source-html.ts`:
`integrative-reflections` legacy per-name card borders/headings give the following
RGB values. Hex conversion is exact; source order now follows the new workbook.

| Integrative reflection | Preserved RGB | Hex |
| --- | --- | --- |
| Visionary | 156,144,118 | #9c9076 |
| Interpreter | 107,141,125 | #6b8d7d |
| Craftsman | 95,98,131 | #5f6283 |
| Overseer | 151,118,94 | #97765e |
| Guardian | 103,115,101 | #677365 |
| Innovator | 163,161,88 | #a3a158 |

Four reflection accents are independently consistent in preserved
`learning-and-contribution` source and `lib/maps-report/report.ts` reflectionFields:
Architect #d4a451; Artisan #647c9b; Shepherd #739d5e; Steward #5a496b.

## Verification and publication workflow

Required: `npm run typecheck`, `npm run build`,
`node tests/designid-lessons-4-6-source.cjs`,
`node tests/designid-authored-source.cjs`, `node tests/designid-welcome-source.cjs`,
`node tests/reflection-catalog.cjs`, `node tests/reflection-export.cjs`,
`node tests/environment-isolation.cjs`, `node tests/designid-owner-preview-access.cjs`.

At built local :3124 and again at stable sandbox:

- `node tests/designid-authored-browser.mjs`: all nine authored lessons ×
  1920/1280/768/390/320, images, actual audio, exact reflection counts, no overflow,
  full-width prose, standalone bodies, neighbors and in-memory failure/retry/save.
- `node tests/designid-lessons-4-6-browser.mjs`: two distinct isolated signed-in sandbox
  users with different saved shadow fields, 30 lesson/viewport cases, table dimensions
  and canonical accents, true database saves/Field Kit edits/export/reopen/immediate
  saved Next at 1280/390/320 for all three lessons; desktop unsaved Next/back draft retention (no database autosave) and failure/retry;
  standalone personalized shadow, anonymous gate, cross-user isolation. Synthetic
  users/reports/rounds removed in finally; original teaching-preview workbook checked
  byte-identical. No external emails, customer records or production writes.

Published environment variables: `DESIGNID_AUTHORED_BASE` and `DESIGNID_LESSONS_BASE`
set to `https://dydd-online-school-sandbox.vercel.app`.

Commit/push only `origin sandbox`, John Willoughby <dyddjourney@gmail.com>, then
`node scripts/deploy-sandbox.mjs`. Require READY, project
`prj_5EC6sfJe9DpGYW59L94iwppeMYUg`, exact Git SHA + expectedCommitSha = pushed HEAD,
and stable alias resolving exact deployment. Recheck receipt after published tests.
Receipt, runtime results and screenshot evidence stay in `tmp/lessons-4-6-*`, with
final release outcome in `tmp/lessons-4-6-status.md` to avoid a docs-only deployment loop.

## Limits

Existing owner teaching preview has no actual DesignID report; shadow missing states
there are intentional. Real signed-in verification uses isolated known QA snapshots,
not customer/John report mutation. Older/incomplete reports may not retain the twelve
shadow fields; those remain explicitly unavailable rather than guessed.
No real customer assessment or email delivery is tested or claimed. Existing sandbox Base Camp navigation auto-prefetch can set an owner-preview cookie;
real-account QA blocks those unrelated preview-entry/prefetch routes and clears only that
preview cookie before bounded navigations, while using unmodified authenticated report/save APIs.
This inherited global preview behavior is not altered by the lesson-scoped release. No discussion
feature change; DesignID continues explicit Save, not Journey autosave.
