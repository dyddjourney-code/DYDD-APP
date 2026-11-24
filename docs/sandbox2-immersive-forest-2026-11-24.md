# Sandbox 2 — immersive forest presentation

## Isolation contract

- Branch: `sandbox2/immersive-forest-2026-11-24`, based on original `sandbox` commit `37dacecfa1de29eadb72331c672cb308be844bd1`.
- Worktree: `projects/dydd-sandbox2`; never build or edit this version in the production or original sandbox checkout.
- **New Vercel project only:** `dydd-online-school-sandbox-2`, project `prj_OIFpZrQcv3uqs14PEiBD1lVngXrH`, team `team_uVFR0iaoxW2TA9q58bZhl8XK`.
- Review URL: https://dydd-online-school-sandbox-2.vercel.app
- Do not alias this deployment to the production or original sandbox domains. No custom domains are attached.
- Reuses existing **sandbox** Supabase `atemrshtshxoqnuevvqu`, never production `laojrzlqbkmirzcbcnyw`. This is a separate presentation deployment, **not a third database**. Existing sandbox accounts/content are available; saving from either sandbox affects the same sandbox data.
- Existing preview query/cookie validation, real-account policy, course access, responses, scoring, integrations and authored course data are unchanged.
- This project has no cron jobs (`vercel.json`) and automatic Git deployment remains disabled. Deploy explicitly from this branch.
- External email flags are off; provider sending keys are not copied. Stripe sensitive TEST keys are not exportable from the original project and are intentionally not provisioned here. Existing TEST billing access gates remain; checkout is not a Sandbox 2 acceptance target and no payments/webhooks were exercised. Production billing is never configured here.
- `DYDD_APP_URL` points to the Sandbox 2 origin. Existing sandbox auth provider/callback settings were not changed. Password/email-link delivery and callback enrollment were not exercised for this visual review.

## Visual architecture — environmental rebuild after owner review

The homepage is preserved source-exact from `fa660f0`: original supplied jungle art, camp introduction, topbar and six-button dock. The rejected destination sidebars are replaced with full-room places in `components/destination-room.tsx` and `app/destination-rooms.css`.

- Ranger Station is **inside** the timber cabin. Its actual raised relief-map table opens the existing interactive ecosystem map; the ranger desk opens genuine Dydi guidance; the wall map opens route guidance.
- Trailheads is a branching rainforest clearing with five real course/assessment paths.
- Field Kit is an explorer archive. Objects open the actual Journey workbook, assessment collection, design integration and gear.
- Passport/profile reuse genuine account/badge/purchase state in an archive reading folio. No invented progress or new account logic.
- Fireside is a blue-hour riverside gathering place with real teaching, Waypoints, live and community destinations.

Four source-referenced environment images are in `public/brand/environments/`. They were generated as separate images using the original supplied jungle scene as reference, decoded/visually checked at 1672×941, and optimized to WebP (about 2.3MB total). Original source art is untouched. Scene object positions follow actual table, desk, journal, trunk and trail locations. Phones/tablets show environmental arrival followed by accessible object lists instead of unreadably shrunken hotspots.

`components/environment-route.tsx` and `app/environments.css` extend the same environments and spatial objects onto real routes. Existing route children remain functional. Journey lessons are readable journal sheets inside the cabin environment; authored text, companions, native audio/transcripts and reflection controls are retained, without inline lesson illustrations. The supplied DesignID GHL course-code file was located; a separate newer immersive course screenshot was not identified. No added eyebrow pills or decorative stripes.

Native room, map/desk and expanded-map dialogs contain keyboard focus. Escape closes only the top layer and restores the opener; nested Passport badge behavior remains. Map CTAs now use review-aware navigation within a local Suspense boundary so static prerender remains valid. The dedicated Fruitful Life mini-lane bypass remains untouched.

## Reproduce

