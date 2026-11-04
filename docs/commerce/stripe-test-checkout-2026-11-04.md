# DYDD isolated Stripe TEST checkout/access

## Target and state

Only `sandbox`, Supabase `atemrshtshxoqnuevvqu`, and `https://dydd-online-school-sandbox.vercel.app` are supported. Stable production/master, free-beta access, existing FruitLife Stripe routes, scoring, saved reports and assessment prerequisites are unchanged. No test entitlement is read on the production database. No LIVE key/object/event is accepted by the new path.

- Account entry: `/memberships` (separate real sandbox password account; owner-review identities cannot buy).
- Create: `POST /api/stripe/test-checkout` with same-origin JSON `{capability,scopeId?}`.
- Fulfill: `POST /api/stripe/test-webhook`, raw-body Stripe signature verification.
- Inspect own access: `GET /api/stripe/test-access?capability=personal` (or `scopeId` for add-ons).
- Return/cancel URLs never grant access. The page reads server-side, current entitlements.

The current protected Gateway restricted key can read the TEST catalog/subscriptions, but GET and POST Checkout Sessions and GET Webhook Endpoints return **403 `more_permissions_required`**. Existing local legacy app Stripe entries contain no usable test-key-format value. Vercel sandbox has no TEST runtime key or signing secret. **There has been no completed Stripe TEST purchase.**

## Hosted setup still required

Nonsecret `DYDD_BILLING_MODE=test` and `DYDD_TEST_APP_URL=https://dydd-online-school-sandbox.vercel.app` have been set only on the sandbox Vercel project.

1. Provide a suitably scoped **TEST** key directly as sensitive server-only Vercel env `STRIPE_DYDD_TEST_KEY`, sandbox project only. Required operations: Checkout Sessions read/write; subscriptions read/write; invoices read/write and invoice-payment reads; payment intents/charges read; products/prices/coupons read. Webhook Endpoints write is needed only for automated endpoint provisioning, not app operation. Customer creation happens through Checkout, never from caller-provided identity.
2. In Stripe TEST mode, create the endpoint `https://dydd-online-school-sandbox.vercel.app/api/stripe/test-webhook`, API version **2026-08-26.dahlia** (matches installed Stripe22.6.2). Subscribe to:
   - `checkout.session.completed`, `checkout.session.async_payment_succeeded`
   - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - `invoice.created`, `invoice.paid`, `invoice.payment_failed`
   - `charge.refunded`, `charge.dispute.created`
3. Save its signing secret directly as sensitive sandbox Vercel env `STRIPE_DYDD_TEST_WEBHOOK_SECRET`. It must belong to this TEST endpoint, not the old live FruitLife webhook.
4. Explicitly redeploy sandbox using `node scripts/deploy-sandbox.mjs`. This project intentionally has no automatic Git deployment. Do not change master or any live Stripe endpoint/key/catalog.
5. Sign into the separate sandbox account, open `/memberships`, and complete a TEST checkout using Stripe's documented test card. Confirm webhook200 and own `test-access` response. Then repeat idempotent replay/cancel/renewal/refund tests through actual Stripe. These provider end-to-end tests remain outstanding.

The supplied key was used through the destination-bound OpenClaw secret-egress proxy for real permission/catalog probes. The saved protected value is write-only, process-local sentinels are not credentials, and its `api.stripe.com` binding does not permit exporting it to Vercel. No key, sentinel, proxy password or signing secret is committed or included in receipts.

## Billing contract and authority

- Personal $10/month, no public promo entry. Independent personal subscription; explicit legacy lifetime personal grants remain exemptions. Paid personal grants the existing FruitLife commercial access and Circle participation prerequisite; it does **not** grant DesignPD or leadership. Existing free content remains free; no broad new course paywall.
- Leadership additional $20/month. Distinct accepted participants in active creator-owned Circles with current paid personal access qualify; exclude pending invitations, self, trials, grants, refunded/disputed/expired payments. Earliest currently accepted active-Circle membership attributes one participant to one leader at a time. 10–19 participants → $10;20+ → $0. Both tiers are leadership-product-only coupons, never personal discounts.
- Couples $5 once for an owned saved `Couple` plan ID. No account-wide unlock. Own personal membership required to activate, and invited partner needs their own membership to accept. Drafts/history remain accessible; activation/paid Circle tools enforce current rights. Payments never grant Circle ownership or result-sharing permissions.
- DesignPD $15 once for an exact owned saved DesignID snapshot. Historical result selection is carried through page, hidden form and revalidated server action. A new saved DesignID result needs its own unlock. Existing lifetime/owner exceptions and report/course prerequisites remain intact. The sandbox's pre-existing external PDF/report delivery block remains intact: payment access tests do not prove external PDF generation or delivery.

