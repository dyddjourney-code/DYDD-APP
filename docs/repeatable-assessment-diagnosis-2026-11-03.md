# Current live DYDD retake investigation — November 3, 2026

State: diagnosis complete; minimal fix reviewed and authorized for production publication. See `tmp/retake-diagnosis/RELEASE.md` and deployment proof for the published identity and verification boundary.

## Production identity and evidence

- Canonical live alias: https://dydd-online-school.vercel.app
- Vercel project `prj_YO15mYTp64EHk0wlg6QmBTxNeV5k`, READY deployment `dpl_9Ev38v4NkyfGAYFaE7M9bxbiFsVa`.
- Deployment Git SHA `0da4858279dd2abe3d2e54ab1f1ad0ad990ed014` equals `projects/dydd-online-school-release` HEAD. This is not the sandbox checkout.
- Read Vercel's current production environment to independently confirm live Supabase project `laojrzlqbkmirzcbcnyw`; matched stored credential, used solely for read-only queries.
- Production saved state: five school profiles, 25 FruitLife sessions, 1,096 assessment snapshots. The recognized owner account with six FruitLife snapshots has six `report_sent` sessions; a second configured-owner identity has a `report_ready` session. Two ordinary returning accounts also have `report_sent` sessions and saved Gifts/FruitLife snapshots. No active-session restriction explains those completed states.
- Anonymous live routes: Trailheads 200; Field Kit and FruitLife setup 307 to login; app Gifts form 200 (submission separately authenticates).
- Private detailed sanitized proof: `tmp/retake-diagnosis/live-readonly-proof.json`.

## Precise cause

1. `app/trailheads/page.tsx`: any existing assessment snapshot or ready FruitLife report makes `complete` true. `ready` then selects **Start/Continue the Course instead of the native Take action**. Completed users only retain course/results, unless an unfinished FruitLife session enables Track Current Assessment. No alternate new-assessment action existed. Applies to beta and owner, ordinary and mini-app Trailheads.
2. `components/field-kit-collection.tsx`: assessment entry required `!reports.length`. A single saved report therefore hides the native entrypoint on desktop and mobile. Remaining actions are report/PDF, reflection workbook, course and return-to-Trailhead—which leads back to cause 1.
3. This is assessment-completion navigation suppression, not a course-completion rule. Neither condition checks lesson/course completion. Completing the course does not restore a Take action; starting a new reflection round is not an assessment retake.

## Actual server policy

- FruitLife: signed-in setup `/fruitlife360`; new session action `createFruitLifeSession`. No six-month/completed-attempt cooldown. Current app resumes an existing nonterminal session instead of creating parallel sessions. Terminal statuses are `report_ready`, `report_sent`, `completed`, `sent`, `archived`. A used self-response token is intentionally one-submit; it is not the correct new-retake entrypoint.
- Current app setup is accessible to signed-in learners; legacy `lane=fruitlife` checks commercial entitlement, included for production free beta/lifetime personal access, plus owner exemption. No entitlement consumption for production free-beta sessions. Course completion is not an entitlement or assessment-entry requirement.
- Spiritual Gifts: native `/spiritual-gifts?channel=app` renders a fresh form regardless of saved results. `saveSpiritualGiftsPublicResponse` creates a new session/result; no six-month/history cooldown. App-linked submission needs signed-in or separately verified identity. Saved result links remain history, not retake entrypoints.
- DesignID ONLY: six calendar months after latest completed attempt, with owner self-exemption and one-use owner override. Entry eligibility and atomic database save policy remain untouched. Existing results/course access is retained.

## Prepared local fix

- Trailheads: add **Take FruitLife360 Again / Take Spiritual Gifts Again** alongside existing course/results when complete. If FruitLife is active, keep Track Current Assessment rather than an extra new-session action.
- Field Kit: allow native assessment entry even with reports, ONLY for FruitLife/Gifts, and label **Take assessment again**. Keep it visible in mobile summary and desktop/expanded report details. Existing active-session setup redirect still protects an unfinished FruitLife session.
- No changes to DesignID, scoring, save actions, database schema, history, report/PDF URLs, course progress or dated reflection rounds.

## Verification and limitations

- New `tests/repeatable-assessment-entrypoints.cjs`: initially failed on the existing live-source behavior, passes after local fix. Renders real page/collection code with isolated no-write fixtures: beta/owner; main/mini Trailheads; completed/active FruitLife; Gifts repeat action; empty/populated Field Kit; retained old/new report and PDF links, course actions, reflection rounds; no unrestricted DesignID CTA. Also verifies actual DesignID eligibility denies recent ordinary retake, permits owner, and clamps six-month end/leap dates.
- `npm run typecheck`: PASS.
- `git diff --check`: PASS.
- Existing `tests/designid-research-retakes.cjs`: attempted, but its unrelated email-module loader fails resolving `@/lib/supabase/admin` from its generated temporary JavaScript. It is not claimed as a complete passing suite. The focused new test independently covers unchanged DesignID eligibility/date behavior.
- `npm run build`: PASS (exit 0); full result in `tmp/retake-diagnosis/build.log`.
- **Authenticated live browser verification unavailable.** Existing user browser could not attach (Chrome DevToolsActivePort absent); no usable persisted production learner/owner login fixture found. No login/session or synthetic customer was created to work around this. Read-only service-role data and exact deployed-source rendering are NOT represented as a signed-in live browser click-through.
- No assessment submission, self/observer email, result regeneration, customer update, commit, push or deployment performed.


## Authorized release verification — November 3, 2026

John approved “ok please fix it” after the above diagnosis. The production-only change is limited to the two navigation components above; sandbox, save actions and policy modules are unchanged. The native `/fruitlife360` setup and create action retain unfinished-session checks, and repeat assessments append through existing native flows rather than changing saved reports.

- Focused entrypoint regression PASS, including retained history/PDF/course/reflection actions and DesignID month-end/leap-year eligibility/owner exemption.
- `RETAKE_BROWSER=1 node tests/repeatable-assessment-entrypoints.cjs`: PASS, 30 real-rendered fixture states at 1280/390/320, main/mini and ordinary/owner-shaped identities, completed/active FruitLife, empty/populated collection. Verifies visible native actions under production CSS. These are read-only isolated fixtures, not authenticated production browser sessions.
- `tests/course-auth-origins.cjs`, `tests/free-beta-boundaries.cjs`, `tests/environment-isolation.cjs`: PASS.
- Final serial `npm run typecheck`, `npm run build`, `git diff --check`: PASS. Build and regression logs are under `tmp/retake-diagnosis/release-*`.
- Rechecked existing-user browser through supported browser profiles/tabs: cannot attach because Chrome `DevToolsActivePort` is absent. No existing persisted production login fixture was found. No synthetic user/session was created, customer impersonated, form submitted, email sent or purchase triggered to work around this. This limits live signed-in click-through verification; it is not a deployment blocker.
- Publish workflow: reviewed release HEAD pushed only to `origin/master`; `scripts/deploy-production-beta.mjs` pins the production project and verifies READY plus exact commit/project/canonical alias. Final receipt/evidence under `tmp/retake-diagnosis/RELEASE.md`.
