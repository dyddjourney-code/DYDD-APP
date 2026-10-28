# CARE: save at lesson boundaries — 2026-10-28

## Requested contract and root cause

The Journey shared reflection session saved each answer after 700ms idle **and** on textarea blur. Leisurely edits therefore appended multiple “Earlier edits in this round” revisions. It was not a scoring or completion defect. The affected lesson is Module 3, section 3.1, lesson 3, **Who vs Whose**, stable lesson `identity-who-vs-whose-16`; saved keys remain `child-of-god-response`, `old-label-truth`, `whose-before-who`, `whose-tomorrow`.

Course-mode ReflectionSession now keeps edits as drafts across pauses/focus/blur and commits all changed answers/reminders at a lesson boundary: Mark complete, Complete & Next, ordinary Next/Previous, lesson sidebar selection, or a departing same-tab app link. An unchanged answer/departure does not create a revision. Saves are single-flight and use the existing serialized per-question persistence and optimistic revision checks. “Together” means one boundary operation, **one revision per changed answer**, not a database transaction/new combined-answer format. Partial success is retained; retry sends only remaining differences, never re-appends already saved answers.

This same shared contract applies to Journey and the DesignID, Spiritual Gifts, FruitLife360, and DesignPD teaching courses (`compactControls || inlineEntry`). Their existing navigators/completion controls already await the shared flush hook; it now applies to all course modes. Automatic round setup stays Journey-only, and short-course report/prerequisite/explicit first-round gates remain unchanged. Reopening a lesson uses saved answers and allows later editing.

## Failures, browser exits, and Field Kit

- A failed answer/reminder save keeps its draft in the mounted lesson and blocks the requested lesson navigation/completion. Error status plus **Retry saving lesson** remain visible; retry uses the full lesson flush.
- Fields stay visible but disabled during a lesson flush to prevent edits racing with departure.
- Same-document hash navigation and downloads do not count as leaving a lesson.
- Cancellable browser Back/Forward traversal uses the Navigation API where available (verified in Chromium). Closing/reloading/document exit retains the native unsaved-work warning; no “saved” claim or unreliable unload save is made. Browsers without the Navigation API use a capture-phase Back/Forward guard that restores the mounted lesson while saving, then loads the destination after success. This fallback may rewrite the immediate forward-history branch. Native exit warnings are browser-controlled; force-closing/killing a mobile browser cannot be guaranteed. Guidance says to save the lesson before closing/reloading.
- Field Kit does **not** enter course mode. Its explicit Edit/Save reflection/Save all changes, dated walkthroughs, previous revisions, export behavior, and read-only earlier rounds remain intact. Its pre-existing optional private reminder editing semantics are retained. No history/key/schema/scoring/completion/assessment changes or data migration.
- Updated shared CARE directions, per-answer guidance, Pathfinder copy, and introductory learner copy to remove pause/blur autosave promises. Sandbox-only condition differences remain intact.

## Verification commands and evidence

Run in each checkout:

```
npm run typecheck
npm run build
node tests/reflection-lesson-boundary.mjs
# Sandbox component fixture mode:
BOUNDARY_ENV=sandbox node tests/reflection-lesson-boundary.mjs
```

`tests/reflection-lesson-boundary.mjs` bundles the actual shared ReflectionSession/Answer/Workbook and CourseCompletionControls into an isolated browser HTTP fixture. Tests cover all five courses × 1280/390/320 widths; no typing/pause/blur/hash saves; one save per dirty answer at departure; unchanged departure; reopen; failure/retry; no completion on failure; sidebar; browser Back failure/success; Field Kit explicit editing; native reload warning. Fixture storage **is not** real database persistence and the fixture route is never deployed.

`node tests/reflection-sandbox-rpc.mjs` separately uses the existing authenticated sandbox RPC with a disposable `@example.invalid` QA user/round. Confirms genuine DB persistence, unchanged same-row no-op, preserved earlier answer, reopened revision 2, stale revision conflict, anonymous privacy, and verified fixture cleanup. No production database or customer record is changed; no email is sent. No schema/RPC changes are made.

After deployment, run the published actual Who vs Whose player at 1280/390/320 with all reflection/progress APIs intercepted:

```
BOUNDARY_BASE=https://dydd-online-school.vercel.app node tests/reflection-published-fixture.mjs
BOUNDARY_BASE=https://dydd-online-school-sandbox.vercel.app node tests/reflection-published-fixture.mjs
```

This verifies deployed browser code and actual navigation with synthetic answer/reminder fixtures. It is **not** a signed-in customer persistence test. All writes in the browser run are intercepted, including position/reminder/progress writes. Real sandbox RPC evidence is separate.

Private local release artifacts: `tmp/reflection-boundary/` (`proof.json`, `sandbox-rpc-proof.json`, published proofs/screenshots, final `RELEASE.md` and deployment identities); logs `tmp/reflection-boundary-{typecheck,build,test,rpc}.log`. Production deploy: push reviewed HEAD to `origin/master`, then `node scripts/deploy-production-beta.mjs`. Sandbox: commit the scoped change on `sandbox`, push `origin/sandbox`, then `node scripts/deploy-sandbox.mjs`. Verify both target project IDs, exact remote SHAs, READY status and stable aliases independently; never copy environment/signup/admin/runtime configuration between checkouts.
