# Applied Capacity — sandbox only, October 23, 2026

## Scope and sources

Baseline `5fcbd6c3acbc0e2cfec92cca4fcc4787f5237580`. Existing stable ID **expertise-applied-capacity-31**, app row31 / source row30, Expertise / Deep Efforts produce deep results. Read the live spreadsheet headers and row30 read-only; only its title was populated. The explicit user-supplied teaching copy takes precedence over that blank teaching row.

Full original learner copy was archived **before editing** at `content/journey/applied-capacity-original-user-source-2026-10-23.txt` (also `tmp/applied-capacity-original-user-source.txt`). Rich read-only sheet snapshot: `content/journey/applied-capacity-sheet-source-2026-10-23.json`. No workbook/source-service write.

The supplied Squarespace image is unchanged and rendered whole: intact DesignID bulb **left**, shattered bulb **right**. Loaded and visually inspected original: `tmp/applied-capacity-source-image.png`. Caption directly below: “What you have energy for, and when you run out.” No regeneration/crop/mirror. Focus: Capacity, Fulfillment, Time.

## Copy and layout

Grammar/readability polished with grace, faith, rest, boundaries, partnership and fulfillment meaning retained. The rule of eights is explicitly an adaptable ideal. Estimates are a helpful capacity lens, not capability measurements or hard limits. No scientific validation claims were added. Calendar examples preserve all four authored roles; no stereotypes added.

Ascending staircase has exact inclusive authored ranges and phrases: Drained0–9 / rest & partnership; Limited10–24 / dependence; Steady25–39 / endurance; Abundant40–60 / sharp focus. Drained is lowest left, Abundant highest right. Desktop uses ascending blocks; mobile places higher steps above and farther right, while semantic ordered-list/screen-reader sequence stays Drained → Limited → Steady → Abundant. No sideways scrolling.

Read-only personalized grid remains **2×2 at all five widths**, Architect, Artisan / Steward, Shepherd. Named labels, soft tints, readable dark text, exact border colors #D4A451 / #647C9B / #5A496B / #739D5E. Calendar key repeats the same labeled colors.

No Reflection/CARE/answer inputs, discussion controls, added calendar form or redundant assessment CTA. Before this change this lesson had no workbook section, catalog questions or stable answer IDs; catalog/history/save APIs and stored records remain untouched. Neighbor lessons, their authored content, stable response IDs, all audio and the connecting-forward Connected Trail boundary are unchanged.

## Actual score path and mathematics

`app/journey/page.tsx` uses existing authenticated `getUser()` → `getAssessmentSnapshotsForUser(user.id, normalized email)` recency selection. `journeyCapacityScores` in `lib/journey/designid-snapshot.ts` projects `buildDesignIdContext` without changing the saved report. Its canonical reader supports current summary/native saved score sections and historical reportPayload-only records. Explicit owner review uses its separate existing review report; those displayed review scores do **not** establish ordinary participant verification.

Only saved finite integer raw points in the authored0–60 range are accepted. Blank/missing/invalid scores render explicit unavailable text, never Drained/zero; actual0 remains Drained and0minutes. No normalization/rescaling or fixed sample scores. Categories match allocation engine thresholds >=10 Limited, >=25 Steady, >=40 Abundant (engine `lib/designid/engine.ts`);0–9 Drained. Canonical four raw points share denominator100, not60.

Daily estimate: `16 × raw points / 100` hours, rounded **once** to nearest15minutes and formatted in hours/minutes. E.g. score3 →30minutes;29 →4hours45minutes;60 →9hours30minutes. User illustrative decimal-hour examples were never used as seed scores or exact assertions. Independently rounded cells may not sum to exactly16h, explicitly noted. For8h work use `8 × raw points /100` (divide **unrounded** daily estimate by2 before any rounding). Score29 workday135min differs from half displayed daily285min. Calendar comparison uses matching day/work periods or unrounded workday estimate × actual workdays for a workweek.

## QA commands and evidence

