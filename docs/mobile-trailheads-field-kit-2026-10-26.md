# Mobile Trailheads / Field Kit — sandbox only, October 26, 2026

Scope: the standard `/trailheads` and `/field-kit` collections, CSS breakpoint <=980px (including short landscape). No production deployment, database writes, assessments, entitlements, saved-report generation, customer data, payment flows, curricula, or persistence changes.

## Design

- Single-column compact cream/forest-green utility cards. Existing complete signposts are integrated at64×86px beside titles, not used as large lead images. No carousel or two-column phone cards.
- Trailheads retains full purpose copy, full-width unbroken commitment, outlined44px **Explore this trail** and original distinct primary action. Supporting terrain/gear/best-for/permit and commitment explanation remain available in the **same real trail guide**; all real modules and lessons remain. Progress is readable one-row-per-step instead of three narrow columns. Owner-preview buttons remain explicitly owner-only.
- Field Kit derives report/round status from existing collection inputs. Original **Review my reflections** remains immediately available. Native **Reports, workbook & course details** disclosure retains existing latest report/history/download/snapshot, course, reminder and feedback actions and explanatory content. Desktop renders the unchanged original detail fragment; CSS-hidden mobile presentation is separate. Both presentations use the same report/round inputs and exact route builders.
- Dialog native modal/Escape/backdrop/close/focus restoration preserved; explicit first/last Tab wrapping added. No new dependency.

## Evidence / verification

Workspace evidence: `outputs/mobile-trailheads-field-kit-2026-10-26/`.

`tests/mobile-trailheads-field-kit.mjs` verifies320×740,390×844,430×932,844×390,932×430,1280×900,1920×1080. Before/local/published full-page captures, geometry/font arrays, original link-target preservation (credential values redacted), each of five real curriculum dialogs/module disclosure, actual touch open/close, Escape and forward/reverse focus wrapping/restoration. Desktop1280/1920 geometry and fonts must match baseline exactly. It blocks non-GET API writes and prefetch; established `/sandbox-review` owner entry is used. Follow-up smoke exercises owner course → menu Field Kit → real workbook → back → existing saved snapshot (read-only `view=snapshot`) and anonymous login gates. `SMOKE_ONLY=1` resumes only navigation checks after a harness-readiness correction; it reuses completed viewport evidence.

Baseline release `c3491785bc718bf356f25c7b700658ca9be98c2f`. At320px Trailheads cards1743–2080px become482–761px; Field Kit1110–1500px at390 become355–378px. Page scroll height about56–57% lower on narrow portrait; desktop unchanged. Page heights can vary slightly during footer streaming; individual card geometry is also recorded.

Required commands: `npm run build`, `npm run typecheck`, `node tests/environment-isolation.cjs`, `node tests/reflection-catalog.cjs`, `node tests/reflection-export.cjs`, `node tests/designid-owner-preview-access.cjs`, `node tests/journey-discussion-access.cjs`, `git diff --check`.

Legacy `tests/trails/access.cjs` and `tests/designpd-course-access.cjs` are already stale: missing mocks for existing `./course-preview` / `getNewReviewReport`. No application access code changed; current owner/learner-boundary suite and actual anonymous guards provide current coverage. Older `tests/trails/details.mjs` asserts the deliberately replaced mobile fact/rating-note presentation and is superseded for this mobile layout by the new verifier.

Publish only via pushed `sandbox` branch and `node scripts/deploy-sandbox.mjs`; its Vercel target named production belongs ONLY to the separate sandbox project. Final `release-proof.json` verifies local/remote exact SHA, intended sandbox project, READY, alias deployment, expected SHA, and byte-identical production alias receipt/master. Re-run proof after published QA.

Physical iOS/Safari is not tested; evidence is Chromium viewport/touch emulation. No real-account save regression is claimed for this presentation-only change.

Published application release: `a03d7678613c6c76a3f29903e90984d003e81b1b`, deployment `dpl_3bKb44yq4MpYx3nxMGaZnVgJ9Rdn`. A verification-only follow-up waits for the visible open-drawer destination (streamed hidden links are not tappable); all14 published viewport checks had already passed, and resumed actual owner/workbook/snapshot/anonymous navigation then passed. This changes no application source, so the exact published application is reused rather than redeployed. Final proof records both application and verification commit and asserts app/components/lib/content/public/config byte identity.
