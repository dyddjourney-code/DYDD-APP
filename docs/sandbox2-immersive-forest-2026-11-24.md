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

## Visual architecture — corrected after owner review

The original photo-backed dashboard was rejected. The supplied `jungle-game-concept.html` is the reference for **layout and interaction**, not just art direction. `components/forest-navigation.tsx` now owns a spatial game shell: full-viewport camp, left intro, minimal translucent topbar, six bottom dock buttons (Camp Map, Ranger Station, Trailheads, Passport, Field Kit, Fireside) and a native right-side modal field guide. Destinations open panels first; real trail/resource/community links then enter the existing app routes. No sample/coming-soon handlers or invented progress.

`app/game.css` implements that composition and adapts the real account/passport UI to the guide's width. `app/forest.css` remains the base forest palette/content styling. Profile, access, purchases and sign-out remain the genuine server-authored Base Camp children inside the profile panel; Passport uses the actual badge state with nested accessible badge details. The passport component's optional `fieldGuide` flag enables its existing sheet interaction at narrow-container desktop widths as well as phones. No account/assessment/save logic changed. No extra heading eyebrows, pills or decorative stripes.

Real shared destinations and Journey are forest field-guide reading pages with the camp topbar/dock retained; authored text, companions, native audio, transcripts and workbook controls remain. No lesson illustrations. Concept fonts are self-hosted. Native dialog contains focus, closes with Escape/backdrop/close/back, and returns focus to its opener. Fruitful Life's dedicated mini-lane bypass remains unchanged.

## Reproduce

1. Create an isolated worktree from the branch; install its exact lockfile (`npm ci`).
2. Read project `.vercel/project.json` and assert its project ID above before any deployment API call. Never copy an original project binding into this checkout.
3. Load sandbox-only credentials into ignored local env files; never print/stage them. Verify Supabase hostname equals `atemrshtshxoqnuevvqu.supabase.co`.
4. Build: `npm run build -- --webpack` (Webpack supports this host's shared dependency symlink); `npm run typecheck`.
5. Run `npm run start -- --port 3148` then `node tests/sandbox2-game-visual.mjs`. Hosted check: `SANDBOX2_BASE=https://dydd-online-school-sandbox-2.vercel.app node tests/sandbox2-game-visual.mjs`.
6. Commit only the presentation files/runbook/test, push only the Sandbox 2 branch, then run `node scripts/deploy-sandbox2.mjs` to deploy that exact SHA to the new project. The guarded script checks the branch, project, alias and protected project deployment identities. Do not use `scripts/deploy-sandbox.mjs`, which intentionally targets the **original** sandbox.
7. Confirm deployment metadata SHA, stable alias and new project ID; independently compare production/original sandbox deployment IDs and alias mappings against the preflight receipt. No production/original sandbox deploy or project mutation is part of this workflow.

Local verification artifacts live outside Git at `outputs/dydd-sandbox2-2026-11-24/`. They contain screenshots and sanitized deployment/QA receipts, not credentials.

## Acceptance and review

- Optimized Webpack build and TypeScript passed; existing authored-content, reflection save-boundary fixture suite and real-account/preview precedence checks passed.
- Independent static review requested restoration of sign out, retention of the dedicated Fruitful Life lane bypass, an accessible camp-map dialog name, and preservation of focus words as plain prose. All were implemented; final independent review passed.
- `tests/sandbox2-game-visual.mjs` exercises all six guide overlays, real profile edit/cancel, real passport expansion/nested badge detail, actual Journey link navigation/authored text/native audio and shared destination screens at 1440, 768, 390 and 320 pixels. The older visual harness documents the first version only and its replaced navigation selectors are no longer current. Screenshots and JSON distinguish local and hosted results. Audio checks wait for the enabled real lesson index after course hydration, not the transient server-rendered first-unit placeholder.
- No real payment, email, assessment submission, new account or production database operation is part of visual acceptance. Personal workbook persistence is covered by the isolated fixture regression rather than new live response writes.
