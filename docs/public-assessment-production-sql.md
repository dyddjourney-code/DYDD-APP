# Public assessment production SQL — local preparation, 2026-11-11

Status: **local only; no hosted database inventory/mutations, commits, push, or deployment**.
SQL slice starts at `023b480`. Supabase skill used; current changelog, CLI v3 breaking change,
and database-function security docs reviewed. Migration files generated with Supabase CLI
3.1.0 `migration new`; SQL is hand-reviewed final form, not wholesale sandbox promotion.

## Ordered additive migrations

1. `supabase/migrations/20261111215314_public_assessment_production_schema.sql`
   - Narrow `dydd_private.retake_verified_email(uuid)` looks up confirmed, non-deleted Auth
     users; exact trimmed/lowercased email only. No profile/user_metadata trust or Gmail alias
     normalization. This is the only new SECURITY DEFINER routine, with an empty search path
     and service-only execution. No Auth-table grants are given to public client roles.
   - Empty, explicitly curated `public.dydd_assessment_grandfathered_access`
     (`user_id` PK, `granted_at`, nonblank `reason`). **No all-users population** and no
     assessment/course entitlements inferred from historic completion.
   - Service-only runtime singleton defaults to `test`; both live/test provider evidence,
     final-form orders/codes/entitlements/reversal tables and exact owned eligible source helper.
2. `supabase/migrations/20261111215316_public_assessment_production_reservations.sql`
   - Requires #1's source helper and the baseline snapshot/participant tables.
   - Absent-row advisory lock plus unique user/source/version reservation; one snapshot/job.
     Exact confirmed ownership and corrected 100-point DesignID are checked before reservation.
     Participant must explicitly belong to the user. Null/stale tokens fail completion.
   - Ready reports reopen; old ambiguous pending/failed records are adopted as `uncertain`;
     running/uncertain never time out into a new job. Confirmed failed jobs with a document ID
     retain the existing one-minute retry and maximum-three-attempt behavior. Application must
     report transport ambiguity as uncertain, not confirmed provider failure.
   - Both reservation RPCs are SECURITY INVOKER and service-only.
3. `supabase/migrations/20261111215318_public_assessment_production_rpc.sql`
   - Requires #1, #2, and baseline
     `public.save_designid_attempt(uuid,uuid,text,boolean,jsonb)`.
   - Final live/test apply, reversal, lookup, waiver redemption, atomic DesignID save and
     atomic DesignPD completion; no temporary sandbox overloads/constraint drops.
   - Payment apply/revoke provider is **required**, not an implicit test default. App must
     pass `p_provider='stripe_test'|'stripe_live'` as the checkout adapter already does.

The parent-owned `20261111215818_public_assessment_artifact_recovery.sql` is an optional
fourth integration migration after #3; the harness can include it with
`--with-artifact-recovery`. It reuses the private order-before-entitlement lock helper.

No other 202611 sandbox migrations are dependencies. In particular **do not** import retake
requests/grants, FruitLife timing, 90/30-day timing, TEST membership billing or Circle changes.
The existing six-calendar-month save function is not redefined or edited; the wrapper invokes
it with `p_owner_exemption=false` even when a caller supplies true. Approved baseline retake
overrides still work normally. Scores are trusted server-scored input, just as for baseline
save; SQL is not a replacement instrument/scorer implementation.

## Preconditions and read-only inventory

Run/review `docs/public-assessment-production-preflight.sql` against the actual target before
any separately authorized application. It inventories catalogs/privileges only. It was **not**
run against hosted production in this task. Confirm hosted migration history, PostgreSQL
version and all baseline objects/privileges, not just repository filenames.

Minimal relational prerequisites proven locally are the actual baseline initial schema,
participant identity migration, and six-month retake migration. The managed platform provides
`auth.users(id,email,email_confirmed_at,deleted_at)`, roles `anon`, `authenticated`,
`service_role`, `gen_random_uuid`, and server/service access to snapshot/participant tables and
retake override records. The full baseline also includes lifecycle capture triggers; these
are exercised by the full-baseline test mode. No external email/PDF provider is invoked by SQL.

These migrations deliberately use CREATE, not blanket IF NOT EXISTS: existing same-name
objects or an existing `retake_verified_email` require catalog reconciliation before applying.
They are designed for `023b480`, **not** for an already-migrated sandbox schema. Never execute
the old schema-review draft on top of them. No down migration deletes customer/audit data.

## Security and concurrency contracts

