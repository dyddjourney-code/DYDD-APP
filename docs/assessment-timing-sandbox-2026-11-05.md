# Assessment Timing & Retake Permissions — isolated sandbox

## Boundary and policy

This work is authorized **sandbox only**: branch `sandbox`, Vercel project
`prj_5EC6sfJe9DpGYW59L94iwppeMYUg`, Supabase `atemrshtshxoqnuevvqu`.
Never run these migrations against the school production database
`laojrzlqbkmirzcbcnyw`. The deploy script pins the pushed sandbox SHA and repairs
both established sandbox aliases. Production still uses six calendar months for
DesignID; nothing here authorizes promotion.

| Assessment/resource | Sandbox policy |
|---|---|
| DesignID | 90 elapsed days between completed assessments; recommend roughly six months |
| Spiritual Gifts | 30 elapsed days between completed assessments |
| Fruitful Life 360 self-only | 30 days from successful self completion, before asynchronous PDF |
| Fruitful Life observer groups | Three distinct rounds in rolling 90 days; concurrent groups allowed |
| Observer respondent | One response per invited respondent/round; corrections retain identity/time |
| Fruitful report generation | One atomic new reservation per round/24 hours, after meaningful final responses |
| DesignPD | Derived from exact chosen owned DesignID; no independent questionnaire/timer |

`lib/assessment-timing/policy.ts` is the shared server eligibility/next-date service.
Sandbox history and identity come from verified Auth, including linked imported
history and canonical email aliases; foreign-owned history is excluded. Every
completion rechecks policy under the account/type transaction lock. DesignID and
Gifts save response/result/permit consumption atomically. Fruitful response
triggers use the same completion assertion and preserve a native response UUID
before a report snapshot exists. Original instruments, point allocations, sorts,
questions, instructions, scoring, report source language and historical results
are unchanged. Draft opening/resumption, failed validation/save and technical
report delivery retries never create another completed attempt.

Owner exemptions and existing DesignID single-use overrides remain supported.
Browser/client roles have SELECT-only RLS policies on existing workflow tables;
new grant/request/outbox/reservation tables deny direct browser privileges. New
privileged RPCs are service-role-only. A narrow private verified-Auth lookup avoids
broad service-role SELECT on `auth.users`. Native Gifts and Fruitful self submission
also require the current verified caller to own the token's stored session.

## Learner communication and early requests

Personal dates appear on existing Trailheads/Field Kit cards and entry gates,
with separate report/course actions. Native Fruitful timing appears even before
its PDF exists. First attempts have no extra timing warning. A short expandable
pre-purchase disclosure appears below Personal benefits and before its CTA.
Shared explanation: `/assessment-timing`. Request:
`/assessment-timing/request?type=designid` (also `spiritual_gifts`, `fruitful_self`).
No questions, instructions or examples were inserted into an instrument.

Requests capture verified identity, original snapshot/native completion UUID and
time, two explanations and next date. One pending/person/type; new request at
most once/person/24 hours. Expired pending requests archive without overwriting
old audit/outbox; concurrent replacement creates one new request. Approval is
never automatic. Email review/approval/decline links only open a confirmation
page; verified designated John owner authentication and a same-origin POST are
required. Random hashed scoped tokens expire after seven days; row locks reject
replay. One additional attempt expires after 30 days and is consumed only in the
successful completion transaction. The replacement restarts normal timing and
keeps original results. Decline retains the date and explanation.

Owner confirmation uses `Referrer-Policy: same-origin`: cross-origin links do not
receive the token-bearing referrer, while same-origin native form POST retains
its Origin. `no-referrer` was found by real-browser QA to yield `Origin: null` on
this form; accepting null Origin was deliberately not used as a workaround.

Frozen mail intents/outbox and provider idempotency keys are persisted before
transport. Failures/pending/blocked/accepted states and authorized explicit retry
are visible; no messaging automation or new cron was created. Accepted is not an
inbox claim. Final sandbox transport remains its existing exact owner allowlist;
controlled QA sinks may be temporarily allowlisted only for explicit release QA,
then restored. No actual learner receives test mail.

## DesignPD commercial boundary

Generation reservations serialize owner + exact source + content version. A
ready matching report reopens without a new job/email; old reports remain. Known
terminal failures retry the same snapshot after one minute, max three attempts;
ambiguous provider outcomes require recovery rather than a duplicate paid job.
Generic artifact POST cannot bypass this ledger.

