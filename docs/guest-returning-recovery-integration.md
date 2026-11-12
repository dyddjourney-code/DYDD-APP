# Returning guest recovery — complete, local code only

## Parent integration

```tsx
import {ReturningGuestRecovery} from '@/app/assessments/returning-guest-recovery';
// Public DesignID and DesignPD pages; product is 'designid' | 'designpd'.
<ReturningGuestRecovery product={product} />
```

Async server component validates `dydd_guest_current` **or an original report's existing session capability cookie** and offers the exact private session link. An invalid cookie emits no private identifiers. It never looks up identity from typed email in UI. Account buyers receive the existing login link.

New owned files:
- `app/assessments/returning-guest-recovery.tsx`
- `app/assessments/guest-recovery-form.tsx`
- `app/assessments/guest-recovery-actions.ts`
- `app/assessments/recover/email/route.ts`
- `lib/public-assessments/guest-recovery.ts`
- `supabase/migrations/20261112155301_guest_returning_recovery.sql`
- `tests/guest-returning-recovery.cjs`
- `tests/returning-guest-recovery-component.cjs`
- `tests/sql/guest-returning-recovery.sql`

Delivery closure also adds `lib/public-assessments/guest-recovery-delivery.ts`, `app/api/cron/guest-recovery/route.ts` and `tests/guest-recovery-delivery.cjs`, and narrowly extends shared lifecycle eligibility/app-mail pre-submit checks plus `vercel.json` (preserving the reminder cron). No commit or deployment.

## Security and delivery

Email request returns the identical generic state for unknown/matched/malformed/disabled/throttled/failing requests. Never returns session IDs, result IDs, tokens, account existence, checkout URLs, or email echo. Uses existing ledger gate independently of paused checkout, and existing `DYDD_GUEST_EMAIL_ENABLED` flag. HTTPS `DYDD_APP_URL` must be configured.

A service-only atomic RPC enforces same-email 15-minute cooldown, 3 new intents/email/day, 10 new intents/requester/hour, with keyed hashes for email and platform IP (shared fail-closed quota when Vercel's trusted IP header is absent). Unknown addresses consume the same quota. Repeat requests reconstruct the same token and durable immutable payload/event; retries cannot mint another send. The request first persists an immutable lifecycle outbox job with the original 30-minute expiry, then immediately calls existing `sendApplicationEmail` for this explicitly requested service message. Existing app-mail owns suppression, global pause checks, compare-and-set claims, send authorization and provider dedupe. No new provider integration or broad campaign activation. A dedicated authenticated `/api/cron/guest-recovery` (every five minutes in `vercel.json`) retries only `guest-assessment-recovery` application jobs with `guest_recovery` context, even while `DYDD_LIFECYCLE_AUTOMATION_ENABLED=false`. It never processes lifecycle events or other email templates. Sandbox and the existing guest email/ledger gates prevent submission. Stale processing/submitting leases are conditionally reclaimed after ten minutes with the original event key; attempts are capped at eight and the existing 23-hour provider reconciliation ceiling is preserved. Other fresh leases are not stolen.

For DesignPD recovery the SQL prefers the exact most recent **completed DesignID session**, even if a newer incomplete checkout exists. Paid/incomplete original ID purchases are recoverable too, without manufacturing any entitlement. No account tables are searched.

Both initial submission and durable retries recheck the stored request token hash, keyed recipient hash, `used_at`, expiry, session recipient/expiry, and current original DesignID entitlement (or an allowed pending original checkout). A final check after durable send authorization prevents already-redeemed or invalidated queued links from being submitted. Storage failures fail closed. Expired/used/revoked recovery never falls through the generic application-mail eligibility path.

Inbox recovery uses 32-byte opaque, hashed, 30-minute one-time proof. GET is a scanner-safe confirmation with no DB mutation. Same-origin POST rechecks expiry and current entitlement, rotates private session capability atomically, invalidates all outstanding same-session recovery tokens, and sets HTTP-only secure/current cookies. Saved scores/orders/artifacts remain untouched.

**Intentional behavior:** confirming an email recovery replaces older private links/browser capability for that session (the confirmation and email say so). Merely requesting recovery never changes existing access. This is necessary because original capability plaintext is not retained. If an owner canary override is pinned to the old capability hash, the owner must update that canary hash after recovery; regular already-paid access remains intact. The existing original email-link route is not changed by this child.

## Database applied and verified

Applied only this additive uniquely named migration to production project `laojrzlqbkmirzcbcnyw`, after confirming existing guest tables, entitlement function, and migration history. Recorded migration version `20261112155301`. Uses only its own `dydd_guest_recovery_requests` table and two `dydd_guest_*_recovery` RPCs; no overlap with abandonment/resend migration ownership. RLS enabled, anon/authenticated/PUBLIC denied, service-only grants, invoker functions with empty search_path.

## Verification

Passed:

```sh
npm run typecheck
node tests/guest-returning-recovery.cjs
node tests/guest-recovery-delivery.cjs
node tests/returning-guest-recovery-component.cjs
# Production psql with ON_ERROR_STOP=1:
# tests/sql/guest-returning-recovery.sql
```

SQL checks run inside BEGIN/ROLLBACK and verify exact completed-source preference over newer incomplete purchases, immutable score preservation, one-time redemption/replay denial, expiry, entitlement revocation, unknown-email denial, durable idempotency, cooldown, requester quota, 3/day email quota, RLS and role grants. Zero retained recovery fixture/request rows after rollback. No production lifecycle jobs or real emails were created/sent by tests. Delivery tests mock all DB/RPC/provider interactions and verify immediate sending with broad automation disabled, durable event dedupe, scoped retries, final pre-provider redemption race, expiry/token/recipient/session/entitlement invalidation, pending checkout provider eligibility, fail-closed storage, sandbox, stale/fresh leases, retry limits, cron authentication and the preserved reminder schedule. The cron source is prepared locally; its production schedule only exists after deployment.
