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
