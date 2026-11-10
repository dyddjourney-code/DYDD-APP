# Public one-off assessments — isolated sandbox

## Environment and routes

Authorized review target only: Supabase `atemrshtshxoqnuevvqu`, Vercel project
`prj_5EC6sfJe9DpGYW59L94iwppeMYUg`, branch `sandbox`. Production database,
production deployment, public Squarespace pages and legacy GHL payment links are
not changed. Existing marketing CTA replacement patches are delivered privately
for the later production cutover, not applied to the live website.

Review routes: `/assessments`, `/assessments/designid`, `/assessments/designpd`,
`/assessments/spiritual-gifts`. Existing verified-account login/signup is reused.
The free Gifts entry sends signed-out visitors through login before the native
app form, avoiding an assessment completed before sandbox authentication.

## Instrument preservation and access

DesignID uses the unchanged native allocation form, 80 statements, sort,
server-side scorer, source report payload and normal timing policy. A verified
one-off access record opens one completion, not a membership/course subscription.
`save_public_designid_attempt` consumes entitlement and saves the result inside
the established timing/completion transaction. Failed validation or transactions
do not consume the assessment entitlement. One-time bearer waiver redemption is
separate and persists before the assessment, so technical recovery never needs a
second code. Included/lifetime/admin and active paid personal access stay intact;
untracked public accounts do not bypass one-off access via the native URL.

DesignPD is derived from an exact owned valid completed 100-point DesignID.
The prerequisite is checked in page selection, server action, database redemption,
checkout creation and payment fulfillment. No user-entered email lookup exists.
The same native scorer/report generation reservation is reused. No questionnaire
is added. Successful public completion consumes the exact-source entitlement
atomically with its saved report metadata. Reopening a saved sandbox preview
creates neither another reservation nor another email.

## Waivers

Three service-only, RLS-enabled tables store orders, SHA-256 hashes of
product-domain-separated codes, and exact user/product/source entitlements.
Code row locking provides atomic redemption; same-user technical retries return
the original record, other-account replay and wrong-product attempts fail.
The private owner workbook contains 25 DesignID and 25 DesignPD codes generated
with 160-bit cryptographic randomness. It is outside Git with mode0600; only
hashes are persisted. Codes are operational **SANDBOX ONLY**, not production.
Blank assignee names and status/use fields are owner annotation fields, not a
live-synchronized redemption dashboard.

## Payment readiness — deliberately disconnected

`lib/public-assessments/payments.ts` contains dormant one-time Stripe TEST checkout
and verified-session fulfillment. The activation switch is off by default;
production checkout is explicitly rejected. No price was invented. Required
future sandbox configuration:

- `DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED=true`
- `STRIPE_DYDD_TEST_KEY` (Stripe TEST only)
- `DYDD_PUBLIC_DESIGNID_STRIPE_PRICE_ID`, `DYDD_PUBLIC_DESIGNID_AMOUNT_CENTS`
- `DYDD_PUBLIC_DESIGNPD_STRIPE_PRICE_ID`, `DYDD_PUBLIC_DESIGNPD_AMOUNT_CENTS`
- `DYDD_PUBLIC_ASSESSMENT_STRIPE_WEBHOOK_SECRET`

Webhook path: `/api/public-assessments/stripe/webhook`. Signed event + re-read
current Stripe session, TEST mode, complete/paid status, exact one-time line item,
quantity, saved price/amount/currency, owner/product/source metadata and matching
order are all mandatory. Browser returns do not grant access. Failed/expired
orders do not grant access; refund/dispute revokes entitlement and late replay
cannot restore it. Source ownership is rechecked in the atomic fulfillment RPC.
PD fulfillment invokes the same native derived-report service automatically.
No live key, price, webhook or provider connection was created by this build.
Live promotion and production payment-mode support remain a separate cutover.

## Reports and email

Sandbox paid PDFMonkey generation and customer email remain disabled by existing
environment policy. This is not represented as completed provider delivery.
`/assessments/report/[snapshotId]` renders the **exact published current official
PDFMonkey HTML template** from the saved native payload using pinned LiquidJS;
it is a full source-template preview, not a new report design or fake PDF.
Template IDs/provenance/body hashes are retained with the source. Authentication,
verified identity and exact object ownership are mandatory; foreign/missing IDs
return404. Private no-store and restrictive no-script/no-fetch CSP apply.

The existing production provider/PDF storage + lifecycle email paths are reused,
not replaced. DesignID now persists report metadata before invoking report-ready
email; DesignPD already does so. Successful PD creation automatically requests
its report email. Existing durable application mail idempotency/outbox handles
provider acceptance/retry states. Sandbox does not claim an email was sent.
Actual paid PDF generation, customer email delivery and human inbox placement
remain unverified and disconnected here. Existing Gifts questions/scorer/report
path and free pricing are unchanged.

## Verification

- `node tests/public-assessments-ledger-sandbox.mjs`
- `node tests/public-assessment-completion-payment-sandbox.mjs`
- `node tests/public-assessments-browser.mjs` (safe local sandbox server required)
- `node tests/designid-allocation.cjs`
- `node scripts/verify-designpd-source-parity.mjs`
- `npm run typecheck`, `npm run build`

Real sandbox DB suites exercise concurrent code redemption/identity races,
wrong product, prerequisite failure, replay, rollback, single assessment
completion, verified-payment idempotency, amount/price/currency mismatch,
failed orders, refunds and browser-role privilege denial. Fixtures are cleaned;
the final 50 owner codes are retained unused. Source parity covers80statements,
40legal patterns,130931DesignPD vectors,222source rows and240profiles; no private
historical workbook was available for a fresh historical replay.

Release evidence and private deliverables live under workspace
`outputs/dydd-public-assessments-2026-11-10/`. Final handoff records exact SHA,
deployment, hosted acceptance and any remaining limitations.
