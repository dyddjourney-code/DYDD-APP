# Standalone website assessments — production-based local integration

**Local only.** Base `023b480`, isolated branch `prep/public-assessment-production-integration`.
No sandbox branch merge, pushes, deployments, provider changes or hosted database mutations.
The sandbox-derived checkout preparation commit `49bd1f8` is reference material, not the base.

## Approved offer boundaries

- Website DesignID: USD19.99 once, assessment/report only. Existing six-calendar-month
  eligibility and approved one-use retake overrides remain authoritative.
- Website DesignPD: USD19.99 once, report only for the exact owned eligible completed100-point
  DesignID selected at checkout. No separate questionnaire, membership, course or Circle grant.
- Separate app DesignPD15 offer and its existing copy/checkout availability remain; no app
  catalog IDs/prices are modified. Gifts remains free; FruitLife/subscriptions unchanged.
- Historical snapshots, scoring/report source libraries, IDs, ownership, report links, retake
  history, course progress/awards and private report bytes are not rewritten or re-scored.

## Explicit grandfathered assessment/course policy

The old global `isFreeBeta()` remains untouched for unrelated production features. Before an
explicit cutover, existing production assessment behavior remains. New sales cannot start until
ALL readiness flags below are present. After selecting `grandfathered-v1`, assessment creation
and the two connected course capabilities require existing personal lifetime access or an
explicit `dydd_assessment_grandfathered_access` row; owner assessment exemptions remain.
This selector persists independently of pausing checkout/ledger connectivity: do not remove it
after launch. No checkout, code, completion or historical report creates a grandfather row.

**Do not activate with an empty/unreviewed cohort.** The migration intentionally creates an
empty table. Production read-only inventory found8 existing verified Auth accounts,7 profiles,
3 personal-access records,272 participants and1099 snapshots. A private candidate list was
written under workspace launch outputs; no grant was inferred or seeded. Review the exact
existing included/beta/course cohort (including every current learner/admin and any external
recurring rights) before cutover. Whether to retain *all current beta accounts* or a narrower
explicit cohort is a business-policy decision; this implementation does not silently choose.
Historical artifact reading is independent of buying another assessment.

Course authorization is separate from assessment completion: both DesignID/PD course pages,
redirected lessons, progress GET/POST, reflection page/read/write and individual/all workbook
exports use the capability. Gifts/FruitLife rules remain. Field Kit/trail cards do not advertise
an unavailable connected course. Existing course completion/report prerequisites still apply.

## Additive database order

Run the reviewed catalog preflight first (`docs/public-assessment-production-preflight.sql`).
Apply only the four new migrations, in filename order:

1. `20261111215314_public_assessment_production_schema.sql`
2. `20261111215316_public_assessment_production_reservations.sql`
3. `20261111215318_public_assessment_production_rpc.sql`
4. `20261111215818_public_assessment_artifact_recovery.sql`

See `docs/public-assessment-production-sql.md` for grants, ownership, lock order and prerequisites.
The baseline six-month `save_designid_attempt` is invoked unchanged. No full sandbox timing,
retake-request, membership, lifecycle or Circle migration is required. Runtime singleton defaults
toTEST; setting payment_mode=live is a separate reviewed runtime mutation, not performed here.
Do not execute the old sandbox schema-review draft on top of these final-form migrations.

## Identity, payment and recovery contracts

All new entry/actions require verified server Auth. Profile/form emails never authorize a
purchase/source. Explicit snapshot owner wins, then explicit participant owner, then exact
verified legacy email only; Gmail dots/pluses do not confer ownership. DesignID participant
claim uses conditional unowned-row update or insert, never user_id-upsert on email conflict.

The payment adapter validates exact one-time active Stripe Price/product/currency/USD1999/mode
before order creation. Webhooks use raw-body signatures and reread session/intent/charge; bind
stored immutable owner/product/source/session/price/product/amount/USD evidence. Browser returns
grant nothing. Foreign events do not mutate assessment rights. Refunds/disputes verify an owned
session then create provider-scoped reversal fences; failed DB updates return500 for retry.

DesignID consumes access atomically with the saved score, not PDF/email. Technical delivery
retry uses that saved artifact without retake or repurchase. DesignPD reserves one job per
user/source/content version; known failed jobs use its bounded retry. A known-ID uncertain job
can become retryable only after the original provider document explicitly reports failure;
pending/unreachable/no-ID outcomes stay fenced. Uncertain jobs cannot
blindly create again. Creation IDs persist before polling. Archive metadata persists before
email; archive failure withholds new ready mail. Download recovery reuses known provider IDs,
blocks ambiguous creation, and never creates a derived DesignPD job via the generic lock.
The fourth RPC reconciles an already archived DesignPD artifact/reservation/consumption, including
retry after linkage failure. Email retry uses the original deterministic report event key and
owned archived result, never a second purchase/PDF; accepted and delivered remain distinct.
Unknown no-ID provider outcomes require operator reconciliation, not automatic duplicate jobs.