The approved one-time-unlock/update **direction is visible**, but activating the
new account-wide purchase awaits its explicit price/fulfillment/migration policy.
The former per-result price is not presented as the new product. New obsolete
per-result sandbox checkout is paused before order/provider creation. Existing
signed checkout fulfillment, exact-result paid unlocks, included/lifetime/admin
access, saved reports and downloads remain intact. No price was changed, paid
access broadened or entitlement granted to a real account. No upgrade charge or
promise of free future updates was invented.

## Verification and repeatable procedure

1. Read current project/environment brief and inspect worktree/unrelated edits.
2. Use `scripts/assessment-timing-sandbox-db.mjs` for exact-ref/project-checked SQL;
   apply only reviewed migration files and verify recorded source equality.
3. Run real synthetic DB suites: `tests/assessment-timing-core-sandbox.mjs`,
   `assessment-retake-requests-sandbox.mjs`, `fruitlife-timing-sandbox.mjs`,
   `designpd-generation-sandbox.mjs`; all remove their own fixtures in finally.
4. Run actual-action/security/UI regressions, instrument preservation manifest,
   typecheck and optimized build. Supabase advisor INFO for service-only RLS
   tables without policies is intentional; no new warning/error is acceptable.
5. Local no-delivery browser runtime:
   `node scripts/start-assessment-timing-qa-sandbox.mjs`. Run
   `node tests/assessment-timing-browser.mjs`. Use precise scoped form buttons,
   wait for actual streamed status/hydrated access, and reload same-document
   hash navigations when no HTTP response exists. Never infer a failed app from
   a stale selector or a menu click.
6. Commit/push only scoped files; deploy with `node scripts/deploy-sandbox.mjs`.
   Verify exact Git SHA, READY project and both aliases by API after hosted QA.
7. Hosted controlled mail is an explicit separate mode with designated owner and
   exact Resend QA sinks only; restore the owner-only allowlist afterward. Keep
   provider acceptance, mail-server delivered event and inbox/read evidence
   separate. Never treat synthetic webhook events as delivery evidence.
8. Recheck production deployment/function fingerprints, clean all task fixtures,
   stop local server, and save final screenshots/receipts in workspace outputs.

Core tests cover before/at/after intervals, month-end/imported history, foreign
ownership, eight/ten-way completion races, one-use expiry, rollback and timing
restart. Request tests cover six concurrent requests/replacements, five competing
approvals, expiry/replay/CSRF/owner denial and frozen retry payloads. Fruitful tests
cover ten simultaneous round creations, eight respondent/report/provider races,
rolling quota, concurrent observer identities, before-PDF timing and grant audit.
DesignPD tests cover 12-way source/version reservations, saved reopen, bounded
terminal retries, unknown transport, source ownership and entitlement boundaries.

Evidence is consolidated under `outputs/assessment-timing-2026-11-05/` at release.
Physical iOS/Safari and human inbox/read placement are separate, unclaimed checks.
External paid PDF transports stay disabled in sandbox; scoring/action/provider
contracts are checked without spending on new PDF jobs.

## Controlled hosted acceptance — November 5

Application commit `00c0367df2df9c4594a9081ded2469394eb45fbf` was deployed
READY as `dpl_CdtTjvHUoUm3EEDQ2p1uDpkrJDGk` to the exact sandbox project and
both established aliases. Local actual-auth flow passed 27 checks; published
actual-auth flow passed 28, including desktop/390/320 views, owner-only approval
and decline, one-use completion, original history, foreign/replay denial, and a
byte-identical existing private PDF download plus course access during cooldown.
No browser runtime errors. The PDF was an explicitly synthetic saved-object
fixture, not a newly generated provider report. All QA objects/accounts removed.

Four deliberate transactional messages (two owner review notices, approval and
decline to two Resend QA sinks) were accepted and received genuine signed
`email.sent`/`email.delivered` telemetry. No synthetic webhook events were written.
This proves provider/mail-server delivery, not human inbox/read/spam placement;
Resend QA sinks are simulated delivery destinations. No real learner was emailed.
The exact temporary three-recipient sandbox allowlist was restored to the original
owner-only value before the final release deployment. No cron or messaging
automation changed. Final exact alias/SHA receipt and post-restore authenticated
read-only screenshots are saved in workspace release outputs.

One legacy standalone `designid-maps-confirmation.cjs` invocation reports existing
TypeScript inference errors in unchanged report source when compiled outside the
project tsconfig. Project typecheck/optimized build and the full unchanged-source
allocation/scoring parity suite (80 statements, 40 legal patterns, 130,931
DesignPD vectors) pass. No current private historical workbook fixture was
available for a fresh historical-input replay (0 rows); no such claim is made.
