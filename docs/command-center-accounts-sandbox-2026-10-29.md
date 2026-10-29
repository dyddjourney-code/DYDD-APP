# Command Center Accounts — sandbox v1

Sandbox only. Route `/command-center/accounts`; completion-only backend
`GET /api/command-center/accounts`. The existing Command Center displays its new
Accounts tab only to the existing owner/admin predicate and only in sandbox.
No migration, production deployment, billing connection, mail or payment change.

## Authorization and privacy

- `lib/accounts/access.ts` uses the exact existing `isOwnerPreviewRequest` or
  verified `auth.getUser()` plus `isDyddAdminEmail`. The sandbox environment is
  an additional mandatory condition. User-editable metadata never grants access.
- The privileged reader repeats authorization before constructing an admin client.
  The JSON endpoint returns 403 to unauthorized callers, 503 on source failure;
  it never returns partial totals. Next may stream a page-level not-found with
  HTTP200; its actual content is still the not-found boundary, not account data.
- Dynamic rendering and explicit private/no-store, no-referrer/noindex headers.
- No scores, report payloads, reflections, answers, PDFs, primary/secondary
  reflection badges, beta code hashes or full Circle plans are queried or sent.
  Names and email are shown solely as the authorized owner account directory.
- The read path performs no writes or external provider requests.

## Data dictionary

| Display | Definition / source |
| --- | --- |
| Total signups | Existing non-anonymous sandbox `auth.users`, fully paginated. Deleted accounts excluded. Signup timestamp UTC. |
| Monthly signups | Accounts whose `created_at` falls in the selected UTC calendar month. Last12month chart, earlier dates via month control. |
| Free lifetime beta | `dydd_personal_access` per account; `granted_at` provides month and redemption date. Not paid. No raw code displayed. |
| Unused beta codes | Exact count of `dydd_beta_access_codes` with null `redeemed_at`. |
| Assessment milestone | Whitelisted saved `passport_awards` keys `designid`, `spiritual_gifts`, `fruit_360`; first saved award date. No inference from draft/submission/purchase. Unsynced old assessments are not included. These are recorded historical milestones, not a current result audit. |
| Course finished | Every canonical lesson in `passport_lesson_completions` or `passport_awards` with trusted `legacy_completed_enrollment` source for that course. A chapter award, last lesson or reflection alone never completes a course. Date is latest canonical checklist date or saved legacy award date, not inferred original event date. |
| Active Circles | `journey_circle_plans` with active status and real `user_id`. Preview plans, drafts and archives excluded. |
| Accepted memberships | Accepted `dydd_circle_memberships` still on that Circle's current roster. Duplicate identity within Circle removed; invited/declined/left/revoked/expired/removed do not count. Organizers not assumed members. |
| Average membership | Accepted memberships / current active Circles. No Circles => unavailable denominator. |
| Member completion % | Accepted Circle membership seats linked to an account with complete Journey / all accepted seats. Same account in2Circles counts2seats. Unlinked membership remains in denominator and is separately disclosed as unmeasurable, never assumed complete. No memberships => not applicable. |

**Financial limitations:** Sandbox REST schema has no recurring paid-subscription
or DesignPD order/payment ledger. Existing Waypoints subscriptions are email,
not paid memberships. FruitLife entitlement rows are not DesignPD purchases.
The active paid count, collected revenue, historical membership revenue and
DesignPD purchase totals are explicitly unavailable/not connected, not zero.
The optional $10/month calculator is a user-entered hypothetical scenario only;
its output is projected, never measured revenue. Free permanent codes are never
included. Month selectors do not invent historic Circle/billing snapshots.

## Verification and repeatable workflow

Run `node tests/accounts-metrics.cjs`, `node tests/accounts-authorization.cjs`,
`node tests/accounts-reader.cjs`, `npm run typecheck`, `npm run build`.
Reader fixtures verify1001accounts and1001awards across pagination and failure
without partial totals; access tests verify sandbox fail-closed and authorization
before service-role reads. Metric tests cover canonical vs chapter/last-lesson,
trusted imports, UTC month edges, beta access and Circle membership boundaries.

For genuine browser acceptance, run built sandbox on3162, then
`node tests/accounts-dashboard-browser.mjs`. Published sandbox requires
`ACCOUNTS_BASE=https://dydd-online-school-sandbox.vercel.app
ACCOUNTS_DEPLOYMENT_READY=1 node tests/accounts-dashboard-browser.mjs`.
The harness creates isolated synthetic sandbox accounts/checklists/awards,
a synthetic free-beta grant and Circle memberships, tests real page/API denials,
SSR data minimization,1280/390/320 layouts, filter/search/month/calculator, then
removes all fixtures. It does not submit assessments or send messages. Existing
10beta codes are compared byte-for-byte before/after, never printed.
Evidence and screenshots live under `tmp/accounts-dashboard/` (not committed).
Publish only with the sandbox's `scripts/deploy-sandbox.mjs` after pushing the
sandbox branch; verify exact SHA/project/READY/stable alias via Vercel receipt.
