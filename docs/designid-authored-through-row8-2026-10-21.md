# Authored DesignID through spreadsheet row 8 — sandbox only

Baseline `ec5a0ca`; authorized sandbox branch/project only. Preserve the completed course hero/top navigation, sidebar, gold sandbox bar, review/access gates, stable lesson slugs and reflection answer keys. No spreadsheet writes, assessments, emails or new users. Production branch/deployment unchanged.

## Source count and mapping

Read-only Sheets API rich-grid fetch of current `DesignID Course!A1:Z10` in spreadsheet `1GTyYUL883YogJ9n46WyUyhQBZpQuU9nCrMtRlbfP1l4`, sheetId `271274217`. Snapshot: `content/designid-foundations/authored-through-row8-2026-10-21.json`. Inspected formattedValue, hyperlink, textFormatRuns. A/B/C = Module/Lesson/Lesson Title, D = Lesson Focus, E = Content, F = Image URL (rich hyperlink), G = Reflection. Sparse modules carry forward. IDs are existing course IDs, never row-derived.

**There are seven authored lessons TOTAL through row 8, not seven new lessons after Welcome.** Row 1 is headers; Welcome is row 2 and remains unchanged. Six next lessons have authored teaching in rows 3–8. Row 9 Integrative Reflections has title/focus only and empty Content/Image/Reflection; it retains its existing lesson rather than receiving invented new copy. Same for later unsupplied lessons.

| Row | Module / lesson | Existing slug | Authored reflection key |
| --- | --- | --- | --- |
| 2 | 1 / 1 Welcome to DesignID | welcome-to-designid | unchanged welcome-to-designid-notice |
| 3 | 1 / 2 The Biblical Foundation of Your DesignID | biblical-foundation | biblical-foundation-respond |
| 4 | 1 / 3 Saved By Grace | saved-by-grace | saved-by-grace-notice |
| 5 | 1 / 4 On Purpose - For Purpose | on-purpose-for-purpose | on-purpose-for-purpose-respond |
| 6 | 2 / 1 What Is in the Report | what-is-in-the-report | none, no bottom box |
| 7 | 2 / 2 Your Design Profile | your-design-profile | none, no bottom box |
| 8 | 2 / 3 Reflection Capacity | reflection-capacity | reflection-capacity |

All six current bodies/focus/image links preserve authored wording; headings/lists/scripture use semantic HTML. No BUILD NOTE/DESIGN NOTE or placeholder instructions are printed. Existing audio moments/transcripts remain untouched. Shared source body serves course player and standalone routes; no image-caption button or generic report-connection box appears in these authored lessons. Paragraphs have no inherited character-width cap; imagery floats on desktop and stacks below 768px.

Capacity displays saved capacity references per reflection plus the requested 2x2: Abundant top-left, Limited top-right, Steady bottom-left, Drained bottom-right. The sheet says “Bottom Left” twice (Steady and Drained); placing Drained in the remaining bottom-right slot resolves that collision without losing any content. Below 768px the order is row-major Abundant, Limited, Steady, Drained in one column.

## Saved report linkage

No new query, endpoint, score calculation, schema or policy. Both routes retain existing `getUser` authentication, owner/email-participant scoped `getAssessmentSnapshotsForUser`, latest `designid` snapshot and prerequisite gates. Existing `buildDesignIdContext` reader already supports canonical values in `scores.summary`, `scores.profileLanguage`, `scores.scores` and imported root keys. It now additionally reads only saved `Primary_Text`/`Primary_Summary` into primaryIntro, `Secondary_Text`/`Secondary_Summary` into secondaryIntro, and `Spiritual_Strength`.

Your Design Profile uses a semantic table Reflection / Score / Capacity, with Architect, Artisan, Shepherd, Steward in that order. Scores and capacity come from canonical `Architect_Pts` etc and `Band_Architect` etc. Zero remains zero. Primary/secondary labels and initial saved report paragraphs use actual latest-report fields, not source Shepherd/Architect examples or a report-library lookup. Integrative label uses Integrative_Reflection, expression uses Integrative_Expression then Integrative_Summary; Spiritual_Strength and source submission/creation assessment date follow. Every dynamic value is HTML escaped. Missing data is explicit “Not available in your saved report.” No invented score, band, persona or boilerplate intro substitutes for missing saved report data.

