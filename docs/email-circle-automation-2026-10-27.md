# DYDD lifecycle and Circle communications — sandbox, October 27

## Boundary

This release targets Git `sandbox`, Vercel project `dydd-online-school-sandbox` (`prj_5EC6sfJe9DpGYW59L94iwppeMYUg`), and Supabase `atemrshtshxoqnuevvqu` only. Production/master, DPG, billing-provider settings, inbound forwarding and Resend webhooks are unchanged. The original verified DYDD From identity remains in use. Both the shared sender and workers prohibit actual provider requests when `NEXT_PUBLIC_DYDD_ENVIRONMENT=sandbox`.

`sandbox_ready` = eligibility and transactional authorization passed, but no provider request. `accepted` = Resend accepted a request, not delivery. Actual delivery/bounce/complaint is the separate October23 signed-webhook ledger. No real customer/test-inbox mail or live webhook was executed for this release.

## Author/participant experience

1. Save Circle dates/timezone, moved dates, holiday ranges, assignments, completion goal and location.
2. Open **Messages**, generate complete written messages from that saved revision, inspect each subject/body/date/recipient and edit as needed.
3. Individually approve each message. Any saved edit resets that message's approval; stale-tab approval fails. Every included message must be approved before finalization, invitation issuance or scheduled release; explicitly excluded messages are intentionally omitted. Restore returns the schedule to review and requires a fresh approval.
4. Finalize the communication schedule; explicitly queue invitations to listed people. A listed name is NOT membership or course access. Only a verified account using the invited email can accept/decline. Acceptance, leave and reminder preferences persist.
5. Future approved preparation/reminders follow actual meetings, not ordinal weeks. No meeting/reminder during a break. Preparation resumes against the next real session. Homework wording follows the selected before-meeting / together / finish-before-next goal. No invented recap or claim of unfinished personal work.
6. Saving a material plan/roster/status revision supersedes old campaigns and cancels only not-yet-submitted jobs. Re-review the replacement messages; started Circles keep genuine historical dates while only future-relevant messages are generated/queued. Necessary changed-schedule notice replaces repeat welcome.
7. Creator-written Circle-only notes have their own saved draft → individual approval → explicit accepted-member queue. Published copy is immutable; future deliveries can be cancelled. It is not a ministry-wide campaign composer.

The welcome contains the visible managed slot `{{next_preparation}}`, previewed in the editor and filled only from the next actual meeting's separately approved preparation. Arbitrary creator prose is never regex-rewritten. A stable membership-scoped welcome key prevents duplicate onboarding after delayed events/revisions. Unsubmitted cancelled welcomes can be replaced by the current approved revision; accepted/ambiguous history is not overwritten.

## Durable events and timing

- Verified account after activation: once-only A03 account welcome; opt-in day3 start-help.
- First genuine learner-created course workbook round: C01 course welcome. Legacy imports/assessment retake rounds do not emit enrollment welcome. Overlapping account/Circle welcome and already-started learning suppress redundant next steps.
- New canonical lesson checklist events, never mere navigation: C02 course completion or C03 Journey celebration, not both. Day5 FruitLife recommendation, day14 available DesignPD learning step, day30 faithful practice and one feedback invitation. Paid entitlement, existing assessment/session/course activity and current consent are rechecked.
- One7-day course inactivity invitation and one35-day gentle return invitation; completed/recently-active/active-Circle users stop. No repeating chase.
- Actual ready native DesignID/DesignPD/Spiritual Gifts snapshot or FruitLife ready report transition: B05 matching use-results followup. Existing report-ready copy is preserved in the durable application outbox.
- Explicit FruitLife observer/self invitations retain original exact content; one5-day incomplete reminder per initial invitation. Manual observer reminders are distinct, day-throttled events. Self-completion can produce a single5-day pending-observer participant status if action still remains. No fabricated minimum observer count/deadline.
- Circle: D01 explicit invitation; D02 one4-day pending reminder when sufficient lead; D03 accepted welcome; D04 first preparation/E01 later preparation; E02 tomorrow reminder; D05 material changes; E03 consolidated breaks/resume; E04 schedule wrap; F01 launch/F02 leader preparation/F03 actual action-needed/F04 leader wrap; E05 deliberate approved leader note.

## Weekly Waypoints

The application has35 approved authored records; legacy email tables had only23. `scripts/sync-sandbox-waypoint-email.mjs` reconciles ONLY16 future Friday08:00 America/New_York releases, October30 through February12. It never seeds/replays the19 historical archive emails. Exact approved body, full Scripture/attribution and four Primary applications are preserved; email includes only the verified recipient's saved Primary application or the generic fallback. Identity lookup never attaches unclaimed reports or exposes other variants.