## Runtime configuration (none configured by this work)

Common: existing trusted Supabase service config, explicit canonical production `DYDD_APP_URL`,
PDFMonkey key and existing DesignID/PD templates, private PDF bucket, Resend sender/key and
lifecycle outbox/retry/reconciliation/telemetry health. Never use preview/sandbox origin in mail.

New production readiness:

- `DYDD_PUBLIC_ASSESSMENT_PRODUCTION_ACCESS_POLICY=grandfathered-v1` (persistent cutover policy)
- `DYDD_PUBLIC_ASSESSMENT_GRANDFATHER_INVENTORY_READY=true` (only after cohort review/seed)
- `DYDD_PUBLIC_ASSESSMENT_PRODUCTION_LEDGER_ENABLED=true`
- `DYDD_PUBLIC_ASSESSMENT_PRODUCTION_SUPABASE_URL` equals actual production URL exactly
- `DYDD_PUBLIC_ASSESSMENT_STRIPE_MODE=live`
- `DYDD_PUBLIC_ASSESSMENT_PRODUCTION_PAYMENTS_ENABLED=true`
- `DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED=true` (new sales; set false to pause only sales)
- `DYDD_PUBLIC_ASSESSMENT_WEBHOOKS_ENABLED=true` (keep active for existing payments/refunds)
- `DYDD_PUBLIC_ASSESSMENT_LIVE_ORIGIN` explicit canonical HTTPS origin, no slash/path
- `DYDD_PUBLIC_ASSESSMENT_STRIPE_LIVE_KEY`, `DYDD_PUBLIC_ASSESSMENT_STRIPE_LIVE_WEBHOOK_SECRET`
- For DESIGNID and DESIGNPD: `DYDD_PUBLIC_{PRODUCT}_LIVE_STRIPE_PRICE_ID`,
  `DYDD_PUBLIC_{PRODUCT}_LIVE_STRIPE_PRODUCT_ID`, `DYDD_PUBLIC_{PRODUCT}_LIVE_AMOUNT_CENTS=1999`
- Separately reviewed DB singleton payment_mode=live; application cannot switch it.

Waivers use fresh cryptographic `DYDD-DID-/DYDD-DPD-`+40hex codes, production-separated hash
namespace. None are created/seeded; sandbox bearer codes/batches are never imported.

## Verification boundary and remaining release work

Local application tests mock DB/provider/mail transport; Stripe signatures are real library
verification. Scoring/source fixtures are independent approved workbook-derived evidence,
not a replay of private historical participants (zero private historical rows available).
SQL tests execute real disposable PostgreSQL17 with actual baseline migrations/roles/two-session
races, not mocked ledger results. Managed Supabase advisors/platform JWT/RLS settings and actual
remote catalog contents remain a separate preflight; REST visibility is not full pg_catalog proof.

Still required before a separately authorized release: resolve/seed reviewed grandfather cohort,
reconcile any external recurring included rights, review actual production catalog and applySQL,
configure exact approved catalog/provider keys/host/webhook flags, controlled authenticated
payment/save/actual PDF bytes/private archive/email canary, desktop/mobile live controls and
historical account regression. No browser or Stripe catalog inspection was performed by this
integration lane; catalog review is separately owned. No send/deploy/DB-write evidence claimed.

### Recorded verification

Final application suites cover18 payment/recovery-policy cases, course capability/API/export
matrix, source scoring/allocation, historical artifact ownership/reopen, durable PDF storage and
source-authored content. The production Next build/typecheck pass locally. Anonymous local HTTP
checks return200 for catalog and all3 product pages using synthetic config (no liveDB/browser).
Full28-baseline-plus4-migration PostgreSQL17.11 test passes including recovery/role denials and
real reversal/reservation/completion races. Logs/verification JSON are in workspace launch outputs.

The old standalone `tests/designid-research-retakes.cjs` harness fails identically on unmodified
023b480 because its temporary transpilation cannot resolve `@/lib/supabase/admin`; it is not
reported as passing. The real SQL suite independently verifies six-month calendar boundaries,
one-use approved overrides, denied early retakes and unchanged baseline save definition.
