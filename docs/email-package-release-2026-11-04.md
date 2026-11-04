# Sandbox school email package — November 4, 2026

## Scope and review

Sandbox only: branch `sandbox`, Vercel `dydd-online-school-sandbox` / `prj_5EC6sfJe9DpGYW59L94iwppeMYUg`, Supabase `atemrshtshxoqnuevvqu`. Production deployment, settings, accounts, subscribers, provider integrations and live charges were not changed. Existing unrelated Circles evidence edits and `tmp/` were preserved.

- Review: https://dydd-online-school-sandbox.vercel.app/sandbox/email-lab
- Real job activity: https://dydd-online-school-sandbox.vercel.app/admin/email
- Start with [short owner guide](DYDD-Sandbox-Email-Quick-Start-2026-11-04.txt); then [complete source-generated catalog](DYDD-Sandbox-Email-Catalog-and-Walkthrough-2026-11-04.txt).

This is **controlled sandbox activation**, not a bulk campaign launch or a claim all 41 potential inventory IDs send. Only `dyddjourney@gmail.com`, an already verified owner address in the live school's read-only auth audit, is allowlisted. A genuinely fresh, separate sandbox password account was created through the actual hosted signup UI at approximately 20:28 UTC. No production user was copied or modified. Sandbox's existing auth auto-confirm behavior is preserved; it is not claimed that sandbox signup verified ownership through an email challenge.

## What was already implemented and retained

The existing foundation/outbox, recipient preferences, issued unsubscribe-token history, signed delivery-event handler, provider IDs, immutable acceptance/event projection, bounce/complaint suppression, SKIP LOCKED leases, stale-lease recovery, capped exponential retry, 23-hour provider-ambiguity limit and transactional lifecycle submission fence remain. Existing report/invitation prose is preserved. Account/course/report/Circle/followup event timing is in the catalog. No per-lesson/badge email or import/backfill campaign was added.

October 28 FruitLife policy remains authoritative: no participant start/self invitation, self reminder, or pending-observer status chase in either mode, including old queued jobs. Observer invitations, one eligible day-five reminder, and genuine ready-report delivery remain. Provider-owned authentication/billing and actual missing deadline/expiry/content events are explicitly distinguished from active application triggers.

## Fixes and activation

1. **Exact-address sandbox transport:** default remains blocked. Explicit enabled flag, exact isolated ref plus API URL and literal allowlist must all match. No domains, wildcards, plus-address normalization, mail redirection or catch-all. At most ten configured entries; this release configures exactly one. Existing DYDD sending-only credential and configured verified From identity were securely reused for this sandbox project only; unrelated DPG credentials/webhooks were not touched. Subjects visibly start `[SANDBOX]`.
2. **No queued backlog:** server-only activation cutoff rejects provider transport for older sandbox jobs, including original held-outbox creation time for later-materialized Circle jobs. Existing `sandbox_ready`, accepted, stopped and manual-review history is not bulk reset. The one newly created test account's A03 was safely requeued with its original key after a non-sending synthetic QA worker drained it; absence of any provider intent/ID and post-cutoff creation were independently required before this narrowly scoped recovery.
3. **Complete immediate editorial review:** 231 server-rendered source-based previews: 12 fixed lifecycle, 12 requested-service/report/export examples, 32 generated fictional Circle messages and 175 Waypoint alternatives. Source extraction preserves real report/observer/confirmation prose; private report/token values are replaced by visibly fictional app-area links. The reflection export is explicitly dynamic private content, not fabricated answers. Authenticated allowlisted verified account required; owner-preview tokens do not authorize it. Same-origin POST, stable per-request business keys, own-test history and a 25-per-day deliberate-copy limit are provided. Test copies are labeled and do not change progress, paid access, consent or subscription.
4. **Real Journey enrollment defect:** current Journey workbook writes `journey-assessments-v1:...`, but the old database trigger accepted only `source='course'`. The additive private-trigger migration now accepts the real Journey writer while preserving author identity, first-round uniqueness, legacy/import and activation boundaries. No backfill scan. The actual hosted `ensure-round` flow now emits its enrollment event.
5. **Incomplete-learning gap:** genuine first course-workbook enrollment now queues A05 day-seven and G04 day-35 inactivity intentions even before a first lesson is checked complete. Existing stable keys deduplicate checklist fallback; consent, recent workbook/checklist activity, completion, access and Circle overlap are still rechecked.
6. **Nov4 paid-Circle integration defect:** new paid operations issued transactional held invitations but did not connect them to the lifecycle sender. A private AFTER INSERT event plus approved current-campaign materialization now bridges original token/membership intent to D01/D02. Draft/excluded/unfinalized/expired/replaced/accepted invitations cannot authorize delivery. Finalization also reconciles an invitation deliberately recorded before approval. Original outbox history is not rewritten.
7. **Approval-invalidating roster bug:** same-roster invitation issuance unconditionally incremented the plan revision and superseded the just-approved schedule. The exact deployed function was patched only at that UPDATE: unchanged computed JSON keeps revision/timestamp/approval; real roster changes still advance revision and supersede. All paid, seat, quota, consent, identity and privacy rules were retained; byte-preservation and existing operation regression are recorded.
8. **Current Circle UI integration:** the new Nov4 operations workspace had no direct approved-message editor; it was reachable only through the separate legacy planner. A leader-only Messages panel now renders the existing three-group message editor directly inside the selected current Circle. Participants do not see leader drafts; readonly/preview state cannot authorize actions.
9. **Monitoring and UX:** `/admin/email` now includes dedicated weekly Waypoint email jobs and available provider state, not just lifecycle jobs. Sandbox/banner/invitation messages accurately describe controlled delivery. A partial cron failure no longer falsely claims no messages were released. Authenticated cron responses include runtime SHA/environment for scheduler proof. Reviewed mobile typography was corrected; no production login policy was weakened.

