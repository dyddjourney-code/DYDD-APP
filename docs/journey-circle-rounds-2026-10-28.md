# Journey review and Circle setup — October 28, 2026

Authorized scope: items 1–9, production and sandbox; no scoring, assessment statement/result, schema, auth or email changes.

## Journey rounds and assessment references

`Review my reflections` already targets the Journey Field Kit workbook. The page now identifies itself as **Your Journey Reflections**, explains the private saved writing and presents the current round directly. Round/history/new-writing controls are a separate collapsed disclosure, not prerequisites to reading answers. The normal review no longer offers a report-connection or course-only choice.

Journey context reads eligible owned completed **DesignID and Spiritual Gifts** results through the existing exact-ownership report and eligibility helpers. A first round automatically captures the newest unambiguous result of each kind, with its instrument and completion date/time. Tied latest dates require an explicit choice instead of choosing an arbitrary report ID. Missing results do not block Journey writing and do not require a retake.

The existing text `reflection_rounds.source` carries a versioned `journey-assessments-v1:` JSON list of immutable references (ID, assessment type, completion date, display label). Scores/results are not changed or copied. `assessment_label` holds readable source labels for existing exports. There is no schema migration, RLS change or global result mutation. Older rounds without captured references are read as-of their start date; the UI explicitly distinguishes this inferred association from an originally recorded connection. No historical rows are rewritten to invent an original association.

**Start a new reflection round** creates empty responses, retains the current round's assessment sources, and preserves all earlier answers/revisions/dates. **Choose different or newer assessment results** is separate, names each assessment and dated result, and deliberately creates a new empty round using the selected owned results. A newly completed Journey assessment does not automatically create a round or lock the current answers. Existing assessment-course rollover behavior outside Journey is unchanged.

Course and Field Kit continue using the same saved entries and stable question keys. Previous-round save denial remains enforced by the existing database RPC and RLS. No private answers are exposed to Circle leaders.

## Verification

`tests/journey-assessment-sources.cjs` verifies dual instruments, dated legacy fallback, frozen labels/IDs, newer-result separation, ambiguous completion dates, empty/malformed metadata. The genuine signed-in synthetic browser suite is `tests/journey-circle-published.mjs`; release receipts, screenshots and exact environment deployment evidence are recorded under `tmp/journey-circle-release/`.

Existing course-eligibility handler, account-identity binding, current-activities/export, environment-isolation and assessment allocation regressions remain required. No real learner email sends or customer assessment/result mutation are part of QA. Synthetic recipients are suppressed before auth creation and all fixture data removed.

Journey teaching personalization is also round-scoped: server-rendered DesignID reflection names/capacity/snapshot and the Spiritual Gifts saved Top Gifts snapshot read only the selected current-round report IDs. Both snapshots identify their assessment completion date. A different/newer result does not silently replace the current round's teaching values. Spiritual Gifts supports current native Top Gifts and retained summary/reportPayload fields; missing values show unavailable rather than invented data. The gifts-module snapshot and DesignID lens do not recalculate scores.

Unavailable-original-reference edge case: a current round's originally recorded source can be retained (with an explicit unavailable label) while the learner selects a newer result for the other instrument. It cannot be replaced by an arbitrary foreign source ID. While reading history, the fresh-writing disclosure explicitly lists the *current* round's sources; newer-result selection is offered only on the current round. A failure to load the current Journey round fails closed instead of silently substituting latest teaching values.
