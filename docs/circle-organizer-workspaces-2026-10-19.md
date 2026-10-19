# Circle organizer workspaces — October 19, 2026

## Scope

A real organizer-owned Circle workspace, not a browser-only plan. Save draft persists to account; Create Circle activates the workspace. Owners can create multiple separate Circles, reopen/edit them and download a PDF. Jordan's three example Circles and existing assessment/CARE/reflection data are unchanged.

Organizer workspaces are intentionally separate from participant memberships. Adding a person does not create a membership, disclose private data, send email or confer course access. Invitation dispatch/acceptance requires the yet-unconnected main-journey paid subscription entitlement; do not substitute an enrollment or a FruitLife purchase for that entitlement.

## Persistence and access

`journey_circle_plans` stores one whole plan atomically, with UUID idempotency and revision-based updates. API authenticates accounts using `auth.getUser`; server-validated owner preview scopes are separate rows. Public clients cannot insert/update/delete; normal authenticated SELECT is owner-limited by RLS. The privileged API scopes every read/update to the verified actor. Replayed creates recover an identical saved result, but reject differing data. Stale saves return 409 without overwriting.

Migration: `20261019195559_circle_organizer_workspaces.sql`; additive table, no modifications to existing membership/group schema. Applied remote migration is recorded in `supabase_migrations.schema_migrations`; never rerun unrelated historical migrations.

## Scheduling and evolving course content

Canonical source: `lib/journey/dydd-course-outline.ts`, stable module/lesson IDs. The suggested first pass groups initial two modules; Identity is the next meeting. This is editable, NOT approved final pacing or workload. Different meeting counts spread lessons in order; leaders can explicitly reassign whole modules or individual lessons. Course titles/durations refresh on reopening; new lessons require assignment, retired lessons can be removed by refreshing the list. Existing assignments are never silently reassigned on course edits.

Pace mode calculates a finish date. Finish-date mode counts usable meeting slots and builds a suggested allocation. Breaks skip date ranges and shift normal meeting dates. Individual moved dates must remain chronological, unique and outside breaks. Changing dates/breaks in finish-date mode requires reapplying that target. Dates are calendar dates independent of DST; local meeting time and time zone are carried separately. One to 104 meetings, custom interval one to 365 days. Teaching-duration metadata is not total time for CARE, practice or discussion.

PDF is generated server-side from escaped text, with all network requests blocked. It includes schedule, assigned lessons, breaks, goal, meeting details and listed people. No private assessment or reflection records are queried.

The Field Guide tab organizes existing leader guidance by each meeting's assigned modules; deeper content development waits for John's main-course review.

## Verification

- `node tests/circle-schedule.cjs`: curriculum coverage, grouping, breaks, target finish, date conflicts, DST, unassigned lessons, group-size boundaries, PDF escaping.
- `node tests/circle-api.mjs`: requires configured app credentials + a running app (`CIRCLE_TEST_BASE`, defaults localhost:3099). Creates temporary QA users without sending mail and removes them plus its QA plans. Tests real accounts, scope separation, CSRF, stale revisions, retries and actual PDF bytes.
- Browser: four-stage setup, account/preview saved reload, creation/workspace, editable assignments, Field Guide, new Circle preservation, all three Jordan samples at 1280/768/390/320; QA rows removed.
- Security advisors inspected for this table; no Circle-table findings. Existing unrelated findings are out of scope.

## Next, per John

Finish this release, then walk the full main course with John: teaching, CARE, reflection questions, expected additions and actual effort. Deepen/reorganize the Field Guide. Final base units, durations, and recommended pacing follow that review, not precede it.
