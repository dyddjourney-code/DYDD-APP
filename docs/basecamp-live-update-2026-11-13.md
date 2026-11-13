# Live Base Camp presentation and Personal cancellation readiness — 2026-11-13

Authorized scope: update standard LIVE Base Camp to the maintained sandbox layout,
excluding all Circles modifications. Fresh actual production alias independently
verified at `48d03fd9d617243cab5405c508d1382d4cd4fb98`, production project
`prj_YO15mYTp64EHk0wlg6QmBTxNeV5k`, before editing. Sandbox `fa9665c` was a
presentation reference, never wholesale deployed.

## Presentation

- Existing cabin image first, compact white branding/purpose/sign-out, personalized
  welcome. Protected owner-console link remains exact-owner-only.
- Compact Ranger “Next” beside opt-in compact editable profile; narrow stacking.
  Shared Circle profile rendering is unchanged unless compact is explicitly set.
- Standard Base Camp orientation carousel removed; underlying component untouched.
- Purchases before whole-book Passport, initially closed, accessible open/close.
  Existing individual badge interactions and milestones retained.
- Compact identity beside actual purchase records, On the Horizon last.
- Account-bound standalone report history reads direct account orders and immutable
  guest-account links. Never email-match guest purchases, never expose contact or
  payment identifiers, exclude TEST records, no new ownership/entitlement writes.
- Newer live Fruitful Life, legal, guest purchase/recovery/receipt, native timing,
  beta redemption, admin/auth boundaries and all Circles routes/data remain.

## Genuine Personal subscription contract

`getPersonalSubscription` is server-only. Configuration must explicitly provide
production mode, a LIVE `STRIPE_SECRET_KEY`, `STRIPE_PERSONAL_PRICE_ID`, and
`STRIPE_PERSONAL_PRODUCT_ID`. Exact catalog validation requires live, active USD
1000/month licensed quantity-one product and price, `app=dydd` and
`capability=personal` metadata. Subscription must have identical fixed product /
price and metadata `app=dydd, capability=personal, user_id=<verified auth UUID>`;
its actual customer must independently have `app=dydd, user_id=<same UUID>`.
No email-only ownership, multi-item subscriptions, schedules, alternative prices,
TEST objects, or Circle capability can pass. Search is discovery only: retrieve
and reverify before every mutation. Multiple candidates fail closed.

Paid boundary comes from the actual paid invoice line's exact matching current
item period, using installed Stripe22 `line.parent.subscription_item_details`.
Do not add a month, assume access from catalog price, or invent billing dates.
Current verified subscribers see “Current subscription”, $10/month, actual next
billing date and verified paid-through timestamp in UTC.

Unsubscribe opens a native modal, not an immediate request. The explicit
“Yes, unsubscribe” submits same-origin JSON to the authenticated cancellation
endpoint. Confirmed, non-anonymous session required; no client-selected user /
subscription / customer / price. Current paid boundary is part of confirmation;
stale confirmations reject. Provider request only sets `cancel_at_period_end`;
deterministic user/subscription/period idempotency prevents duplicate effects.
Repeated cancellation re-reads provider state and does not recreate a mutation.
No immediate cancel, delete, refund, charge or entitlement revocation.

Policy: retain paid access to exact verified boundary; recommend downloads before
expiry; retain account/results/reports/workbook/progress/purchases. Separate Circle
billing, organization billing, standalone reports, lifetime grants and free tools
keep independent rules. Renewal links preserve the same identity. `/renew` checks
real auth and presents the existing beta/lifetime access instead of creating a
replacement account or charging for access already included in this LIVE beta.

## Important activation boundary (not a completed LIVE cancellation claim)

Production currently has **no Personal product/price configuration keys**. Its
existing sensitive LIVE payment key is not exported by Vercel. The inherited
protected Stripe key successfully reads TEST objects only (`livemode:false`);
legacy local key probe returns401. TEST Personal subscriptions cannot be promoted
or represented as LIVE memberships. No live catalog or subscription was created,
charged, changed or canceled. No customer cancellation was attempted.

Consequently genuine paid billing currently fails closed, and beta/lifetime
members retain their normal access card. Cancellation implementation is ready
for a positively configured/owned LIVE Personal subscription, but activation and
real LIVE provider acceptance are **not verified**. Existing one-time production
assessment billing is unchanged. Do not enable a paid membership checkout or
expiry gate merely to make a visual subscription card appear.

## Verification

- Full TypeScript and optimized production webpack build (local node_modules is
  an existing external symlink; default Turbopack rejects that local layout).
- Isolated provider/route tests cover catalog/mode/customer/subscription ownership,
  foreign/Circle/ambiguous denial, actual paid boundary, stale confirmation,
  same-origin CSRF, verified auth, no client identity and provider idempotency.
- Account-history privacy/error fixtures, Passport milestones and owner-boundary
  fixtures; beta boundaries, guest checkout/resume/recovery and Fruitful completion.
- Portable Chromium renders shared source/CSS in a temporary isolated UI harness
  at1280/768/390/320: no overflow, loaded cabin, compact layout/stacking, orientation
  absent, initially closed Passport and keyboard open/close. Native cancellation
  modal focus/Escape, no request on open/dismiss, explicit confirmation, isolated
  provider failure/retry/success and preserved boundary; no JS errors.
- Mock paid member UI is explicitly hypothetical; no real subscription was used.
  Temporary harness moved outside `app/` before the release build.
- Production REST availability reads200 for the three existing purchase/link
  tables. No schema, account, data, email or fixture writes were required.
- Managed Chrome cannot launch; portable Chromium hosted login navigation also
  times out after30seconds through the authenticated proxy. Local rendered
  evidence is not an authenticated hosted-user click acceptance claim.

Deploy only exact reviewed HEAD pushed to `origin/master`, with repo-local author
John Willoughby / dyddjourney@gmail.com and guarded `scripts/deploy-production-beta.mjs`.
Independently verify canonical `app.discoverdivine.design` and legacy alias SHA,
project and READY state. Final release identifiers live in the workspace handoff.