A new subscription request atomically persists a rate-limited confirmation intent, not an active subscription. An explicit confirmation click activates it; opening/scanning a GET does not. The24-hour token is one-use/idempotent: replay after unsubscribe cannot resubscribe. Existing active subscription intent is retained. Subscribers receive only future releases after their confirmation, with48-hour release freshness; no stale backlog. The dedicated October23 delivery jobs/idempotency/unsubscribe history are retained, driven by the shared sandbox tick.

## Reliability / privacy

- Private service-role tables and RLS; no anon/authenticated direct reads/writes or privileged RPC execution. Creator authorization is not teaching-review authorization. Private authenticated admin queue: `/admin/email`.
- Stable business event keys, immutable accepted/published snapshots, SKIP LOCKED claims, unique lease tokens, stale-lease recovery, capped exponential retry and23-hour provider-ambiguity guard. Ambiguous submissions retain shared cadence reservation and end in manual review rather than replay beyond provider dedup lifetime. A competing worker cannot fail an active eighth attempt.
- A final SQL authorization fence serializes optional-recipient cadence and rechecks current campaign/revision/approval/membership/preferences/suppression immediately before transition to `submitting`. Lost/cancelled claims do not send and do not abandon the rest of the batch. A revision/optout after this explicit submission boundary cannot recall an already-authorized provider request; history shows that distinction.
- Invitation status, token hash and exact initial/reminder intents are committed in ONE transaction, not a read/upsert/enqueue race. Tokens in private job bodies are necessary recipient links, not routine telemetry.
- Required security/report/material schedule notices remain separate from optional learning/growth. Global optional stop, category stop, per-Circle member reminders and creator leader-digest choices persist. Earlier issued links remain usable; category optout cannot reset other choices or undo a global stop. Optional general cadence at most1/day and3/week; daytime08:00–20:00 recipient timezone, documented America/New_York fallback. Circle timing is separately controlled.
- Tomorrow reminders expire at local midnight of meeting day, so pause/outage cannot send false “tomorrow” wording on meeting day. No blanket historical/backfill scan. Paused accepted members retain durable future jobs and reconcile on resume.

## Intentionally conditional / external items in the41-ID catalog

A01/A02 auth messages and H01/H02 billing receipts/security events stay provider-owned; their exact configured templates are unavailable locally. A06 has no new app-specific access-change source. B06 deadline extensions/closure and H03 access-expiry notices require a genuine configured deadline/expiry event, absent from this product. G03/G06 need actual approved resource/news/offer content and the appropriate explicit campaign consent, not a fabricated automatic campaign. The complete editable catalog labels these as provider-owned or pending; it does not call all41 potential IDs active sends.

The sender key remains send-only. Provider domain/dashboard verification, webhook registration/signing secret, inbox delivery, account limits and separate production promotion remain unverified/out of this sandbox release. Operator `review`/failed rows are visible but deliberately require trusted manual reconciliation; no unsafe one-click replay/reset is provided.

## Recurring execution / release evidence

`vercel.json` keeps automatic Git deployment and Vercel cron disabled. `scripts/configure-sandbox-lifecycle.mjs` validates exact sandbox project/ref, prepares an encrypted sandbox-only Vercel/Vault cron secret, then AFTER deployment and a proven `sandbox=true,accepted=0` endpoint installs only named pg_cron job `dydd-sandbox-lifecycle` every5minutes. It preserves unrelated jobs and uses Vault + pg_net to POST the published sandbox worker. Neither secrets nor bearer values are logged/committed. Actual cron run PLUS HTTP response status/body are required proof, not cron SQL success alone.

Final deployment/alias/SHA, migration hash, scheduler/HTTP proof, published mobile/persistence results and unchanged production reference are recorded in workspace `outputs/dydd-email-circle-automation-release-proof.json`. Full subject/body/trigger/timing/recipient/status catalog: workspace `outputs/DYDD-Complete-Email-Catalog-2026-10-27.{TXT,DOCX,PDF}`.

## Checks

`npm run typecheck`; `npm run build`; `node tests/environment-isolation.cjs`; `node tests/email-sender.cjs`; `node tests/email-foundation.cjs`; `node tests/lifecycle-templates.cjs`; `node tests/lifecycle-sandbox.mjs`; `node tests/lifecycle-races-sandbox.mjs`; `node tests/lifecycle-application-sandbox.mjs`; `node tests/lifecycle-course-events-sandbox.mjs`; `node tests/lifecycle-waypoints-sandbox.mjs`; `node tests/lifecycle-http-browser.mjs`; existing FruitLife worker/lifecycle and reflection-export regressions.

