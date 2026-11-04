# Integration notes — owning agent

All lanes: read docs/circles-system-2026-11-04.md safe defaults. Never edit preexisting tmp/ files. Parent handles deploy + migration. No production changes or real sends.

## File coordination
- commerce owns all lib/commerce, app/api/stripe, billing SQL; expose capability/state helpers usable core.
- core owns operations endpoint/helper/migration and app/api/circles/route.ts. Please post operations contract immediately for UI.
- experience owns new operations UI, my-circles page, offers page, Couples API/helper and owner UI.
- owning integration agent owns legacy routes app/api/circles/{membership,data,export,field-guide,messages}/route.ts, lib/circles/plan.ts, tests/circles-system-published.mjs, migration/deploy tools and final docs.

## Required contracts / warnings
- Existing lib/circles/plan.ts Class presently unlimited; integration agent patches49 + Cohort50+.
- Existing membership acceptance bypasses approved cap/cancellation; integration agent will route existing invite acceptance through core operations as possible.
- Existing data.ts snapshot-sharing logic needs audit; integration agent prevents default leakage.
- Existing FieldGuide returns full leader content; participant operational projection needs participant-safe content and no leader notes.
- Core database should be canonical for membership/invitations; favor existing dydd_circle_memberships rather than a second divergent table.
- Export/report budget must be server enforced even on legacy export route.
- Approval mail held sandbox outbox, no real sending. UI expose actionable owner approval, not pretend notification.

## Owner approval configuration
Current Vercel env has NO DYDD_CIRCLES_OWNER_USER_IDS. Prefer existing `isDyddAdminEmail` verified auth email owner policy or parent will explicitly configure known owner IDs after DB query. Never trust client metadata. Owner preview may review pending synthetic approvals read-only, but approval requires genuine account.

## Existing surfaces owned by integration agent
Class max49 and Cohort50..1000 now patched in lib/circles/plan.ts. Report concurrency not promised. Will integrate operations state into legacy invite, field-guide, data, export and messages after helpers settle.

Independent QA lane now owns tests/circles-system-published.mjs + docs/circles-qa-findings.md; integration parent owns legacy-route regression tests instead.

## Privacy consent integration request (for core)
Please expose canonical consent table name/fields quickly in operations contract, integration agent needs ensure legacy `loadCircleData` does NOT publish accepted participant snapshots automatically. Creator can view own snapshots; all other records require explicit selected-Circle insights consent, including Couples. Couples legacy data route will suppress DesignPD unconditionally. Integration will enforce participant names opt-in via people consent too.

## Blocking integration defects spotted in draft SQL (18:48 UTC)
CORE: plan INSERT trigger currently requires full unlock for all formats/drafts. Couple cannot be paid until draft exists -> deadlock. Permit exactly one unpaid Couple draft with verified personal and permanent intended-pair binding; draft cannot operate or enroll. Need Cohort draft permitted before cap approval (leadership+personal) so approval workflow possible. Enforce create budgets on all draft creations and one pending Couple draft/binding per account. Core lifecycle duplicates commerce and currently ignores paid_through/refunds/personal; call commerce SQL state instead. Use its phase mapping active->full, transition->transition, unpaid/read_only->readonly, with p_circle NULL for insert since no row yet. See billing helper contract.
BILLING: explicit credited-leader choice must be exposed (not only earliest accepted); implemented final default doc says participant controls one credited leader. Coordinate core operation `credit_leader` or commerce API. Couple2 active membership requirement at operation vs acceptance should allow setup to invite the second member while personal paid creator is valid. Family tools require both active personal memberships after acceptance; no unconsented partner snapshots.

MIGRATION OWNERSHIP: Parent apply runner detected billing220000 already applied but SOURCE DRIFT. Do NOT silently rewrite applied migration; use a new corrective migration. Integration parent will inspect. Core please DO NOT APPLY until Couple-draft/lifecycle blocking issues fixed. Parent owns migration run + receipts.

