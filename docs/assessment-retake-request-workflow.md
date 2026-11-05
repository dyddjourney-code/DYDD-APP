# Sandbox early-retake requests

## Scope and dependencies

Local-only source implementation; no commit, push or deployment. Sandbox DB only:
`atemrshtshxoqnuevvqu`, Vercel project `prj_5EC6sfJe9DpGYW59L94iwppeMYUg`.
The additive migration **20261105231043_assessment_early_retake_requests.sql** was
applied and recorded in sandbox migration history, then its private Auth lookup
was repaired in place before QA. The checked-in SQL and recorded source match.
This migration creates the agreed `dydd_assessment_retake_grants` contract; apply
it **before** the core timing migration, whose eligibility/completion functions
consume grants. Core owns eligibility, atomic successful-completion consumption,
normal timing reset and existing owner/legacy exemptions.

The request service imports `getAssessmentEligibility` from
`lib/assessment-timing/policy.ts`. No assessment instruments or core actions are
changed by this package. Integration links should use:

- `/assessment-timing`: shared explanation.
- `/assessment-timing/request?type=designid` (also `spiritual_gifts`, `fruitful_self`).
- Owner review links are minted only with persisted request intents and contain
  an opaque random token. `/assessment-timing/owner` must never be used to confer
  owner authority; verified signed-in Auth identity plus `isDyddAdminEmail` AND
  the designated sandbox owner address are required.

## Security and durability

GET only reads. Every mutation is a same-origin POST with Origin and Fetch
Metadata checking. Request user ID/email come from `auth.getUser()` with confirmed
email; submitted hidden user/owner fields have no authority. SQL independently
checks the designated verified owner through a narrow private SECURITY DEFINER
Auth-email lookup, service-role-only. Public workflow RPCs are SECURITY INVOKER,
with public/anon/authenticated EXECUTE revoked. All three public tables have RLS
and no anon/authenticated table privileges. Grant mutation is service-only.

One pending request per user/type is enforced by unique index and an advisory
transaction lock. New requests are limited to one per user in 24 hours. Tokens
are 256-bit random, SHA-256 stored on requests, scoped to one request and expire
after seven days. Row locking makes decisions replay-safe; approval creates one
30-day grant and one decision notification in the same transaction. Decline
creates no grant. Request/source result, reason, actor and times are retained.

Mail payloads (including review URL) are frozen in the service-only outbox before
sending. Retries reuse the same input and provider idempotency key through the
existing durable `sendResendEmail` ledger, suppression and 23-hour ambiguity
window. No automatic reminder or cron was added. Request and owner pages show
pending/failed/blocked/accepted status, with an authorized POST retry. Accepted
means provider acceptance, never inbox delivery. Parallel retries rely on the
existing provider stable-key idempotency; an already accepted status is never
overwritten by a failed concurrent retry.

Only the designated `dyddjourney@gmail.com` owner receives review mail, subject
to the existing sandbox exact allowlist. Learner decision mail goes to that
learner's actual Auth email **only if allowlisted**; it is never redirected to the
owner. Non-allowlisted synthetic/learner sends are visibly blocked before
transport. Payload body/URL is sensitive service data; do not expose outbox JSON
to clients or logs.

## Verification performed

- `node tests/assessment-retake-requests.cjs`: sandbox identity gate; Origin and
  Fetch Metadata CSRF; absent/preview-only auth denied; frozen retry payload/key;
  persisted failure; accepted replay; outsider blocked before transport.
- `node tests/assessment-retake-requests-sandbox.mjs`: real isolated DB, six
  concurrent requests yield one request/outbox; 24h throttle; anonymous and
  authenticated foreign read/RPC denial; forged owner denial; bad/expired token;
  five competing approvals yield one grant and decision notification; 30-day
  expiry; replay denial; decline without grant. Synthetic users/grants/requests/
  outbox cleaned in finally; no provider sends.
- `node tests/email-sender.cjs`: existing sender durable timeout/500/persistence
  recovery, stable byte retries, provider window/manual review, suppression and
  exact sandbox allowlist regression checks.

Parent-owned coupled QA remains: real signed-in request/owner browser flow,
owner-only provider acceptance and delivery, live responsive screenshots,
successful-completion grant consumption and normal timing restart, build/deploy.
The new routes require the core eligibility migration to be applied first for
runtime request eligibility (after this storage migration creates grants).

## Operational limitations

Expired decision links fail closed. The enclosing reviewed migration archives an
expired pending request before creating one new replacement under the existing
request lock, preserving its original token/outbox/audit rather than rotating
bytes under a provider key. Native completion UUID/time provenance is retained.
Outbox retries are explicit POST actions, not a background delivery guarantee.
Transport framing (From/footer/config) is still supplied by the shared sender;
if its environment changes mid-retry, the durable payload hash fails closed
rather than sending changed bytes. No real owner mail was sent by these tests.

Enclosing integration: real cookie-backed 1280/390/320 local request/John-owner approval/decline/grant consumption flow PASS. Owner form uses same-origin referrer policy (no cross-origin token referrer) because no-referrer produces Origin:null on a native form POST; CSRF was not weakened. Hosted controlled-provider proof is recorded in the final release receipt.
