# Architecture

## Application

Use Next.js on Vercel.

Suggested route structure:

- `/`: public school overview.
- `/courses`: course catalog.
- `/courses/[slug]`: course detail and modules.
- `/learn/[courseSlug]/[lessonSlug]`: lesson player.
- `/dashboard`: student dashboard.
- `/profile/design`: student's assessment profile.
- `/admin`: protected course/content management later.

## Supabase

Supabase should handle:

- Authentication.
- Profiles.
- Course, module, and lesson records.
- Enrollment and entitlement records.
- Progress events.
- Reflection answers.
- Assessment snapshots.
- Agent conversation/context records.

Use Row Level Security from the start. Students should only read their own enrollments, progress, reflections, assessment snapshots, and agent threads. Public course marketing content can be readable without auth if desired.

## Assessment Sources

Use the current live Google Sheets as scoring engines first, then mirror client-safe outputs into Supabase. DesignID/DesignPD and Spiritual Gifts are both live production sources and should be treated as read-only until John explicitly approves a write or automation change.

Initial source map:

- DesignID / DesignPD: Google Sheets source referenced by `DESIGNID_PD_SPREADSHEET_ID`.
- Spiritual Gifts: Google Sheets source referenced by `SPIRITUAL_GIFTS_SPREADSHEET_ID`.

The app should connect users to their own normalized `assessment_snapshots`, not expose raw sheet rows or scoring internals.

## Stripe

Stripe should handle:

- Checkout sessions.
- Products/prices.
- Subscription or one-time purchase events.
- Webhook-driven entitlements in Supabase.

Early prototype can delay Stripe by manually granting enrollment rows in Supabase.

## GHL Content Migration

Current API probing confirmed access to the DYDD GHL sub-account and membership capability, but did not expose course lesson/code-block content. Treat GHL as a source system requiring one of these:

- Manual copy/export from the GHL editor.
- Browser-assisted extraction if John opens access later.
- Rebuild from source scripts, videos, and code blocks supplied by John.

## Agent Layer

Start simple:

- Store each student's assessment profile.
- Provide one lesson reflection assistant that receives lesson context and the student's available DesignID, DesignPD, Spiritual Gifts, and journey/workbook snapshots.
- Add companion personas later after the core course loop works.