The sandbox Jordan owner teaching preview currently has no DesignID report: honest unavailable fields remain, and workbook assessment prerequisites are not bypassed. Two distinct synthetic canonical report objects verify actual data-to-render mapping, first-paragraph extraction, score zero, HTML escaping, date and missing data in pure tests without persistent test records. Published preview/browser verifies the real route and missing state, not an invented signed-in report. A fresh signed-in end-to-end report test would require an existing authorized test account/session; none was created.

## Reflection compatibility

Four authored questions retain their matching existing IDs. Canonical current catalog removes retired prompts only from current lesson UI; existing answers/round question snapshots/revisions remain available to Field Kit/history/export. The existing owner-filtered optimistic current-round metadata refresh now updates the authorized exact prompts and versions as well as Welcome, keeping all retired IDs. Archived rounds remain untouched. New rounds have no questions for the two explicitly no-reflection lessons. DesignID remains explicit **Save reflection**, not Journey autosave. No save API/storage/auth behavior was altered.

## Verification / deployment

- `npm run typecheck`
- `npm run build`
- `node tests/designid-authored-source.cjs`
- `node tests/designid-welcome-source.cjs` (unchanged-neighbor assertion scopes out these newly authorized lessons)
- `node tests/reflection-catalog.cjs`, `node tests/reflection-export.cjs`, `node tests/environment-isolation.cjs`
- `node tests/designid-authored-browser.mjs` (local built server :3124)
- `DESIGNID_AUTHORED_BASE=https://dydd-online-school-sandbox.vercel.app node tests/designid-authored-browser.mjs`

Browser checks six lessons at 1920/1280/768/390/320; real loaded images, focus, exact reflection counts, no reflection containers for report/profile, no source notes/placeholders/runtime errors, no document overflow, maxWidth removal, static narrow course menu, 2x2 geometry/order, retained actual audio playback where supplied. Visual inspection caught inherited `display:block` tables shrinking internal rows despite full-width table bounds; this snapshot restores semantic table display and checks tbody width against table width. Screenshots `tmp/designid-authored-{local|published}-{slug}-{width}.png` are inspected. Standalone paths and Welcome/Integrative neighboring reflection controls are checked. Explicit save/blur/failure/retry/reopen uses browser-intercepted in-memory transport only: no test accounts, records, assessment runs or remote reflection saves. Existing export/environment tests use mock transport; no emails sent.

Publish scoped commit to `origin sandbox`, then `node scripts/deploy-sandbox.mjs`. Receipt must be READY for project `prj_5EC6sfJe9DpGYW59L94iwppeMYUg`, expectedCommitSha/Git SHA equal pushed HEAD, and stable alias `dydd-online-school-sandbox.vercel.app` resolving exact deployment. Post-release receipt/progress evidence is kept in `tmp/designid-seven-status.md` and returned to the parent, avoiding a documentation-only redeploy loop.

Entry: https://dydd-online-school-sandbox.vercel.app/sandbox-review then course menu. Direct course lesson: `/courses/designid-foundations?lesson=your-design-profile` after opening the existing preview entry. No production publication.

Local outcome: all 30 lesson/viewport cases PASS; six standalone routes, Welcome/Integrative neighbor controls, retained audio, in-memory save failure/retry/reopen, and preview/header/sidebar/gold-bar/anonymous/invalid-access regressions PASS. Desktop/tablet/phone screenshots were actually inspected. Snapshot table uses a reserved label column and compact single-line mobile headings; assertions check all header text fits and table rows fill the panel. No Supabase feature/auth/schema change was needed; current changelog reviewed, unrelated Postgres/GraphQL changes do not affect rendering saved report fields.

Published QA uses DOM-content readiness plus explicit rendered-lesson/image assertions. A network-idle navigation wait timed out despite the correct live lesson and loaded image; the harness now avoids treating ongoing unrelated network activity as lesson failure.
