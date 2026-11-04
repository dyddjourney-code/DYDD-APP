# Read-only Waypoints audit — 2026-11-04

Checked approximately 20:05–20:16 UTC. No worker/cron endpoint executed, no database/config/provider mutations, no email sent. Only this sanitized document was written. Existing unrelated modified evidence files and tmp trees were preserved.

## Result

The missed Friday was **October 30, 2026, 08:00 America/New_York = 12:00 UTC**. Authored content was **Called Before You Feel Ready**, release `225346ec-b58f-4514-9072-577349841ede` in both environments. Schedule/content were present and published; this is not missing authored content or a DST mistake.

Production has a concrete application-level delivery blocker: `dydd_lifecycle_settings.optional_paused=true`. The deployed Waypoints worker returns immediately when either `paused` or `optional_paused` is true, before querying eligible releases or making jobs/provider requests. The October 30 release remains scheduled with no jobs; the existing subscription is active, verified/account-linked, confirmed before release, not globally opted out and not suppressed. This strongly explains the failure, but exact October 30 HTTP invocation/result and historical pause state have not been independently recovered. Current settings alone are not a historical audit log.

Sandbox has different, independently sufficient reasons for no mail: **zero subscriptions/confirmation intents**, plus hard sandbox outbound guards. Its release actually advanced to released at **2026-10-30 12:00:00.658 UTC**. Its scheduler is healthy. Therefore production repair is production-specific; enabling real sandbox email is separate scope, owned by the parent, and is not necessary to restore production Waypoints.

## Production evidence

- Supabase ref `laojrzlqbkmirzcbcnyw`; Vercel project `prj_YO15mYTp64EHk0wlg6QmBTxNeV5k` / `dydd-online-school`.
- Current singleton settings: `activated_at=2026-10-28 16:13:42.158044+00`, `paused=false`, **`optional_paused=true`**. There is no settings updated-at column, so the exact pause-change time is unknown.
- October 30 release: `status=scheduled`, `released_at=null`, channels email/app, content published. Its date is after activation. November 6 release is scheduled at **13:00 UTC = 08:00 EST**, correctly accounting for the November 1 DST change.
- Exactly one active subscription. Sanitized identity query confirmed its email matches its verified linked auth account and its owner-name/email hints match John. It is not the initially guessed alternate Gmail address; no address is retained here. Subscription confirmed **2026-09-17 14:56:58.098 UTC**, preference Friday / 8:00 AM Eastern, global optional-disabled false, no suppression.
- October 23 email job is `sent`, timestamp `2026-10-23 12:00:25.159 UTC`. Earlier October 2/9/16 email jobs are also sent. October 30 has no delivery jobs. Historical app-channel jobs remain queued; these are distinct from email history.
- `dydd_email_messages` has no `dydd-waypoint-%` rows; `dydd_email_events` has no rows. These new ledgers do not establish historical inbox delivery; the older job sent state is not equivalent to delivered.
- Production Vercel current deployment: READY `dpl_2SVLQovgmrpwg1WumY6cM1oWUBFS`, Git `18790ab801e07f81ea0eec6c2439a2cfe48b14d3`.
- Previous READY production deployment `dpl_9Ev38v4NkyfGAYFaE7M9bxbiFsVa`, Git `0da4858279dd2abe3d2e54ab1f1ad0ad990ed014`, is the pre-October-30 deploy in the deployment list. Both deployed Git objects contain `lib/lifecycle/waypoints-worker.ts` with the same early pause gate and 48-hour freshness filter. Its route requires CRON_SECRET and calls this shared worker.
- **Important stale-checkout trap:** sibling `projects/dydd-online-school` local HEAD is `5893bad`, with the older inline cron implementation. It is NOT the deployed production code. Deployed Git objects were read explicitly from the sandbox repository object database.
- Vercel project reports active Waypoints cron definition `/api/cron/waypoints-release`, schedule **`0 12,13 * * 5`**. Pre-October-30 deployed Git config has this same schedule. Current deployed config has no Vercel cron disable timestamp.
- Production has no pg_cron/pg_net extensions or cron/net relations. This is expected for its Vercel scheduling model, not evidence of missing Vercel cron.
- CRON_SECRET and DYDD_RESEND_API_KEY are present in production-target Vercel environment names. Presence alone does not prove runtime auth correctness, provider acceptance or historical execution.

