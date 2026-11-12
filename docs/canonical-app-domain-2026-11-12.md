# DYDD canonical app domain — 2026-11-12

Target: **https://app.discoverdivine.design**. `https://www.discoverdivine.design` and root stay marketing on Squarespace. The earlier school/academy/learn note was a recommendation, not an implemented approval; latest instruction requests the simplest app address.

## Current release / preparation

Production baseline: `50752dad993259460811d5b2b05865dfe1882723`, READY `dpl_3JBM53eDsp93oEuzkJTZmsziB1dR`, project `prj_YO15mYTp64EHk0wlg6QmBTxNeV5k`, master. Existing app alias remains fully supported.

All executable app-origin fallback constants are centralized in `lib/app-origin.ts`; the configured `DYDD_APP_URL` remains authoritative, so code preparation does not activate an unverified domain. New queued delivery validation accepts only the exact active origin, plus the exact old public app origin when production is explicitly on the new canonical. It preserves queued immutable payload/idempotency keys, and all existing capability/recipient/expiry/archive/paid-order checks. Sandbox cannot inherit production legacy permission.

## Provider state / actual blocker

- Added `app.discoverdivine.design` to the existing Vercel production project; ownership verified.
- Added exact app origin, `/auth/callback`, `/**` to existing Supabase redirect allowlist, preserving all old and local callback entries. Auth `site_url` remains old until TLS is verified. No email templates or SMTP changed.
- Squarespace authenticated browser can read authoritative zone, including root/www/Google Workspace/Resend records. DNS add triggers **Verify to continue as the4dlens@gmail.com / Login with Google to continue**. Continue did not complete verification. Domain registrar label Network Solutions does NOT mean DNS must be edited there: actual authoritative records are NS1/Squarespace.
- DNS is NOT changed. Do not call the new hostname live: wildcard `* A 66.81.203.198` currently catches it.
- Needed single new custom record: **CNAME `app` → `a1a1e1dd32e7d92c.vercel-dns-017.com`** (Vercel project-specific recommendation at preparation). Re-read Vercel config at activation. Keep all presets, wildcard, root/www and mail untouched. Use minimum available TTL.

## Activation after browser Google verification

1. Existing browser tab `t36`: https://account.squarespace.com/domains/linked/discoverdivine.design/dns/dns-settings . Complete Google verification; add only CNAME above. Capture final DNS table and compare all prior records unchanged.
2. Verify authoritative and public CNAME, Vercel `misconfigured:false`, valid public TLS and GET `/login`, `/assessments/designid?guest=1`, `/assessments/designpd?guest=1` on new origin.
3. Back up provider state again. Change production-only Vercel `DYDD_APP_URL` AND `DYDD_PUBLIC_ASSESSMENT_LIVE_ORIGIN` to `https://app.discoverdivine.design`. Preserve all other values/targets. Set Supabase auth `site_url` to same. Existing `ConfirmationURL` templates automatically respect callback configuration; old callbacks remain allowlisted.
4. Deploy exact reviewed master using existing deployment guard. Verify production deployment exact SHA and BOTH hostnames point to same project/release. Test GET-only invalid `/auth/callback` handling without generating emails or submitting transactions. Actual authenticated signup/password reset/email delivery requires separate human walkthrough; do not claim it from GET checks.
5. Change only the six published primary CTA hrefs on Squarespace `/designid` (four) and `/designpd` (two), identified in `outputs/dydd-squarespace-launch-2026-11-12/RESULT.md`. Preserve `?guest=1`, all copy and all other hrefs. Audit `/resources`, `/designid-assessment`, `/designpd-assessment`, `/spiritual-gifts-test` separately; no global historical substitutions.
6. Keep old alias serving, NOT a blanket redirect: Stripe webhook POSTs and existing host-bound Supabase/guest capability cookies/PKCE callbacks must continue working. Old deep/private links remain valid. No cookie/token copying through URLs, no cookie-domain widening, no report regeneration.

## URL inventory and invariants

- Auth actions: `app/login/actions.ts`; preserve safe relative next/PKCE callback.
- DesignID/Gifts/FruitLife actions and DesignPD service: explicit configured origins continue controlling emailed/report URLs.
- FruitLife Stripe checkout: configured origin controls new checkout returns; old existing sessions/webhook endpoints untouched.
- Guest checkout: `DYDD_PUBLIC_ASSESSMENT_LIVE_ORIGIN` controls strict HTTPS success/cancel; update atomically with `DYDD_APP_URL` for report/recovery/individual pass links.
- Lifecycle/guest recovery/report/reminder payloads: never bulk-rewrite historical rows or old links. Strict compatibility permits old exact hostname after cutover.
- Maps/couple PDF asset base centralized without touching saved PDFs/scoring/report content.
- Deployment/verification/seed scripts retaining old hostname are operational identity/legacy checks, NOT learner runtime URLs. Historical docs/test fixtures left unchanged.
- Owner console and sandbox are separate projects/domains and are untouched.
- Approved guest footer remains the exact main marketing invitation and Spiritual Gifts marketing URL; no signup/course promotion reintroduced.

## Rollback

Before live cutover: remove only added app CNAME if needed, remove Vercel app domain, restore original allowlist from secured auth snapshot; current site URL and app config were never changed. After cutover: restore both production origin env vars and auth site_url to `https://dydd-online-school.vercel.app`, deploy reviewed prior release; leave old callbacks allowed and old alias working. Do not restore entire unrelated DNS/config snapshots over concurrent changes. Root/www/mail records never need changing.

Evidence and secure backup references: workspace `outputs/dydd-canonical-domain-2026-11-12/`; auth/environment full backups in protected secrets directory, never Git. Vercel sensitive values are redacted even with decrypt=true; do not treat blanks as original values to restore.
