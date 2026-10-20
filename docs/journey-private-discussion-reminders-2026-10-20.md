# Private Journey discussion reminders — sandbox only

John approved individual “Bring to discussion” marks and optional notes on October 20. Scope is only CARE reflections inside Discover Your Divine Design Journey. No facilitator send, Circle chat, notification, or sharing is included. John will explain the action in his first CARE lesson; introductory course content is unchanged.

## Learner experience

- Small per-question mark, including unanswered questions. Tap again to unmark; the reflection answer remains unchanged. An existing optional note is retained if re-marked.
- Note field is hidden until “Add a note (optional)” or an existing note; 1,000-character maximum. Mark and note save automatically, on blur, and before Journey lesson navigation.
- Field Kit → Discover Your Divine Design → My discussion reminders opens the same workbook filtered to marked questions. Modules/lessons expand in that view. Each shows the question, current answer, note, and a lesson-return link. Marks/notes can be edited in either location.
- Marks do not share anything. Current walkthrough editable; previous walkthroughs read-only. No additional introduction/setup box in Journey.

## Persistence and access

No schema or policy changes. Uses the existing private `assessment-report-pdfs` bucket, under `private-discussion-reminders/user-<authenticated uid>.json` or `preview-<server-validated review persona>.json`. These are separate from reflection answers and preview workbook objects. The path/identity cannot be supplied by the client. Service-role storage access is server-only; authenticated API verifies round ownership, current walkthrough, and the CARE question allowlist before mutation. Endpoint and UI both require the sandbox runtime.

The small per-owner JSON document has a create-only Storage lock during write, per-question expected revisions for stale-tab protection, private/no-store responses and random cache-nonce downloads. The client serializes reminder/answer/position writes. Failed saves retain drafts and prevent Journey navigation until successful retry. A reminder-load outage does not block reflection loading/saving. No links or signed URLs expose the reminder object. A terminated write can leave a lock: inspect and remove only its exact abandoned lock after verifying no writer is active; never discard the owner document.

CARE IDs derive from actual workbook experiences with `kind === 'care'` (currently 33 questions); Pathfinder and other assessment-course prompts are not enabled.

## Verification

- `npm run build`, `npm run typecheck`
- `node tests/journey-discussion-access.cjs`
- `node tests/journey-discussion-reminders.mjs` (sandbox config only; local default port3124 or sandbox URL via JOURNEY_TEST_BASE)
- Existing `journey-fieldkit-sync.mjs`, reflection catalog/export and environment-isolation regressions.

Browser suite covers account and Jordan preview at1280/390/320px, unanswered marking, notes, Next navigation flush, Field Kit note edit → Journey reopen, unmark, retained answers, failure/retry, stale revision denial, wrong course/question/round/length and origin validation, other-owner API denial, anonymous/authenticated direct-object denial and no public storage access. It restores the preview reminder document exactly if no concurrent change and removes synthetic QA users/objects.

Publish only pushed `sandbox` via `node scripts/deploy-sandbox.mjs`; verify READY, project, exactSHA and stable sandbox alias. Main/stable beta is not part of this release.