1. Create an isolated worktree from the branch; install its exact lockfile (`npm ci`).
2. Read project `.vercel/project.json` and assert its project ID above before any deployment API call. Never copy an original project binding into this checkout.
3. Load sandbox-only credentials into ignored local env files; never print/stage them. Verify Supabase hostname equals `atemrshtshxoqnuevvqu.supabase.co`.
4. Build: `npm run build -- --webpack` (Webpack supports this host's shared dependency symlink); `npm run typecheck`.
5. Run `npm run start -- --port 3148` then `node tests/sandbox2-environments.mjs`. Hosted check: `SANDBOX2_BASE=https://dydd-online-school-sandbox-2.vercel.app node tests/sandbox2-environments.mjs`.
6. Commit only the presentation files/runbook/test, push only the Sandbox 2 branch, then run `node scripts/deploy-sandbox2.mjs` to deploy that exact SHA to the new project. The guarded script checks the branch, project, alias and protected project deployment identities. Do not use `scripts/deploy-sandbox.mjs`, which intentionally targets the **original** sandbox.
7. Confirm deployment metadata SHA, stable alias and new project ID; independently compare production/original sandbox deployment IDs and alias mappings against the preflight receipt. No production/original sandbox deploy or project mutation is part of this workflow.

Local verification artifacts live outside Git at `outputs/dydd-sandbox2-2026-11-24/`. They contain screenshots and sanitized deployment/QA receipts, not credentials.

## Acceptance and review

- Optimized Webpack build and TypeScript passed; existing authored-content, reflection save-boundary fixture suite and real-account/preview precedence checks passed.
- Independent static review requested restoration of sign out, retention of the dedicated Fruitful Life lane bypass, an accessible camp-map dialog name, and preservation of focus words as plain prose. All were implemented; final independent review passed.
- `tests/sandbox2-environments.mjs` exercises all six environmental rooms, real profile edit/cancel, real passport expansion/nested badge detail, actual Journey link navigation/authored text/native audio and shared destination screens at 1440, 768, 390 and 320 pixels. The older visual harness documents the first version only and its replaced navigation selectors are no longer current. Screenshots and JSON distinguish local and hosted results. Audio checks wait for the enabled real lesson index after course hydration, not the transient server-rendered first-unit placeholder.
- No real payment, email, assessment submission, new account or production database operation is part of visual acceptance. Personal workbook persistence is covered by the isolated fixture regression rather than new live response writes.

### Environmental QA extensions

The environment harness additionally checks real map markers/selection, review context on map CTA, expanded-map Escape → work surface Escape → room Escape, dock focus restoration, high-resolution art decode, genuine account/passport controls, native course audio advancing, no non-companion lesson art, direct routes, four widths plus short landscape. Preserve first-pass failures separately; final screenshots must wait for all entrance animations and environment image decoding. Verify actual visuals independently instead of relying only on overflow checks.

Changes remain presentation-only plus map-link review propagation; no database, scoring, auth policy, integration, package or authored-content change.

## Reading-first walkthrough refinement — November 24 owner feedback

The environmental art is unchanged. Room exploration now uses numbered physical stops, a current-stop action, next-stop handoffs from the map/desk and an explicit onward room. Desktop hotspot names reveal on intent rather than permanently obscuring the room; phones retain large, unboxed object links. All destinations remain available through a disclosure.

The normal school courses use one continuous paper reading surface inside the cabin (`app/course-walkthrough.css`). `CourseTrailNavigation` keeps the actual existing gated module/section/lesson index inside a native modal, with Escape/focus restoration. It is not an alternate course list or access implementation. `LessonPacing` jumps to real Read / Listen / Reflect or Continue destinations, including the Applied Capacity activity and personalized DesignID snapshot. Native companion audio, original portraits and transcripts are available in a compact disclosure. Course report context and save instructions are available on demand; live save/error status stays visible. Repeated arrival panels and the duplicated static module racetrack no longer precede the lesson. The historical internal build/planning appendix remains in source but is no longer mounted, avoiding hundreds of duplicate hidden workbook fields and their effects on phones.

The dedicated `lane=fruitlife` bypass keeps its original assessment navigator, audio layout and report context (`immersive={false}`). No source lesson, response key, audio asset, progress/save handler, entitlement or assessment logic changed. The normal 71-lesson Journey and four focused courses retain their original authored content and sequential completion behavior. Inline course illustrations stay hidden; actual companion portraits stay visible.

Acceptance:
- `node tests/sandbox2-walkthrough.mjs`: real normal-course walkthrough at 360/390/430/1440; map selection/Escape, audio advancement, companion decode, transcript, readability/contrast, overflow and final dock clearance.
- `node tests/sandbox2-special-lessons.mjs`: specialized Read/Reflect targets, CARE header contrast and Fruitful Life normal course.
- `SANDBOX2_EVIDENCE_ROOT=<output directory> node tests/sandbox2-environments.mjs`: all rooms, real relief map/desk, nested Escape, genuine profile cancel/Passport, direct routes, tablet and short landscapes.
- Hosted runs use the same tests with `SANDBOX2_BASE=https://dydd-online-school-sandbox-2.vercel.app`.

All revised browser harnesses intercept non-GET app API calls: existing preview position-bookkeeping calls are locally acknowledged, not sent. These are real read/navigation/audio/render checks, not live writing or completion-persistence certification. Initial exploration before interception advanced only the existing owner's sandbox preview position Storage JSON; no reflection answers, completion, relational database, payment or email operations were requested. Existing isolated source/save-boundary tests cover preservation separately.

Evidence for this refinement: `outputs/dydd-sandbox2-walkthrough-2026-11-24/`. Old environmental baseline evidence remains in its original output directory.
- `node tests/sandbox2-access.mjs` independently verifies four fresh browser contexts (absent and invalid preview for a focused course and standalone lesson); access checks never reuse the authenticated review context.

Access limit: the original sandbox-only `testBillingEnabled()` configuration is disabled here because sensitive original TEST keys are not provisioned. Consequently Journey teaching retains its pre-existing public-read behavior; the source membership guard is unchanged. Focused-course assessment access and private reflection/progress APIs retain their existing guards. Do not describe the public Journey as newly login-gated or claim paid checkout validation.
