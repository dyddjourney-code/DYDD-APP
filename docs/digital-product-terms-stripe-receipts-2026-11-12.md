# Digital product disclosures and provider receipts (2026-11-12)

Production target: `dydd-online-school.vercel.app` only; standalone DesignID/DesignPD and app sign-in/terms. No main website publishing.

- Prepayment wording: **Digital assessment/report. All sales are final; no refunds except as required by law.** Shown before initial guest purchase, optional DesignPD purchase, guest checkout resume, and account report purchase. Also near sign-in.
- Bottom: **Technical trouble? Email support@discoverdivine.design.** **© 2026 Discover Your Divine Design. For personal use only. No unauthorized copying or distribution.** Current year rendered at runtime. Focused assessment lane retains its otherwise minimal footer; no app/course promotion added.
- Support is existing owner-approved alias from `memory/2026-09-17.md` line 17 (confirmed forwarding then); no mailbox routing/send tests or new forwarding promises. Contact queue and application email From/Reply-To remain untouched.
- New guest/account Stripe Checkout sessions display concise equivalent custom submit text, no checkbox or new consent claim. PaymentIntent `receipt_email` explicitly uses the same stored participant / verified account email already provided as Checkout `customer_email`. Existing sessions/orders/metadata/idempotency, payment checks, fulfillment and pricing preserved.
- Stripe account `acct_1QyaOOABW64O7Vgm` Customer emails Successful payments was OFF; switched ON through existing authenticated Chrome and verified checked after navigating afresh. No owner dashboard step remains. Refunds/security/mandate settings unchanged. Provider receipts are not duplicated by app email. Stripe's existing receipt reply destination is `john@the4dlens.com`, unchanged (separate from the app support alias).
- Current live Stripe secret is sensitive/write-only via Vercel; old export had placeholder values. This is not a disconnected provider. Used dashboard verification; no key replacement, API permission or secret changes.
- No charges, refunds, retroactive receipt sends, customer messages, session revocation, data migration, scoring, codes, pricing, schedules, availability/env edits, or main site changes. Future receipt inbox delivery requires a future genuine purchase; no such test initiated.

Evidence: `outputs/dydd-digital-terms-stripe-receipts-2026-11-12/` (handoff, build, setting proof, screenshots, release identity). Rollback application through previous exact production SHA `452bd7662b8b7039220d228da1a31e8f15f7e245`; preserve receipt setting unless owner explicitly requests otherwise.
