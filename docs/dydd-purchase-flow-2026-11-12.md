# Guest purchase-flow correction — November 12, 2026

Authorized scope: public assessment app release, four unpublished website-block drafts, one future abandoned-checkout message, and secure returning-customer access. No domain/DNS/Squarespace publication, new agent payments, PDF generation or real verification emails.

## Customer flow

- Guest purchase and private assessment pages have a non-navigating DYDD logo; private header adds only the welcome name. No Journey/header/footer links, private-link callout, account promotion or optional Gifts invitation during pending checkout or an unfinished paid assessment.
- Saved reports/downloads/resend remain primary. Optional app invitation follows the report tools only when there is no unfinished purchase/assessment. Explicit verified-account linking remains unchanged.
- DesignPD **Purchase now** and **Explore** are separate actions. Explore goes to the existing website `/designpd`, in a safe new tab. Spiritual Gifts informational links use the verified HTTP200 `/reflections-gifts` overview, not the assessment. The free assessment still has its separately labeled Start action.
- The four prepared website block drafts now open purchase links with `target="_blank" rel="noopener noreferrer"`. They have NOT been published to Squarespace.

## Stripe Back / resume

A pending purchase now has **Resume secure checkout / check payment**. Server action first verifies the exact private session and original order. Open Stripe Checkout is reused; complete/paid Checkout is independently fulfilled through the existing exact payment-intent/charge verifier; processing status explicitly blocks another payment. Only an expired **unpaid** session can be replaced, preserving the same order with a deterministic provider idempotency key and conditional reference update. DesignPD requires the exact still-entitled original DesignID source.

New sessions request card-only payment and `wallet_options.link.display='never'`. This controls optional Link payment/promotion in our Checkout creation. It does not disable required Stripe/issuer security, Link-account verification or provider-controlled receipt emails. Previously read actual historical sessions offered Link and other methods; their original paid evidence is unchanged. Production sensitive key metadata is configured but does not export plaintext; no new live Checkout was created for this release's verification.

Email recovery can rotate the session capability. If a previously open Checkout returns its old URL, `/assessments/recover` can continue **only** using the browser's separately verified same-session current cookie. The revoked URL token alone remains denied.

## Returning after a month

Public DesignID/DesignPD entry validates existing current/session capability cookies before showing a private continuation. Fresh browsers request a generic secure recovery email; typed email never yields reports, private IDs or direct access. Existing account buyers retain the explicit sign-in path. Recovery selects the latest exact completed guest DesignID ahead of newer unfinished checkouts.

Recovery uses keyed email/requester hashes, 15-minute cooldown, three intents/email/day and ten/requester/hour; a 30-minute one-time proof; scanner-safe confirmation GET; same-origin POST; atomic session-capability rotation. Requesting alone changes no existing access. Confirming intentionally replaces older session links. Original orders, scores, PDFs, contacts and account ownership remain intact.

Recovery service messages use the existing durable lifecycle outbox/app-mail fences and the narrow authenticated `/api/cron/guest-recovery` every five minutes. Broad lifecycle campaign automation remains disabled. Send-time and final pre-provider eligibility deny used, expired, mismatched, revoked or invalidated recovery links. This is requested access recovery, not a second abandonment sequence.

## One abandoned-checkout email

New pending paid-order intents only: database trigger, one immutable queue row/order; registration requires the verified private capability and persisted Checkout linkage. No historical backfill. Due +1 hour, scanned every five minutes; absolute cutoff +24 hours. Paid/completed, resumed, invalid/changed capability, free/group access, provider-completed, expired or suppressed recipients do not send. Atomic SKIP LOCKED claims/final fence, compare-and-set leases, maximum eight attempts, provider idempotency and a 23-hour ambiguous-acceptance ceiling prevent a repeat sequence or duplicate concurrent mail. Existing schedules are preserved. Optional reminder storage failure cannot strand valid paid report access; a later visit retries the marker. A transient failed marker can leave a reminder eligible after storage recovers; no guarantee of external-email cancellation after submission is made.

Personalized message (product substitutes DesignID/DesignPD):

