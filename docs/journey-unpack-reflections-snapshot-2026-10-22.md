# Journey: return from DesignID — sandbox only

Baseline `9581ff28084e6fcf83caa29f73b76c54875049fa` (Spiritual Gifts header) retained as ancestor. Stable lesson is `identity-the-designid-lens-what-is-in-the-report-19`, Journey Module 3 / Identity Assessment / row19. Its workbook heading is **Unpack Your Reflections**; the canonical course-map title remains **The DesignID Lens: What is in the report?** Current headers A–H and row19 were fetched read-only into `content/journey/unpack-reflections-source-2026-10-22.json`: AModule/BSection/CLesson/DLesson Title/ELesson Focus/FContent/GImage URL/HCARE. Row19 still has blank focus/content/image/CARE, canonical title and lesson2; no source spreadsheet edits. New introduction explicitly authorized by John; replaces the target's implementation-oriented placeholder teaching only.

## Read-only personal snapshot

The top teaching welcomes the learner back from DesignID and summarizes primary/secondary/integrative/shadow discoveries and capacity. Below it:

1. Primary Reflection, Secondary Reflection, **Integrative Reflection**, **Shadow Reflection** (canonical names, not “Integrated” or a fabricated fourth reflection).
2. The report's scored Quick View doughnut, using the retained `Chart_Image`/`qc_donut` URL when present, otherwise the official report's doughnut configuration applied to the exact four saved point values. Order Architect/Artisan/Shepherd/Steward; official gold/blue/green/purple palette; white borders; 58% cutout; whole points (same PDF score-display repair), no recalculation or new assessment.
3. The four reflection→saved capacity-band mappings, no separate capacity chart.
4. Existing `personalizeDesignIdAuthored` shadow renderer's exact saved Risks / Root Cause / Redemption values, plus original report A–D row markers. No invented risk/root/redemption prose. Narrow screens retain the chart as an accessible keyboard/swipe-scroll table with readable type.

No contribution/learning sections. No report, assessment, scoring, schema, storage or entitlement changes. Existing audio, lesson focus, CARE questions/IDs/answers/private reminders and navigation are unchanged. Neighboring lessons and shared report renderers are unchanged.

`app/journey/page.tsx` reuses the established server-verified review resolver and authenticated `getAssessmentSnapshotsForUser(user.id, normalizedEmail)` owner-scoped report path. Only rendered/escaped selected fields cross into the client navigator, never credentials or full raw report payloads. Historical `reportPayload`-only records are supported. Missing report shows an explicit unavailable state; incomplete reports show missing fields and no invented wheel. `Potential_Shadow` is never substituted for the canonical primary `Reflection_Shadow`.

Official chart/table contract inspected read-only from retained official PDF template `346a0595-80fa-48c3-a9e2-29f0c0312e6e` plus the existing app's authored shadow component and score-display module. Attempts to refresh the template read through the existing PDFMonkey credential returned HTTP403; no template writes or PDF generation were attempted. Existing report source remains unchanged. QuickChart remains the existing report chart-image provider.

## Verification / repeat

- `npm run build`, `npm run typecheck`, `git diff --check`.
- `node tests/environment-isolation.cjs`, `node tests/reflection-catalog.cjs`, `node tests/reflection-export.cjs`.
- `node tests/journey-designid-snapshot.mjs`: isolated real signed-in sandbox users, engine-scored saved reports with different primary reflections and summary vs reportPayload-only shapes; exact labels, point vector, loaded chart, saved bands and all12 matrix values; 1920/1280/768/390/320; actual audio playback; existing CARE database save/immediateNext/reopen; honest missing/incomplete records; no page overflow; readable phone chart scroll; existing public owner recovery→sidebar Trailheads → Journey→target lesson with no invented owner report; runtime errors. All isolated accounts/reports/workbooks cleaned in `finally`.
- `node tests/journey-designid-lens-care.mjs` keeps approved CARE, answers/history/export/marks regression.
- Published repeat: `JOURNEY_TEST_BASE=https://dydd-online-school-sandbox.vercel.app node tests/journey-designid-snapshot.mjs`.

Publish only pushed `sandbox` via `node scripts/deploy-sandbox.mjs`. Exact READY/project/SHA/stable alias and unchanged production receipt required. Evidence under untracked `tmp/unpack-*`.

Public review recovery: https://dydd-online-school-sandbox.vercel.app/sandbox-review then sidebar Trailheads → Journey → target lesson. Direct lesson: https://dydd-online-school-sandbox.vercel.app/journey?lesson=identity-the-designid-lens-what-is-in-the-report-19 . Established Jordan preview has no saved DesignID assessment; it truthfully shows the no-report state. Real signed-in learners see only their own connected report.

## Release / harness readiness

Application commit `08b2de9f04735c5d1a91c5f4479169b0560725cc`, deployment `dpl_Es9iuz5QJ3G1jKnDDREpRZykQ2zQ`, READY on the exact sandbox project/alias. The subsequent verification-only change waits for visible Welcome/sidebar and hydrated Trailheads main Journey CTA before real clicks; DOMContentLoaded alone exposed a transient unclickable element on the published site. No application code changed, so the verified application deployment is reused. Published signed-in reports, all five widths, CARE database saves and missing/incomplete states passed before this owner-harness correction; corrected real owner navigation also passed separately. Final combined published suite is recorded under `tmp/unpack-published-test-pass.log`.
