# Welcome to DesignID — sandbox-only source refresh

Scope: first DesignID Foundations lesson `welcome-to-designid`, Module 1 / Welcome, only. Baseline `0d55342ef7c74b83d25a485f02277f278c723c4a` on sandbox; production master remains `728e88b7681067c9e78b18aa023ba689c502602a`. Lesson 2, the other 11 lessons, Journey content and DesignID Lens are unchanged. The course remains a parallel Journey companion, not a Journey replacement.

## Current source and mapping

Spreadsheet `1GTyYUL883YogJ9n46WyUyhQBZpQuU9nCrMtRlbfP1l4` metadata discovered **DesignID Course**, stable sheetId `271274217` (not the renamed DYDD Journey Course sheetId 0). Rich read-only grid headers A1:G1 and first data row A2:G2 inspected; no spreadsheet writes. Committed snapshot `content/designid-foundations/welcome-source-2026-10-21.json`.

| Column | Current header | Implementation |
|---|---|---|
| A/B/C | Module / Lesson / Lesson Title | 1 / 1 / Welcome to DesignID; stable existing slug |
| D | Lesson Focus | Two pieces: Welcome; Overview |
| E | Content | All authored teaching, section headings, numbered goals, Ephesians 2:10, exactly one supplied inline chart; snapshot example values are replaced by real learner values |
| F | Image URL | Rich hyperlink DesignID logo, top-right below faint gold divider |
| G | Reflection | One exact authored prompt under the existing `welcome-to-designid-notice` key |

The first authored line is the existing visible lesson title, not duplicated inside teaching. Only `Inline text image:` is an authoring directive rendered as an image; not printed to the learner. Readable semantic headings/bold restore organization after paste. Supplied images have no caption/green “Open image full size” bar. Desktop/tablet prose flows around the logo and fills its former column below; phones stack. Metadata follows latest Journey estimate: DesignID / Module 1 / Welcome / 3–5 minutes. Original Dydi audio URL, transcript and playback are unchanged (actual file ~22.895 seconds; existing audio-card label retained).

## Actual personalization, not source examples

The server authenticates via `getUser`, loads only that user's attached assessment snapshots through existing owner/email-participant rules, selects the latest `designid` snapshot, then uses `buildDesignIdContext`. Canonical native report producer `lib/designid/report.ts` stores `scores.summary.Primary`, `scores.summary.Secondary`, `scores.summary.Integrative_Reflection`. Existing reader supports matching canonical keys in summary/profileLanguage/scores/root for imported records. Snapshot renders ONLY these three values—never Primary_Text, score bands, shadow, integrative explanation, other assessments, or fabricated defaults. Spreadsheet examples Shepherd/Architect/Innovator are NOT learner data.

Welcome has no generic report-connection panel (which previously included shadow). Missing saved fields say “Not available in your saved report.” A signed-in learner without an assessment follows the existing honest Trailheads prerequisite gate, and cannot create a reflection round; anonymous users go to login. Review previews remain explicitly identified previews and use their real isolated saved review report, not hard-coded values.

## Reflection compatibility

Only one prompt/input is rendered in the first lesson. New rounds contain only `welcome-to-designid-notice`, prompt version `2026-10-21`. Existing current rounds refresh this one prompt's metadata with owner-filtered optimistic CAS; all retired reflect/respond keys remain in their original round and saved entries. Historical rounds and existing revision prompt snapshots remain untouched. Field Kit/history/text exports continue exposing old saved answers, and the new prompt's current answer shares the existing account/round/key/revision storage. No schema, policy, scoring, save timing or discussion eligibility changes. Existing DesignID explicit **Save reflection** rules are retained; this is not Journey autosave.

The legacy HTML stays untouched. The normalization script explicitly retains the authored Welcome override rather than regenerating it from legacy prose.

## Verification and publishing

Commands: `npm run typecheck`, `npm run build`, `node tests/designid-welcome-source.cjs`, `node tests/designid-welcome-browser.mjs`, reflection-catalog/export/environment-isolation, existing authored-Journey regression and sandbox preview access checks. The old optional Journey fixture now explicitly excludes this authorized Welcome prompt update; dedicated Welcome tests validate the change and unchanged neighboring lessons/audio.

Browser test uses two known, distinct synthetic signed-in sandbox accounts and canonical saved snapshot fields at 1920/1280/768/390/320; tests exact three-field snapshot, both focus pieces, one reflection, both real loaded images, audio actual playback, text-node line ranges crossing the logo column after its bottom, divider placement, no overflow/runtime errors, real reflection save/reopen/Field Kit edit/export, old three-key data/history/archive preservation, missing field, no assessment, anonymous gate and standalone lesson. Test-owned accounts/snapshots/rounds/entries are removed. Existing Jordan preview workbook is byte-compared before/after (never rewritten). Screenshots and logs: `tmp/designid-welcome-*`.

Publish only after commit/push to sandbox using `node scripts/deploy-sandbox.mjs`. Verify deployment READY, project `prj_5EC6sfJe9DpGYW59L94iwppeMYUg`, both Git SHA and expectedCommitSha equal pushed HEAD, and stable sandbox alias resolves that exact deployment. Run browser test again with `DESIGNID_TEST_BASE=https://dydd-online-school-sandbox.vercel.app`. Deployment receipt and post-release outcome are recorded in workspace notes/progress ledger to avoid a documentation-only deployment loop.

Local final outcome: all ten account/viewport cases PASS, actual audio plays, original/Field Kit edited answers and retired historic keys export correctly; 1280 failure/retry and saved Next/unchanged lesson 2 PASS. Screenshot inspection additionally caught the inherited sticky tablet menu; a first-lesson-only class now makes the index static at <=1100px, with a non-overlap geometry assertion. Final desktop/tablet/phone screenshots visually reviewed. All isolated test data cleaned and original Jordan workbook byte-identical.

Existing sandbox Jordan review currently has no matching saved DesignID assessment (no Jordan participant record), so its DesignID review URL truthfully follows the existing Trailheads prerequisite gate. No example report was inserted into Jordan and no access bypass was added. A real signed-in sandbox learner with a saved assessment sees their own snapshot; this is explicitly verified with distinct isolated accounts. This data availability is not a fabricated-personalization fallback.
