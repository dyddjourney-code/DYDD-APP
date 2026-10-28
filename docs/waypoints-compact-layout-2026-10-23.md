# Waypoints compact layout — sandbox only

## Scope

Reading content stays in the green devotional container, centered in an up-to-84ch
column. The full-width reflection follows Scripture. The subscription form/status
is outside that container, as the third cell of a compact desktop shortcut row:
Current week | See last week | Subscribe (or Subscribed). Both week cells share
the same top-aligned label, title, Scripture and date stack. At 900px and below,
the cells stack. At 360px and below the email/action controls stack as well.

Email still comes from the existing authenticated server state as a real input
value; the accessible Email address label is visually hidden, not removed. The
field uses readable subdued text and email autocomplete. The existing explicit
form-submit handler, loading/error/success behavior, subscription lookup, privacy,
authentication, unsubscribe path, API endpoints and delivery semantics are intact.
No effect or page-load auto-subscription was added. Already-subscribed users see
the existing simple Subscribed state and unsubscribe control in the same third cell.

Only `components/waypoint-explorer.tsx` and scoped Waypoints styles changed.
All35 content records, Scripture formatter/attribution, saved-Primary selection,
archive behavior, notes, assessments and scoring are unchanged. Production is not
part of this release.

## Verification

- Typecheck, production build, original23/new12 content invariants PASS.
- All35 actual React/Chromium Scripture renders (including16 future), seven quote
  edge cases and all19 hydrated current/archive passage checks retained.
- Real sandbox synthetic-user browser checks: guest/signed-in prefill, widths
  1920/1280/768/390/320, top alignment, centered reading column, metadata stack,
  no overflow, current/last-week switching and stable third-cell horizontal
  position/email, no page-load subscription request.
- One explicit Subscribe click is intercepted/aborted before the server to verify
  the exact email payload and connection-error/retry state. No subscribe backend
  or real outbound email is exercised. A disposable active subscription fixture
  verifies server-rendered Subscribed status at1280/390. Sessions are signed out,
  fixtures and synthetic users removed in finally cleanup.
- Evidence, screenshots and exact release proof live under workspace
  `outputs/waypoints-layout-qa/` and `outputs/waypoints-layout-release-proof.json`.

Uses existing CSS architecture (no new dependencies), guided by the
`design-taste-frontend` skill; requested centered reading/three-cell layout takes
precedence over the skill's default asymmetric layout preferences.
