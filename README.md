# DYDD Online School

Starter project for the Discover Your Divine Design online school.

## Purpose

Build a discipleship and training platform that can host DYDD classes, biblical basics, evangelism training, and future personalized lesson paths. The long-term goal is a school that adapts to a learner's DesignID, DesignPD, spiritual gifts, and course history, with DYDD companion agents serving as guides inside the journey.

## Proposed Stack

- Vercel: Next.js app hosting, preview deployments, production deployments.
- Supabase: auth, learner profiles, course catalog, lesson progress, quiz answers, assessment snapshots, and agent conversation context.
- Stripe: paid enrollment, subscriptions, coupons, and access entitlements.
- Existing GHL course: source content to migrate manually or by export because current GHL API access does not expose membership lesson/code-block content.

## Current Status

- Local project folder created.
- Initial architecture, schema plan, migration skeleton, content inventory, and build outline are in this repo.
- GitHub, Vercel, and Supabase project structures are created and documented.
- Supabase magic-link login and the first protected DYDD HQ dashboard route are in place.
- DesignID/DesignPD and Spiritual Gifts live Google Sheet sources are confirmed for read-only app planning.

## First Build Target

The smallest real version should be:

1. A public course landing page.
2. Student login.
3. One migrated DesignID class module.
4. Lesson pages with video/embed/code-block content.
5. Progress tracking.
6. A simple personalized reflection panel using stored DesignID scores.

## Production Source Discipline

DesignID/DesignPD and Spiritual Gifts are live working assessment engines. The app should observe those sources and mirror client-safe results into Supabase; do not change the live sheets or expose raw response data without explicit approval.

## Folder Map

- `app/`: future Next.js app routes.
- `components/`: shared UI components.
- `content/`: migrated course/module source.
- `docs/`: strategy, architecture, implementation notes.
- `lib/`: Supabase, Stripe, and agent helper code.
- `supabase/migrations/`: database migration files.
- `agents/`: companion behavior notes and prompt scaffolds.
