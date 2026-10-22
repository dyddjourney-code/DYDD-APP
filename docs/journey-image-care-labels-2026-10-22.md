# Journey image and CARE heading cleanup — sandbox only

Baseline `581716d3a390e242010001275000621150d4db84`; retain the complete final DesignID module release.
Only application changes: add media to Journey `identity-assessment-time-designid` (Module3/Section3.2/Lesson1), and remove the decorative one-letter spans from Who vs. Whose's four green headers. Full Connect / Act / Reflect / Explore words, explanations, questions, answer keys, prayer and persistence remain unchanged. No shared/global CARE styling or DesignID Lens implementation changes.

## Current read-only source

Workbook `1GTyYUL883YogJ9n46WyUyhQBZpQuU9nCrMtRlbfP1l4` now names sheet0 **DYDD Journey Course**, not the historical Sheet1. Read current A1:Z1 and A18:Z19 with rich grid data. Snapshot: `content/journey/assessment-image-source-2026-10-22.json`.
Headers remain A Module / B Section / C Lesson / D Lesson Title / E Lesson Focus / F Content / G Image URL / H CARE. Row18 is section3.2/lesson1/Assessment Time: DesignID. G18 formatted value and actual hyperlink match:
`https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/a3412b55-fabf-4ec5-9721-7348edea38dd/DYDD_piegraph+final.png?format=2500w`.
No image formula or hidden alternate rich link. The original teaching, audio, metadata and all other lesson objects are unchanged.

Row19 (lesson2 The DesignID Lens: What is in the report?) has empty current teaching/image/CARE source cells. Actual getWorkbookExperience resolves this lesson to the existing fallback: title Unpack your reflections, source Workbook p9 - p18, two stable IDs identity-the-designid-lens-what-is-in-the-report-19-designid-connect / -designid-reflect. Its CARE connects results/capacity/loving God and others; acts in a concrete place; reflects on alignment/stretch/resistance/grace; explores the next faithful step without a label. A separate canonical section unpack-designid-reflections exists with three summary/shadow/overall prompts, but does NOT currently match this lesson. Neither mapping nor either set of prompts is changed. Any newly proposed CARE is a review-only draft owned by parent; NOT implemented here or written to spreadsheet. Future heading preference: full stage words only, without redundant individual letters.

## Verification and release

`npm run build`, `npm run typecheck`; reflection catalog/export, environment isolation, retained final DesignID module source, diff whitespace checks. Scoped baseline comparison proves only media differs in all Journey lesson objects. Five-width Chromium checks at1920/1280/768/390/320 prove both lessons' exact existing body, loaded source images, overflow-free layout, full-only headings, retained four green cells/white labels/four inputs/private discussion marks and assessment connected Trail navigation. No save transport or learner data writes; no persistence implementation changes warranting broad lifecycle repetition.

Evidence and read-only verification harness: untracked `tmp/journey-image-label-*`; local and published screenshots inspected. Push sandbox only, explicit `node scripts/deploy-sandbox.mjs`, verify READY/exactGitSHA/expectedSHA/projectprj_5EC6sfJe9DpGYW59L94iwppeMYUg/stablealias. Recheck production master728e88b7681067c9e78b18aa023ba689c502602a and aliasdpl_6Cc63HvDtSydhUoxbXxi4MHSzF3p unchanged. No production/source/scoring/schema/customer/email writes.