Billing applied-source drift inspected: ONLY SQL dollar-quote delimiters collapsed $$ to $ in migration ledger statements (likely JS replacement-string escaping). Runtime schema applied original SQL. Parent runner accepts this documented exact normalization; no runtime change or ledger rewrite. Do not reapply220000. Use callback in String.replace to preserve dollar delimiters.

Parent privacy work complete locally: lib/circles/data.ts now queries dydd_circle_consents before snapshot lookups, names require people opt-in, results require insights opt-in, Couple legacy response suppresses DesignPD; regression tests/circle-sharing-consent.cjs PASS. Existing membership endpoint routes sandbox accept/decline/leave through canonical RPC. FieldGuide participant projection available (safe prepare/readings/questions/followThrough; no leader help/flow). Export payload adds circleId and durable report budget SQL222000. Old messages invite sandbox delegates core preview/invite_roster to avoid alternate acceptance loopholes. Core must retain rows/errors preview payload support. Billing ledger normalized by child, latest preflight exact hash matches.

## UI contract integration defects from 18:44 review — EXPERIENCE must resolve
- Real detail `callouts` is OBJECT `{counts,submissions,own}`, not array; current UI `.map` crashes.
- Real `consents` is ARRAY own permission record; UI expects object -> normalize.
- Real `outbox` rows `{recipient,payload:{token,...}}`, UI expects heldOutbox URL/email -> normalize or expose shape backend.
- Real lifecycle is `{phase:'active|transition|read_only|unpaid',canEnroll,...}`; UI uses state/mode/status defaultfull => readonly controls incorrect; phase active should display active, no paused banner.
- Callout core validation requires session STRING plus lesson/prompt and explicit audience; UI submits Number session and omits audience unless shared => 400; withdraw session normalize String too. Prompt max200 not300.
- `Open your Journey` URL `/journey/<slug>` nonexistent. Real Journey is /journey query. Inspect existing planner links for native lesson selector.
- Participant FieldGuide endpoint now supports safe projection; UI needs actual participant materials not placeholder sentence.
- Own consent + withdraw controls must remain enabled in readonly (server permits privacy revocation); only submitted new activity disabled.
- Owner-preview GET operations currently401; preserve genuine existing owner review navigation and planner; do not require new login just to inspect offers/current preview. Parent will add preview API if core does not.

Integration parent adds components/circle-lesson-callout.tsx + prompt-context map + Reflection DiscussionControl insertion: actual lesson/prompt explicit selected-Circle submit, fresh question textarea never copies private reminder, counts-only cohort variant, withdraw. No scoring/response IDs changed. Experience do not edit those files.

Local QA runtime starting localhost:3138 via scripts/start-circles-qa-sandbox.mjs with isolated DB/test billing and LOCAL ONLY synthetic owner email circles-qa-owner@example.com. Core SQL not yet applied: parent will apply when core source ready; do not run fixtures until docs/evidence/circles-migration-receipt.json shows applied221000. QA lane can run read-only preflight then actual tests after signal in this file. Typecheck and privacy/schedule/environment tests pass so far.

## CORE potentially critical live-SQL privilege issue
Commerce verified service_role cannot SELECT auth.users. Core SQL operate/trigger currently SELECTs auth.users in multiple places => service-only invoker RPC likely fails42501. Implement narrow SECURITY DEFINER stable helper `dydd_circle_verified_actor(who uuid, recipient text default null)` search_path='' returns bool based on fully qualified auth.users id+email_confirmed_at and optional intended-email match. Grant only service_role, revoke public/anon/authenticated. Replace raw auth.users reads in core funcs with narrow bool helper (including excluding own roster email). Alternative server passes trusted actor email but DB acceptance still needs verified identity. Do not broaden service_role auth.users grants.

Parent adding real Couple shared-logistics endpoint/RPC223000 plus components/circle-couple-planning.tsx; both accepted active spouses may edit dates/holiday breaks/timezone/location via allowed patch and optimistic revision, never pairing/private answers/billing. Experience lane: once no longer editing workspace, parent will insert this component. Please expose `.revision` on normalized circle type or parent adds.

