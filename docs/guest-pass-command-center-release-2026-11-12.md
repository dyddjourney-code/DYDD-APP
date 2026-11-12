# Guest Pass in the existing owner Command Center — 2026-11-12

## Root cause
The school `master` release a6b4a83 added individual passes to the learner production
project only. Sandbox's existing Owner navigation deliberately opens the separate
Vercel-authenticated `dydd-private-owner-console` project, branch
`owner-command-center`. Its f33fc6f still had the old group/coupon form. Reloading
Sandbox or the learner app could not update that independent owner deployment.

## Bounded repair
Port the reviewed individual pass management UI, server actions, HMAC/deadline and
invitation helpers into the existing protected owner branch. Preserve its pinned
private-project predicate and confirmed existing allowlisted audit owner identity.
Rename the existing `Free group & coupon access` navigation entry to
`DYDD Guest Pass` while retaining the exact `/owner/guest-access` route. Guest
links must use canonical learner production, never the protected owner hostname.
Add invitation eligibility to the owner's durable mail path with the same final
pre-provider expiry/revocation/recipient/content checks. Creating sends nothing.
Owner production needs `DYDD_GUEST_EMAIL_ENABLED=true`, matching the school.
Do not enable campaigns or send email to verify this release.

## Deployment and data boundaries
Deploy only owner-command-center to prj_Aw8o5xjiMpVY9NaGvFBsamRIM4Aq.
Keep Vercel authentication `deploymentType=all`; temporary verification bypass, if
used, must be revoked in finally. No sandbox schema/data/env changes, no school
production redeployment, no migrations or data backfill, no real invitation or
pass creation needed. Existing grant and completion records are shared with the
already migrated production school database. Preserve all other Command Center
capabilities and the sandbox owner forwarding routes.

## User entry
Existing Sandbox -> Command Center -> DYDD Guest Pass.
Direct: https://dydd-private-owner-console.vercel.app/owner/guest-access
Vercel owner authentication applies. Initial Access type is Individual guest pass,
with recipient email, optional name, products, Eastern completion date and no
manual individual capacity. Group/coupon remain selectable on the same screen.

Release evidence is under workspace outputs/dydd-guest-pass-ui-fix-2026-11-12/.
