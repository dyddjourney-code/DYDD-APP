# Circles complete sandbox implementation — November 4, 2026

State: complete implementation pushed and deployed to sandbox; backend hosted acceptance passed24checks twice, actual hosted PDF/history exports passed. Final focused browser-control verification and clean-runtime teardown are underway.

## Scope and isolation
John authorized full sandbox completion and deployment on November 4 after accepting the compiled checklist. Source: memory/dydd-circle-operating-rules-2026-11-04.md and sanitized original discussion. Sandbox branch `sandbox`, Vercel project `dydd-online-school-sandbox`, Supabase `atemrshtshxoqnuevvqu`. Production branch, production aliases and production DB are out of scope. Existing untracked `tmp/` retained.

## Source-of-truth requirement checklist
- [x] Verified personal membership required for leaders and participants; owner grants explicit only.
- [x] Leadership separate $20; renewal $10 for 10–19 distinct qualifying participants, $0 for20+; one credited leader, no duplicate/free/pending counts, no midcycle churn.
- [x] DC3 personal $5/month only, no discount to add-ons.
- [x] Couples $5 one time, one persistent two-person Circle, both personal memberships.
- [x] Per-Circle membership/roles and participant-safe home; no cross-Circle disclosure.
- [x] Couple2, Small3–19, Class20–49, Cohort50+ approved per Circle and cap; invitations reserve seats.
- [x] Account-wide creation/burst/invite/report budgets; deletes do not reset ledger; owner overrides.
- [x] Cohort request details/dedup/owner review/approval-specific capacity and held approval email plumbing.
- [x] Bulk CSV validation/preview/dedup/email-bound invitations and paid acceptance.
- [x] Full tools until paid end; no new enrollment during30-day transition; then preserved read-only; renewal and transfer supported.
- [x] Participant cards/current section/next meeting/action/prep/own progress/calendar and consented people.
- [x] Reflections, reports, notes private by default; deliberate selected-Circle sharing only.
- [x] Couples consent + pending states + existing DesignID overlay AND detail and SpiritualGifts, not DesignPD/full reports.
- [x] Deliberate callouts per session/lesson/prompt for small/class; cohort unique-person counts only; withdrawal.
- [x] Offer/FAQ covers do life together, tools, size paths, prices, cancellation and discounts. Unavailable founder resources not advertised available.
- [x] Server/database enforcement, synthetic realistic tests, fixture cleanup, build/typecheck, published sandbox verification.

## Documented safe implementation defaults
These implement previously provisional mechanics accepted in the final authorization; not claims of prior exact agreement.
- Organizer counts within roster seat cap, preserving existing setup behavior.
- Creation working budget30/day60/month, burst5/10minutes; invitation budget1000/day and100/10minutes. Planner PDFs20/day100/month3/minute. Owners may approve higher explicit allowances; capacity approval remains separate.
- DC3 paid personal qualifies as paid participation; free/beta/lifetime grants do not count toward discounts.
- Participant explicitly controls one credited leader at a time; selection changes apply at next renewal.
- Failed payment never mints paid access; previously paid access expires at its saved paid-through date.
- Couples pairing persists; ordinary users cannot recycle a purchase into new spouses/Circles. Support correction must be explicit/audited.
- Both spouses may edit shared planning; either may withdraw own assessment-sharing consent; marriage grants no automatic result access.
- Marking a topic sends a deliberate signal only; sharing text requires explicit submission. Withdrawal removes leader-visible callout; private notes stay untouched.
- Cohort request email is persisted in a held sandbox outbox, not sent to real recipients.
- No performance claim for1,000 concurrent assessment/report jobs; independent load work remains separate.

## Execution lanes
Core operations/database: internal child `circles-core`.
Billing/renewal entitlements: internal child `circles-commerce`.
Participant/Couples/offers UI: internal child `circles-experience`.
Integration, QA, migration, commit/push, deployment and release verification: owning implementation agent.

## Evidence / verified intermediate state
- Isolated sandbox billing220000 applied; operational221000, PDF budget222000, shared spouse planning223000 and personal-activity hardening224000 applied with hash receipts.
- Billing real-DB + signed mocked-Stripe suites, CSV/projection/HTTP API unit tests, restricted-service database rollback suite, privacy consent/schedule/environment regressions passed.
- Final local HTTP run:25/25 checks passed after all independent-review fixes; actual long-name mobile overflow fixed. All8temporary accounts and10Circle fixture IDs cleaned with zero residue errors. No completed provider payment or email sent.
- Actual lesson reminder now has separate explicit selected-Circle callout control. No private response/note is copied into its request.
- HTTP acceptance additionally covers both-spouse shared logistics, participant credit selection/opt-out and personal-expiry activity denial.

Production build and typecheck pass. Sandbox release is deployed; final focused browser and cleanup receipts are recorded below.

## Customer subscription management
Real server actions now support cancellation at paid-period end and restoring renewal without proration. Provider state is tied back to the user’s own order and trusted metadata. Mocked provider identity/CSRF/cancel/resume tests passed. Optional payment-method/history portal was additionally implemented but the actual sandbox runtime key returned403more_permissions_required for portal configuration; its customer button is withheld, so no unavailable portal is advertised. This was outside the agreed Circles operating scope and does not block the agreed paid-period lifecycle, direct renewal controls or leader transfer. Owner readiness evidence is retained. No fresh completed provider purchase was performed in this build.

