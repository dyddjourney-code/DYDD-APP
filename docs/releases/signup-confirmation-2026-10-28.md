# Signup verification UX — 2026-10-28

Scope: account entry presentation and sign-in feedback only. Successful signup without a session now routes to `/login?mode=confirmation`, not the normal welcome-back sign-in page. The dedicated state explains that verification is required for access, instructs the learner to open the email verification link, includes spam-folder help, and offers explicit post-verification sign-in and wrong-email correction links. The original `next` remains preserved. No email address is placed in the redirect URL.

Password sign-in maps Supabase `email_not_confirmed` to actionable verification instructions. Feedback now renders above the form in a high-contrast accessible alert, rather than below the password and recovery controls. Existing signup validation and other auth errors remain visible.

No changes to auth settings, mandatory verification, callback handlers, session exchange, profile/assessment matching, production route boundaries, or sandbox configuration. No resend feature or automatic extra email added.

Verification: production build and TypeScript; responsive signup/signin/recovery/confirmation checks at 1440/1280/768/390/320; live synthetic signup through public browser UI, confirmation waiting screen, unverified Base Camp denial and password-signin alert, original Supabase signup token through normal PKCE callback, authenticated Base Camp/API session, and fixture deletion. Repeatable full-flow check: `node scripts/verify-signup-confirmation.mjs`; uses only the established `delivered+...@resend.dev` synthetic mail sink and existing local credential files, never a learner/owner address. This test intentionally creates then deletes its own synthetic auth fixture and reads only that fixture’s original confirmation token. It does not inspect a mailbox or send learner mail. Evidence lives in workspace `outputs/dydd-free-beta-2026-10-28/signup-confirmation/`.

Limit: browser viewport emulation, not physical iOS/Safari; SMTP acceptance/callback token verified, not inbox placement. Exact SHA/alias evidence accompanies the release artifacts.
