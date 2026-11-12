# DYDD guest cleanup — November 12, 2026

## Authorized scope and preserved contracts

Standalone DesignID / derived DesignPD, free group/coupon access without signup, free public Spiritual Gifts provenance and secure later verified-account linkage. No marketing campaigns, drips, arbitrary-recipient tests, new real charges, score recalculation or duplicate original PDF/order creation.

Canonical engines, approved report narratives/templates and native app generation remain unchanged. Guest compact layout is fulfillment-scoped. Original John session has exactly two original paid orders/results; source relationship, saved scores, provider document IDs, original PDF paths/bytes and timestamps are preserved. No snapshots are duplicated to make guest results visible.

## Delivered behavior

- Concise branded purchase/start pages; private reports no longer carry prices/school/membership sales copy. Primary product-specific PDF actions; newest paid product or exact owned email report gets first position.
- Compact guest questionnaire; step changes focus/scroll the questionnaire rather than repeated site header. Existing 80 allocation answers + 12-item sort remain unchanged.
- Paid DesignPD starts the existing idempotent preparation action once per tab/order when exact saved DesignID source is paid; explicit fallback remains if tab storage or preparation is unavailable. No scoring runs on a GET.
- Emails include the validated exact original private PDF attachment plus a report-focused private access link. Explicit resend is a separate durable intent: two-minute cooldown, three per 24 hours, ambiguous pending intent reuse, accepted-worker reconciliation, exact existing archive only. Original send snapshots remain immutable.
- New guest Checkout explicitly uses `payment_method_types: ['card']`. Link and bank-payment options are not requested. Eligible Apple Pay/Google Pay card wallets are not suppressed; actual eligibility and issuer authentication remain provider/device/issuer controlled.
- Individual guest session capability plus a verified, nonanonymous Auth account is required for explicit immutable account linkage, with independent atomic DB validation and retained original contact/account audit. No typed-email claim. Connected reports: `/assessments/account`.
- Public Gifts no longer assigns an account from a typed email. Exact Gifts session capability plus verified account is required for explicit linkage. Public/new and historical session provenance is filtered from legacy participant-email access, including learner Field Kit loaders and direct artifact reads. New restrictive RLS preserves native policies while denying participant-only public Gifts reads. Linked/latest results are merged chronologically without rewriting snapshots.
- Protected actual owner Command Center overlays every saved guest result and existing public Gifts scores/contact/source/payment/coupon provenance. Existing original rows are used directly, without generating a second report. A legacy owner test-contact exclusion required a dedicated protected-owner fix so John's actual paid results remain visible while his native test results stay hidden.

## Free group / coupon access

In the actual protected owner Command Center, select **Free group & coupon access** (`/owner/guest-access`). Supply the real name, included products, future UTC expiration and enrollment limit; coupon links also require a provenance code. No groups, names or quotas are pre-seeded.

The one-time displayed link points to the public app. Share it with intended participants. Participants enter their name/report email, no password or app signup, and receive their own individual private report link. The reusable group token is never inserted into reports, score payloads or participant report emails. Limits/expiry stop new enrollment; explicit revocation disables granted rights but retains historical records. Enrolled private-session proof can restore included DesignPD in a new browser without the reusable group token. DesignPD always uses that individual's exact saved DesignID; six-calendar-month DesignID timing and existing unresolved-purchase protection remain enforced.

## Additive production migrations

- `20261112000300_guest_email_resends`
- `20261112142808_guest_group_access`
- `20261112142809_secure_guest_account_linking`
- `20261112143754_secure_public_gifts_account_linking`

Each was rehearsed with actual-hosted rollback-only synthetic fixtures before application and history registration. No real groups or account links were auto-seeded. Auth account count and existing source records remain unchanged. See global evidence migration receipts for exact hashes and role/denial tests. Group RPC changes affect guest functions only; the shared native provider-mode fence is unchanged.

## Acceptance evidence

Evidence directory: `/home/openclaw/.openclaw/workspace/outputs/dydd-guest-cleanup-2026-11-12/`.

- Actual local guest report pages at 1440/1024/768/390/320: latest PD first, exact ID email focus, prominent downloads, no owned pricing/school copy or horizontal overflow, fresh-context denial; both original PDFs fetched and checked by exact byte count/hash.
- Actual real questionnaire controls desktop + touch/mobile: every 20 allocation sets, 12-item sort, review, missing/under/over rejection, keyboard/drag/drop/tap, Back/Next persistence, 92 captured fields / 100 points. Non-delivering temporary route was removed before production build. Desktop Next controls stay visible after step changes.
- Two authorized John-only genuine new report email copies accepted by provider, each with one exact original PDF attachment (4,859,095 and 6,138,644 bytes) and product-focused link. Persisted immutable outbox attachment counts/lengths verified. Provider delivery retrieval is 403 with send-only key; human inbox receipt is not independently claimed.
- Isolated PostgreSQL plus hosted rollback fixtures: claim denial/expiry/reassignment/ACL/audits, free/coupon provenance, exact-source PD, concurrency/capacity, expiry/revocation, immutable scoring, bounded resend and worker reconciliation.
- Independent final security review found return-contract union typing and merged-latest ordering defects; both corrected. Full project typecheck and a new merged learner chronology regression verify closure.
- Broader legacy sweep initially had 57 passes / 2 stale baseline harness failures: `designid-maps-confirmation.cjs` lacks project alias/JSON standalone compiler settings; `designpd-report-state.cjs` mocks an older pre-extraction unverified native action contract. Their production scoring/action files are unchanged. Current native recovery/artifact/scoring/guest/security contracts are tracked separately; do not report that broad old sweep as wholly green.

## Deployment and boundaries

Public app canonical: `https://dydd-online-school.vercel.app` (final exact deployment receipt in evidence).
Actual owner canonical: `https://dydd-private-owner-console.vercel.app`, owner SHA `f33fc6ff75d51499da34933b7945259eb349ef45`, deployment `dpl_GoZLTqd4332kuwemJSzarTobF2xj`, READY exact alias/project. ALL-deployment Vercel Authentication and zero bypass grants preserved. Local actual-production-data owner UI/PDF/navigation checks pass; authenticated hosted browser not claimed because platform auth was not bypassed.

Public app `/command-center` remains intentionally unavailable; the real protected owner project was deployed separately. Four refreshed Squarespace blocks are prepared under `website-DRAFT-NOT-PUBLISHED/`; **Squarespace itself was not changed**. No marketing automation or outreach enabled. Secret-bearing individual access URLs remain only in protected local storage/private email, not this document.
