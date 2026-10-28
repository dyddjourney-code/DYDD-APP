# DesignPD illustrated header and phone comparison stacks — sandbox only

## Scope and unchanged behavior

Baseline `sandbox` commit `4edee92`. John authorized the DesignPD header and the previously deferred phone comparison-card presentation. Production master `728e88b7681067c9e78b18aa023ba689c502602a` and its deployment must remain unchanged. Publish explicitly with `node scripts/deploy-sandbox.mjs` only after pushing `sandbox`.

The supplied, already illustrated JPG is copied **byte-for-byte**, without regeneration, resizing, recompression or metadata edits, to `public/brand/designpd-course-cartoon-hero.jpg`. SHA256: `aff898961ca1bbb8faac0f7235efacc5f861026f39b76dcd0d0f0c89bae781b1`. Other course artwork files are unchanged. The generic overview reuses the existing Journey-style hero and connected module strip; all eight module names/counts/first-lesson destinations come from `designPdCourse`, preserving validated preview query/cookie and lane context.

## Complete current text-chart inventory

| Surface | Chart / grouping | Shared routes |
| --- | --- | --- |
| DesignID `integrative-reflections` | The Six Integrated Reflections; each blend and description stays with its named reflection | Course player + standalone |
| DesignID `learning-and-contribution` | How You Naturally Learn; Contribution to the Body; each paragraph stays under Architect, Artisan, Shepherd, Steward in authored order | Course player + standalone |
| DesignID `shadow-reflections` | Authenticated saved Risks → Root Cause → Redemption; each complete row stays together | Course player + standalone |
| DesignID `exploring-the-dydd-ecosystem` | How DesignID Fits Within DYDD; each explanation stays with its Journey heading | Course player + standalone |
| Journey `identity-the-design-reflections-and-love-21` | Reflection/love comparison; each reflection with all four authored aspects, in existing order | Journey shared lesson body |
| Journey `identity-the-designid-lens-what-is-in-the-report-19` | Saved shadow rows A–D; Risks → Root Cause → Redemption remain grouped within the original row | Journey saved snapshot |

Seven rendered tables across six lessons. Inventory reviewed current `components`, generic course/player/standalone routes, `lib/courses` presentation/authored/personalized bodies, and `lib/journey`. Legacy raw source remains an archive and is not substituted into current lessons. DesignPD/Spiritual Gifts/FruitLife teaching currently uses already grouped text rather than custom comparison tables. Existing CARE grids already stack with complete heading/explanation/question/answer controls and remain untouched.

**Excluded:** numerical score summaries, capacity bands, scored report wheels/diagrams, assessment allocations/sorts, and Circle/report comparison tools. They remain charts. All authored content files, stored question IDs, persistence/report/scoring/API logic, audio files and recent Pathfinder source/recovery work are unchanged.

## Presentation architecture

At **<768px only**, opt-in `.mobile-comparison-table` uses one complete row per stacked group. Existing column headings label the corresponding text cells. The existing semantic table and source DOM order remain a single tree; no duplicated content, inputs or client-side DOM reordering. `mobileComparisonTables` decorates only trusted authored `designid-authored-table` markup, never numerical `designid-live-snapshot` score tables. Journey's typed table renderer supplies the same metadata directly. The saved Journey shadow receives metadata only after personalization and its A–D row headers are assembled.

At **768px and above**, the existing table layout, content, geometry and computed styles remain unchanged. The scoped phone rules override inherited first-column percentage widths so each heading fills its group. Desktop scroll hints remain unchanged; the old Journey shadow scroll instruction is hidden only on phones where all columns are now vertically readable.

## Verification / evidence

- `npm run build`, `npm run typecheck`, `git diff --check`.
- `node tests/environment-isolation.cjs`, `node tests/reflection-catalog.cjs`, `node tests/reflection-export.cjs`, `node tests/designid-lessons-4-6-source.cjs`, `node tests/journey-pathfinder-source.cjs`, `node scripts/verify-designpd-source-parity.mjs`.
- `node tests/designpd-header-mobile-charts.mjs`: 1920/1280/768/390/320px exact artwork, all eight actual module navigations, real sandbox owner sidebar entry, all seven comparison tables, source-cell equality, per-type reading order/full-width labels, no hidden columns/page overflow/runtime errors, shared standalone routes, numerical-table exclusion, neighboring headers and anonymous gate.
- `node tests/mobile-comparison-persistence.mjs`: isolated actual sandbox account and engine-scored report; all three response-bearing DesignID chart lessons preserve explicit Save, and Journey love/lens preserve pause/blur autosave. At1280/390/320 checks real database saved entries, Next/reopen, Field Kit and TXT export. At1280 also checks failure/draft retention/retry and original audio playback. Only synthetic test objects are removed in finally; no owner workbook is edited.
- Published acceptance repeats both suites with `COURSE_TEST_BASE=https://dydd-online-school-sandbox.vercel.app`.
- Pre-change built application captured desktop geometry/text/computed styles at1920/1280/768. Twenty of21 table captures compare exactly. The old love1280 capture caught a transient113px layout; an independent original-markup comparison verifies identical current desktop geometry/styles, and the published suite repeats that original-presentation check for every desktop table. Screenshots inspected for desktop and phone.
- Existing `journey-design-reflections-love-source.cjs` contains an obsolete whole-outline baseline predating later authorized Identity/Pathfinder changes; its unrelated-neighbor equality fails on the starting branch. New source-cell browser checks and unchanged-source comparison against `4edee92` cover the current task without rewriting prior work.

The older `designpd-course-access.cjs` harness also lacks newer preview mocks and expects retired access redirects; it is not used as release proof. Current `designid-owner-preview-access.cjs`, environment-isolation and real-browser owner/anonymous checks pass without any guard changes.

Task state, screenshots/logs, current verification summary and exact Vercel project/GitSHA/READY/stable-alias/production-unchanged receipt are retained under untracked `tmp/designpd-header-mobile-*`, including `status.md`, `release-proof.json`, and `verification.json`. No production, schema, policy, auth configuration or email actions are part of this release.