Prices are fixed to the independently verified TEST catalog in `outputs/dydd-stripe-setup/receipt.json`; callers cannot choose price, amount, user, coupon or return origin. Price active/currency/amount/interval/livemode are rechecked before session creation. Checkout session reuse/idempotency and unique open orders prevent concurrent duplicate starts; existing non-cancelled recurring subscriptions prevent a second unpaid subscription.

## Fulfillment and renewal behavior

- Webhook fulfillment re-fetches Stripe Checkout/Subscription state; checks TEST mode, immutable app order, authenticated owner reference, exact price/quantity/scope/currency, payment status and unrefunded/undisputed payment evidence. Successful subscription access expires at its item period end. A100% leadership invoice can grant an active membership without a positive charge; personal qualification cannot.
- Client roles/metadata and success URLs cannot grant rights. Service-only, RLS-enabled tables record orders, source-unique entitlements, event receipts and renewal audits. An invoker RPC locks the actual order, honors current revocation and ignores older provider-read timestamps. Revoked one-time orders cannot be reactivated by stale completion events. Event receipts are written only after fulfillment; retries use the same source key.
- Recurring refunds/disputes resolve `invoicePayments`→invoice→subscription and reconcile its current invoice. A refund on an older already-replaced period does not revoke a genuinely paid new period. Current-period refunded personal access cannot qualify for leadership reduction.
- Initial Checkout's forever coupon is removed from the subscription after the initial invoice is paid, without proration. At `invoice.created` for leadership renewal, re-read the current invoice, hold automatic finalization, capture qualifying count once, apply invoice-only discount (explicit `discounts:""` clears it), verify expected USD total, then release automatic collection. The upcoming page displays the current-count estimate.
- If the first notification arrives after an invoice is finalized, do not mutate an uneditable invoice or retry forever. Save a durable `review` audit and show the account an explicit TEST renewal-review alert. No automatic credit/refund or live billing correction is attempted. Provider outage/delayed delivery recovery must be reviewed before real billing is considered ready.

## Verification and repeatability

- `npm run typecheck`, `npm run build`, `node tests/environment-isolation.cjs`.
- `node tests/test-billing.cjs`: **real isolated Supabase** persistence with **mock Stripe API responses** and real SDK signatures. Covers four capabilities, identity/CSRF/ownership/price spoofing, invalid signature/LIVE refusal, replay, refunds including recurring, stale cancellation/expiry, invoice hold/reset/release and delayed finalization, distinct attribution, anonymous DB denial. QA-only accounts/Circles/orders/entitlements/renewal audits/events cleaned in `finally`.
- `BILLING_TEST_BASE=https://dydd-online-school-sandbox.vercel.app node tests/test-billing-browser.mjs`: actual authenticated sandbox account/browser,1280/390/320 widths, error/no-overflow checks, forged return cannot grant, missing setup503 cannot grant. It intentionally verifies the current blocked state, not a successful Stripe purchase. Removes its synthetic account/orders.
- DB SQL privilege probes verify RLS on all four new tables; anon/authenticated have no direct table/function rights, service role has needed rights. Supabase Management API advisor access was not available for this branch; SQL and actual anon REST denial were verified instead.
- Migration `20261104165449_dydd_test_billing.sql` applied only to the sandbox IPv4 pooler and recorded in its migration history. Do not apply it to production without a separate reviewed release.
- Independent security review issues addressed before release. Screenshots/receipts live in workspace `outputs/dydd-stripe-setup/`.
