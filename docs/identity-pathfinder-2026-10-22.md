# Identity Pathfinder — sandbox only

## Scope and current source

Baseline `0d8be5e7f0df50f964b1fb239353cbb39d92a343`. Module 3 **Identity**, section 3.3 **Identity Pathfinder: Niche**, lesson 1 **Niche Preparation: Identity**, stable ID `identity-niche-preparation-identity-24` (source row24). Current read-only rich source: `content/journey/identity-pathfinder-source-2026-10-22.json`, workbook `1GTyYUL883YogJ9n46WyUyhQBZpQuU9nCrMtRlbfP1l4`, sheetId0/current title **DYDD Journey Course**, current A1:Z1 + A24:Z24 including hyperlinks/runs/build note. Headers Module/Section/Lesson/Lesson Title/Lesson Focus/Content/Image URL/CARE; H24 contains Pathfinder authoring, despite the old column name. Source teaching, focus **Identity**, image and three statement/instruction pairs are preserved. Implementation build note is not learner copy. Scripture receives the established dark-green indented callout treatment, without added translation text.

Other early teaching content, especially rows22–23, is unchanged. All original companion audio is unchanged; row24 had no separate recording to replace. The original four-voice recording in section8.2 remains playable. FruitLife360 vineyard header remains byte-identical. Deferred charts/full Pathfinder agent-assisted builder are not implemented.

## Shared pieces, not copied answers

All Pathfinder activities now use a burnt-orange title and continuous numbered waypoint treatment, with no CARE acronym/process cards/class discussion controls. Section8.2 is Module8 **Niche**, section **Step in to your purpose**, seven activities:

| Lesson / stable slug | Canonical saved question IDs |
| --- | --- |
| 1 `niche-pathfinder-preparing-your-niche-declaration-68` | `identity-declaration` |
| 2 `niche-coming-from-69` | `story-declaration` |
| 3 `niche-which-will-enable-me-to-use-my-70` | `identity-service-reflections`, `identity-love-for-others`, `expertise-talents-skills`, `expertise-declaration` |
| 4 `niche-impassioned-by-71` | `desire-declaration` |
| 5 `niche-supported-by-72` | `gifts-declaration` |
| 6 `niche-resulting-in-my-73` | Existing `…-pathfinder-line` / `…-pathfinder-notes` |
| 7 `niche-encouraged-by-74` | Existing `…-pathfinder-line` / `…-pathfinder-notes` |

Row24's three authored pieces are `identity-declaration` (existing), `identity-service-reflections` (existing) and `identity-love-for-others` (new). Early and later controls render the same IDs in the same current round; autosave/pause/blur/Next/queue/conflict protection is the existing shared engine. Field Kit uses full authored statement + instruction to distinguish the two “Which will enable…” pieces. Expertise, Story, Desire and Gifts use their existing early canonical IDs without rewriting their teaching.

The current-round metadata upgrader adds/refreshes approved prompts only. Old later duplicate question IDs, entries, all revision history and archived round snapshots are retained. If a mapped later `…-pathfinder-line` has an answer and its canonical ID has **no revision at all**, recovery appends one canonical revision; any existing canonical revision, including an intentional blank, wins. Legacy records are never rewritten/deleted. Concurrent recovery is protected by the existing unique `(round_id, question_id, revision)` constraint using ignore-duplicate insert semantics. A conflict cannot overwrite a canonical save. Preview recovery uses the existing locked workbook persistence. No schema/policy/auth/scoring changes. Retired duplicate answers remain available in their original Field Kit/history/export paths.

The existing `niche-working-declaration`, source picker, attribution and pulling-together mechanisms remain unchanged. No new full-builder capability is promised.

## Verification and release

`npm run typecheck`; `npm run build`; `node tests/journey-pathfinder-source.cjs`; reflection catalog/export, discussion-access and environment-isolation regressions. `tests/journey-pathfinder-browser.mjs`: all8targetlessons ×1920/1280/768/390/320, authored content/image, exact IDs, no CARE/process/discussion, no overflow/runtime errors, actual original audio playback, builder retained, neighboring CARE, `/sandbox-review`→sidebar Trailheads→Journey owner navigation. Screenshots inspected in `tmp/pathfinder-*`.

`tests/journey-pathfinder-sync.mjs`: isolated actual sandbox-auth/database all8canonicalpieces (three Identity, two Expertise, Story, Desire, Gifts) early→8.2→early, pause autosave, Field Kit edit/history/all TXT scopes, immediateNext, failure/retry, in-flight edits and stale-tab conflict at1280/390/320. `tests/journey-pathfinder-legacy.mjs`: real isolated current-round upgrade/recovery, canonical nonoverwrite, concurrent idempotency, original entries/revisions/archive equality and export; fixtures removed. Published suites use `JOURNEY_TEST_BASE=https://dydd-online-school-sandbox.vercel.app`.

Release only pushed `sandbox` via `node scripts/deploy-sandbox.mjs`; exact project `prj_5EC6sfJe9DpGYW59L94iwppeMYUg`, GitSHA/expectedCommitSha/READY/stablealias, untouched productionmaster/deployment and FruitLife asset verified in `tmp/pathfinder-release-proof.json`. Review entry `/sandbox-review`; row24 `/journey?lesson=identity-niche-preparation-identity-24`, section8.2 `/journey?lesson=niche-pathfinder-preparing-your-niche-declaration-68`. Parent owns visible Telegram delivery.

Screenshot review found an inherited sticky course-index overlay on later section8.2 at768px, even though document overflow checks passed. All Pathfinder walkthroughs now reuse the established <=980px static-index rule; the browser suite asserts this across every target. The final recovery guard also returns the winning real entry when simultaneous recovery/save encounters an existing unique revision, avoiding a temporary blank UI without overwriting data.

The signed-in suite also opens the original Field Kit source dialog, adds a canonical Identity insight with its attribution/source link, and verifies that the existing `niche-working-declaration` actually persists. Synthetic accounts/rounds/entries and any reminder objects are removed in finally; no learner report or score is fabricated or changed.

Retired mapped duplicate line IDs are historical-only in Field Kit: original text/revisions/export remain visible, with a link to edit the shared canonical piece. Both ordinary and preview save APIs reject attempts from stale clients to keep editing a retired duplicate. This prevents a second active source while preserving every old saved ID and historical answer.
