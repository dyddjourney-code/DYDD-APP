# Sandbox Base Camp account billing — November 4, 2026

## Approved account policy

Account details places compact name/email on the left and authenticated purchases,
scoped purchase history and subscription status on the right (single column on
phones). No account deletion or result reset is associated with cancellation.

Personal cancellation changes only the authenticated account's exact Personal
Stripe TEST subscription to `cancel_at_period_end`, without proration. Circle
Leadership and organization subscriptions are not canceled by this operation.
The confirmation explains no further renewals, access until the verified paid
boundary, downloading reports before expiry, retained records, and renewing with
the same account. Native modal semantics, initial safe-button focus, Escape,
focus return and explicit confirmation are preserved. Restore renewal acts on
that same existing subscription while it is still resumable.

Next billing comes from Stripe's actual subscription item `current_period_end`;
paid-through comes from the existing payment-verified fulfillment ledger. No
calendar-month arithmetic grants access or invents dates. Missing paid evidence
cannot schedule a purported paid-through cancellation. After mutation, existing
fulfillment re-fetches Stripe/payment evidence and the response reads the newly
reconciled boundary. Request UUID supplies Stripe idempotency; trusted ownership,
app, TEST mode, scope and fixed price are revalidated.

## Expiry and renewal

The exclusive current paid-through boundary is enforced server-side for already
billing-tracked members. Paid membership-backed Journey, DesignID, Fruitful Life
and Waypoints content/direct write APIs and member report downloads require
renewal after expiry. Old self-assessment tokens do not bypass expiration.
Password/OTP/link sign-in routes an expired member to `/renew`, preserving the
original safe return target and existing authenticated identity. Renewal does
not recreate a user, reset assessments, clear workbook/progress or unlink history.

Existing free Spiritual Gifts, lifetime grants, authorized owner previews and
untracked legacy behavior are unchanged. Separately bought DesignPD, Couples
Circle records and purchased standalone Fruitful Life sessions/reports retain
their existing object-scoped entitlement and Circle operating rules. Account
history/Field Kit records remain retained; saved-record retention is not a grant
to operate a paid Circle after its required memberships expire. Scheduled
Waypoints exclude expired personal members, including previously queued work.

## Isolation and repeatable verification

Only sandbox branch/project, isolated `atemrshtshxoqnuevvqu` and Stripe TEST
billing are enabled. Production/master/database, organization subscriptions,
shared report providers, pricing/catalog and email provider configuration were
not changed. This builds on and preserves `ed81e70`, `836e349` and `591272a`.

Focused tests:

- `node tests/account-purchases.cjs`
- `node tests/account-subscription-boundaries.cjs`
- `node tests/account-artifact-expiry.cjs`
- `node tests/personal-membership-access.cjs`
- `node tests/personal-membership-access-sandbox.cjs` (real isolated DB; cleanup)
- `node tests/personal-waypoint-expiry.cjs`
- `node tests/circle-subscription-controls.cjs`
- `node tests/environment-isolation.cjs`
- `ACCOUNT_BILLING_BASE=https://dydd-online-school-sandbox.vercel.app node tests/account-billing-hosted.mjs` (real HTTP/browser, disposable DB fixtures, no Stripe/email)
- `npm run typecheck`, `npm run build`

The workspace release folder `outputs/account-billing-cleanup-2026-11-04/`
contains deployment/cleanup receipts, genuine owner desktop/mobile screenshots,
native-modal keyboard proof, expiry/renewal screenshots and exact tested paths.
Provider lifecycle verification is reported separately from transport fixtures.
The unavailable Stripe billing portal is not promised or retried.