## Deployment and verification records

Implementation releases: `f0ce5ca` (controlled transport/lab), `cc55a8e` (full source previews/monitoring), `26473a3` (real Journey and paid-Circle integration), `a6ffe16` (direct current leader review and responsive heading correction). Final exact READY project/SHA/stable+legacy branch alias and production-preservation receipt is written by the parent execution to workspace `outputs/dydd-email-package-release-proof-2026-11-04.json`, after the final pushed review-guide/visual follow-up. That receipt, not an earlier build ID, identifies the handed-off runtime.

Evidence lives under `docs/evidence/`:

- `email-durable-regressions-2026-11-04.json`: initial comprehensive run, including honestly retained initial fixture failures.
- `email-regression-repair-2026-11-04.json`: current legitimate Personal/Leadership fixture contracts, time-relative future count, all three previously failing suites pass, asserted cleanup.
- `email-workbook-migration-2026-11-04.json`: exact sandbox migration, hash and denied public execution.
- `circle-email-schema-2026-11-04.json`: exact live-function hash preservation, no-op vs actual roster revisions, private event trigger, existing operations regression and rollback/fixture cleanup.
- `email-live-sandbox-2026-11-04.json`: actual signup/password session, 231 previews, delivered UI at390/768/1280, real provider acceptance, duplicate request same provider ID, no implicit optional consent/subscription, outsider denial and read-key permission boundary.
- `email-security-advisors-2026-11-04.json`: security-advisor read plus private trigger privilege checks; 38 existing project advisories, none naming the changed private functions. No claim unrelated existing advisories were remediated.
- `email-hosted-circles-2026-11-04.json`: real current leader panel, authenticated approval/acceptance/worker/opt-out/revision/IDOR checks,360/390/768/1280 browser and24-table asserted cleanup.
- `email-validation-summary-2026-11-04.json`:20 unique passing suites and resolved initial failures.
- `email-dns-2026-11-04.json`: public DKIM/SPF/return-path MX present; root DMARC `p=none`. DNS presence is not provider-dashboard verification or observed message alignment.

**20 distinct suites/harnesses passed**, plus typecheck/build and deterministic source-catalog checks. Exact commands are in `email-validation-summary-2026-11-04.json`. Core verification commands include typecheck/build; sender/environment/allowlist; signatures and isolated delivery/race ledgers; lifecycle events/application/course/Waypoints; FruitLife policy/native worker; actual workbook-source trigger; paid-Circle held-outbox bridge; and authenticated published HTTP/browser ownership, approval, invitation, opt-out and schedule semantics. The final validation summary lists exact completed commands; failures were investigated rather than omitted. Browser automation uses the configured local authenticated egress proxy; its test browser trusts that proxy's interception certificate, not a production TLS claim.

Synthetic fixture cleanup is asserted, including entitlements/orders, Circle operations/outbox, lifecycle events/jobs and auth users. The fresh owner review account and accepted controlled-email history intentionally remain. One task account welcome needed the narrowly documented non-sending-QA recovery; integration suites that sweep shared sandbox queues should run before introducing a controlled recipient, or be isolated/scoped, never be mistaken for a production-safe test runner.