- `npm run build`, `npm run typecheck`, `git diff --check`.
- `node tests/journey-applied-capacity-source.cjs`: stable ID/focus/original-source archive; exact ranges/phrases/order/colors; category boundaries0/9/10/24/25/39/40/60; missing/invalid versus0; points3/29;15min rounding and unrounded8h model; canonical summary/payload-only extraction; exact all-neighbor and audio equality versus baseline. Existing Being/Connecting/four-expertise source tests now exclude only newly authorized Applied Capacity from their old-baseline neighbor comparisons; new test asserts every other lesson exact.
- Existing source/catalog/export/discussion/environment isolation tests. Self-email export uses existing mocked transport; no email sent.
- `node tests/journey-applied-capacity-browser.mjs`:1920/1280/768/390/320, actual original image load/caption, exact focus and staircase, physical ascending coordinates, ordered2×2/colors, no lesson inputs/CARE/discussion/Connected Trail, no overflow/runtime errors. Screenshots `tmp/applied-capacity-{local,published}-{width}.png` and staircase detail. Owner `/sandbox-review` → visible sidebar Trailheads → Journey → actual Expertise section/Applied Capacity button.
- `node tests/journey-applied-capacity-profile.mjs`: **real isolated signed-in sandbox users and actual saved database snapshots**, not intercepted fixtures. Engine report A: Architect40/Artisan60/Steward0/Shepherd0; engine report B payload-only: Architect0/Artisan0/Steward60/Shepherd40. Older contradictory snapshots confirm latest recency selection.1280/390/320 category/time/raw points and no controls verified. Separate actual DB partial state Architect0/Artisan29/Shepherd3/Steward missing confirms no silent renormalization; actual absent report confirms no fallback data. All synthetic users/snapshots/workbook rounds/reminder objects removed in finally; cleanup asserted. Owner-preview/basecamp navigation-prefetch requests are aborted only in this harness to prevent the established owner-review cookie from contaminating ordinary learner routes; saved report/API responses are not intercepted. First harness run detected that contamination and cleaned up; corrected isolation rerun passed.
- Unit/source projection checks are in-memory fixtures; owner visual screens use existing owner review. These are **separate from** real signed-in database profile tests above.
- Existing `journey-being-browser.mjs`: unchanged Being four-stage CARE, prompts/reminders; actual retained Expertise audio plays and advances; neighbor One Anothering controls. Existing Connecting browser harness checks exact prose/matrix/controls and all forward Connected Trail exclusions. Repeated locally and published.

Published checks use `JOURNEY_TEST_BASE=https://dydd-online-school-sandbox.vercel.app` before each browser/profile command. Layout measurements/profile cleanup receipts: `tmp/applied-capacity-{local,published}-{layout,profiles}.json`; logs use `tmp/applied-capacity-*`.

## Release / review

Only branch `sandbox`, project `dydd-online-school-sandbox`, sandbox DB `atemrshtshxoqnuevvqu`. Capture real production alias/master read-only with release harness `baseline` **before** deployment. Commit/push sandbox; `node scripts/deploy-sandbox.mjs` creates the explicitly authorized sandbox deployment. After published QA, `node tests/journey-applied-capacity-release.mjs` verifies final HEAD = remote sandbox = GitSHA = expected SHA, READY, exact intended project/stable alias, and unchanged production/master against baseline. Receipt: `tmp/applied-capacity-release-proof.json`. No production deployment or master push.

Review entry: https://dydd-online-school-sandbox.vercel.app/sandbox-review

Lesson: https://dydd-online-school-sandbox.vercel.app/journey?lesson=expertise-applied-capacity-31

## Follow-up display correction — October 23, 2026

Removed the extra score-total/range explanation below the formula and the saved raw-score line from all four personalized cards. Populated cards now contain only the reflection name, capacity category, and calculated hours/minutes. Missing-report unavailable states remain explicit. The formula, internal raw scores, calculation/rounding, report selection, image, staircase, enrichment, and every neighboring lesson remain unchanged. Browser checks assert explanation/score-line absence and formula retention; actual saved-profile checks assert each populated card's complete three-field content. Released only on sandbox using the release flow above.
