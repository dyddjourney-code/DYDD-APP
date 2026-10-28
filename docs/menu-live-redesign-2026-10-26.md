# Sandbox grouped menu and Live Fireside header — October 26, 2026

## Authorized scope

Sandbox worktree/branch only; starting commit `0a1cce643d260a855822d4157de1b2e901535c4b`.
No production, curriculum/auth/scoring/customer records, settings, or data edits.
The requested menu recommendation is now authorized for published sandbox review.

## Implementation

- Preserve all 13 destinations and ReviewAwareLink's existing owner/learner query
  behavior. Keep the desktop sidebar unchanged.
- Replace mobile floating card grid with a 320px / 90vw native modal drawer:
  warm ivory, forest green, quiet active marker, five parent groups with indented
  children. Every destination and close target is at least 44px tall.
- Native dialog makes the background inert, traps keyboard focus and supports
  Escape; explicit close/backdrop handling returns focus to the trigger.
  The header remains visible while navigation scrolls in short landscape windows.
  Body scrolling is locked only while open. Selection closes immediately,
  including the current route; resizing above the desktop breakpoint dismisses.
  Entrance uses transform/opacity and honors reduced motion.
- `/live` is Live Fireside, distinct from `/camp-circle` and My Circles. Preserve
  its original image file and existing two lines of writing. Remove the image
  gradient and all positioned companion text at EVERY width and orientation.
  The native-aspect image is followed immediately by the unchanged writing on a
  warm readable surface. Existing artwork words are part of the original image.
- Circles and all other content/renderers remain unchanged.

## Checks and evidence

Use `npm run build`, `npm run typecheck`, `node tests/environment-isolation.cjs`,
`node tests/reflection-catalog.cjs`, `node tests/reflection-export.cjs`, and
`git diff --check`.

Read-only Puppeteer/Chromium harness `tests/menu-live-review.mjs` checks portrait
320/390/768, landscape 844×390 and 932×430, and desktop 1280/1920. It measures
image native aspect, copy position, no gradient/overflow; checks every destination,
current-page dismissal, close/Escape/backdrop, modal focus, touch target geometry,
landscape scrolling/rotation, and established review entry/Command Center access.
API writes and opportunistic prefetch are blocked. This is browser emulation,
not physical iPhone/Safari testing. No persistence changes/tests are needed.

Workspace evidence: `outputs/menu-live-redesign-2026-10-26/`, including screenshots,
local/published QA JSON, read-only harness and exact release receipt. The prior
Base Camp/named-map regression selectors are updated to explicitly target the map
dialog now that the mobile navigation also has its own dialog.

Publish only after scoped commit/push using `node scripts/deploy-sandbox.mjs`.
Verify READY, exact Git and expected SHA, sandbox project and stable alias;
compare production alias/deployment/master to preflight snapshot after live QA.
The deployment API uses target `production` **inside the separate sandbox project**;
it must never target the real production project.

Review: https://dydd-online-school-sandbox.vercel.app/sandbox-review

Local optimized build, typecheck, isolation, catalog, export and whitespace checks
passed. All seven local viewport cases passed, including 65 real menu destination
clicks, repeated current-page dismissal, rotation, all dismissal/focus behavior,
and owner entry/Command Center/review-query continuity; zero page errors. Phone,
landscape and desktop screenshots were visually inspected. Published verification
uses touch taps for all destination rows.
