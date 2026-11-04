# Personal membership and Base Camp organization — 2026-11-04

Sandbox only. Continues the customer-visible purchase preview release (`98c6171`); production is untouched.

## Requested corrections

- Personal membership is $10/month, led by faith/purpose-oriented customer copy. Explicit benefits: Discover Your Divine Design (DYDD) Journey; DesignID assessment and class; FruitLife360 assessment and class; Spiritual Gifts assessment and class; Waypoints; free seats for eligible live virtual events identified as included with Personal membership. Event-listing inclusion is explicit; not all events are promised free.
- Base Camp Purchases has Personal membership only: no DesignPD upsell or explore-Circles links.
- DesignPD's optional $15 one-time offer appears inside its existing Trailheads and Field Kit sections. It describes the report and supporting class, distinguishes DesignID (included with Personal), and routes to the existing owned-result gate with exact saved DesignID snapshot and origin. Fresh customers receive the DesignID prerequisite action. No generic/unscoped checkout is introduced; no assessment/scoring/access logic is altered.
- Circles offers only Leadership ($20/month; 10 qualifying paid participants=$10, 20=$0, reviewed at renewal) and Couples ($5 one-time for selected couple). A simple Personal-membership prerequisite links directly to Base Camp Purchases. No Personal offer or checkout appears there. Existing authenticated/scope gates remain authoritative.
- Main Base Camp order: preceding profile/orientation unchanged, then Ranger Station > Purchases > Passport > Account. Blazing New Trails is the very last section, after admin-only content if present.
- Passport is default collapsed. Its visible summary identifies a milestone record, and its prominent bold notice remains outside the disclosure: “This is a record of your journey—not a way to access courses or assessments.” A native keyboard-operable button synchronizes aria-expanded/aria-controls with hidden content. Existing desktop hover/focus and mobile badge dialogs are retained.

## Scope and verification

Applied `design-taste-frontend`: existing brand retained, clear offer hierarchy, responsive single-column fallbacks, visible focus and generous button targets; no new packages or speculative feature promises. Applied `supabase` only to existing isolated synthetic authentication/fixture verification. No schema/RLS/customer-record changes.

Targeted acceptance: `tests/membership-organization-browser.mjs` verifies actual fresh signed-in and owner-preview renders at1280/390/320, full benefits, DOM/visual section order, collapsed/expanded Passport + Enter/Space, desktop badge hover/mobile badge dialogs, Circle-only offers and real prerequisite navigation, both contextual DesignPD placements, no overflow/errors, zero checkout POSTs. Fresh account must remain without results/entitlements. `tests/contextual-purchases-browser.mjs` additionally checks exact historical DesignID/Couple payloads via transport interception, anonymous401/foreign403, forged-return denial, and cleanup.

Final publication receipt and screenshots: `outputs/dydd-stripe-setup/membership-organization/STATUS.md` in the shared workspace. Local production server is started with `DYDD_BILLING_MODE=test` to match the sandbox runtime; local Node fetches need `NO_PROXY=localhost,127.0.0.1` in the protected proxy environment. No payment/email is part of this release verification.
