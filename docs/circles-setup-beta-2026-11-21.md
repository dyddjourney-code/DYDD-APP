# Limited volunteer-facing Circle setup beta — November 21, 2026

## Authorized scope

Public learner app only: create/edit Circle plans, complete the four-step setup,
save/edit/remove draft people, reopen the persisted plan and calendar. Stop before
invitations. No admission links, participant enrollment, paid Circle products,
messages, sharing of assessment results or personal writing. Owner console and
teaching sandbox are separate deployments and are not promoted or redeployed.

The existing planner is the same four-step setup used by the sandbox (the only
previous differences were test-purchase controls and an export circle ID). Reuse
it and its calendar editor; do not promote the sandbox operations or TEST billing.

## Policy and implementation

- `lib/circles/beta-policy.ts`: public setup pilot runs through February 28, 2027;
  subsequent writes fail closed while saved plans remain readable. This is a
  temporary setup policy for signed-in beta accounts, NOT a permanent Leadership,
  Couples, participant, billing or cross-person-results entitlement. Lifetime
  PERSONAL grants and assessment prerequisites are untouched.
- Couple 2, Small group 3–19, Class 20–49 planned people, including organizer.
  Cohorts are not in this slice. Existing larger plans remain readable.
- `journey_circle_plans` is reused without schema changes. Completing setup stores
  `plan.betaSetupComplete=true` but database status remains **draft**, so completion
  cannot activate memberships/campaigns. Old active plans remain readable and are
  converted to planning-only drafts only on their owner's deliberate next save.
  Revision/conflict/idempotency and exact creator scopes remain enforced.
- Middleware denies **all** `/api/circles/*` operational URLs except plan PDF and
  creator-scoped static Field Guide. The current messages, membership and data
  handlers independently deny before authentication/database calls. Circle-specific
  commerce/Stripe URLs deny as well; unrelated public assessment and personal
  purchase paths remain unchanged.
- Lifecycle event processing consumes Circle events without enqueueing. Worker
  eligibility rejects Circle/campaign/category/E-series jobs before submission.
  Global automation flags and schedulers are NOT enabled or changed.
- Existing DB ACLs were inspected: authenticated plan access is owner-scoped SELECT
  only. Mutations and operational RPCs are service-only. Trigger-returning functions
  cannot be called as ordinary RPCs. No sandbox database, schema, data, TEST gate,
  billing catalog or authoring content is copied to production.
- Public UI has Schedule and People, with explicit draft/not-invited notices, no
  send/result/payment tabs. Draft people have add/edit/remove controls. The public
  introduction clarifies that invitations/enrollment are not part of this beta.

## Verification

- `node tests/circle-setup-beta-policy.cjs`: expiry, operational default deny,
  direct handler GET/POST pre-DB denial, worker pre-DB no-send, sandbox isolation,
  assessment/personal/owner path independence.
- `scripts/verify-circle-setup-beta.mjs`: real production-compatible HTTP/auth/DB
  fixtures, all synthetic `example.test` accounts. Authentication, ownership/RLS,
  forged owner, retries, optimistic conflicts, edits, participant persistence,
  caps, cross-origin checks. Anonymous/creator/foreign GET and POST requests to
  invitation/membership/messages/data/admission/payment paths must return 423.
- Browser: full four-step create→schedule→add/edit person→review→complete→reload
  at 320, 390, 768 and 1280px, persisted draft-only data, no overflow/no uncaught
  errors/no send or assessment controls. Screenshots inspected at phone widths.
- Fixtures produce zero memberships, campaigns or Circle lifecycle jobs. Cleanup
  requires exact restoration of original record counts + content hashes for plans,
  memberships, campaigns, message drafts, assessments, lifetime Personal grants,
  beta codes, lifecycle jobs/events, sent email records and Auth users. No provider
  calls or actual invitations/email/payment tests are performed.
- Shared schedule/curriculum regressions cover all 104 meeting counts and 1,440
  clock values. Sandbox legacy projection contract, Base Camp authorization,
  environment isolation, personal cancellation, public assessment runtime catalog
  and production payment/entitlement suites are run independently with fixtures.

## Release and rollback

Maintained source starts at exact published `0948c0a4da0084ae456f54d5fd081292a95e588b`.
Push reviewed commit to production `master`, then run `scripts/deploy-production-beta.mjs`.
Verify BOTH `app.discoverdivine.design` and `dydd-online-school.vercel.app` resolve to
the exact reviewed SHA/project/READY deployment. Re-run authenticated acceptance
against canonical public domain. Recheck sandbox and owner alias SHA/protection.

No schema migration or rollback is needed. Re-aliasing the old release would
restore the old invitation operations, so a rollback must preserve the new
setup-only server fences or temporarily block Circle routes. Never roll back by
turning on sandbox/test flags. Deployment and test receipts are in workspace
`outputs/dydd-circles-beta-2026-11-21/`.

Local checkout has a pre-existing external `node_modules` symlink. Its Turbopack
filesystem-root restriction requires `npm run build -- --webpack` locally; Vercel
uses a normal dependency installation. Local env is private/ignored and uses the
canonical HTTPS app origin. Node HTTP fixtures require `NO_PROXY=localhost,127.0.0.1`
so the platform's configured outbound proxy does not intercept localhost.
