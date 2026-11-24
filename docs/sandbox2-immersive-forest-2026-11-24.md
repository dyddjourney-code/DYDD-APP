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

## Visual architecture

`app/forest.css` is a final shared stylesheet overriding the original presentation. `components/forest-navigation.tsx` replaces the sidebar with the camp navigation and a native accessible camp-map dialog linking to the actual existing routes. Base Camp uses the supplied jungle artwork as a full-bleed scene. Editorial gold/ivory serif headings, dark forest reading surfaces and restrained controls apply across the shell. Legacy eyebrows, signboard top/bottom trims and text-only chips are removed. Journey illustrations are not rendered; companion portraits, native audio, transcripts and workbook controls remain. Course source data and stable answer keys are not edited. Both concept fonts (Cormorant Garamond and DM Sans) are self-hosted with their OFL licenses. The existing workbook-cover image is also self-hosted to avoid third-party loading failures.

Root `/` opens the existing `/base-camp` entry. All real routes remain available, including the owner Command Center via Camp map. Environment identification stays in the main navigation, not an extra colored banner.

## Reproduce

1. Create an isolated worktree from the branch; install its exact lockfile (`npm ci`).
2. Read project `.vercel/project.json` and assert its project ID above before any deployment API call. Never copy an original project binding into this checkout.
3. Load sandbox-only credentials into ignored local env files; never print/stage them. Verify Supabase hostname equals `atemrshtshxoqnuevvqu.supabase.co`.
4. Build: `npm run build -- --webpack` (Webpack supports this host's shared dependency symlink); `npm run typecheck`.
5. Run `npm run start -- --port 3148` then `node tests/sandbox2-visual.mjs`. Hosted check: `SANDBOX2_BASE=https://dydd-online-school-sandbox-2.vercel.app node tests/sandbox2-visual.mjs`.
6. Commit only the presentation files/runbook/test, push only the Sandbox 2 branch, explicitly deploy that SHA to the new project. Do not use `scripts/deploy-sandbox.mjs`, which intentionally targets the **original** sandbox.
7. Confirm deployment metadata SHA, stable alias and new project ID; independently compare production/original sandbox deployment IDs and alias mappings against the preflight receipt. No production/original sandbox deploy or project mutation is part of this workflow.

Local verification artifacts live outside Git at `outputs/dydd-sandbox2-2026-11-24/`. They contain screenshots and sanitized deployment/QA receipts, not credentials.

## Acceptance and review

- Optimized Webpack build and TypeScript passed; existing authored-content, reflection save-boundary fixture suite and real-account/preview precedence checks passed.
- Independent static review requested restoration of sign out, retention of the dedicated Fruitful Life lane bypass, an accessible camp-map dialog name, and preservation of focus words as plain prose. All were implemented; final independent review passed.
- `tests/sandbox2-visual.mjs` exercises thirteen real routes at 1440, 768, 390 and 320 pixels, camp-map open/Escape/link navigation, the first two authored Journey units, actual native companion audio playback, transcripts, retained portraits, absence of other lesson images, and anonymous/invalid protected-course denial. Screenshots and JSON distinguish local and hosted results. Audio checks wait for course hydration/network idle, not the transient server-rendered first-unit placeholder.
- No real payment, email, assessment submission, new account or production database operation is part of visual acceptance. Personal workbook persistence is covered by the isolated fixture regression rather than new live response writes.