## Provider acceptance versus delivery

Three provider-accepted controlled emails were verified before handoff: real fresh-account A03 and two explicitly labeled copy previews (account welcome and October30 Waypoint). Stable duplicate request returned the same ID without another intent. The separate sandbox access message is recorded at final handoff. An October30 copy preview is **not** a replay of the expired production release or a new subscription.

The existing key is **sending-only**: Resend domain/webhook/email-inspection GET returned401 `restricted_api_key`. It successfully accepted sends, so this is not an expired-key diagnosis. No provider admin authority was obtained and no unrelated webhook was changed. `accepted` is proven; actual Delivered/Bounced/Complaint/inbox/spam status and provider plan/limits remain unverified. No fabricated delivered webhook was applied to genuine provider IDs.

The deployed receiving endpoint is `https://dydd-online-school-sandbox.vercel.app/api/webhooks/dydd-email`. It deliberately returns503 until this environment has its own securely stored `DYDD_RESEND_WEBHOOK_SECRET` and a matching provider registration. Supported events: `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.failed`, `email.complained`. Active provider telemetry remains a genuine provider-console/credential-boundary handoff, not an unfinished code endpoint. Local signature, replay, duplicate, ordering and concurrency projection tests passed.

Sandbox authentication SMTP remains deliberately unconfigured/default2-email/hour with password signup auto-confirm and app auth-link mail blocked. Production read-only auth audit found Resend SMTP, required email confirmation and100-email/hour setting. No auth SMTP or templates were changed. The supplied access handoff uses an ordinary one-time account-session link delivered through the controlled app sender; it does not advertise a blanket working sandbox Supabase SMTP integration.

## Missed October30 Waypoints — production-only finding

See [bounded diagnosis](email-audit-2026-11-04-waypoints.md). The authored issue **Called Before You Feel Ready** was correctly scheduled October30 08:00 EDT /12:00 UTC, published and after activation. Current production `paused=false`, **`optional_paused=true`** makes the deployed Waypoint worker return before jobs. Its existing subscriber is active, verified/account-linked, confirmed before the release, not globally opted out and not suppressed; October30 has no email job. This is a confirmed present blocker and strong explanation, not an invented historical pause audit or recovered cron result.

Production has Vercel Friday12:00+13:00UTC scheduler definitions; sandbox instead has healthy five-minute pg_cron→pg_net. Sandbox actually released October30 at12:00:00.658UTC, but had zero subscribers/confirmation intents and disabled transport then. Neither missing content nor DST explains that sandbox non-send. November6 correctly uses13:00UTC /08:00EST.

**Production repair is outside the authorized sandbox mutation scope.** Simply clearing `optional_paused` affects all optional lifecycles, not only Waypoints. A production-only review must choose intended pause scope, inspect eligible pending work, then authorize the smallest appropriate repair. October30 is outside48-hour freshness and will not automatically backfill on resume. No date reset, subscriber change, production deploy, live cron execution or missed-issue resend was performed.

## Repeatable safe operations

1. Read exact environment credentials/project/ref guards; never set environment to production to bypass sandbox guards.
2. Run mocked/synthetic integration suites before controlled real-recipient account flows, or in properly scoped isolation; assert cleanup.
3. Regenerate the full TXT and public service-copy JSON using `node scripts/generate-sandbox-email-catalog.cjs`; source-only, no network/DB. Check deterministic output and body coverage.
4. Review via authenticated `/sandbox/email-lab`; only its deliberate send button or an authorized future genuine trigger can deliver to the exact allowlist. Do not reset accepted/ambiguous history.
5. Configure with `scripts/configure-sandbox-email.mjs` only from protected local staging; retain original activation cutoff. It writes only the validated sandbox Vercel project, then requires explicit deploy.
6. Push sandbox and use `scripts/deploy-sandbox.mjs`; require READY exactSHA/project and both intended aliases, and compare production before/after.
7. Verify authenticated cron runtime SHA plus actual pg_net HTTP response bodies, not cron SQL `succeeded` alone. Keep the existing five-minute schedule; expired jobs do not become a backlog.
8. `scripts/verify-sandbox-email-live.mjs --send-controlled` is an explicit owner-only provider test, not an ordinary no-send unit command. Its existing fixed verification keys deduplicate reruns; the protected staged password is only valid until the owner chooses another password. Do not print staging credentials or one-time links.
