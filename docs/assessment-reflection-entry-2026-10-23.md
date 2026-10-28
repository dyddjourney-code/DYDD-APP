# Assessment-course reflection entry (sandbox only)

## Approved scope

DesignID (`designid-foundations`), Spiritual Gifts (`spiritual-gifts-service`), FruitLife360 (`fruitlife-360-formation`), and DesignPD (`designpd-alignment`). Their course players and the three existing standalone assessment-lesson routes now introduce the workbook at the first encountered reflection, including direct lesson links. No Journey, scoring, source lesson, report-personalization, prerequisite, API, database schema, or production changes.

## UX and implementation

- Removed the opening workbook lecture/setup bar from these course players.
- The first reflection offers **Your private reflections**, **Save what you notice as you work through this course.**, and **Begin my reflections**. It creates the existing deliberate round; it does not auto-start or autosave assessment reflections.
- Optional report selection lives inside **Link these reflections to a report (optional)**. Helper: **This labels this set of reflections; your lesson content stays the same.**
- Beginning reveals the existing answer, explicit **Save reflection**, and saved/error status. Existing dated rounds, revisions, read-only history, report metadata, and retake rollover remain the same persistence path.
- **Previous reflections and fresh sets** are secondary, collapsed workbook controls (below the course navigator or in Field Kit), not an opening lecture. Existing course/workbook answers still share the same keys and records.
- `inlineEntry` opts in only the four allowlisted assessment courses. Navigator `entryPoint` marks only the first rendered prompt in the active lesson; deep links need no prior lesson visit. The shared Journey automatic-workbook branches are unchanged.

## Verification

`npm run typecheck`, `npm run build`, environment isolation, owner-preview access, reflection catalog/export, Journey discussion access, plus `tests/assessment-reflection-entry.mjs`.

Run browser acceptance with `REFLECTION_ENTRY_BASE=http://localhost:3124 node tests/assessment-reflection-entry.mjs`, or the exact sandbox stable alias. It refuses non-sandbox hosted targets, loads only sandbox credentials, creates one synthetic confirmed account and isolated prerequisite snapshots, verifies real round creation/save/reload/revision history/fresh sets/read-only history/retake rollover/text export, and deletes that account and cascaded records in `finally`. No email or PDF generation is invoked. One intentionally intercepted failed save checks draft retention/retry separately from subsequent real writes. Ordinary-learner requests block the existing sandbox owner-entry prefetch so owner-preview cookies cannot contaminate the isolated account proof. Owner-entry navigation is separately checked without writing owner workbooks.

DesignID uses its dedicated course player with `?lesson=` deep links. Its separate standalone reading page retains the existing “Open this lesson to save your reflections” link into that player; it does not mount the generic standalone workbook. No route is invented by this change.

Screenshots and layout checks: 1920, 1280, 768, 390, and 320px for every course; saved text controls at 1280, 390, and 320px. Zero runtime errors and no horizontal page overflow. Raw evidence and cleanup receipts: `tmp/reflection-entry-{local,published}-*`.

Baseline caveat: legacy `tests/designpd-course-access.cjs` is stale independently of this change: its Heather mock omits `getNewReviewReport`, and after a temporary mock repair its expected old `/field-kit#optional-expansions` redirect disagrees with the existing `/trailheads#designpd` implementation. The file is left unchanged. Current owner/access tests and actual authenticated/anonymous four-course acceptance cover the affected boundaries.

## Publication

Publish only pushed `sandbox` through `node scripts/deploy-sandbox.mjs`. The production `master` SHA and stable production alias are captured before release, compared after release, and must remain unchanged. Exact commit, Vercel deployment, stable alias binding, immutable URL, and real published acceptance results are recorded in `tmp/reflection-entry-release-after.json` and the published proof/cleanup JSON files.
