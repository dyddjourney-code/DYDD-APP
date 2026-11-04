# Sandbox Base Camp cleanup — November 4, 2026

Sandbox-only UI pass on top of email release `591272a`. No production source,
deployment, environment or database configuration changes. No outbound mail,
owner account reset or password changes. Existing unrelated circles evidence
edits were left uncommitted and untouched.

## Changes

- The standard Base Camp begins with the existing cabin image. Small white
  branding and “On purpose. For purpose.” are top-left; the existing sign-out
  form is top-right, and the personalized welcome remains on the image.
- Ranger Station is a compact left-hand “Next” card; the editable profile sits
  alongside it on desktop. Both stack on narrow screens. Full Circle profile
  views retain their existing layout; only Base Camp opts into compact styling.
- Removed the standard dashboard's entire three-slide “What is DYDD” carousel.
- Purchases has one heading and a compact two-column membership card, stacking
  naturally on mobile. Removed the extra introduction, public Personal promo
  input/code/discount copy, preview checkout sign-in explanation and redundant
  personal test-payments footer. Global sandbox identification stays intact.
- The existing signed-in verified-account checkout button, authentication,
  subscription management, beta redemption, Passport, navigation and admin
  functionality remain. Pricing, redemption backend and billing isolation are
  unchanged. A removed public promo is not a removed backend redemption rule.
- Account details is a compact name/email row. Fixed an existing owner-only
  admin-panel minimum-content overflow revealed by testing the real account.

## Verification and delivery evidence

- `npm run typecheck` and optimized `npm run build`.
- Genuine existing sandbox owner account authenticated using safely stored
  access, without password/reset changes or consuming the emailed access link.
- Chromium viewport checks at 1440, 1280, 768, 390 and 320px: hierarchy, header
  position, desktop Ranger/profile placement, mobile stacking, no horizontal
  overflow, removed copy absent, edit-profile open/cancel and Ranger navigation.
- Focused actual Personal checkout handler/real isolated sandbox DB contract:
  verified identity, anonymous/cross-origin denial, no trusted client pricing,
  lifetime protection, regular price and unchanged Personal-only discount.
  Stripe transport mocked: no charge or provider purchase completed. Synthetic
  contract fixtures removed. The older broad billing suite fails at its
  unrelated Circle creation fixture because current DB requires a verified
  Circle unlock; no Circle billing behavior was changed for this UI task.
- Local and published browser receipts/screenshots, build logs, actual checkout
  handoff proof and exact Vercel deployment receipts are recorded under
  `tmp/basecamp-cleanup/` and the workspace output handoff directory. Private
  browser session state is excluded from the deliverable and Git.
- Deploy only with `scripts/deploy-sandbox.mjs` after pushing `sandbox`.
  Its guarded alias repair proves both sandbox entry addresses resolve to the
  current exact READY sandbox project/SHA and production remains unchanged.

Review URL: https://dydd-online-school-sandbox.vercel.app/hq

Viewport-emulated Chromium, not a physical iOS/Safari test. The actual sandbox
Stripe handoff check is reported separately from any paid-access/payment proof.
