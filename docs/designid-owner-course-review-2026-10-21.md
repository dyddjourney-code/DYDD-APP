# Sandbox owner DesignID course review

## Cause and entry

The published Welcome lesson was present, but Jordan Preview has no saved DesignID assessment. The ordinary course prerequisite therefore redirected the owner back to Trailheads. A second mismatch was that Command Center sidebar links preserve `review=owner`, while participant/course previews use `review=new` (Jordan). An assessment-backed preview was incorrectly the only way to review this teaching.

Use the **existing private sandbox Owner Command Center** entry, then sidebar **Trailheads → DesignID → Preview DesignID Course (Owner)**. Existing Jordan Preview → Trailheads works too. No new login link or assessment attempt is needed. The same authorization also opens the standalone Welcome lesson. Credentials are never recorded here.

## Smallest scoped change

`lib/trails/course-preview.ts` verifies the existing owner credential server-side and sandbox environment before allowing DesignID Foundations teaching review. It maps a verified Command Center `owner` request to the established isolated `new` persona on Trailheads and the two DesignID course/lesson routes. It never creates an account/session, assessment, snapshot, entitlement or result. Ordinary learner assessment gates, other courses, paid expansion, pricing and production behavior are unchanged.

Trailheads retains the truthful incomplete assessment action and adds a separate owner preview button. Both DesignID routes show an explicit owner-preview notice. Missing snapshot values still say **Not available in your saved report.** There are no example values passed off as Jordan's results. No-assessment reflection/new-round restrictions are unchanged: teaching review is available, but no assessment-backed new workbook round is granted. Existing isolated workbook storage remains separate from learner records.

## Checks

- Server authorization matrix: configured correct owner/Jordan credential + sandbox only; no/invalid credential denied; signed-in learner without assessment still redirected; Heather/paid expansion and production unchanged.
- Browser: actual Owner Command Center → existing sidebar Trailheads → new owner button → Welcome, standalone Welcome, desktop/390px phone, truthful three missing snapshot fields, zero runtime errors/overflow; anonymous and invalid credentials denied at both routes; no anonymous owner CTA. Preview reflection API continues `canStart:false`, no report records.
- Existing source parity/neighbor/audio/reflection-key tests, preview-profile access tests, typecheck, optimized build and whitespace checks.
- Deployment: push sandbox only, explicit isolated deployment, then verify project + Git SHA + expectedCommitSha + stable alias and rerun browser proof on exact deployment. Receipt is under ignored `tmp/designid-owner-preview-receipt.json`; ledger records final outcome.

## Prior Welcome build time and reusable batch checks

Git/log evidence: authored refresh commit `98affe9` at 16:33 UTC, cosmetic follow-up `a891bef` at 16:36, exact final deployment/QA receipt at 16:39. Earlier local evidence begins at 16:25; the 16:29 ledger already reports source import, first-lesson implementation and local source/build checks complete, with persistence/layout QA active. The ~16:25–16:39 observable verification/publish tail is not a claim of total authoring duration. Optimized Next compilation itself was only **1.976 seconds**, static page generation **341ms**. Significant elapsed work went into current-sheet/rich-source mapping, real-account persistence/history/export checks, five-width screenshots/image/audio/flow geometry, inherited tablet/menu/header corrections and two deployments with published regression reruns—not compilation.

For future batch content imports, reuse the common source/catalog/export/unchanged-neighbor/audio checks, authorization/environment matrix and typecheck/build **once per batch**. Use a representative actual-account save → Field Kit edit → reopen/export/history + failure/retry test per storage behavior, not redundantly per prose lesson. Keep per-lesson source completeness, reflection key/prompt compatibility and focused desktop/phone rendering checks; broaden widths where layout is novel. Deploy the reviewed batch once, confirm exact SHA/alias, then perform focused published smoke checks. Existing Welcome suites `tests/designid-welcome-source.cjs` and `tests/designid-welcome-browser.mjs` are reusable evidence, not grounds to skip checks for changed behavior. No batch tool was implemented.
