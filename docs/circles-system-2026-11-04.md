# Circles complete sandbox implementation — November 4, 2026

State: implementation integrated locally; sandbox schema applied; real HTTP/browser acceptance active. No application deployment yet.

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
- [ ] Server/database enforcement, synthetic realistic tests, fixture cleanup, build/typecheck, published sandbox verification.

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

Application build/deployment and final hosted acceptance still pending; no completion claim yet.

## Customer subscription management
Real server actions now support cancellation at paid-period end, restoring renewal without proration, and a trusted TEST billing-portal session for payment method/history. Provider state is tied back to the user’s own order and trusted metadata. Portal configuration is created/reused only in TEST mode at runtime, never as a connection probe or real charge. Mocked provider tests passed; hosted runtime configuration readiness is checked separately before final delivery. No completed provider purchase is claimed.
