# DesignID allocation restoration — October 15, 2026

## Requested contract

- Twenty sets, four full audited statements per set; one independently selectable 0/1/2/3 value per statement.
- Exactly five points per set; repeated numbers (including multiple zeroes) are valid. Total = 100.
- Live running total and points remaining/excess. Back/Next preserves choices. Server rejects missing, duplicate, noninteger, out-of-range, and incorrectly totaled responses.
- Preserve the existing 80 edited statements exactly. A frozen fixture matches the September 4 audit's suggested wording and the existing native bank, and all code/reflection mappings match the live Key tab. No further statement edits in this change. The audit's explicit final-approval column is blank; the test verifies the existing edited bank, not a new approval claim.
- Keep the 12-word clarification sort separate from the primary score/order, capacity bands, and derived DesignPD outputs. Its hint is interpretive, not evidence of improved psychometric validity.

## Read-only source verification

Read the live DesignID scoring workbook: Key, Scored row-two formulas, DesignPD_Helper, DesignPD_Report_Data numeric/tendency formulas. No live workbook edits or scenario runs.

The previous native implementation used 3/2/1/0 ranking (120 points), percentages against 60, different movement pairings, and an invented 18-question DesignPD path. These are replaced by the source contract:

- Reflection points = sum of the mapped allocations; total = 100.
- Stored percentages = points / total (fractions). PDF-facing percentage labels are formatted as percent strings because the existing PDF template prints the label directly and strips `%` for the chart.
- Bands: >=40 Abundant; >=25 Steady; >=10 Limited; otherwise Drained.
- Dreamer = (Shepherd + Artisan) / 200; Doer = (Architect + Steward) / 200.
- Feel It = (Architect + Shepherd) / 200; Think It = (Artisan + Steward) / 200.
- Solo = (Architect + Artisan) / 200; Together = (Shepherd + Steward) / 200.
- Movement = respective differences, with no lossy two-decimal rounding.
- DesignPD tendencies: absolute movement <=0.05 Balanced; >=0.16 Strong; otherwise Moderate, using the source polarity.
- DesignPD display scores = absolute rounded movement ×100; signed movement remains distinct in the payload.
- Legacy primary/secondary column tie order remains unchanged; exact/near-tie flags and the separate sort remain available without rewriting scores/order.

New native DesignID snapshots store allocation answers, block totals, the existing question-version identifier, and `scoringVersion: designid-allocation-5x20-v1`. DesignPD records the source DesignID snapshot ID, movement, and `designpd-derived-workbook-v1`. A 120-point native legacy run cannot feed DesignPD; it requires a fresh corrected DesignID run. Existing records are not rewritten/deleted. No Supabase schema, RLS, auth, pricing, credit, Make, or Jotform changes.

## Verification

- `node tests/designid-allocation.cjs`: exact 80-statement audit/key mapping check; all 40 legal per-set patterns and all illegal sums; duplicate/missing/out-of-range rejection; original point/fraction/band/movement formulas; all 130,931 feasible 100-point vectors (each reflection <=60) for DesignPD thresholds, direction, and score magnitudes; report units; sort invariance.
- Optional private historical fixture: `DESIGNID_HISTORICAL_FIXTURE=/tmp/designid-anonymous-workbook-results.json node tests/designid-allocation.cjs`. 240 valid real historical allocation rows matched live workbook point totals, fractions, bands, movement, primary/secondary/pair key, and DesignPD helper tendencies/movement. Private allocations stay outside git; no names/emails are in the fixture or printed by the comparison.
- `node tests/designid-maps-confirmation.cjs`: secondary validation, normalized reflection means, tie hints, no mutation of main score/order, report integration.
- `tests/designid-allocation-ui.mjs`: local real form with non-delivering action, missing/under/over-total handling, zero/repeated choices, keyboard, 20 sets, Back/Next preservation, desktop/touch, running total, logo size, narrow overflow, native drop, real grip movement, tap/menu placement, balanced limits, review, and captured 80+12 fields totaling 100. A desktop grip/native drag collision was found and corrected by preventing native HTML drag initiation during pointer-grip capture.
- To repeat local UI QA, copy `tests/fixtures/designid-local-harness.txt` to `app/qa-designid-allocation/page.tsx`, start localhost:3107, run the UI script, then remove the route before building. Never deploy the harness. Stop the owned dev server and relocate its generated dev cache outside the repository before production build if it retains route-validator references.

## Verification boundary

This restores and verifies numeric scoring and DesignPD handoff, not the entire historical report-content migration. Existing native narrative libraries/report copy have not been certified identical to every live workbook content-library output. No live assessment save/PDF/email was triggered by these checks. Production authenticated UI and deployment verification are recorded below after release. Do not represent a local captured submission as a live save/email test.
