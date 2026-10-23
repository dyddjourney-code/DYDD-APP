# DYDD email foundation — sandbox implementation

Scope: user-authorized foundation items 1–3. Production, DPG, billing, live inbound forwarding, provider webhooks, real email and production configuration are untouched.

## Review routes

- Contact: `/contact`, linked in application/assessment footers.
- Private queue: `/admin/support`, actual administrator authentication required; review links do not grant access.
- Delivery webhook implementation: `/api/webhooks/dydd-email`. Deliberately returns 503 until this environment has its own `DYDD_RESEND_WEBHOOK_SECRET`. **This is not a configured live Resend webhook.**

## Mail identity and help

The central sender preserves each configured verified From address and existing DYDD display name. Every application email gets the unmonitored-mailbox notice plus an absolute Contact link in plain text and HTML. No Reply-To is added, especially not historical `support@discoverdivine.design`. The recipient's Reply button cannot be removed. No discard/forward/reject behavior is claimed or configured. Existing incoming-email/forwarding rules need separate provider review before promotion. Authentication SMTP is provider-owned, outside this application sender; it has not been changed.

## Reliability implementation

- Private service-role-only message intents, provider IDs, immutable delivery events and bounce/complaint suppressions. `accepted` means provider API acceptance, not delivered.
- Standard Webhooks/Svix SHA-256 signature on exact raw bytes, timing-safe comparison, five-minute timestamp tolerance; event IDs deduplicate transactionally. Unsupported event types acknowledged without retaining payloads. No email bodies or recipient arrays retained in telemetry events.
- Delivery, delay, bounce, failure and complaint events project into message state. Delayed/sent events cannot downgrade delivered; negative terminal events cannot be overwritten by late delivered events. Bounce/complaint suppress future sends and stop active Waypoints subscriptions.
- Provider acceptance and event projection serialize using a provider-ID advisory transaction lock. A webhook preceding the API response is durably reconciled; repeat acceptance never resets a terminal delivery state.
- Waypoints jobs have unique release/subscriber/channel keys, leased `FOR UPDATE SKIP LOCKED` claiming, bounded batches, exponential backoff, eight-attempt cap and stale-lease recovery. Pending jobs are processed even after the website release is marked released. Eligibility is rechecked before send. Sender payload snapshot, per-job unsubscribe token and provider idempotency key stay constant on retry.
- Provider ambiguity retries use the original key. After 23 hours (inside Resend's 24-hour idempotency window), automation fails closed to manual `review` rather than risking a duplicate. Do not reset these rows until provider acceptance is reconciled.
- Each message keeps its opt-out link; new emails and resubscription do not rotate/delete old hashes. The migration preserves the last legacy hash and the endpoint retains legacy fallback. Earlier hashes already overwritten by the historical sender cannot be reconstructed. RFC 8058 one-click POST is supported; unsubscribe remains independent of Contact and login.
- Existing callers with explicit stable keys inherit safe retries; callers without a key get per-call intents, not a new cross-invocation business-event lifecycle. This foundation does not activate the proposed lifecycle inventory.

## Sandbox isolation and verification

Sandbox checkout/branch `sandbox`, Vercel project `dydd-online-school-sandbox`, DB `atemrshtshxoqnuevvqu`. Only additive sandbox migrations were applied and registered in sandbox migration history. No live data copied. Sandbox's existing no-cron configuration and hard outbound guard remain in force. Webhook exercised only on localhost against sandbox fixtures, never on any live delivery endpoint. Provider sends in sender tests are mocked, never actual.

Verification commands:

- `npm run typecheck`; `npm run build`; `node tests/environment-isolation.cjs`
- `node tests/contact-support.cjs`; `node tests/contact-support-auth.cjs`; `node tests/contact-support-sandbox.mjs`
- `CONTACT_BASE=http://localhost:3138 node tests/contact-support-browser.mjs`
- `node tests/contact-http-sandbox.mjs` (local QA allowlist only); `node tests/email-foundation.cjs`; `node tests/email-sender.cjs`; `node tests/email-foundation-sandbox.mjs`; `node tests/email-http-sandbox.mjs`

Tests cover origin/body/field validation, storage failures, authenticated admin guards, private RLS/RPCs, eight parallel support submissions, optimistic status conflicts, 360/390/768/1280px layouts, failure-preserved form content, success reference, transport failures, retries, provider-state persistence failure, payload conflicts, eight competing workers, stale leases, expired retry windows, duplicate/signed/tampered events, eight acceptance/event races, suppression and historical opt-out links. Synthetic DB fixtures are removed.

## Externally pending, before production activation

1. Review sandbox, then approve a separate production promotion/additive migration. Do not merge sandbox environment/cron configuration into master.
2. Create a **DYDD-only** Resend outbound webhook for `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.failed`, `email.complained`, pointing to the production DYDD `/api/webhooks/dydd-email` route only after production schema/code promotion. Keep DPG webhook/key untouched.
3. Securely store that endpoint's signing secret as server-only `DYDD_RESEND_WEBHOOK_SECRET` in the matching environment; no secret was requested over chat or committed.
4. Review the provider's current receiving/forwarding behavior for the existing sender. No replies should route through historical support forwarding into John's main inbox. This code adds no forwarding and no monitored Reply-To, but cannot change already-existing mailbox rules.
5. Separately verify provider's actual delivered/bounce dashboard status and authentication SMTP/help copy. No actual provider send or live webhook execution occurred during this build.
