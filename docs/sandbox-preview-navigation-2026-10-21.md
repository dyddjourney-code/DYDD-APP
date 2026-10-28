# Sandbox preview navigation continuity

## Reproduced failure

On the deployed sandbox, both public portal home entries (Owner Command Center and New person review) opened correctly in a clean browser. But Ranger Station's plain **Choose a trail** link (`/trailheads`) discarded `review` and `key`. Trailheads then had no owner course preview action; `/courses/designid-foundations` redirected to `/login`. The gold banner denoted environment only and did not establish authentication. The earlier owner-course fix did not solve this navigation loss.

## Sandbox-only repair

A server-verified existing owner/Jordan preview query now establishes an HttpOnly, Secure-on-HTTPS, SameSite=Lax preview-continuity cookie. On supported teaching/navigation GET routes, a valid cookie restores the existing preview query when a plain link omitted it. Command Center restores owner mode; learner-facing navigation restores Jordan. Explicit invalid credentials never fall back to the cookie. Authentication, assessment submission and purchase routes are not restored/bypassed. Production ignores this cookie entirely.

The gold banner now provides **Sandbox Base Camp** and **Preview DesignID course**. The latter uses `/sandbox-review`, a sandbox-only fixed teaching destination using exactly the existing `/base-camp` Jordan entry mechanism. This also recovers an already-open gold-bar window that previously lost its preview query and has no new cookie. No login, new assessment or invented saved report is required. Reload an old window to receive the new banner.

Working public sandbox recovery URL: https://dydd-online-school-sandbox.vercel.app/sandbox-review

Existing navigation: gold banner → Preview DesignID course; or Sandbox Base Camp → Trailheads → DesignID → Preview DesignID Course (Owner).

`tests/sandbox-entry-continuity.mjs` verifies actual public homepage buttons, the previously failing raw Ranger Station link, Trailheads course action, direct course/standalone lesson under the same preview, desktop/phone, tokenless old-window recovery, anonymous/invalid denial and browser runtime errors. No assessment submissions, emails, data updates or real learner entitlements are involved.

Verification cannot inspect John's physical browser because no user browser profile is connected. It reproduces the same Jordan/gold-bar and tokenless states in isolated Chromium. The external public site's Sandbox button itself is outside this repository; the tested destination is the actual published sandbox portal root. No claim is made to have clicked an unavailable external button.