> Subject: {First name}, your DesignPD checkout is still here
>
> Hi {First name},
>
> You started your DesignPD checkout but haven’t finished. If you’d like to continue, your private link is below.
>
> Resume your DesignPD checkout [secure private URL]
>
> Designed on purpose, for purpose. You are God’s workmanship, created for good works He prepared for you to walk in. — Inspired by Ephesians 2:10
>
> No pressure—this is your only checkout reminder. If you’ve already continued, you can disregard it.

Existing sender/contact footer, suppression and provider telemetry remain. Provider acceptance and human inbox receipt are separate facts. A narrow unavoidable race remains if someone pays/resumes after final eligibility but before external submission; that can yield one already-in-flight reminder, never a new charge or sequence.

## Production migrations

Additive migrations `20261112155246_guest_checkout_reminder` and `20261112155301_guest_returning_recovery` applied and registered against school project `laojrzlqbkmirzcbcnyw`. Service-only tables/RPCs, RLS, invoker functions and empty search_path; no account schema or scoring changes. At verification: four original orders, two guest sessions, three original results; both new queues empty. Full private table fingerprints are retained in sanitized output evidence.

## Verification and limits

- Final focused combined suite: 56/56 PASS; includes resume/open/expired/paid/processing/foreign/concurrent cases, reminder delivery guards, recovery delivery/dedupe/final redemption race, guest reports/resend/account security and allocation/derived-score preservation.
- Canonical allocation verification: 80 approved statements, 40 legal patterns, 130,931 DesignPD score vectors; historical private-workbook fixture count is zero. No new historical-source parity claim.
- Real PostgreSQL isolated reminder timing/8-way concurrency/ACL checks PASS. Actual production recovery security/source/timing fixtures were transactional and fully rolled back, with no real mail jobs.
- Actual async components at 1280/390/320: nine private pending/assessment/results states and six public purchase/recovery states; no header/footer navigation or horizontal overflow. Browser transports blocked; real controls and saved-data fixtures distinguished from real provider operations. Representative screenshots visually inspected.
- Actual optimized Next server public purchase pages: six desktop/mobile states PASS with real assets/fonts and all non-GET browser requests blocked. Actual local Next + original authorized paid guest data: both saved report controls, existing-capability return through public DesignPD, no bearer in continuation, and fresh-browser denial PASS. No real account claim, payment, PDF or email.
- Two pre-existing broad harness failures remain outside this change: `designid-maps-confirmation.cjs` standalone report TypeScript compilation and `designid-research-retakes.cjs` standalone mail alias resolution. Relevant instrument/report/mail source files are unchanged. The latter passes its six-calendar-month/leap/end-month assertions before the unrelated mail-load failure. Do not call the historical broad sweep wholly green.
- Production release/alias and hosted read-only acceptance are recorded separately in `purchase-deployment-ready.json` and `purchase-hosted.json` under `outputs/dydd-guest-cleanup-2026-11-12/`. No real hosted payment, email delivery or PDF generation was repeated.

## Safe owner retest

1. Fresh private browser: public DesignPD entry. Use the existing private report email link or request recovery to the **known inbox you own**; do not guess the transcribed address. Typed email must show only generic feedback. Confirm the one-time email link; original DesignID/report should return, without retaking it.
2. If DesignPD is not already purchased, choose **Purchase DesignPD now** and confirm $19.99 at Stripe. For no-charge UI testing, leave before paying; Back/cancel returns to a clear pending purchase. Resume must reopen the same active checkout; do not pay repeatedly. Expired unpaid replacement is covered by synthetic provider tests.
3. Paid returning users should see their original report controls and resend first; no new questionnaire for DesignPD. Account linking stays optional and explicit.
4. Informational Explore DesignPD and Gifts open their actual website overviews separately. Website-block purchase new-tab behavior is draft-only until authorized Squarespace publication.
5. To observe the future reminder, only if desired, personally begin a genuinely new purchase intent using an inbox you control, then leave Stripe without returning/resuming. Expect at most one product-specific email around 60–65 minutes. Returning/resuming or paying suppresses it. The agent has not initiated such a real test.
