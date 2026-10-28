# DesignID: save and saved-report presentation — 2026-10-28

Scope: requirements 1–3 only; local release checkout, no commit/push/deploy, customer records or emails. Applied source-faithful-course-lessons and multi-step-assessment-verification skills; read repository AGENTS and current save-boundary/source mapping documentation. Existing authored workbook snapshots, prompts, reflection keys, teaching, scale and scoring are unchanged.

- All DesignID reflection lessons have **Save reflection** again. It calls the existing serialized reflection flush without completing or departing the lesson. **Complete & Next** continues to await the same flush before completion/navigation; failures retain drafts and block departure, with existing retry/error state. New directions explain both choices and saving before reload/close. No pause/blur autosave is promised. No shared reflection/backend/progress change was needed for these requirements.
- Module 2 Lesson 3, `reflection-capacity`: each learner-specific capacity word now has its actual saved numeric `Architect_Pts` / `Artisan_Pts` / `Shepherd_Pts` / `Steward_Pts` beside it, including zero. Canonical `Band_*` fields remain the source of words. No division, normalization, new thresholds or score calculation. The authored ranges remain Abundant 40–60, Steady 25–39, Limited 10–24, Drained 0–9.
- Module 2 Lesson 4, `integrative-reflections`: **Your Integrated Reflection** renders the saved `Integrative_Reflection` and `Integrative_Expression` (existing `Integrative_Summary` fallback) through the existing authenticated report context. The six reference rows remain intact. All report fields remain HTML escaped; missing fields explicitly say “Not available in your saved report.”

Checks:

```
node tests/designid-personalized-results.cjs
node tests/designid-save-next.mjs
node tests/designid-authored-source.cjs
node tests/designid-allocation.cjs
npm run typecheck
npm run build
```

`designid-personalized-results.cjs` traces ten contrasting saved-profile/report-shape fixtures through the actual context reader and renderer; covers capacity boundaries, zero, integrated label/expression, unavailable states, escaping, immutable report data.

`designid-save-next.mjs` bundles the real DesignID navigator, ReflectionSession and CourseCompletionControls, using synthetic HTTP storage only. At 1920/1280/768/390/320 it exercises manual save without completion, failed manual save/retry, pause/blur not saving, immediate Complete & Next without manual Save, failure blocking completion/departure, retry, reopen and unchanged-answer revision no-op. Artifacts: `tmp/designid-save-next/proof.json`, navigator screenshots. This verifies real browser components/requests, **not authenticated database persistence**. No data/email tools are invoked. Existing allocation regression reports zero private historical workbook fixtures available; its audited statements/formula/vector regressions still execute.
