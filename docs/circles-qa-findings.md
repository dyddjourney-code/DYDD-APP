# Circles independent QA findings

State: final local actual HTTP/browser acceptance PASSED25/25 after integration, with zero runtime errors or horizontal overflow at1280/390/320; all8temporary identities/10Circle fixture IDs cleaned. Initial handoff readiness findings below are historical and resolved. Hosted verification is in progress.

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

## Final integration resolution
The local server and all operations migrations are ready. Initial local fetch failure was inherited egress proxy handling; `NO_PROXY=localhost,127.0.0.1` is required for loopback. Couple partner expiry and alternate-route mutual-consent checks are enforced. Quota denial returns controlled409. Canonical Cohort prompt catalog prevents free writing via identifiers; owner report allowances and real planner PDF/history checks pass. See docs/evidence/circles-local-acceptance.json and circles-pdf-verification.json.

## Hosted acceptance checkpoint
Initial hosted run passed24of25checks, including actual hosted owner approval/allowance changes and all backend workflows. The browser navigation waited for networkidle0 and timed out on external assets; no application runtime error occurred. Harness now waits for DOM content and actual Circle readiness. All7disposable accounts/10Circle fixture IDs cleaned; one explicit synthetic owner fixture is retained solely until hosted acceptance and then removed with its environment authority.

## Final release resolution
All historical runtime/schema/owner-fixture readiness blockers above are resolved. Full local acceptance passed25/25. Actual hosted backend acceptance passed24checks; a focused actual browser follow-up covers participant preparation, explicit count submission/withdrawal, Couple capacity overlay/detail/SpiritualGifts, spouse calendar edits, and desktop/mobile widths without intercepted backend responses. Runtimee8a478d additionally fixes the native header context, never-paid Field Guide access, and finish-mode shared holiday derivation. Temporary owner account/environment/credential file removed before final deployment. The final published-browser and cleanup JSON receipts are the current outcome; earlier failed harness receipts remain historical evidence.

Manual final screenshot inspection also identified cramped four-column capacity text at320px; replaced narrow-screen cells with labeled stacked rows, and added an actual computed-layout browser regression.

FINAL PASS: runtimee8a478d /dpl_4ubq6fHTqm2Sf1yXXW932EizpFyH actual9UIchecks pass, responsive labeled rows confirmed at320/390, no JS errors/overflow. Subsequent release audit passes with zero synthetic auth fixtures, original3plans/1Couple binding preserved, no new operations/outbox/privacy fixture residue, temporary owner authority removed, production/ref isolation unchanged. No unresolved agreed-scope release blocker.
