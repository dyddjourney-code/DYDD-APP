# Stable login presentation — October 28, 2026

Scope: public `/login` presentation only, following the stable free-beta release.

- Center the account card at all viewport widths, independent of shared hero grid styles.
- Add the existing DYDD logo, warm green palette, compact headings, readable form spacing, focus states and password-length guidance.
- Keep sign-in, create-account and password-recovery navigation, including the original `next` destination. Use link navigation semantics rather than incomplete ARIA tabs.
- Explain that returning assessment learners should use the same email and registered learners should sign in.
- Preserve assessment-specific FruitLife360 / Spiritual Gifts branding.
- No changes to auth actions, account confirmation, participant matching, RLS, assessments, environment configuration, crons, or sandbox.

## Verification

Production build and TypeScript checks; existing `tests/free-beta-boundaries.cjs`.
Read-only browser checks cover signup/signin/recovery at 1440, 1280, 768, 390 and 320px: card centered, logo loaded, headline under 32px, no horizontal overflow or runtime errors. Check native required-field validation without sending an auth request, `next` preservation, mini-app branding and direct stable owner/admin exclusions. Capture desktop/mobile screenshots and verify exact production project/SHA/alias after push.

Private account investigation is intentionally not committed. It uses read-only live auth and assessment queries; no accounts or assessments are changed, and no email/reset is requested. Gmail canonicalization removes dots and plus tags for participant matching, but an already-owned participant cannot be claimed by another user. Historical assessment ownership is not universally merged across aliases: matching selects one eligible participant, not every matching legacy record.

Limitations: automated Chromium desktop/mobile viewports, not physical iOS/Safari. This presentation-only verification does not register new accounts or send confirmation/reset messages.
