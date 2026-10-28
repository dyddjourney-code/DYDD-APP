# Final eight FruitLife360 + DesignPD corrections — October 28, 2026

Authorized: implement and deploy both live and sandbox. This release follows the nine Journey/Circle fixes at live `aa5af30`, sandbox `4f680f2`; their source/persistence behavior stays unchanged.

## Acceptance contracts

1. FruitLife course completion returns `/field-kit#collection-fruitlife-360`, including direct/old course links. Field Kit named anchors reserve signpost geometry and use the existing bounded, user-interaction-cancelled settling behavior.
2. The assessment badge recognizes a completed, strictly owned FruitLife report independently of a course badge. Self-only assessment completion is not a claim that observers participated. Existing null-mode sessions recover only their exact owned linked report's mode; incomplete reports, foreign participants/snapshots and canonical Gmail aliases stay excluded. Full360 observer validation remains separately available. Existing customer results/scoring are read-only.
3. Issued DesignPD emailed locators redirect anonymous browsers through normal sign-in and resume the exact artifact. Direct bounded snapshot lookup replaces row-capped report-list searching; explicit snapshot/participant ownership takes precedence over exact-address unclaimed legacy fallback. New report artifact metadata is persisted before delivery is attempted; delivery failure does not invalidate a ready PDF or overwrite concurrently stored recovery metadata. No customer email is sent by QA.
4. DesignPD finishes at owned `/designpd/thanks?snapshot=…&origin=…`, displaying its saved Plan/Decide/Do results, original report and clear card return. No unrelated Journey action on that results screen.
5. Back from DesignPD opens its exact Field Kit/Trailheads card, not the page top.
6. Module2 Lesson1 **What You See** includes every saved Plan/Decide/Do tendency, not only course-level personalization.
7. Planning/Deciding/Doing modules prominently show their individual saved tendency. Source report labels are read unchanged from retained/native formats; absent fields show unavailable, never inferred scores/example values. Authored teaching/reflection prompts, source lesson IDs and stored answers are unchanged.
8. DesignPD course completion preserves the originating Field Kit or Trailheads card. A small allowlist uses URL `origin=field-kit|trailheads`, retained through refresh, module navigation, canonical standalone redirects, submitted form and login return. No arbitrary return URL/history/referrer dependency. Other courses retain their prior routes.

## Verification and release

- `node tests/course-auth-origins.cjs`: independent review caught the prior sign-in redirect dropping origin/lesson; corrected canonical allowlisted course return and origin-specific ineligible card; anonymous course/invalid origin/lesson regressions.
- `node tests/course-card-origins.cjs`: actual navigator render, exact saved axes/labels, absent states, unmodified source teaching/prompts, durable allowlisted routes.
- `node tests/fruitlife-assessment-badge.cjs`: native/imported completed reports, null mode, full observer gate, foreign/alias/incomplete/stale-ledger denial, independent course completion.
- `node tests/designpd-artifact-lifecycle.cjs`, `node tests/designpd-report-state.cjs`, `node tests/artifact-access.cjs`, `node tests/designid-email-access.cjs`: ownership, login/resume, immediate/deferred link lifecycle, persist-before-email, no unauthorized writes, no real sends.
- `tests/final-eight-published.mjs`: genuine synthetic signed-in desktop/mobile, real reflection/final checklist save and reload, all three origins/card entries and actual Continue clicks, four saved tendency lessons, owned results, private synthetic PDF upload/resolver/bytes, anonymous login, foreign denial. Email suppression installed before synthetic user creation; fixtures/accounts/storage/lifecycle data removed in finally and zero provider intents asserted. Remote runs require explicit deployment-ready flag; local override available.
- Preserve prior nine: Journey dual source/current activity/export tests, all104 Circle meeting counts, all1440 clock-minute roundtrips, saved reflection boundary browser checks.
- Unchanged scoring: DesignID allocation and130931 DesignPD vectors +240 source profile combinations/222 rows.
- Per-environment optimized build/typecheck, environment isolation and identity boundaries.

Push reviewed production HEAD to `origin/master`, run `node scripts/deploy-production-beta.mjs`; scoped three-way port only source/tests/docs to sandbox, push `origin/sandbox`, run its documented deploy script. Never copy environment/middleware/runtime config, databases or secrets. Independently verify exact SHA/project/stable aliases READY with `JOURNEY_RELEASE_OUT=tmp/final-eight node scripts/verify-journey-circle-deployments.mjs`.

Private full release receipts, sanitized real-account read-only diagnosis, signed-in proof and screenshots: `tmp/final-eight/RELEASE.md`. Browser QA uses Chromium desktop/mobile emulation, not physical Safari. Synthetic saved results/private PDF bytes do not claim actual assessment submission, provider PDF generation, email/inbox delivery or impersonation of a real customer.