The HTTP/browser harness accepts localhost or the exact sandbox alias only, creates synthetic verified `.example.test` users, and deletes its own fixtures. It covers360/390/768/1280 widths, actual edit/approval persistence, all-approved gate, invitation acceptance, historical optouts, creator preferences, IDOR denial, approved notes, real started-Circle revision and membership welcome dedup. Provider calls remain forbidden/mocked; these checks do not establish delivery.


## Circle simplification follow-up — October 27

- **Journey Tracker** replaces the visible Racetrack label. Real Circles never default to sample people/results. Fictional assessments are available only behind an explicit demo-preview checkbox in review mode.
- The old Data view was client-side demo output, not real results assigned in the database: opening every Circle reset `samples=true`. A six-person demo therefore appeared despite only the host having actual results. `/api/circles/data` now reads only the creator plus account-linked accepted memberships still present in that exact Circle's saved roster. A listed name/email is a planning placeholder; an invited account is not yet an accepted member. Roster names/emails are never used to discover or attach assessment records. Linked assessment participants must have confirmed matching `user_id`; foreign/conflicting ownership is excluded. Explicit sandbox owner/new previews may read only the pre-existing private sandbox copy of John’s saved report, never identities/results discovered through roster contacts; other previews remain empty. The current private owner copy has one DesignID result and no Spiritual Gifts or DesignPD snapshot; absent assessments are not invented.
- Spiritual Gifts, DesignID and DesignPD appear independently from genuine saved completed snapshots. No completed DesignPD snapshot means no DesignPD chart/profile, even when a DesignID snapshot exists. No missing-type/sample fallbacks. Saved Primary controls primary-reflection counts, including approved tie presentation.
- Current DesignID is a **100-point allocation**, with 0–60 raw points per reflection. Capacity-bar averages are raw saved points, not four independent percentage capacities. The prior synthetic averages were not a valid current allocation. Historical raw scores are preserved, never rescaled into invented percentages; scoring code is unchanged. DesignPD reads signed saved movement ×100 as percentage points (−50 to +50): positive Dreamer, Feel It and Solo. It is not generated from DesignID by this dashboard.
- Message review has three collapsed sections: **Welcome series**, **Leader emails**, **Participant emails**. The custom Circle note composer remains below the generated schedule. Routine participant copy combines follow-through and next preparation, plus a day-before reminder; the generator limits routine messages (including final wrap) to two in any seven local calendar days, even for clustered custom/moved dates. Required service notices and leader mail are separate.
- Every generated message can be excluded/skipped and restored. Server-side `excluded_at`, optimistic revisions, creator checks and plan→campaign→draft→membership→job locking protect approval/finalization and the last SQL submission fence. Exclusion cancels unsubmitted scheduled/retry work; ambiguous previous attempts go to manual review, and submitted/accepted history is not rewritten. Restoring clears approval and reopens schedule review. Exclusions follow stable message keys into material plan revisions; approvals never do.
- Generated Circle bodies contain lesson titles as plain text, no lesson URLs, and one main **Open the Journey** link. Private invitation acceptance/decline links and functional preferences/unsubscribe/support footers remain distinct. Managed welcome preparation strips only the preparation fragment's exact trailing generated CTA, preserving the welcome's own CTA and authored prose.
- `scripts/refresh-sandbox-circle-generated.mjs` refreshes only exact old-generator matches at pristine unapproved revision1 in current draft campaigns, with no submitted/accepted history. It never rewrites creator edits, approved messages or delivery history. Dry run is the default; `--apply` is sandbox-ref fenced and optimistic-revision guarded. Existing approved/history bodies remain immutable by design.

Regression: `node tests/circle-data.cjs`; `node tests/circle-message-exclusions-sandbox.mjs` (rollback-only migration/SQL fixtures); `node tests/circle-simplification-browser.mjs` (local or exact published sandbox, synthetic authenticated accounts cleaned afterward); existing lifecycle/template/isolation regressions. Release proof is recorded separately in `tmp/circle-simplification-release-proof.json`.

Published reload follow-up: Base Camp/first-launch prefetch previously installed a review cookie, and middleware let that cookie replace a real signed-in learner on reload. Authenticated identity now takes precedence on ordinary navigation; explicitly requested authorized owner preview and anonymous preview convenience remain available. Regression: `node tests/sandbox-review-auth-boundary.cjs`.

Excluding the next actual meeting’s preparation leaves the managed welcome slot as a truthful leader-confirmation fallback; it must not silently substitute a later meeting’s homework. The preview and queued body use this same rule (`20261027210232_circle_welcome_excluded_preparation.sql`).
