# Circles independent QA findings

State: harness created; JavaScript syntax check passes. Read-only local preflight attempted at 2026-11-04 18:42 UTC and failed with `fetch failed` because no app server was listening on localhost:3138. Zero users/Circles/entitlements created; cleanup returned no errors. Full implementation is NOT yet verified. No commits, migrations, deployment or implementation changes by this lane.

## Run

```sh
CIRCLES_QA_BASE=http://localhost:3138 node tests/circles-system-published.mjs --preflight
CIRCLES_QA_BASE=http://localhost:3138 node tests/circles-system-published.mjs
```

Target is hard-asserted to isolated `atemrshtshxoqnuevvqu`; only localhost/127.0.0.1 or the canonical sandbox hostname is accepted. Fixtures are synthetic verified `@example.com` users and explicitly labeled synthetic paid-entitlement records, not provider purchases. No mailbox or checkout is used. A held outbox is read for invite tokens. Every fixture has explicit finally cleanup, including non-cascading ledgers, permanent bindings, notes, billing renewals and users, plus residue verification. Browser refuses payment provider/checkout requests.

## Coverage

Paid activation/acceptance; wrong-email and cross-Circle denial; cross-origin mutation; CSV quoted rows/validation/dedup/replay; pending-seat reservation and concurrent final-seat race; actual private note markers across projections; explicit callout text/unique counts/withdrawal; Cohort request dedup, authorization and exact caps; Cohort text denial; consent/no emails/revocation; canceled paid-through/transition/read-only/renewal; accepted-member transfer; Couple exact binding, pending/consent and no DesignPD; participant authenticated UI at1280/390/320; held-only delivery.

## Required integration coordination

- Actual HTTP owner approval needs an explicitly synthetic owner account. Start local server with `DYDD_ADMIN_EMAILS=circles-qa-owner@example.com` and run harness with `CIRCLES_QA_OWNER_EMAIL=circles-qa-owner@example.com`. Never configure a real owner account or impersonate one. Without this, script tests unauthorized owner approval and seeds a clearly labeled approved fixture for downstream Cohort tests, but reports owner HTTP coverage BLOCKED and exits nonzero.
- Couples endpoint confirmed as `/api/circles/couples?circleId=...` in experience code. Both partners must consent before a comparison is expected.
- Reconciled final core detail shape: lifecycle object (`phase`), `callouts.counts[{prompt,count}]`, `callouts.submissions` and `callouts.own`.
- Supabase skill applied; changelog checked (CLI v3 change irrelevant: harness uses pinned existing JS clients, no CLI/schema mutation).

## Genuine release issues / observed evidence

- Runtime blocker: no local HTTP server at `http://localhost:3138` during the first preflight. Start an isolated local server once owning parent finishes migration/build. Run command above; no need to create manual users.
- Static audit finding for experience owner: Couples API currently checks owner Personal/unlock (`hasTestCircleTools(owner,...)`) but does not verify the accepted partner still has active Personal. Added an actual HTTP regression case that expires only the synthetic partner entitlement and asserts shared members disappear/pending is explicit. This is a code-inspection finding until full HTTP run confirms.
- Core code now supplies scoped counts/submissions and exact membership authorization; not claimed runtime-verified yet.

Harness now also verifies direct authenticated ledger/RPC isolation, budget ledger survival after deletion, owner override (if synthetic owner configured), permanent Couple binding and partner-access expiry. JSON receipts/screenshots are written under workspace `outputs/circles-system`.

## Independent read-only DB readiness probe

At initial handoff, sandbox service-role reads confirm Couple bindings table exists, but all seven operations tables (`operation_limits`, `operation_events`, `cohort_requests`, `roster_previews`, `consents`, `callouts`, `held_outbox`, each prefixed `dydd_circle_`) are missing from the REST schema cache. These are migration/readiness blockers, not claimed missing permissions. The QA lane did not apply migrations. The first HTTP run must wait for the parent migration runner and local/hosted app readiness.

A failed operation-budget creation currently appears likely to return generic HTTP503 through legacy create route; the harness expects a controlled 4xx denial and will flag it if reproduced. This is a static contract concern, not a runtime-confirmed defect.
