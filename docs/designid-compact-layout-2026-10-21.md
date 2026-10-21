# Compact DesignID lesson layout — sandbox only

John's sizing preference: lesson-focus labels should fit their wording, with compact
padding and natural wrapping, across the **entire DesignID course**. Single words
must never become equal-width, tall green cards. Retain the established Welcome
visual treatment rather than redesigning the course or changing its content.

Your Design Profile and Reflection Capacity have short introductions: text left,
small original artwork right, then the snapshot/capacity display directly below.
Do not allow a large image or its float clearance to create an empty hero block.
Preserve original image URLs/alt text, report fields, tables, capacity bands, audio,
lesson focus wording, reflection IDs/controls and navigation.

## Scope and mechanism

- `.designid-active-lesson .journey-active-focus` uses wrapping flex rather than the
  shared three-column grid; individual labels have intrinsic width, no minimum
  height, 7px/12px padding and bounded wrapping. Applies to all 13 DesignID lessons,
  including the seven currently authored lessons. Shared Journey/other-course
  selectors and styling remain unchanged.
- `DesignIdAuthoredBody` receives an explicit `compactIntro` presentation flag from
  the course player and standalone route, only for `your-design-profile` and
  `reflection-capacity`. Other authored images keep their existing dimensions.
- Those two figures float right at 96px desktop / 64px below 768px. Images have
  matching maximum heights and `object-fit: contain` (no cropping or distortion).
  The original full-width report/capacity clear rules remain in place.
- No curriculum/report personalization/catalog/API/auth/schema/data change. Do
  not seed a fake assessment to review this styling. Existing sandbox review
  displays honest unavailable saved-report fields.

## Verification and release

Reproduced the published baseline before edits using actual Chromium at
1920/1280/390/320. At 1920, the intro-to-report gaps were approximately 249px
(Profile) and 410px (Capacity). Focus labels inherited a 74px minimum height;
phones stacked the 234–507px-tall artwork above short introductions.

Run `npm run build`, `npm run typecheck`, existing authored/Welcome source tests,
reflection catalog/export and environment isolation checks. Run
`node tests/designid-layout-browser.mjs` for all 13 lessons × 1920/1280/390/320,
checking intrinsic focus widths, compact natural heights, wrapping, no overflow,
short intro geometry, report table width/rows, capacity bands, reflection counts,
course menu/pagination, original loaded images and both standalone compact bodies.
It blocks non-read browser requests: no real learner or preview workbook writes.
Screenshots cover all seven authored lessons at all four widths.

Also run the existing `tests/designid-authored-browser.mjs` content/audio/capacity
and in-memory-only explicit Save / blur / failure / retry / reopen regression.
Use `DESIGNID_LAYOUT_BASE=https://dydd-online-school-sandbox.vercel.app` and
`DESIGNID_AUTHORED_BASE=https://dydd-online-school-sandbox.vercel.app` for published
checks. The latter intercepts saves with isolated in-memory transport only.

Commit/push `sandbox` with John Willoughby <dyddjourney@gmail.com>; publish using
`node scripts/deploy-sandbox.mjs`. Require exact Git + expected SHA, READY,
project `prj_5EC6sfJe9DpGYW59L94iwppeMYUg`, stable sandbox alias, unchanged
production alias `dpl_6Cc63HvDtSydhUoxbXxi4MHSzF3p` and master
`728e88b7681067c9e78b18aa023ba689c502602a`. Record release receipts outside Git
under `tmp/designid-layout-*` to avoid a documentation-only redeployment loop.

Evidence: `tmp/designid-layout-before-{slug}-{width}.png`,
`tmp/designid-layout-{local|published}-{slug}-{width}.png`,
`tmp/designid-layout-{local|published}-measurements.json`,
`tmp/designid-layout-{local|published}.log`,
`tmp/designid-layout-authored-{local|published}.log`, and
`tmp/designid-layout-receipt.json`.
