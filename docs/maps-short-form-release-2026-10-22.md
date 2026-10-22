# MAPS short-form rollout — 2026-10-22

## Authorized scope

John approved the Purpose sample, then explicitly requested the same short form throughout MAPS, database persistence, participant-specific interpretation and a refreshed usable production Command Center download. This is a scoped stable-beta/master release, not promotion of unrelated sandbox course/Pathfinder work. No email sends, workbook edits, assessment/result writes, schema/auth/policy changes.

## App and teaching

- All 12 focus pages retain simple definitions, demand/capacity/use, Reflection Capacity and Plan/Decide/Do lenses, all four DesignID scores/bands and all three DesignPD tendencies/scores.
- Concise strength/gap/support follows actual four-reflection ranking (including ties), all four capacity bands, the page's required capacity and each PD axis side/magnitude. Dreamer vs Doer, Feel It vs Think It and Solo vs Together get different support; balanced profiles get task-dependent support, not blanket opposite-side advice. Missing tendencies do not invent a side. Strong magnitudes explicitly call for built-in support.
- All 36 authored ABC definitions, Biblical lenses, design capacities, scripture references and scripture summaries remain word-for-word shared teaching in `lib/maps-report/content.ts`.
- Reflection Space and repetitive per-term movement prose removed. ABC body 12px, line-height1.35; consistent headings, padding and spacing match the approved Purpose sample.
- Cover circle and all four phase/chart section markup are exactly unchanged. Existing responsive and print styles for these visuals are unchanged. Fresh baseline/revised PDFs rendered in the same Chromium run prove cover and all four phase/chart pages pixel-identical. Historical PDF files created in an earlier render are not used for that pixel claim.
- Command Center names the short-form roadmap. Existing protected GET generates from the current participant's latest saved DesignID + DesignPD; no-store preserved, version response header `X-MAPS-Version: 2026-10-22-short-form-v1`. Existing email capability remains unchanged and was not invoked.

## Persisted native definition

Production Supabase school ref `laojrzlqbkmirzcbcnyw`, table `native_assessment_definitions`, MAPS row `3ddd19d4-cec9-4fb1-9861-86cc71e7886b` only. Prior version2026-10-09 → `2026-10-22-short-form-v1`. Existing sections/term-label arrays and generation/required-assessment metadata retained; `authored_sections` now stores all full authored teaching, and `short_form` stores layout and score-aware support reference content/policy. The app generator remains the canonical runtime and does not fetch a stale native definition to render.

`node scripts/sync-maps-short-form-definition.cjs` defaults to read-only backup/plan. `--apply` validates production ref, makes a timestamped private backup, uses optimistic id/version/updated_at filters, updates one row and independently reads back/canonical-compares the exact JSON. Original pre-update backup2026-10-22T23-22-43-394Z and final-copy timestamped backup under `tmp/maps-short-form/`; receipt `database-receipt.json`, readback `native-definition-readback.json`; definition SHA256 `d28534c8152aadccb52f323ac0ae2932a883f94ef8d380cecb1b91be82a5aadb`.

Supabase changelog index and current JavaScript update docs reviewed. Recent breaking-change entries concern extensions/indexes, automatic new-table exposure and GraphQL; none applies to an existing single-row JSONB reference-content PATCH. No migrations or policy changes needed.

## Verification

- `node tests/maps-short-form.cjs`: all 12 pages/all 36 shared teaching blocks, contrasting ranks, ties, all bands, all opposing PD axes, balanced/zero/missing inputs, imported/derived score shapes, degree-dependent support and input immutability PASS.
- `node tests/pdf-score-display.cjs` PASS; `node tests/environment-isolation.cjs` PASS.
- Existing `tests/designid-maps-confirmation.cjs` assertions PASS through the existing TS loader. Its unchanged standalone `tsc` test harness fails because it lacks JSON-module flags and assumes an obsolete flat emit path; unrelated test harness not modified for this release.
- Typecheck and optimized Next production build PASS.
- `node tests/maps-short-form-render.cjs`: mixed all-bands, opposing PD, balanced/zero, all-drained and all-abundant in-memory profiles all render18 pages with12focuspages and12px ABC body PASS.
- John real current inputs plus synthetic contrasting profiles all render18 pages, no horizontal page overflow. All18 John pages/contact sheet visually inspected; no out-of-paper text. Real scores are read only, never rewritten by this release.
- Existing built-in `/owner` entry recovered the already-configured owner-preview credential after masked local/Vercel env pulls failed. Protected production Command Center and its actual John PDF link returned200 before deployment. No auth changes, new users or emailed login links required.

## Release evidence

Exact SHA/deployment and published after-release PDF evidence are recorded in `tmp/maps-short-form/release-receipt.json` and `live-after-proof.json` on completion. Private preview keys are not included in published evidence or URLs. Download route requires existing admin/owner access; a login redirect is not considered verification.
