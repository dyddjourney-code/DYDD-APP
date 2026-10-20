# Journey automatic workbook — sandbox only

John approved removing the entire top reflection setup/history box, not just collapsing it. The class begins with course navigation/content; CARE and Field Kit explanations belong in the teaching where relevant. Inline digitized workbook prompts remain unchanged. Group-discussion marks remain a discussion topic, not a sharing feature implemented here. DesignID lesson rewriting and quizzes are separate future work.

## Implementation

- Journey's compact session now hides all top reflection controls. Field Kit retains history/round selection, optional report controls and manual editing.
- Opening Journey automatically ensures an initial workbook for an authenticated learner or authorized owner preview. Existing workbooks are reused; first real-account round uses a deterministic owner-scoped UUID so concurrent first visits cannot create duplicate initial rounds. Existing RLS and ownership checks apply. No schema/policy/config changes.
- Journey answers save after a 700ms typing pause and on blur. Saves and position writes use one queue, including owner-preview Storage writes. Edits made during an in-flight save are queued against the returned revision.
- Next/Previous/course-map lesson selection flushes pending answers before changing lessons. Ordinary link navigation also waits for saves. Failed saves retain the draft, show a retry action beside it, and prevent the lesson/link change. Browser close/reload retains the existing unsaved-change protection.
- Quiet per-answer Saving/Saved status; no Begin reflections or report-connection setup in class. Same round/question/entry history powers Field Kit; neither copies nor hidden parallel answers are created.
- Field Kit's previous dated reflections, exports and report-specific trail behavior remain available. Journey always opens its current round; dated-history reading stays in Field Kit.

## Verification

- Production build/typecheck; environment isolation; full reflection catalog parity; reflection text/export access tests.
- `tests/journey-fieldkit-sync.mjs`: sandbox-only synthetic account, no manual initial setup, idempotent ensure, desktop1280/phone390/320 autosave → Field Kit → manual edit → Journey reload; immediate Next flush; network failure retains draft/blocks navigation/retry; edit during in-flight save; cross-tab revision conflict retains draft and prevents overwrite. Synthetic accounts removed afterward.
- `tests/journey-preview-autosave.mjs`: authorized sandbox Jordan autosave and same Field Kit answer at1280/390/320. Original workbook restored exactly; test refuses to overwrite concurrent edits.
- These tests validate their target against the sandbox allowlist. Legacy reflection-history test hardcodes stable credentials and is not used as a sandbox regression suite.

Publish only the pushed sandbox ref through `node scripts/deploy-sandbox.mjs`; verify exact Vercel SHA/READY/alias, then repeat the two Journey browser suites against the sandbox alias. No main branch changes, schema migrations, sharing changes, learner messages or email sends.
