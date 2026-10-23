# MAPS universal contextual correction — 2026-10-23

## Authorization and scope

John authorized the shared correction for every existing and future participant, native MAPS reference persistence and production release. This supersedes the narrative rules in `docs/maps-final-refinement-2026-10-23.md`; the approved indicator mappings, original bands/scoring, all 48 authored page fields and 36 complete authored term blocks remain unchanged. No sandbox/Pathfinder work is included.

Runtime/reference version: **2026-10-23-contextual-v4**.

## Correct interpretation

A page's Reflection Capacity Lens uses **only its approved mapped reflection(s)**, each at its actual band. It never picks global top-two Strengths or bottom-two Gaps. Abundant (40+) and Steady (25–39) are available capacity even when ranked third/fourth; Limited (10–24) and Drained (0–9) indicate a need for sustainable support, not proof of poor performance. Exact ties have equal treatment without an arbitrary winner. Missing scores do not become Drained findings.

| Page | Capacity relationship | Contextual operations |
| --- | --- | --- |
| Purpose | Shepherd + Architect mean | Calling / Direction / Kingdom Impact |
| Culture | Shepherd | Belonging / Trust / Unity |
| Motivation | Shepherd | Care / Growth / Life-giving |
| Assessment | Artisan | Discern / Understand / Clarify |
| Insight | Artisan | Shape / Refine / Adjust |
| Development | Artisan + Architect mean | Improve / Strengthen / Elevate |
| Proof | Steward | Observable / Measurable / Verified |
| Organization | Steward | Clear Roles / Ownership / Responsibility |
| Reliability | Steward | Consistent / Dependable / Sustainable |
| Energy | Architect | Initiative / Activate / Move Forward |
| Momentum | Architect | Build / Advance / Multiply |
| Outcomes | Architect + Steward mean | Complete / Deliver / Closure |

The three means are indicators, not additional independently measured assessments. Both partners retain their individual bands in the narrative. A split Outcomes average cannot disguise available Architect capacity and depleted Steward reserve.

Examples for a 29 Architect / 35 Artisan / 33 Shepherd / 3 Steward shape (not a code special case): Culture recognizes Shepherd Steady capacity, with no Steward gap; its action invites a quieter voice, keeps a trust-building promise and agrees a shared practice. Proof recognizes Steward Drained reserve and proposes a co-owner to capture a visible result, choose a measure and have a second person verify the evidence. Purpose/Development retain Architect29 as available; Outcomes distinguishes Architect29 from Steward3.

Each page has a distinct three-way PD task read for the appropriate axis and polarity. Stored tendency determines polarity; unsigned magnitude0–5 is balanced,6–15 moderate,16+ strong. Moderate advice calls for a brief check when the task becomes difficult; strong advice schedules that concrete page-specific check. Balanced/missing data never invent an opposite-side deficit. Guidance appears once in the upper Plan / Decide / Do Lens. Bottom cards retain all original scores/bands/tendencies, without duplicated universal prose. Label width is increased for legible Strength/Support spacing; authored teaching stays12px/1.35.

## Runtime paths and existing reports

The only shared generation implementation is deployed `lib/maps-report/report.ts`, imported by `/api/command-center/maps-report`. Every authorized HTML/PDF GET reads the selected participant's latest saved DesignID+DesignPD and generates afresh, with `Cache-Control: no-store` and `X-MAPS-Version`. There is no stored PDF cache to invalidate in this path. The individual and group send code uses the same builder, but **no email or group send is invoked by this release**. Existing participants receive corrected content on their next download without altering snapshots, requiring a retake, or bulk regeneration. Previously downloaded files and already emailed attachments remain historical copies; refresh the Command Center and download again.

Native school project `laojrzlqbkmirzcbcnyw`, MAPS definition row `3ddd19d4-cec9-4fb1-9861-86cc71e7886b`, mirrors the actual `capacityContexts`, `movementContexts`, approved mappings and explicit rank-free policies. Obsolete unused global contribution/task/PD-copy dictionaries are removed from the reference. The sync script defaults to read-only backup/plan; `--apply` performs an optimistic id/version/updated_at-filtered single-row update, then independent canonical readback. Original source/sections/generation metadata are retained. No schema, auth, policy, assessment-score or unrelated definition changes.

## Verification

`node tests/maps-refinement.cjs` checks independent mappings/boundaries,929 assertions plus3072 category×all-band combinations, global-rank independence, exact ties, mixed blends, all36 source concepts, exact unchanged authored teaching, specific Culture/Proof examples, task-specific PD side/intensity/missing, score-only bottom cards and nonmutation. It replaces the faulty former assertion that every page should interpret all four reflections.

Five contrasting full PDFs cover all-bands/opposing/balanced/all-drained/all-abundant; all18pages/no horizontal overflow/12px ABC. Optimized build/typecheck, existing short-form, PDF score units, environment isolation and unchanged DesignID allocation assertions are run. The pre-existing standalone confirmation test has a JSON-module compiler harness issue; its unchanged assertions also run through the repository's established TS loader. Independent editorial QA caught five movement contexts using older/general terms; all three polarities were corrected and regressions now require every page’s three authored concepts in its PD prose. Minor grammar and support punctuation were also tightened. Actual production owner Command Center download and the published PDF receive separate authored-text, page-bounds, chart/wheel parity and visual inspection. Ordinary email/password login and email delivery are outside this verification; no emails sent.

Release receipts and actual PDF are collected under `output/maps-system-contextual-2026-10-23/`; private plans/backups/QA details under ignored `tmp/maps-system-contextual/`.
