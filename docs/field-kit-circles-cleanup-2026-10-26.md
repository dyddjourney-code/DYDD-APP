# Field Kit and Circles presentation cleanup — October 26, 2026

## Scope

Sandbox only, branch/worktree `sandbox` / `projects/dydd-online-school-sandbox`.
The supplied `projects/dydd-online-school` checkout is production `master`; inspect
it, but do not edit or deploy it for this sandbox-authorized request.

Removed the Field Kit Help trigger, its help content and its unused PageHelp
import from `/field-kit`. Other pages' help controls remain unchanged.

The actual Circles surfaces are `/camp-circle` (Camp Circles overview) and
`/camp-circle/my-circles` (personal workspace). They used the same background-art
header, so both now use `CirclePageHeader`: original 1884×835 campfire artwork,
uncropped at native aspect ratio, followed immediately by the unchanged eyebrow,
title and description on a warm light background. No gradient/darkening/text
layer remains on the image. Scoped CSS overrides the old desktop and mobile
background/pseudo-image rules without altering any other headers.

The separate `/live` menu destination is Live Fireside gatherings, not Circles.
It was inspected in the browser and left unchanged. The user's later “writing
for the circles” clarification identifies the target; “on live” is not treated
as authorization to change production.

No menu redesign, curriculum, assessments, reports, auth, workbook/save APIs,
profile, Circle data, membership, pricing, emails, database/schema or storage
changes. Existing untracked files and earlier sandbox work retained.

## Menu recommendation (not implemented)

The existing phone menu is 13 full-width boxed links in a tall floating panel;
only My Circles is visually nested. Desktop already has meaningful hierarchy.
Recommend a compact right-hand slide-out (about 300px wide, capped at 90vw),
warm ivory background, forest-green labels, quiet gold active accent, and simple
44px-tall link rows instead of one card per link. Reuse the desktop grouping:
Base Camp; Ranger Station → Trailheads / Field Kit / Gear; Fireside → Waypoints /
Live; Camp Circles → My Circles; Command Center → Design Map / Expedition.
Keep child links always discoverable, a clear close control, dim backdrop,
Escape/focus return and scrollable landscape access. Preserve review-aware URLs
and immediate close-on-selection behavior. No new destinations or changes now.

## Verification and release evidence

- Optimized Next build, TypeScript, environment-isolation, reflection catalog,
  reflection export and whitespace/diff checks passed.
- Read-only actual Chromium at 1920, 1280, 768, 390 and 320px: both Circles
  surfaces, Field Kit, and unchanged Live; no horizontal overflow or page errors.
- Geometry checks prove loaded original image/natural aspect ratio, no background
  or pseudo artwork duplication, and all copy below image with no gap.
- Field Kit Help trigger/content absent. Screenshots visually inspected on
  desktop/phone; menu reviewed visually and in source, not modified.
- Browser harness blocks non-GET API writes and opportunistic router prefetch.
  No account/customer data mutation or persistence behavior change/test claimed.
- Publish only via `node scripts/deploy-sandbox.mjs` after scoped commit/push.
  Exact sandbox project/SHA/READY/stable alias and unchanged production alias/
  master are independently checked by a read-only Vercel receipt.

Workspace evidence directory:
`outputs/field-kit-circles-cleanup-2026-10-26/` contains `before-*`, `local-*`,
`published-*` screenshots and QA JSON, plus exact `release-proof.json` after
publication. Browser emulation is not physical Safari/iOS verification.

Review entry: https://dydd-online-school-sandbox.vercel.app/sandbox-review