## Sandbox evidence

- Supabase `atemrshtshxoqnuevvqu`; Vercel project `prj_5EC6sfJe9DpGYW59L94iwppeMYUg`.
- Settings: activated October 27 19:10:34.021421 UTC, paused=false, optional_paused=false.
- October 30 published release is **released**, released_at October 30 **12:00:00.658 UTC**. October 23 is still scheduled but before lifecycle activation and deliberately excluded from backfill.
- Current subscriptions: **0 total**, confirmation intents: **0**, delivery jobs: **0**. No eligible recipient existed in the currently retained tables; table history/deletions are not audited here.
- `lib/lifecycle/waypoints-worker.ts` converts eligible sandbox email jobs to sandbox_ready without provider requests. `lib/email/resend.ts` independently returns skipped for sandbox. Vercel env names contain no Resend API key. Thus scheduler activation alone cannot deliver mail.
- pg_cron job 1, `dydd-sandbox-lifecycle`, `*/5 * * * *`, active=true. Its private function targets exactly the sandbox alias `/api/cron/lifecycle`.
- Retained cron rows October 30 11:55, 12:00, 12:05 UTC: all succeeded (`1 row`). Cron SQL success alone proves enqueue, not HTTP success; the release timestamp supplies independent evidence the worker actually ran at due time.
- October 30 pg_net HTTP response rows are no longer retained (query returned empty); no historical HTTP 200 is claimed.
- Current November 4 20:00, 20:05, 20:10 UTC responses: HTTP **200**, timed_out=false, error_msg=null, sandbox=true, accepted=0; Waypoints sandbox=true, skipped=true, acceptedEmails=0, erroredEmails=0, skippedEmails=0, claimedJobs=0. Corresponding cron SQL runs succeeded.
- Current Vercel sandbox deployment READY `dpl_4ubq6fHTqm2Sf1yXXW932EizpFyH`, Git `e8a478dd8d9a8cd34262799c48499848d8b704f1`. Vercel cron definitions are empty intentionally; pg_cron owns sandbox recurring execution.

## Provider and HTTP evidence limits

Read-only Resend list probe using the existing local production credential returned HTTP **401**, name **restricted_api_key**, message **This API key is restricted to only send emails**. No provider send was attempted. Provider-side sent/delivered/bounced evidence therefore cannot be inspected with that credential; this is a permission limitation of the key, not proof the key is invalid for sends.

A read-only Vercel runtime-log stream request for the pre-October-30 production deployment timed out after eight seconds without usable results. Exact October 30 Vercel cron request/response, historical pause transition time and provider-side mailbox outcome remain unverified. No authenticated worker endpoint was invoked to manufacture execution evidence, because those endpoints mutate release/jobs and can send.

## Repair required (not performed)

1. **Production:** resolve the global optional pause versus intended Waypoints operation. A targeted Waypoints setting/guard may be needed if other optional lifecycle messages are intentionally paused. Blindly setting optional_paused=false affects more than Waypoints; it is not a production-only Waypoints toggle.
2. Confirm intended production cron auth/runtime configuration and next scheduled execution, then collect actual HTTP/job/provider acceptance evidence. On November 6 the intended local time is 08:00 EST / 13:00 UTC; the extra 12:00 UTC run should have no due release.
3. October 30 is older than 48 hours. Merely unpausing will **not** backfill it under current deployed code. Do not reset jobs, dates or bypass freshness as a diagnostic. An explicitly scoped one-time missed-release send requires a separate authorized decision with duplicate/provider reconciliation.
4. Sandbox mail activation/recipient allowlisting/subscription setup is a separate parent-owned task. Do not change NEXT_PUBLIC_DYDD_ENVIRONMENT to production merely to bypass outbound guards.

## Read paths / verification method

Read existing `docs/email-circle-automation-2026-10-27.md`, `docs/email-foundation-2026-10-23.md`, schema migrations and environment-specific configure/sync scripts; queried Supabase Management database/query with `read_only:true` and SELECT-only statements; GET-only Vercel projects/env metadata/deployments and provider API. Local script bodies that contain mutations were inspected, never executed. Sandbox release proof at workspace `outputs/dydd-email-circle-automation-release-proof.json` also records original October 27 cron plus HTTP 200 guard evidence.
