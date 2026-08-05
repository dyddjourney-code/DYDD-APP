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
- Provide one lesson reflection assistant that receives lesson context and the student's design snapshot.
- Add companion personas later after the core course loop works.

