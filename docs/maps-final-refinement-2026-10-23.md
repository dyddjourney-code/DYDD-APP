# MAPS Personal Roadmap final refinement — 2026-10-23

## Authority and source

John explicitly authorized this stable `master` release and the one native MAPS definition update. This is not promotion of sandbox/Pathfinder work. Shared teaching source remains `lib/maps-report/content.ts`, unchanged from the preceding `d42ba498` release/workbook-aligned 36-term content. The new indicator blends and generated interpretation are approved MAPS presentation rules, not changes to DesignID scoring or independently validated measurements.

Runtime/reference version: **2026-10-23-personalized-v3**.

## Indicator contract

The chart retains its 0–60 scale and existing four phase colors. The nine single-reflection indicators retain their existing assignments. Three arithmetic means replace single-reflection proxies:

| Indicator | Reflections | John (Architect29 / Artisan35 / Shepherd33 / Steward3) |
| --- | --- | --- |
| Purpose | mean(Shepherd, Architect) | 31 |
| Development | mean(Artisan, Architect) | 32 |
| Outcomes | mean(Architect, Steward) | 16 |

Each phase-opening strip now names its three reflection relationships in regular-weight parentheses; each of the four opening pages explains paired averages and the non-independent indicator meaning. The cover wheel has no participant overlay and remains unchanged. No reflection labels added to detailed focus-page titles.

## Personalization and layout

- Twelve explicit task dictionaries each define a different contribution for all four reflection identities. Every focus page's strength/gap rows together interpret all four identities at their actual bands. Available lower-ranked capacity is not called a deficit. Limited/Drained contributions are small/supported possibilities, not unsupported claims of strength.
- Each required reflection's support has four distinct band branches, including each partner in blends. Outcomes16 does not conceal John's Architect29 / Steward3 split; ownership help follows Steward3, not a fictional independently measured Outcomes capacity.
- All three PD axes retain stored tendency polarity and unsigned magnitude thresholds: 0–5 balanced, 6–15 moderate, 16+ strong. Strength, gap and need differ in flexible versus default preference / occasional versus built-in support. Each of twelve pages adds its own action, check and failure mode. Six sidebar polarity branches give different brief versus scheduled/required actions. Balanced and missing tendencies never invent an opposite-side need.
- All original Simple Definition / Project demand question / Core capacity need / Common use strings, and all 36 authored ABC definitions, Biblical lenses, design capacities and scripture fields are exact. Four equal-width teaching blocks use faint 16%-phase-color vertical rules. ABC stays12px/1.35; letter-index badges sit beside headings to reclaim vertical space. Lenses use readable stacked mini-rows; sidebar guidance is concise.
- Restrained final page: three practical next-step prompts and a resource link; removes oversized CTA/remote QR. Document remains18pages, not expanded.

## Native definition, precedence and caching

Only school Supabase project `laojrzlqbkmirzcbcnyw`, `native_assessment_definitions` MAPS row `3ddd19d4-cec9-4fb1-9861-86cc71e7886b` is updated. Existing sections/labels, source, generation metadata and required assessments remain. `authored_sections` preserves teaching; `short_form.personalization` centrally mirrors all12 reflection tasks, all12 movement contexts, three blend mappings, PD copy/sidebar matrix and policies. No migrations, policies, assessment results, underlying instruments, auth changes, emails or bulk regeneration.

`node scripts/sync-maps-short-form-definition.cjs --output=tmp/maps-final-refinement` defaults to a read-only backup/plan. `--apply` validates exact project and row, backs up prior definition privately, optimistic-filters id/version/updated_at, updates exactly one row and independently compares canonical JSON. Previous version `2026-10-22-short-form-v2`. Readback SHA256 `ced5bfec84fb86a0be76c17c38cb3af1ea7bd0cc31c691e2021c158dbc6ab0ed`. Backup and receipts are in the private ignored tmp directory.

Actual runtime precedence: `/api/command-center/maps-report` imports `buildMapsRoadmapHtml` from the deployed `report.ts`; it does **not** render from a database-native stale definition. Each authorized GET reads the requested participant's latest saved DesignID + DesignPD, then generates current HTML/PDF. Both responses explicitly use `Cache-Control: no-store` and the version header. Thus all participants get the new rules on their next download, without writing their snapshots or regenerating batches. The DB reference mirrors the same deployed dictionaries.

## Verification and release proof

- `node tests/maps-refinement.cjs`: independent authored-source comparison;1325 checks plus all3072 category × four-band-combination cases, each identity at0/9/10/24/25/39/40/60; exact other-nine mappings and John's31/32/16; actual lens wiring, all twelve distinct strengths/gaps/supports, ties/missing/nonmutation; both PD polarities at0/5/6/15/16/60, explicit balanced and missing, sidebar moderate/strong distinction; all12 opening labels.
- Independent review caught support being identical at39→40. Corrected before release; all relevant reflection bands now independently alter support, including both blended partners.
- Existing short-form narrative, PDF-score units, environment isolation, typecheck and optimized Next build pass.
- Chromium full-document rendering: five contrasting profiles (all bands/opposing/balanced/allDrained/allAbundant), both default fonts and deployed OpenSans,18pages each. Actual John PDF18pages; allpages contact sheet visually inspected. Page3 and final-page large inspection confirms faint rules, readable teaching, balanced whitespace and no expansion. Published PDF receives separate all18page authored-text/bounds inspection.
- Final exact commit, Vercel production deployment/alias and actual protected owner Command Center button-click download receipts live under `output/maps-final-refinement-2026-10-23/`. Existing owner entry is used without changing auth; ordinary email/password sign-in is outside this proof. No email delivery path tested or invoked.
