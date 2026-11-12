# Verified public-result carryover and individual guest passes

## Bridge contract

Completed public DesignID and ready original-PDF DesignPD results automatically join the same exact verified Auth email account. Database proof re-reads `auth.users`; no user metadata, profile/typed email or Gmail aliases establish ownership. Existing session links remain immutable and win over email matching. Anonymous, unverified and banned accounts fail closed. Existing cookie-plus-verified-account manual links remain valid, without reassignment.

Original guest results and PDFs stay authoritative. Additive immutable `assessment_snapshots` projections retain the original result UUID, scores and completion timestamp, with `source=public_guest`. They support the established native PD source foreign key and durable report references without modifying native or guest source records. The dedicated guest archive routes serve the original private PDF; native generic recovery may not regenerate imported reports. Pending guest PD PDFs are not completed school report evidence. Later paid results become current by original completion time and retain earlier history.

Shared school reads, Passport/primary badges, Field Kit, subscribed-course prerequisites, accepted Circle data, Waypoints and FruitLife DesignID context consult the entitlement-aware resolver. Privileged reads and authenticated RLS recheck original payment/environment/grant/source rights; refunds and revocations cannot leak stale imported projections. Existing native PD generated from a guest source also checks that source. Report completion does not create subscription rights, course lesson completion or course awards.

Included native DesignID saves use the latest eligible native/linked public completion plus six UTC calendar months (end-of-month clamping); importing today never resets the original date. Owner/override policy remains. Separately paid guest reservations still permit unlimited completed-history repeats; unfinished-purchase recovery guards remain. Free group timing, scoring and payment fulfillment are unchanged.

## Individual pass contract

Owner `/owner/guest-access` defaults to Individual guest pass: required recipient email, optional name, assessment selection, and an Eastern calendar DATE. End-of-day is stored as an absolute UTC deadline, including DST. One grant-scoped HMAC link represents one normalized exact recipient and one private session; no manual enrollment capacity is exposed. Only token hashes are stored. Existing group and coupon-provenance links keep their previous behavior; coupon_code itself is not a redemption endpoint.

The database rejects new individual result INSERTs at the actual wall-clock deadline, even when enrollment, transaction start or assessment opening happened earlier. DesignPD still requires the entitled completed DesignID in that private session. Completed reports remain entitled/downloadable after grant expiry; explicit revocation disables granted rights without deleting history. Group expiry remains enrollment-only.

Creation never sends mail. Owner Send Email/Resend uses the existing durable application-mail/Resend pipeline, exact recipient/content binding, idempotent request keys, final expiry/revocation checks, and persisted provider status. Resend preserves the original link and deadline. Invitations contain products, a Start button and the Eastern deadline, without subscription enrollment language. Provider acceptance and inbox delivery are distinct.

## Verification and deployment evidence

Detailed private operational evidence is under workspace `outputs/dydd-bridge-individual-2026-11-12/`, including disposable PostgreSQL17 tests, hosted rollback rehearsal, migration invariance proof, source/scoring regression logs, exact-final typecheck/build, hydrated local synthetic owner-browser checks, provider read-only status and canonical deployment proof.

No real invitation, customer test email, payment or PDF generation is part of this release verification. The runtime mail switch/key are configured; domain inspection with the sending-only key is restricted. Real invitation acceptance/inbox delivery remains for the owner's supplied test recipients.
