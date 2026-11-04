# Approved sandbox purchase placement — 2026-11-04

Purchases belong in the existing workspace, never a new top-level Memberships tab:

- Base Camp (`/hq#purchases`, reached through `/base-camp`): personal $10/month and current lifetime/paid access.
- DesignPD (`/designpd?snapshot=<saved-DesignID-id>`): direct $15 checkout for that exact owned historical or latest result, in the existing unlock spot. Checkout buttons must be `type="button"` because this spot lives inside the assessment form.
- Camp Circles overview: pricing and prerequisites. My Circles selected saved draft: $5 one-time Couples unlock for that owned Circle, or additional $20/month leadership for Small Group/Class. Personal membership remains separate; leadership is $10 at 10 qualifying paid participants and $0 at 20, rechecked at renewal.

The old `/memberships` route is a compatibility redirect to Base Camp purchases, including old Stripe return URLs. No sidebar/mobile/banner membership navigation should be reintroduced. New Stripe sessions use server-selected contextual success/cancel paths; the browser never supplies an arbitrary return destination.

## Cause of the inaccessible tab

The added sidebar/banner linked to a strictly authenticated `/memberships` page. The sandbox's existing read-only owner review is not a Supabase purchasing identity, and `/memberships` was not a review-aware preview route. So owner-preview navigation hit login instead of a usable purchasing context. The solution preserves real account authentication and moves price visibility/actions to the agreed existing areas, with explicit sign-in messaging in preview.

## Safeguards

`test-purchase-options` requires the authenticated server identity. Optional Circle scope is validated against that user's nonarchived saved Circles before access is returned. Preview prices are read-only; no review credential is sent to Stripe. Existing checkout verifies confirmed identity, same origin, fixed TEST catalog, ownership, active/lifetime grants, personal prerequisite and sandbox DB isolation. Webhooks alone grant access. DesignID scoring/report prerequisites and Circle data roles are unchanged.

## Verification

- `node tests/test-billing.cjs`: real isolated DB, mocked Stripe SDK responses, signed webhook authorization/scoping/return-path/fulfillment/refund/renewal regressions. Not a real purchase.
- `node tests/contextual-purchases-browser.mjs`: authenticated desktop/390/320 layouts, exact historical DesignID and selected Couple payloads, no new tab, read-only preview, anonymous401/foreign Circle403 and forged return denied. Browser POST transport intercepted; synthetic access fixture is not payment.
- `node tests/environment-isolation.cjs`, production build and diff checks.

Previous runtime proof (`outputs/dydd-stripe-setup/RUNTIME-STATUS.md`) verified two actual hosted Stripe TEST purchases ($10 personal and $5 Couples), automatic webhook fulfillment, and sensitive Vercel runtime credentials. This UX change does not claim a new actual purchase, or provider-tested Leadership/DesignPD purchases. Production and live billing remain untouched.