Parent added customer Personal DC3 code field to ContextualPurchases + discountCode prop TestCheckoutButton (server fixed Personal-only TEST coupon; no add-on discount UI). New components/circle-leader-credit.tsx exposes real per-participant one-leader selection/opt-out; experience can render once in MyCircles nonpreview home. New CircleCouplePlanning should render inside Couple section with current revision and onSaved reload. Parent will insert after your final handoff if not done.

PARENT FIXED actual core SQL privilege issue in unapplied221000: narrow service-only SECURITY DEFINER dydd_circle_actor_email(uuid), empty search_path, verified email lookup only. Replaced all direct auth.users SELECTs in operate/trigger/transfer/preview. Core: preserve this integration fix. No broad auth grants. Please test via SET LOCAL ROLE service_role, not just postgres rollback.

Parent now applying221000+222000+223000 after rollback SQL checks passed, and billing220000 source exact verified. Please freeze221000 migration after application; any further correction gets a NEW migration. Both narrow verified_actor and actor_email helpers present due simultaneous independent fix; both service-only empty-search_path, safe. Local server localhost:3138 ready. QA: once receipt reflects applied, run actual HTTP/browser harness with CIRCLES_QA_OWNER_EMAIL=circles-qa-owner@example.com. Fix stale claim_couple test payload: now requires p_owner_email trusted synthetic leader.email (see commerce contract), plus cleanup dydd_test_leader_credits by participant_id.

All operations/report/shared-planning migrations now APPLIED sandbox; receipt docs/evidence/circles-migration-receipt.json. QA run now authorized ready localhost3138. Freeze221000 source: further runtime fixes new migration only. Actual source editor may display redacted token URL snippets `encod…` due tool sanitation; check booleans/AST before assuming baseline code corrupt.

PARENT hardening224000: expired participant personal must block NEW callouts/shared operations, not only invite acceptance. Privacy consent withdrawal/leave/callout withdrawal remain allowed. When invitations grow within category cap, raise expectedPeople to actual reserved seats so legacy planner validation remains compatible. Applied221000 remains immutable. Cohort plan max aligned100000 with approval API; no performance/load claim. New operations endpoint now explicitly sandbox TEST-only404 elsewhere.

QA LOCAL FETCH FIX: NODE_USE_ENV_PROXY=1 inherited with NO_PROXY unset routes localhost through egress proxy causing UND_ERR_SOCKET. Server IS running. Invoke harness with `NO_PROXY=localhost,127.0.0.1 CIRCLES_QA_BASE=http://127.0.0.1:3138 CIRCLES_QA_OWNER_EMAIL=circles-qa-owner@example.com node tests/circles-system-published.mjs`. Do not disable proxy for external Supabase. Migration224000 applied, actor Personal activity enforcement and target expectedPeople growth fix complete. Parent only runs preflight, QA lane should own full run now.

Post-integration acceptance:24/24 actual HTTP/browser checks PASS, all8users+10Circle fixtures cleaned, no runtime errors or1280/390/320 overflow. Additional hardening225000 now applies canonical69lesson/prompt catalog to cohort counts: arbitrary prompt text cannot collect written submissions under a topic-key disguise. UI uses canonical dropdown and exact assigned session. Report allowances226000 exposes owner-approved daily/monthly/burst PDF budgets without resetting usage. Final acceptance rerun will include these additions; independent release review underway.

Final review found4concrete issues; all addressed: legacy Couple data now mutual-consent gated and both-person paid-gated;225000 canonical Cohort prompts prevent hidden freewriting;227000 prevents written callout conversion into Cohort; sandbox insight consent no longer reads/returns DesignPD. Final25/25localHTTP checks PASS incl alternate Couple route and report owner overrides; exactPDF tests PASS for actual PDFs/readonly saved exports. Adding real customer subscription cancel-at-paid-end/resume/payment-method management so cancellation/renewal isn't only webhook logic. Existing TEST credentials reused; no customer payment or messaging.
