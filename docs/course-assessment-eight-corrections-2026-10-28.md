# Eight course and assessment corrections — October 28, 2026

Scope: new correction set, production and sandbox. This is distinct from the earlier `eight-learner-fixes` release. No scoring formulas, assessment statements, customer results, admin identity, environment configuration, database schema, or CARE save boundaries are changed. Private receipts live under `tmp/new-eight-course-fixes/RELEASE.md`.

## Corrections and contracts

1. **DesignID saves:** explicit Save reflection flushes existing dirty fields without completion/navigation. Complete & Next waits for the same serialized flush; failures retain drafts and prevent departure. Directions explain both. No idle/blur autosave.
2. **Capacity:** Module 2 Lesson 3 renders each saved capacity word beside its actual numeric saved score, including zero, on the original 0–60 scale. No recalculation or score mutation.
3. **Integrated reflection:** Module 2 Lesson 4 renders Your Integrated Reflection from the existing authenticated report's integrated result/expression, with unavailable state rather than sample data.
4. **FruitLife email:** participant assessment-start/self invitation and manual/automatic/status reminders are suppressed in both self-only and observer cycles, including old queued retry eligibility. Observer invitation/reminder series and participant actual report/result mail remain eligible. Disabled participant mail is not a failed delivery.
5. **FruitLife submission:** completion page resolves actual session status, exposes ready report directly in a new tab, shows a direct Take the course action, and links the precise FruitLife Field Kit collection. Pending observer counts and report preparation are explicit; no aggregate/result is invented. Observer completion cannot expose participant report/tracker.
6. **Private reflections:** one-time Start my reflections is explained beside the first prompt; instructions identify the private workbook, boundary saving and Field Kit review location.
7. **Association:** a fresh round automatically chooses the latest eligible owned completed report when selection is omitted/null. Optional explicit historical selection must belong to the account and remains attached to its own round. Existing dated rounds/answers/revisions are retained, and reports are ordered by actual completion date with deterministic fallback.
8. **Progress lockup:** course eligibility is separate from full360 badge eligibility. An owned valid completed self-only report opens teaching/reflections/progress without an optional connection click. Incomplete/missing reports and incomplete observer cycles stay gated. Earlier native sessions left report_mode null; recover their actual mode only from the same owned linked report snapshot, and persist actual payload mode when future reports finalize. Exact account/participant ownership is checked at the privileged boundary, never canonical-Gmail aliases. Failed completion offers Retry saving lesson, retrying the actual failed POST and intended advance rather than merely refreshing GET.

## Verification

```
node tests/designid-personalized-results.cjs
node tests/designid-save-next.mjs
node tests/course-eligibility-handlers.cjs
node tests/course-correction-browser.mjs
node tests/fruitlife-email-policy.cjs
node tests/fruitlife-completion.cjs
node scripts/verify-fruitlife-lifecycle.cjs
node scripts/verify-fruitlife-worker.cjs
node tests/reflection-lesson-boundary.mjs
node scripts/verify-current-assessment-awards.cjs
node tests/account-identity-binding.cjs
node tests/basecamp-admin-boundary.cjs
node tests/environment-isolation.cjs
node tests/designid-allocation.cjs
npm run typecheck
npm run build
```

`tests/course-corrections-published.mjs` uses a newly-created confirmed synthetic account, direct synthetic owned native self-only sessions/report snapshots, real signed-in APIs and real database round/reflection/progress persistence. It does not submit an assessment or enqueue/send mail. It tests no-assessment denial, no-manual-connect startup, latest selection, save and completion failure/retry/reload at 1280/390/320, explicit historical selection, retained history, independent strict full360 badge gate, and finally removes all fixtures. `COURSE_ENV=production|sandbox` validates separate credential/project hosts; `COURSE_BASE` optionally selects loopback for pre-release checks. Mocked/fixture email tests never call the real provider.

Port only scoped code/test/doc changes between respective heads; do not copy environment/runtime/middleware/signup/cron files. Run the documented production and sandbox deploy scripts, then independently check exact pushed SHA, project and stable alias READY. No database migration or environment change is required.

## Limits

Chromium desktop/mobile emulation, not physical Safari/iOS. Email purpose/eligibility/provider behavior is mocked; no real invitation, reminder or report email is sent or inbox-delivery claim made. Generated report readiness uses saved synthetic fixture facts rather than running the PDF/scoring pipeline. Real customer accounts/results are neither impersonated nor changed.
