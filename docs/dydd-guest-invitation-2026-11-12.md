# Private guest discovery invitation — November 12, 2026

> Superseded by the results-footer correction below. Earlier account/app invitation evidence is historical, not the current approved UI.

## Scope

Presentation-only follow-up to the guest release. The user confirms receipt/resend and report downloads work. Report boxes, ordering, downloads, resend and preparation code remain untouched; invitation remains below reports and the existing group panel. Journey website navigation opens a new tab with `noopener noreferrer` and an accessible new-tab hint. Main Squarespace four blocks remain drafts. No domain/DNS/configuration changes.

Replaced the immediate “Keep your results in the app” block with a compact branded optional congratulations/explore-further invitation, distinct create-verified-account and sign-in actions, explicit connect form only for a verified nonanonymous account, and a smaller free Spiritual Gifts invitation using the unchanged `/assessments/spiritual-gifts` destination.

## Copy provenance

- Saved connected report access: `lib/public-assessments/guest-account.ts`, `app/assessments/account/page.tsx`.
- Assessment-connected courses, practical teaching and personal reflection: existing `app/trailheads/page.tsx` introductory copy and `lib/trails/catalog.ts` descriptions.
- Standalone report does not include DesignID/DesignPD courses: existing prerequisites in `lib/trails/catalog.ts` and `lib/public-assessments/course-capability.ts`. No price, subscription, unlocked-course or broader available-feature promise added.

## Claim/security review

Existing `linkGuestAssessmentAccount` action, `linkCurrentGuestToAccount`, server `auth.getUser()`, HttpOnly capability proof and atomic `dydd_guest_link_verified_account` are unchanged. Navigation is not a claim; GET/render does not mutate ownership. Signup/sign-in retain the exact private session return path, and a separate explicit form submission is still required. Form contains session ID only, never capability or typed claim email. Server and atomic RPC still independently deny unverified/anonymous/wrong-cookie/expired/reassignment cases. Account identity comes from Auth, not participant contact matching. Original contact/purchase/result/audit semantics remain intact.

## Verification

Optimized Next build and project TypeScript pass. Existing focused `guest-account-linking.cjs` and `guest-account-report-access.cjs` pass with mocked transport; verified account plus correct cookie, conflict failure, unrelated account, revoked access and exact saved-score/archive routing preserved. Read-only SQL source inspection confirms role restriction, confirmed Auth/nonanonymous/banned checks, row-locked matching unexpired capability, immutable ownership and audit. No hosted claim/account mutation was performed.

Actual async invitation/shell components rendered with synthetic auth at 1280/390/320 for guest, verified, unverified and anonymous states: 12 passes, safe new-tab navigation, signup return path, verified-only explicit form, same Gifts path, no overflow, no action invocation/network. Desktop/mobile screenshots reviewed. This isolated fixture blocks all network (including brand image requests); it is not a hosted authenticated browser claim test. No redundant questionnaire/scoring/provider suite or payment/PDF/email test was run for this bounded CSS/copy change. Production HTTP/alias proof is in global release handoff.

## Fresh paid-flow walkthrough (human only)

1. Open a fresh private/incognito window at `https://dydd-online-school.vercel.app/assessments/designid?guest=1`. Use a different inbox you control, or a fresh deliverable plus alias supported by your mailbox (for example `yourname+dydd-review-20261112@gmail.com`). The guest timing ledger compares trimmed/lowercased full email; same-email DesignID retakes remain six calendar months, with pending-purchase recovery protection unchanged. This is a separate human review identity, not a code/policy bypass. No agent payment is authorized/performed.
2. Enter name and chosen report email, continue to Checkout, confirm **DesignID $19.99 USD**, and complete payment yourself. If an existing-purchase/timing message appears, do not repeatedly pay; use its existing private link or an unused review mailbox.
3. Return to the paid session and complete the native 21-step DesignID flow (20 allocation sets, then confirmation sort/review). Submit once. Download the saved DesignID PDF and check its report email/attachment/private access link. Existing resend is optional; no resend is needed just to test this new invitation.
4. From that same private session choose **Explore DesignPD**. Confirm the separate **$19.99 USD** human payment. On return, DesignPD derives from that exact saved DesignID; no second questionnaire. Download its saved PDF and check the report email. Reports stay above the new invitation.
5. Below completed reports, inspect the logo-led **Explore the Discover Your Divine Design journey** invitation. Its only main website link is `https://www.discoverdivine.design/`. A separate Spiritual Gifts callout links to `https://www.discoverdivine.design/spiritual-gifts-test`. No app, signup/signin, course, Trailheads or subscription promotion appears in this footer.
6. Journey website opens separately; free Gifts remains optional. No domain/DNS or Squarespace changes are part of this review.
