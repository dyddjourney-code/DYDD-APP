# Fruitful Life timing integration — verified local + sandbox DB

## Boundaries and completion contract

All work is isolated to sandbox DB `atemrshtshxoqnuevvqu`, Vercel project `prj_5EC6sfJe9DpGYW59L94iwppeMYUg`. Source is local only; no commit, push or deployment. Production and mail/PDF providers were not called. Questions, instruments, instructions, scoring JSON and shared cards were not edited by this lane.

Core `getAssessmentEligibility(userId,email,'fruitful_self',owner)` now uses service-only `public.dydd_fruitlife_last_self_completion(uuid,text)`. It returns `(completed_at timestamptz, source_snapshot_id uuid)`; source snapshot may be NULL until report materialization. Native completion is a successful `fruitlife_360_responses` self INSERT in a **self-only** session (`observer_round_started_at IS NULL AND observer_goal=0`). Its completion marker and optional one-use grant consumption commit in the same transaction. Drafts, response validation failures, corrections and report production are not new attempts.

Imported `assessment_snapshots.assessment_type='fruit_360'` with `scores.summary.Report_Mode='SELF_ONLY'` count through owned/linked/unclaimed canonical-email participants. Explicit draft/pending/queued/processing/error/failed or zero-response snapshots do not count. Native derived snapshots `source='fruitlife_360_native_app'` are excluded, so a late PDF cannot move the completion date. Core snapshot guards must preserve this exclusion.

Shared lock: `hashtextextended('assessment-timing:' || user_id::text || ':fruitful_self',0)`. Grants use existing `dydd_assessment_retake_grants` type `fruitful_self`; unused, unexpired grant consumed only when needed, audited on response `metadata.retakeGrantId`. Grant table can be absent during staged migration application; cooldown then fails closed rather than bypassing.

## Implementation

- Setup generates a stable creation ID. Service-only atomic `dydd_fruitlife_create_round` inserts session+all invites or neither, and returns the existing owned ID on retries. Explicit draft resume checks signed-in ownership; no global active-round gate. Draft buttons identify observer group.
- Observer round timestamp is immutable, set at creation. Three distinct rounds per rolling 90 days under account advisory lock. Concurrent groups and the same respondent in distinct rounds are permitted. Cancelling invites/archiving cannot erase the creation quota or convert observer history into self-only history. Completed self-only cannot be relabeled into an observer round.
- Unique self/session, observer/invite and canonical observer email/session indexes. Trigger checks invite/session relationship, assigned respondent and active state. Corrections retain original respondent, round and completion time. Server actions derive self account/observer email and ignore editable identity authority.
- `dydd_fruitlife_refresh_completion` locks and recomputes counts atomically. It queues only at meaningful/final readiness, never every observer response, and preserves ready/sent report state.
- Job INSERT is an atomic per-round 24h generation reservation; rollback frees reservation, same-job retries use UPDATE. Reading existing ready reports is untouched. Before external creation, worker obtains one service-only `dydd_fruitlife_claim_provider_creation` reservation bound to current worker lock. Ambiguous provider outcomes fail closed and require reconciling provider document into the existing artifact; retries cannot issue a second paid creation.
- Default legacy owners and configured owner exemptions remain. Configured exemption metadata is supplied only by authenticated server action `isDyddAdminEmail(user.email)`, never form fields. Existing table writes are RLS/service-only.

## Applied additive migrations and schema dependencies

Applied and recorded, each independently transactionally, in this order:

1. `20261105140000_fruitlife_timing_safeguards.sql`
2. `20261105143000_fruitlife_timing_history_hardening.sql`
3. `20261105145000_fruitlife_completion_identity_audit.sql`
4. `20261105150000_fruitlife_trusted_owner_exemptions.sql`
5. `20261105153000_fruitlife_imported_completion_status.sql`

Dependencies: existing `auth.users`, `assessment_participants(id,user_id,normalized_email)`, `assessment_snapshots(id,user_id,participant_id,assessment_type,source,source_submitted_at,created_at,scores)`, all five existing `fruitlife_360_*` workflow tables, lifecycle triggers and later-existing shared grant table `(id,user_id,assessment_type,created_at,expires_at,used_at)`. Adds only `fruitlife_360_sessions.observer_round_started_at`, Fruitful indexes, Fruitful triggers/functions. Does not alter core policy functions or shared grant schema. Core eligibility migration must follow helper creation. All new privileged RPC execute grants exclude anon/authenticated and include service_role. Existing workflow tables remain RLS-enabled.

## Verification

`node tests/fruitlife-timing-sandbox.mjs` PASS against actual sandbox: 10 simultaneous round creations -> 3; creation replay and foreign-account denial; rolling90d slot release; 8 concurrent respondent submissions -> 1; cross-round/wrong-respondent denial; same observer across separate concurrent groups and separate reports; 8 concurrent report reservations -> 1/24h; 8 provider claims -> 1 and wrong worker denied; saved-ready read unaffected; after24h new job permitted; simultaneous self-only saves -> 1; exact before/at/after30d; 5 simultaneous one-use-grant saves -> 1, failed-insert rollback, expiry, grant audit and correction identity; linked imported completion counts while explicit imported draft does not; trusted owner exemption; completed self-only conversion denied; anon/authenticated RPC denial. All synthetic users/participants/responses/sessions/jobs/snapshots/grants/lifecycle events cleaned.

`node tests/fruitlife-timing-actions.cjs` PASS real exported self action: foreign/anonymous token bearer denied before writes, owner reaches unchanged instrument validation, completed retry refreshes original round. `node tests/fruitlife-timing-start.cjs` PASS actual setup page with three distinct draft resume forms and separate creation ID, 1280/390/320 no overflow. Screenshot `tmp/fruitlife-timing/start-320.png` inspected. `node tests/fruitlife-completion.cjs` PASS nine existing completion/report states × thanks/status, observer privacy, twelve desktop/mobile checks, popup/course navigation. `fruitlife-assessment-badge`, `fruitlife-email-policy`, `fruitful-life-terminology` PASS. `npm run typecheck` PASS; scoped `git diff --check` PASS.

Integration findings were fixed by their owners: core service RPC auth.users permission via narrow verified-Auth helper; core helper hook/uppercase observer-mode distinction; shared status displays completion before report snapshot exists. Real service-role eligibility is now verified by the Fruitful integration suite.

Evidence: `tmp/fruitlife-timing/` migration SHA/timestamps, DB schema-before, integration-proof.json, cleanup-proof.json, logs, setup screenshots. No real PDF or mail calls; no deployed/browser-authenticated full save claim. Parent owns build/deploy/release coordination.
