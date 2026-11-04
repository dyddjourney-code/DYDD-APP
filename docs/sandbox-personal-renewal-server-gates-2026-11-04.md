# Sandbox personal membership renewal: server boundaries

Scope: only this sandbox checkout. No production/shared repo, deployment, migrations or commits.

## Existing evidence reused

`dydd_test_billing_entitlements` and existing orders remain the commercial source;
`paid_through` is the already-installed paid-history boundary. `dydd_personal_access`
remains the lifetime override. No assessment, workbook, identity or Circle records
are changed by account-access checks or the renewal page.

The state resolver distinguishes `active`, `expired`, `lifetime`, and `untracked`.
The task is an expiry boundary: existing sandbox accounts with no personal billing
ledger remain **untracked**, preserving prior access rather than retroactively
classifying legacy/free fixtures as expired. Unknown/failed storage does not grant
access. Active requires active+paid and both verified boundaries strictly after
now. Revoked or missing orders cannot authorize even with a stale active row.

## Gates

- DesignID page and submit action.
- Journey page and legacy workbook action.
- DesignID and Fruitful Life supporting courses through the existing assessment
  gate. Standalone lesson URLs already redirect to that secured canonical route.
- Course progress and reflection writes return 402 with `renewalUrl`; existing
  history reads/exports remain available.
- Fruitful Life new-session page/action; old valid participant self links and
  direct self submissions. A separately paid standalone session remains usable.
  Observer participation and completed status/report history are not revoked.
- Waypoints page and queued delivery worker. Expired jobs are skipped without
  deleting subscription/history; renewal allows future releases. Lookup failures
  fail closed and retry as errors.
- Signed-out sandbox Journey/Waypoints require sign-in; credential-validated
  owner/new preview remains available through the existing preview checks.

Separate DesignPD supporting courses/reports, Couples Circle records, free
Spiritual Gifts, independently purchased report downloads, and saved workbook/progress history retain
existing object authorization. Membership is not a replacement for ownership,
assessment eligibility, privacy or Circle billing checks.

## Renewal identity

Password, code verification, PKCE callback and one-time token confirmation all
resolve successful sign-in using the verified authenticated user. Expired default
and membership-backed destinations route to `/renew?next=...`. Recovery, history,
free content and separately bought DesignPD/Couple destinations retain their exact
safe local target. No user ID/email is accepted from the renewal URL.

`/renew` is sandbox TEST-only and requires the existing signed-in account. It
shows that identity and preservation message, and reuses existing checkout and
subscription controls. New checkout is allowed only where the existing checkout
route permits; no unavailable portal or payment-method recovery is promised. Active/lifetime
identities return to the safe original target. Checkout still returns to the
existing `/hq#purchases` flow; it does not directly grant access or reset history.

## Verification

- `node tests/personal-membership-access.cjs`: deterministic exclusive boundary,
  failure/refund/revoked evidence, server direct course/write denials, self-token
  bypass, purchased/free/history exceptions, all four sign-in paths, renewal page
  identity, safe return targets, lifetime/admin/verified previews, production no-op.
- `node tests/personal-waypoint-expiry.cjs`: expired deliveries skip before payload
  or provider requests; subscription remains; lookup failure retries fail closed.
- `node tests/personal-membership-access-sandbox.cjs`: real isolated sandbox DB,
  disposable users/orders/snapshots/progress; expiry, failed unpaid future invoice,
  same-order same-user renewal, exact assessment/progress history retention,
  separate DesignPD purchase preservation, foreign identity and revoked-order
  denial. Finally cleanup deletes all fixtures; no Stripe/email requests.

No hosted/browser/deployment claim is made by this server-only workstream.

Existing course/reflection eligibility, DesignID email report access, DesignPD
course and artifact lifecycle, and Fruitful Life email-policy regressions passed.
TypeScript `npx tsc --noEmit` and `git diff --check` passed after implementation.

Known pre-existing regression: `tests/designid-owner-preview-access.cjs` expects
`/trailheads` for an incomplete Spiritual Gifts course, while the current canonical
route is `/field-kit#collection-spiritual-gifts`. Confirmed the identical failure
using `HEAD:lib/trails/course-access.ts` in memory; this change does not alter that
origin. The new focused suite independently verifies valid owner/new preview keys
continue bypassing commercial course checks.
