# Journey Course Content Map

This is the receiving structure for moving the Discover Your Divine Design class
content into the app without losing the workbook, CARE, assessment, and
Pathfinder logic that already exists.

## Current App Structure

The Journey page is driven from `lib/journey/dydd-journey.ts`.

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