- Every new table has RLS, no anon/authenticated grants or permissive policies, and service
  grants; every new RPC/private helper revokes PUBLIC/anon/authenticated EXECUTE. Invoker
  routines cannot self-elevate. Historical snapshot RLS and artifact-read access are untouched.
- Exact ownership mirrors `lib/assessments/artifact-access.ts`: explicit snapshot `user_id`
  is authoritative; if absent, explicit participant `user_id` is authoritative; only if both
  are absent may the **current verified exact Auth email** match legacy normalized email.
  Dot/plus/Googlemail alias equivalence is deliberately not accepted. New paid source eligibility
  additionally requires valid corrected 100-point DesignID (including supported nested payloads).
- Runtime mode independently fences apply, lookup and consumption. Missing runtime row denies
  payment-backed rights; waivers are not payment-mode-specific. Changing `test` to `live` is
  a later reviewed deployment operation, not part of this preparation.
- Reversal accepts either explicit known provider **even if it is not the active runtime mode**.
  A sales pause/mode cutover must never block recording refunds. Tombstones and advisory keys
  are scoped by provider/intent. Session and intent uniqueness are provider-scoped too.
- Apply locks provider/intent, rejects tombstones, locks order, checks stored provider/session/
  amount/USD/price/intent and valid verified source, then creates at most one entitlement per
  order. Replays return the existing matching entitlement, including already-consumed rights;
  revoked rights cannot be regranted. The server adapter remains responsible for re-reading
  Stripe and proving product ID, quantities, metadata and successful non-refunded charge.
- Completion locks order **before** entitlement, matching reversal's order→entitlement order,
  and revalidates both after waiting. This fixes the draft's entitlement-only refund race.
  Duplicate DesignID source-response submission returns its prior consumed snapshot; same-token
  completed DesignPD replay is a no-op. Historical result access is not revoked by a later refund.
- Expired/revoked/wrong-product codes fail; exact source prerequisite failure leaves code untouched.
  Same-account same-source redemption retries return the original entitlement. No bearer codes,
  code hashes, sandbox batches, customer/order rows or entitlement fixtures are seeded by migrations.
- Production DesignPD consumption requires `ready`/`success`; sandbox preview/failure never
  consumes access. Provider-ready does not attest successful private PDF archive/email delivery:
  application recovery must reuse the reservation/snapshot, not create another checkout/job.

## Verification

Run from repository root (Python 3 and local Docker with cached `postgres:17-alpine` required):

```sh
python3 tests/public-assessment-production-sql.py
python3 tests/public-assessment-production-sql.py --full-baseline
python3 tests/public-assessment-production-sql.py --full-baseline --with-artifact-recovery
```

Harness cannot accept a DB URL: it creates a unique disposable local container, binds no ports,
mounts no host volumes, and stops/removes it in `finally`. Managed Auth/Storage catalog stand-ins
are explicit test fixtures, **not** deployable Supabase replacements. Actual baseline tables,
policies, save routine and migrations are executed, not mocked outcomes. The minimal mode proves
no omitted sandbox dependency; full mode replays all 28 repository baseline migrations.

Verified on local PostgreSQL **17.11**:

- Migration order/parse/execution; six-month function definition byte-for-byte unchanged.
- Verified exact/explicit ownership, foreign snapshot/participant precedence, nested corrected
  scores, alias denial, invalid ranked score rejection, unverified identities.
- Waiver idempotency/product/expiry/ownership, source failure rollback, blocked early retake
  rollback, actual six-calendar-month eligible/ineligible boundaries, approved original override
  consumption, purchase cannot set owner exemption, save retry/consumption.
- Reservation uniqueness, null-token denial, uncertain preservation, sandbox-preview rejection,
  ready completion and same-token replay.
- Live/test mode isolation, same-order payment replay, amount mismatch, refund-before-payment,
  double reversal, inactive-mode refunds and mode-scoped same-intent IDs.
- RLS and privileges for **all** new tables/functions, actual anon/authenticated denials.
- Real two-connection races with first transaction's actual lock held before second starts:
  fulfillment→reversal, reversal→fulfillment, absent-row reservation, reversal→completion,
  completion→reversal. Final state retains artifacts/audit but never revives revoked access.

Full hosted Supabase/PostgREST/JWT, platform security advisors, live/test Stripe signed webhook,
PDFMonkey/storage delivery, email inbox, production identity/rights inventory and deployment
cutover remain **unverified** here and belong to parent integration/release checks. Historical
scoring/content/report bytes were not re-scored or migrated. App/course authorization and approved
legacy grandfather row selection are parent-owned and not SQL deployment side effects.
