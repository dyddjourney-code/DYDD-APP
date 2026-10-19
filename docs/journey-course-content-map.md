# Journey Course Content Map

This is the receiving structure for moving the Discover Your Divine Design class
content into the app without losing the workbook, CARE, assessment, and
Pathfinder logic that already exists.

## Current App Structure

The Journey page is now driven by two connected structures:

- `lib/journey/dydd-course-outline.ts` holds John's August 27, 2026 master
  course walkthrough from the spreadsheet.
- `lib/journey/dydd-journey.ts` holds the deeper workbook, CARE, Pathfinder,
  facilitator, database, and Dydi planning layer.

The page should lead with the course outline, then keep the workbook/CARE
engine below it.

Current UX direction:

- Show the course as a guided player, not a long scrolling outline.
- Collapse modules by default except the active module.
- Collapse sections inside each module except the active section.
- Show one active lesson at a time.
- Keep the lesson's workbook/checkpoint/Pathfinder response attached in the
  active lesson view.
- Provide previous/next controls so learners always know where they are.
- Preserve stable unit slugs/types so Camp Circle can later show group progress
  without exposing private workbook responses.

## Lesson Layout and Reflection Policy — October 19, 2026

John requested the Journey follow the Spiritual Gifts, FruitLife360, and DesignPD
lesson layout, not the DesignID layout:

1. Keep the module/section/lesson sidebar and stable lesson identifiers.
2. Show lesson-focus blocks first, then existing companion audio where available.
3. Title the teaching section with the lesson title, not “Teaching block.”
4. Place the illustration to the right of the teaching on desktop and below it
   on smaller screens. Reuse existing lesson media; otherwise use chapter artwork.
5. Keep book/workbook page references and the attached CARE workbook experience.

Do not add a generic reflection or practice response to every Journey lesson.
Only the established CARE/workbook/Pathfinder experience should ask for responses.
The 70 generic `-lesson-reflection` prompts have been retired from the current
question catalog and hidden from the interactive Journey workbook even when an
older saved round still contains them. Existing saved answers and historical
round snapshots are not deleted or rewritten; saved-history exports retain them.
CARE question IDs, source wording, Pathfinder/niche support, and answer history
remain unchanged.

The teaching copy is still placeholder material awaiting John's lesson-by-lesson
rewrite. This layout pass does not finalize the curriculum, CARE content, module
pacing, or Field Guide. Other assessment courses are unchanged.

## Master Outline Translation

Source file reviewed: `DYDD_Course_Content---1a6c7c74-a82a-48b3-a28d-dd2e4d63dc2f.xlsx`.

Spreadsheet signals were converted into explicit app content indicators:

- Normal rows become teaching lessons.
- Green font rows become `DesignID reflection` units.
- Orange/theme font rows become `Pathfinder / niche` units.
- Assessment rows become assessment bridge/launch units.
- Workbook-only rows become workbook checkpoints.
- Intro rows become orientation units.

Current app data totals:

- 8 modules
- 70 lessons/checkpoints
- 10 DesignID reflection units
- 12 Pathfinder/niche units

Each journey stage currently supports:

- `classWeek`
- `title`
- `summary`
- `videoIntro`
- `contentMoves`
- `assessmentCallouts`
- `sampleLessons`
- `sections`
- `pathfinder`
- `databaseRecord`
- `dydiContext`

Each workbook section supports:

- `sourceRef`
- `title`
- `purpose`
- `care.connect`
- `care.act`
- `care.reflect`
- `care.explore`
- workbook prompts with response types

## Course Lesson Template

Use this shape for each lesson or sheet row:

- Module name
- Chapter or stage
- Lesson title
- Lesson type: intro, teaching, worksheet bridge, assessment bridge, group bridge, closing
- Suggested length
- Media need: none, image, video, downloadable, assessment link
- Lesson summary
- Main teaching copy
- Focus points
- CARE handoff
- Workbook section below it
- Assessment tie-in
- Pathfinder tie-in
- Private/shared rule
- Companion/Dydi note

## First Sample Placement

The opening stage now has two sample lesson blocks:

- Welcome to the Trail
- How This Journey Works

The Identity stage now has one sample lesson block above the workbook flow:

- Before Who You Are, Remember Whose You Are

These are placeholders for reviewing layout, spacing, media size, and the
handoff from lesson content into workbook/CARE prompts.
