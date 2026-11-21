# Volunteer Beta Tester invitations — private owner console

## Scope

John requested a Volunteer Beta Tester option in the existing Guest Pass owner UI, accepting name/email and issuing unlimited unique signup codes for lifetime access to the **currently published** app. Checklist document pending; no invented attachment or real invitation/email/account creation. Implemented on maintained `fix/owner-fruitful-life-360-live-2026-11-13`, not stale `owner-command-center`.

Entry: https://dydd-private-owner-console.vercel.app/owner/guest-access . The pinned owner project remains protected by Vercel Authentication on ALL deployments. Volunteer mutations additionally require server-only pinned private-owner mode and the existing verified owner audit identity. Public learner release and teaching sandbox are not promoted or changed.

## Working loop

1. Select **Volunteer Beta Tester**, enter recipient name and email, and create invitation. This saves a code only; no account or email is created.
2. Copy signup details (canonical https://app.discoverdivine.design account signup plus unique code), or upload John's checklist and explicitly request **Send welcome + checklist**.
3. Recipient signs up using the invited email (or signs into that existing account), confirms their email, then enters the unique code in **Base Camp → Purchases → Redeem beta access code**. No new public signup page is needed. This is code-based redemption, not automatic one-click activation.
4. The existing published server endpoint creates the existing durable `dydd_personal_access` / `personal_all_access` entitlement. It never expires. Current personal tools/reports/courses use it; assessment/course prerequisites, ownership/privacy, owner permissions and seats for other people stay unchanged.

There is no ten-code cap. Original ten unbound codes remain usable. Generated volunteer codes are bound to the exact normalized invited email and one confirmed nonanonymous account, with existing durable attempt throttling and row locking retained. A SHA256 hash is persisted; the owner can recover the same HMAC-derived code while the server secret remains unchanged. Rotation requires code recovery/reissue, never a broken link silently displayed. Duplicate pending-email creation recovers the existing invitation. A service-only unique index also prevents concurrent duplicate pending recipients.

## Checklist and email

The attachment table is empty until John supplies his actual checklist. Owner can privately upload PDF or DOCX up to 2 MB. No default/synthetic checklist is shipped. Missing checklist prevents both UI send and server enqueue. Upload alone does not send mail.

Welcome includes name, invited email, canonical published-app signup URL, unique code, confirmation/redemption steps, lifetime/no-payment terms, correct limitations, exact checklist bytes and existing public support footer. Existing durable lifecycle/message storage handles idempotency, retry, suppression and accepted-vs-delivered status. An additive database submission trigger fences the new message type even when consumed by the unchanged published lifecycle worker: revoked/redeemed/replaced/wrong-recipient codes or missing/replaced attachment cannot pass to submission. Attachment is snapshotted in the persisted intent. Replacing checklist stops old pending snapshots; explicitly reviewed new requests can use the replacement. As with existing mail, an already provider-submitted message cannot be recalled.

Unused codes can be revoked; earned lifetime access and saved work are never removed by invitation revocation. List search/pagination, recovered code copy, welcome status and delivery receipts are available in the owner UI.

## Additive database change

`supabase/migrations/20261121190507_volunteer_beta_invitations.sql` adds optional recipient/audit/revocation/welcome-request fields to existing beta codes; a pending-recipient unique index; private checklist storage; narrow private email verifier; recipient/revocation checks in existing redemption; scoped mail submission trigger. Service role only; RLS; no anon/authenticated table/RPC access. No existing guest assessment table, scoring, result, entitlement, auto-sync, Auth policy or environment is changed.

Migration applied and history registered on production DYDD database `laojrzlqbkmirzcbcnyw`. Original ten beta-code rows, three lifetime grants, eight Auth users and complete guest grant/result hashes were exactly preserved. Security advisors: no new WARN/ERROR; one new INFO `rls_enabled_no_policy` is intentional service-only deny-all storage, matching existing protected tables.

## Verification

- Optimized Next build and TypeScript pass; isolated real-module tests cover private mode rejection, 20 unique codes, recovery, normalized email, duplicate creation, escaped welcome, exact attachment payload, missing attachment denial, revoked denial and send-time eligibility. No provider network calls.
- Real production DB rollback-only fixtures test verified/wrong/unverified recipients; revoked, single-use/idempotent redemption; spare-code preservation; legacy code compatibility; 20 extra codes; century-old lifetime grant; durable 12-attempt/15-minute recovery; anon/authenticated denial. Mail submission fence allows exact original attachment and rejects revoked/replaced/missing attachment. All synthetic users/codes/jobs/checklist and entitlements rolled back.
- Existing eleven guest/native couple report/privacy route tests pass.
- Exact built app browser checks at 1280/390/320: volunteer option, required name/email, no assessment/deadline controls for volunteers, original individual/group/coupon fields preserved, pending checklist and no page overflow. Live read-only database check and isolated populated/server-action checks are recorded separately.
- Published learner compatibility independently audited at `0948c0a4da0084ae456f54d5fd081292a95e588b`; no public deployment needed. Inbox receipt and actual recipient signup/redemption are intentionally untested; no real invitation sent.

## Rollback

Redeploy owner SHA `83c077846743b6e1d1a354adb97b413bf4734674` on the same protected owner project. Leave additive schema in place. Original beta codes and existing lifetime/guest paths remain compatible; no destructive down migration or entitlement deletion. Checklist and invitation records remain private.
