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


## Header cleanup and artwork — sandbox follow-up (2026-10-21)

John requested the real learner course appearance during owner review. This
follow-up supersedes the earlier requirement above to display an owner/Jordan
preview notice inside the DesignID course and standalone lesson. The notices and
course-level Individual walkthrough / missing-pattern panel are removed from
rendering. Sandbox access checks, query/cookie/recovery flow from `f6a989c`, global
gold sandbox indicator, genuine lesson/report values and reflection restrictions
are unchanged. No assessment, result, entitlement or workbook records are created.

The course sequence is **DesignID Course** / **Identity**, panoramic illustrated
forest-path header, existing three numbered module references, **Your Private
Workbook** controls, then unchanged lessons. The redundant Open course lessons
CTA, logo, class-branch label, header scripture, marketing description and extra
course-help panel are removed. Route/storage slug remains `designid-foundations`.
Journey, lesson content, companion audio and reflection keys remain unchanged.

Artwork: generated source `designid-forest-path-cartoon-header---b31ac27d-dd03-4ff1-904e-7e7809120427.png`
(2135 × 736), optimized to `public/brand/designid-course-cartoon-hero.png`
(1913 × 659, 761,603 bytes). The scoped `.designid-course-hero` background uses
Journey's two subdued cream/green overlays and center/cover geometry. Journey's
shared typography, spacing, border, responsive layout and clamped hero height are
inherited; its own artwork is untouched. The frontend skill's novel-layout defaults
are overridden by John's explicit Journey visual-match requirement.

Verification: typecheck, optimized build, current Welcome source/unchanged-neighbor
and audio/reflection-key checks, owner-course authorization matrix and whitespace
checks. Focused read-only browser proof covers desktop 1280px and phones 390/320px,
actual `/sandbox-review` entry, existing Owner Command Center → sidebar Trailheads
→ DesignID navigation, direct cookie-backed course/lesson access, global gold-bar
recovery, missing snapshot honesty, no new workbook round, anonymous/invalid denial,
no horizontal overflow and zero runtime errors. Screenshots and logs use the
`tmp/designid-header-*` prefix and are not committed. No assessment submission,
record creation, or email was performed.

Publish only pushed `sandbox` via `node scripts/deploy-sandbox.mjs`; verify READY,
project ID, exact Git SHA and expectedCommitSha, stable sandbox alias, and unchanged
production deployment. Repeat focused browser proof against the stable sandbox
alias. The final deployment receipt is `tmp/designid-header-receipt.json`; record
post-release outcome outside Git to avoid a documentation-only deployment loop.


## Course navigation preference — sandbox follow-up (2026-10-21)

John requested no redundant top navigation row on the DesignID course. Removed
Back to Trailhead, Return to My Journey and DYDD home from this course page; the
existing sidebar handles site navigation, as it does for the Journey course.
Removing the entire nav element also removes its bottom margin and mobile pill
wrapping space, bringing the forest hero directly to the shared Journey shell
padding. No new spacing override is needed. Keep the forest artwork, hero sizing,
sidebar/mobile navigation, global gold sandbox bar, authorization, modules, lessons
and private workbook unchanged. Standalone lesson navigation remains unchanged.

Verified with typecheck/build, whitespace review and focused desktop/phone browser
checks before and after sandbox-only publication. Evidence uses ignored
`tmp/designid-nav-*` artifacts; deployment receipt confirms the exact pushed SHA,
stable sandbox alias and unchanged production deployment.