## Hosted release checkpoints
- Runtime9ddd523 deployed READY to dpl_7dawWZHhAPK2c6svYvj8djhaszuX; final runtime refinements0caa693 deployed READY to dpl_3bdhGiztToB6TZYZTGEzhwpD9iMp. Both sandbox aliases verified; production deployment unchanged.
- Actual hosted owner capacity approval/allowance changes, paid acceptance, concurrent capacity races, CSV, cohorts, privacy, mutual Couples alternate routes, shared spouse edits, renewal/lifecycle and transfer:24backend checks pass. All disposable records cleaned.
- First browser harness waited for external-asset network idle; second accepted Circle-card readiness before detail readiness. Both harness races are corrected. Focused real-browser follow-up exercises actual count submit/withdrawal, Couple detail/gifts and spouse calendar save at1280/390/320.
- Temporary synthetic owner account, its credential file and sole sandbox owner-UUID environment entry have been removed. Final redeploy clears its runtime reference. No real owner was impersonated.

Read-only enforcement additionally freezes legacy shared-result projections at the transition boundary, blocks new consent grants, and still allows selective/all consent withdrawal and callout withdrawal. Bulk names use the same120-character bound as the planner, enforced by both CSV validation and PostgreSQL. Real restricted-role rollback regressions and cutoff tests pass.

## Final deployed release
- Sandbox URL: https://dydd-online-school-sandbox.vercel.app/camp-circle/my-circles
- Runtime source: `e8a478dd8d9a8cd34262799c48499848d8b704f1` on branch `sandbox`.
- READY deployment: `dpl_4ubq6fHTqm2Sf1yXXW932EizpFyH`; both canonical and legacy sandbox aliases verified. Evidence-only commits after this runtime do not change deployed application code.
- All November4 migration source hashes checked against the sandbox ledger, including final shared-calendar finish-date derivation. Applied migration files remain immutable.
- Native Camp header uses its proper page context: one compact art image, not duplicated mobile pseudo-art. Actual viewport checks cover1280/390/320.
- Never-purchased saved plans cannot unlock premium Field Guide; previously paid read-only guide history remains available. Participants receive preparation/questions without leader-only flow/help.
- Shared Couple finish-mode calendar changes derive and persist the correct finish date while retaining narrow patch, accepted-spouse/Personal access checks, and optimistic revision conflict protection.

### Evidence map and limits
- `docs/evidence/circles-local-acceptance.json`:25/25 full local HTTP checks with actual isolated sandbox DB; fixtures cleaned.
- `docs/evidence/circles-hosted-initial.json`:24actual hosted backend checks, including synthetic owner approval; original browser harness timeout is preserved honestly, not relabeled a full25/25.
- `docs/evidence/circles-hosted-browser.json`:focused actual hosted UI/backend follow-up; no network response interception.
- `docs/evidence/circles-pdf-verification.json`:actual hosted PDF bytes, foreign-scope denial, read-only persisted plan.
- `docs/evidence/circles-schema-verification.json`:private RLS tables and service-only RPCs, no broad auth.users grant.
- `docs/evidence/circles-billing-verification.json`:real isolated billing data and signed mocked-provider lifecycle scenarios. Direct cancellation/restore-renewal provider controls additionally pass mocked identity/CSRF tests.
- `docs/evidence/circles-dc3-test-catalog.json`:actual TEST coupon readback, restricted to Personal.
- `docs/evidence/circles-final-deployment.json` and `circles-cleanup.json`:published runtime, aliases, production/ref isolation and synthetic residue audit.
- No fresh provider purchase was completed in this build; no live charges or real customer email. Invitations/approval email remain held in the sandbox outbox. Earlier sandbox payment proof is not presented as a new purchase.
- Optional payment-method/history Stripe portal is not advertised: runtime setup returned403 insufficient permission. Direct paid-end cancellation and renewal restoration work independently; optional portal is outside the agreed Circles scope.
- No1000concurrent report/assessment load claim. Existing content, private reflection/scoring/report derivation and preexisting untracked tmp work were preserved.

Final mobile visual review: capacity detail switches to readable labeled stacked rows below600px, retaining the full comparison table on desktop. Actual320/390px screenshot review is part of release verification, not merely a no-overflow assertion.

## Completion status — November4,20:02UTC
**Complete, pushed and deployed to sandbox for John’s testing. No agreed-scope blocker remains.** Final runtimee8a478d is READY; final actual browser9checks pass at1280/390/320 with no JS errors/overflow, including deliberate callout submit/withdrawal and finish-mode spouse holiday/calendar save. Manual320px capacity detail screenshot is readable after the stacked-label adjustment. Final audit finds0synthetic users,3preexisting plans and1preexisting Couple binding preserved, and0new operations/outbox/consent/callout residue. Temporary owner authority/file absent; production deployment/master/unrelated refs unchanged. Final local QA server is stopped.

For a repeatable release check, run `CIRCLES_QA_COMMIT=<deployed-code-sha> CIRCLES_QA_DEPLOYMENT_ID=<deployment-id> node scripts/verify-circles-release-sandbox.mjs` after the browser harness cleans up. It is read-only and validates the exact sandbox project, both aliases, Git refs, production deployment baseline and synthetic-user residue without emitting customer records or credentials.
