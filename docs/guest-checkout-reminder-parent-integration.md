# Guest checkout reminder integration (implemented; pending parent deployment)

Child owns `lib/public-assessments/guest-checkout-reminder.ts`, dedicated cron route,
additive migration, `vercel.json` cron entry and tests. Parent owns checkout/recovery UI/actions.

Required parent integration (function names stable):
1. In `createGuestCheckout`, after successful `payment_reference` persistence, call
   `await registerGuestCheckoutReminder(order.id, token)` from
   `@/lib/public-assessments/guest-checkout-reminder`.
   Registration never sends and should not break a created checkout if unavailable:
   catch it, preserve original checkout URL; queue stays inert without verified capability.
2. After successful `verifyGuestCapability` in `/assessments/recover`, call
   `await markGuestCheckoutResumed(id)` from the same module. This durably suppresses
   all pending reminders for the resumed session (fail closed: if unavailable do not
   silently claim suppression). Also call on verified session entry if desired.
3. Migration creates only future-order queue rows; never backfill. One row per order,
   +1h due, 24h absolute cutoff; paid/completed/resumed suppressed at delivery.
4. Production `CRON_SECRET` and `DYDD_GUEST_EMAIL_ENABLED` already exist. Dedicated
   Vercel schedule every 5min avoids enabling broad historical lifecycle campaigns.
   Parent must deploy reviewed code/config; child does not deploy or commit.

## Verified implementation state — 2026-11-12

- Migration `20261112155246_guest_checkout_reminder` APPLIED + registered on
  production school project `laojrzlqbkmirzcbcnyw`. Before/after: 4 orders,
  2 sessions, 3 results unchanged; reminder table empty (zero historical enqueue).
  RLS enabled; anon SELECT and authenticated claim RPC execution denied.
- No PostgreSQL cron/pg_net installed. Existing Vercel schedules inspected and
  preserved; added only `/api/cron/guest-checkout-reminders` every five minutes
  to `vercel.json`. Production `CRON_SECRET`, Resend and guest-email settings
  are already configured. No broad lifecycle worker activation.
- Dedicated worker runs at ~60–65 minutes, only for registered future order
  intents. Provider status is independently checked before the atomic final
  DB authorization. No webhook-only assumption. One immutable payload/key per
  order; CAS lease, SKIP LOCKED, bounded retries, 24-hour cutoff; no old rows.
- Parent checkout/recovery integration observed in shared working tree:
  registration after linkage; durable suppression after capability recovery and
  explicit Resume action. No additional checkout/UI edit made by child.
- Tests: 18 focused JavaScript tests PASS; isolated PostgreSQL 17 future-only,
  timing, capability-proof registration, immutable payload, 8-way concurrent
  claim, final fence, resumed/cancelled suppression, expiry and browser ACL PASS.
  TypeScript PASS. Full guest integration suite run alongside focused tests.
- No commits, deployments, real emails, payments or PDFs performed by child.
  Scheduler endpoint is not live until parent deploys reviewed code/config.
  Existing reminder queue is empty; no real send was requested for verification.
