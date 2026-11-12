# Group guest integration handoff (implemented; parent wiring needed)

Owned files are new `lib/public-assessments/guest-group-access.ts`, `app/assessments/group/*`, `app/owner/guest-access/*`, `supabase/migrations/20261112142808_guest_group_access.sql`, and dedicated tests. No guest.ts, payment, report or existing session page edits.

Parent integration needed:

1. In `paidGuestOrder` in `lib/public-assessments/guest.ts`, replace the RPC call to `dydd_public_assessment_provider_allowed({p_provider:found.data.payment_provider})` with `dydd_guest_order_entitled({p_order_id:found.data.id})`. Keep existing status/session/source checks; source order also needs `dydd_guest_order_entitled` to prevent source grant revocation retaining PD rights. The RPC validates paid Stripe mode/reversals OR server-created zero-dollar grant provenance (redemption, product, non-revocation), not a caller-supplied flag.
2. Add `GuestGroupSessionPanel` from `../../group/session-panel` (check relative import from session/[sessionId]/page.tsx: `../../group/session-panel`) to the private session UI with `sessionId`. This lets guests with both products unlock derived DesignPD after completing DesignID using only the saved session capability and httpOnly group cookie. Do not show a competing $19.99 PD offer when this panel provides included DesignPD. Option: panel returns itself only when group products include PD; inspect orders/access_grant_id + grant products for paid-offer suppression.
3. Add owner nav link `/owner/guest-access` to Command Center. Manager independently enforces confirmed owner user via `auth.getUser()` + admin allowlist and ledger fence; it does not depend on the sandbox-only Command Center layout. Production identity lane must make Command Center itself reachable separately.
4. Apply guest migration 001 first, then `20261112142808_guest_group_access.sql`. No shared provider-mode function changes. No actual groups or quotas are seeded.

Owner create form requires explicit name, included product checkboxes, UTC expiry, enrollment limit; coupon requires provenance code. Raw link is shown once only to the authenticated creating owner, and is never placed in report payloads or list queries. Revocation disables grant-created rights; expiry/use limit blocks only new enrollments. Repeated redemption is idempotent per grant/session and does not spend another use. Existing paid/pending orders are not overwritten. DesignPD-only grants require the guest to restore their original DesignID private session first.


## Verification

- `node --test tests/guest-group-access.cjs`: 6/6 pass (validation, unknown/revoked token, hashed RPC only, timing error mapping, owner auth, explicit bounds and coupon provenance).
- `python3 supabase/tests/run_guest_group_access.py`: disposable network-isolated PostgreSQL 17; migration rollback rehearsal, coupon provenance/free evidence, idempotent concurrent replay, immutable score save, exact-source derived PD, foreign-source denial, six-calendar-month email policy, revocation, final-use concurrent race, expiry/new-enrollment behavior, PD-only prerequisite, service-only ACL/RLS, existing provider fence/account sentinel preservation.
- Targeted TypeScript check including all group-owned routes/modules plus their actual transitive imports passed (`/tmp/dydd-guest-group-typecheck.json`). Full-repository tsc could not complete in the parallel shared workspace: first process killed, bounded 1536MB attempt reached heap limit. Parent should run final whole-repo build/typecheck when parallel jobs settle.
- `supabase/tests/guest_group_access.sql` is a standalone **BEGIN/ROLLBACK-only** synthetic verification for the parent to execute after applying the migration. It has unique invalid-domain fixture emails, no provider calls, no actual groups or permanent quotas. The isolated runner also executes it and asserts zero leftover grant rows.

Entry recovers only browser-held verified guest capability cookies, never sessions discovered from typed email. Owner can choose an explicit eligible DesignID retake checkbox; RPC still enforces six-calendar-month policy and no duplicate unresolved order. PD-only links require recovering the original DesignID session first.

No deployment, commit, hosted DB write, or real group creation was performed by this lane.
