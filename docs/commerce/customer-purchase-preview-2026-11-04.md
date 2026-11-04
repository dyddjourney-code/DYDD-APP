# Customer-visible purchase preview correction

Owner review is not a purchasing identity. The first contextual implementation hid every checkout CTA in preview (`canBuy` only for ready + verified), led with a technical test label and retained long empty-state copy. DesignPD independently redirected owner review to login; fresh accounts without DesignID never saw its offer. Old verification checked text presence, not useful visible actions.

The same customer offer layout now renders in owner review and genuine empty accounts:

- Base Camp Purchases: personal $10/month, verified existing FruitLife access / Circle-participation inclusions, separate add-ons stated, primary Start personal membership CTA, contextual DesignPD/Circle links.
- DesignPD: $15 per saved DesignID result, report / supporting course / reopen-download inclusions. Owner review sees the offer and Unlock CTA leading to ordinary account sign-in. A genuinely new learner sees the offer and Start DesignID prerequisite; an owned saved result retains exact-scope checkout.
- Circles: personal prerequisite, additional $20/month leadership with approved 10/$10 and 20/$0 renewal discounts, $5 once per selected couple, useful setup/prerequisite/sign-in/checkout actions in every state.

No memberships navigation. Existing API identity, email verification, origin, scope ownership, TEST catalog, sandbox-only enablement and webhook-only grants are unchanged. Preview CTAs go through ordinary login; they never supply review credentials to Stripe. `/designpd` joins existing sandbox middleware preview-cookie continuity; no production authentication change.

Checks: production build/typecheck, environment isolation, backend signed-webhook regression (mock Stripe), existing scoped-context desktop/390/320 browser tests, new account with zero saved results and zero entitlements, owner review at all three widths, ordinary sign-in destination continuity. Hosted fresh customer opens a real Stripe TEST Checkout without submitting payment; no entitlement should be granted. Evidence and receipts: `outputs/dydd-stripe-setup/customer-preview/`.

No production deployment, live billing, customer mail or report delivery. Temporary QA users/results/Circles/orders/fixtures are cleaned and sessions signed out. A created uncompleted Stripe Checkout is not a purchase.
