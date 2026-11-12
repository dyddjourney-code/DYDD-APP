# Secure guest account linkage + Kingdom overview — parent integration

State: implemented locally; no commit, deploy, production SQL application, claim, email, payment, PDF generation, or data rewrite by this worker.

## Parent integration

1. Apply additive migrations in order: existing guest `20261112000100`, group/coupon `20261112142808_guest_group_access.sql`, then `20261112142809_secure_guest_account_linking.sql`. Apply before deploying account/overview callers. Ownership migration itself depends only on guest + Auth tables; overview coupon provenance needs group order columns. No automatic contact-email backfill or claims are performed.
2. Render `<GuestAccountLink sessionId={sessionId}/>` from `app/assessments/guest-account-link.tsx` inside the **existing capability-protected session page**, after `requireGuest`. This worker intentionally did not edit that page. Import relative from session page: `../../guest-account-link`.
3. Handle `account=not-linked` on that session page with a constant safe message such as “Your results are saved. Sign in to a verified account and reopen this private link. If this session was already connected elsewhere, contact support.” Never interpolate raw errors/contact emails into the URL. Claim success redirects `/assessments/account?linked=1`.
4. Ensure the group worker’s required `paidGuestOrder` integration is applied: use service-only `dydd_guest_order_entitled` for both result order AND DesignID source, instead of raw Stripe provider mode. Account report/listing and owner download intentionally reuse `ownedGuestResult` and therefore inherit those checks. Without this parent integration group/coupon results appear in the owner overview but their downloads/listings fail closed.
5. Account entry point is `/assessments/account`. Optional app navigation link can point here. Existing product account-access includes connected guest downloads, without passing guest IDs to native artifact generation or native retry-email actions.
6. Parent independently ensures production `/command-center` is reachable by the actual verified owner. Existing Command Center layout/sandbox gating is outside this worker’s edit scope. New guest report endpoint independently requires verified admin Auth (or existing sandbox-only owner-preview). It cannot be used by ordinary Circle owners.

## Security and data model

- New session-to-Auth UUID binding table has one primary key per session; actual verified, non-anonymous, non-banned `auth.users` record is checked in the transactional mutation.
- The server action obtains account identity from `auth.getUser()` and guest proof from the HttpOnly cookie via `requireGuest`. It ignores typed emails/user IDs/tokens. Original guest contact and actual verified account email may differ: the two real proofs, not email similarity, establish ownership.
- Sole mutation RPC has `SECURITY DEFINER` only to inspect Auth and write otherwise service-read-only tables; explicit service-role guard and revoked public/anon/authenticated EXECUTE. No broad Auth table grants. Current server Auth validation happens before RPC, so browser account sessions cannot request arbitrary target users.
- Session row lock serializes competing claims; same owner retry is idempotent, another owner is denied. Link + audit insert are atomic. Neither row can be edited/deleted; tables have RLS, no browser access and service SELECT only. No reassignment flow is provided.
- Audit records original contact email + verified account email and proof method, not raw cookies or bearer hashes. Guest tables, snapshots, scores, report/PDF/email metadata, native participant ownership and commercial rights are untouched.
- Once linked, the account reads by explicit Auth UUID even after guest cookie expiration. Payment/source refunds and grant revocations still gate reads. Cookie expiration prevents NEW claims; it does not erase an existing account link.
- Linking the session includes its existing and later legitimately saved results. It grants no school/course/membership access and does not convert guest result IDs into native snapshots.
- `getOwnedAssessmentSnapshots(user,{includeGuest:true})` opts display callers into normalized guest summaries with `owned_report_href`. Default remains native-only to preserve native source FK/generation/retake behavior. `/assessments/account` is the combined native + guest report list.

## Query-driven owner “backfill” (no rewrites)

- Kingdom overview reads all guest results (paid Stripe, zero-dollar group/coupon and historical reversals), with contact name/email, exact order/result/source IDs, provider/current purchase state, access/grant name and coupon code.
- Native Spiritual Gifts snapshots already exist in the public pipeline. They are retained once and enriched from session/response records with actual public/native channel, original contact, signup source and session ID. Stored `scores.channel` is sometimes `native_app` even for public submissions; the original saved score object is not changed.
- A retained Gifts response missing its snapshot appears read-only from `derived_scores`; no rescoring or report generation. It is explicitly labeled as lacking a report snapshot; no misleading download link.
- Stable pagination has no arbitrary 10,000-row ceiling. Source read failures are explicit instead of silently producing incomplete counts. Unique public result IDs survive owner display deduplication.
- Guest contacts are synthetic read-only overview identities, not `assessment_participants`. Group assignment is disabled unless the owner grouping includes an actual native participant. Original contact is separately shown even when owner contact grouping merges same-email records; this grouping is not authorization.
- Guest owner downloads resolve private archives via a new `/command-center/guest-report/[resultId]` route, never by disclosing capability tokens.

## Verification

Run from repository root:

```sh
node tests/guest-account-linking.cjs
node tests/guest-account-report-access.cjs
node tests/owner-public-overview.cjs
python3 supabase/tests/run_guest_account_links.py
npm run typecheck
```

SQL harness creates a disposable `postgres:17-alpine` Docker container with `--network none`; no production credentials are loaded. It exercises the actual base/group/link migrations, SQL ACLs, wrong hash/expired cookie, nonexistent/unverified/anonymous account denial, idempotency, immutable audit/contact provenance and two competing verified-account claims (one winner).

After parent applies migrations, run `supabase/tests/verify_guest_owner_overview.sql` as READ ONLY. It checks result/provider/current-state counts, link/audit consistency, Gifts channel/snapshot coverage, missing-snapshot fallback counts, and browser ACLs. It does not claim accounts or generate/send anything.

Verified locally on 2026-11-12: all three new Node suites PASS; isolated combined base/group/link SQL + competing-owner race PASS; existing `tests/account-identity-binding.cjs` and `tests/artifact-access.cjs` PASS; repository TypeScript check PASS (rerun by parent after its remaining integration).

Production browser acceptance still required by parent: verified login + valid private cookie claim; same-email-only account cannot see unlinked guest results; second-account rebind denied; linked account download works after removing guest cookie; wrong-account report ID denied; genuine owner sees both paid live results plus coupon results and public Gifts with original contact/source provenance; ordinary Circle owner cannot see global guest rows.

## Existing independent public Gifts identity caveat

`app/spiritual-gifts/actions.ts` currently resolves unsigned public contact email against `school_profiles`, and uses that match as `created_by_user_id` / snapshot user ownership. This predates this task and is NOT reused by secure guest linkage. The overview overlay is read-only and labels original public provenance correctly, but does not rewrite or certify historic Gifts ownership. A broader public Gifts identity cleanup must use separate explicit capability/Auth proof; do not mass-reassign historic snapshots from contact email. This worker did not modify the Gifts submission/report pipeline.
