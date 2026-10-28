# Circle curriculum and time controls — October 28, 2026

Local implementation of requirements 6–9. No deployment, database migration,
external sends, reflection content/response changes, or learner-work writes.

## Choosing time

The schedule setup has a visibly larger **Choose time** fieldset with separate
**Hour**, **Minute**, and **AM/PM** labels, native keyboard-accessible selects,
stable label associations, 48px minimum select height, and visible focus rings.
Every minute is supported, including existing non-five-minute times. Stored
values remain `HH:mm`; midnight/noon round-trip correctly. An unset time remains
unset until a choice; the other fields then default to 7:00 PM and remain editable.
Clear time returns to the optional unset state. CSS is isolated to the time picker.

## Complete automatic curriculum allocation

The canonical content source remains `lib/journey/dydd-course-outline.ts`.
Assignment keys are its stable lesson slugs, not dates, titles, or row numbers.

The eight-meeting path is unchanged:

1. Welcome & Orientation + What is DYDD?
2. Identity, including the DesignID assessment lesson
3. Expertise
4. Story
5. Desire
6. Gifts
7. Niche / declaration preparation
8. Congratulations, Prayer, What's Next (canonical completion units)

Calendar cadence is independent: an eight-meeting biweekly Circle receives this
same complete path. Shorter plans combine adjacent curriculum blocks at module
boundaries (completion rejoins Niche); they never cut a module into equal piles:

| Meetings | Adjacent curriculum groups |
| --- | --- |
| 1 | Entire journey |
| 2 | Foundations through Story; Desire through completion |
| 3 | Foundations through Expertise; Story + Desire; Gifts + Niche + completion |
| 4 | Foundations + Identity; Expertise; Story + Desire; Gifts + Niche + completion |
| 5 | Foundations + Identity; Expertise; Story + Desire; Gifts; Niche + completion |
| 6 | Foundations + Identity; Expertise; Story; Desire; Gifts; Niche + completion |
| 7 | Foundations; Identity; Expertise; Story; Desire; Gifts; Niche + completion |

For 9+ meetings, expand the largest remaining curriculum block at a canonical
section boundary. Only after all section boundaries are used do extra meetings
split into individual lessons. All 1–104 supported meeting counts assign every
current lesson exactly once in course order. Counts above the current 71 lessons
leave the remaining meetings explicitly available for discussion/practice/catch-up.
These suggestions are an editable organizer aid, not a claim of newly approved
teaching workloads or a fixed per-lesson duration recommendation.

Meeting-count changes immediately produce a complete plan. Existing automatic
plans reflow; custom plans preserve every in-range assignment, moving only
out-of-range lessons to the shortened plan's final meeting. The allocation drawer
is labeled optional. No normal setup action requires Build suggested schedule or
Refresh lesson list. Reopening automatically reconciles current lesson metadata,
retired lessons, and additions: missing lessons join an already-assigned sibling
module when possible, otherwise use their canonical suggested meeting. Explicit
custom unassignment is retained and clearly reported, not silently reversed.

## Calendar edits and saved work

Start date, cadence, holiday additions/removals, skipped dates and moved dates
preserve meeting count and lesson assignments exactly. In finish-date mode,
calendar edits update the displayed finish to the resulting last meeting instead
of requiring a destructive rebuild. Explicitly choosing a different finish target
recounts available slots; only a resulting count change invokes the count-resize
rules above, preserving still-valid manual dates. Skipping a moved meeting also
skips its regular slot, so it advances rather than reverting to the original date.
Invalid/duplicate/out-of-order/moved-into-break dates still fail
validation, as before.

Learner work is independent of meeting dates and continues to use stable lesson
keys. The unchanged Circle save API writes only `journey_circle_plans`; this change
never reads or writes progress, reflection, assessment, or workbook tables. Work
completed ahead is not reset, reassigned to another learner, or locked by schedule
changes. No new schedule-based course gate was introduced.

## Verification

- `npm run typecheck`.
- `node tests/circle-schedule.cjs` — prior schedule/PDF validation regression suite.
- `node tests/circle-curriculum-controls.cjs` — all 104 counts; complete unique
  ordered coverage; module/section boundary semantics; canonical eight-meeting
  biweekly case; holiday/finish/moved-date preservation; custom count reduction;
  missing assessment lesson recovery and reopen round-trip; actual editor event
  handlers (count, finish target, skipped/moved dates); all 1,440 time round-trips;
  accessible rendered label associations; native selection and clear handlers.
- `node tests/circle-data.cjs` and `node tests/circle-message-actions.cjs` — existing
  Circle privacy/data/message contract regressions.
- `git diff --check`.

These are local model/component/server-rendered checks, not a claim of live
persistence testing or physical-device Safari verification. Parent owns combined
release verification, reflection changes, commit, and publication.

Integrated release follow-up: setup displays a live **5:30 PM**-style meeting-time summary and explicit format example. Saved Circle cards, review/workspace summaries and downloadable meeting-plan PDF use the same human-readable 12-hour display helper. Stored `HH:mm` and the lifecycle scheduler are unchanged.
