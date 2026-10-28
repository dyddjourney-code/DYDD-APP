# Spiritual Gifts assessment and course flow

Both environments use the existing app green (`--green-dark`) for selected 1–5
answers. Native fieldsets and rating tracks shrink within320px; a reproduced
348px document-width overflow is corrected without hiding content. Statement
text, response bounds, mappings and scoring are unchanged.

Successful native app submission returns directly to
`/field-kit#collection-spiritual-gifts`, after the assessment/snapshot/report
state has been saved. Public standalone assessment completion remains public.
Old app thanks links remain usable and no longer claim unverified email delivery.

Spiritual Gifts course Back/final Continue returns to that same Field Kit card,
including direct/retired `lane=fruitlife` entries. Normal sign-in retains the
validated lesson and canonical Field Kit origin. Course prerequisites, saved
responses, reflection rounds and checklist completion remain independent of
assessment completion. Field Kit Snapshot and private-PDF download are preserved.

## Delivery finding and hardening

The existing October28 21:39:43UTC report was matched by account UUID and recipient
to the already-verified current test account from the preceding release. Its
private PDF is archived; attachment and provider acceptance are recorded; the
matching durable job/message intent are accepted once. This is evidence of
provider acceptance, not inbox delivery. The configured send-only Resend key
cannot retrieve delivery details (`restricted_api_key`, HTTP401). No account,
assessment, existing result or provider delivery was mutated/replayed.

The confirmed reliability defects fixed here are separate from that unproven
inbox cause: persist/check both snapshot and token-locator session artifact state
before notifying; use provider download rather than viewer for attachment; keep
attachment/delivery exceptions from invalidating a ready saved report; preserve
intervening PDF-recovery metadata; only record sentAt after acceptance.
See [email/artifact procedure](spiritual-gifts-email-lifecycle-2026-10-28.md).

## Repeatable verification

1. Run `node tests/spiritual-gifts-navigation.cjs` and
   `node tests/spiritual-gifts-email-lifecycle.cjs`: actual actions/scoring execute
   against in-memory DB/provider/mail interception. Do not send an assessment or
   email merely to test routing or sender behavior.
2. Run `node tests/course-auth-origins.cjs`,
   `node tests/course-card-origins.cjs`, privacy/environment/artifact/scoring
   regressions and `npm run build` independently with each checkout's own env.
3. Run `tests/spiritual-gifts-release.mjs` with a suppressed synthetic account,
   isolated owned saved snapshot/private PDF and prerequisite checklist fixtures.
   It captures the final assessment submit event before React invokes its server
   action; no actual assessment/report/provider generation occurs. Exercise every
   statement, each green choice, Back retention, saved Snapshot/download ownership,
   genuine final-lesson save/reload and actual anchored Continue at1280/390/320.
4. Publish stable master and isolated sandbox separately using the existing deploy
   scripts; verify exact pushed SHA/project/READY alias with
   `scripts/verify-journey-circle-deployments.mjs` and
   `JOURNEY_RELEASE_OUT=tmp/spiritual-gifts-release`.
5. Run `SG_DEPLOYMENT_READY=1 SG_ENV=production node tests/spiritual-gifts-release.mjs`
   and the corresponding `SG_ENV=sandbox` against the published aliases. Confirm
   complete fixture cleanup and zero provider intents. Keep actual inbox delivery
   explicitly unverified unless provider delivery evidence is available.

Full release receipts/screenshots: `tmp/spiritual-gifts-release/RELEASE.md`.

## Remaining owner work

Observer-based FruitLife360 assessment and Journey course completion. Beta
invitations await these Spiritual Gifts fixes. No invitations are sent here.
