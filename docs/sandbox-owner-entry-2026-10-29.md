# Sandbox owner entry: stale Vercel Active Branch alias

## Actual cause

The original school project's **sandbox** Active Branch pointed to an obsolete
October 19 preview (`fa0e6a1`, deployment `dpl_D66bQXhtHppjbWhD8rpjt77bypTa`),
not the maintained, isolated sandbox project. Its branch alias was
`dydd-online-school-git-sandbox-dydd-6069s-projects.vercel.app`.
That preview belongs to the production Vercel project, whose review credential
is scoped to production, not preview. `/owner` explicitly redirects to
`/login?next=%2Fcommand-center` without that credential. Vercel authentication
only opens the deployment; it does not establish an app learner/admin session.

The dedicated sandbox's actual homepage Owner Command Center click already
worked in a fresh browser before this repair. The October 21 continuity repair
and October 22 universal owner review had not regressed there. The failing
entry opened a different, stale deployment, older than those fixes.

## Repair and durable workflow

Reassign **only** the obsolete sandbox branch alias to the current READY
`dydd-online-school-sandbox` deployment. Both entry addresses now resolve to
that project's existing isolated database, existing server-verified preview
mechanism and current code. Do not restore owner credentials, owner preview
bypasses or sandbox environment flags in the production project.

`scripts/repair-sandbox-branch-alias.mjs` validates the sandbox database/project,
remote sandbox SHA, branch and READY state before assigning the alias. It
captures and compares the production stable alias/deployment/SHA before and
after and aborts on a mismatch. Its private receipt is
`tmp/sandbox-owner-access/alias-repair.json`.

`scripts/deploy-sandbox.mjs` invokes the repair after each successful explicit
sandbox deployment so the legacy branch address does not become stale again.
No application auth predicates, customer data, production deployments, project
environment variables, database state or outbound services change.

Use the maintained project `dydd-online-school-sandbox` in Vercel or bookmark
https://dydd-online-school-sandbox.vercel.app/owner . The old immutable October19
preview URL and its historical deployment card cannot be rewritten by an alias
repair; do not use its deployment-specific Visit URL. Refresh the dashboard and
use the branch alias or the dedicated sandbox project. Do not give that old
production-project preview an owner secret to make it appear functional.

## Verification

`node tests/sandbox-owner-entry-browser.mjs` uses fresh Chromium contexts on
both the legacy branch alias and canonical sandbox at1280/390px. It follows the
actual homepage Owner button to Command Center, then Accounts; verifies secure
HttpOnly review continuity, plain Command Center link/reload, no overflow and
zero JS errors/mutation requests. Fresh anonymous and invalid-token Accounts
APIs remain403; anonymous direct Command Center remains login-gated. Production
owner/review/Command Center/Accounts APIs remain404. No account fixtures,
assessment submissions, emails, reports, payments or customer writes are used.

Chromium/mobile viewport emulation, not physical Safari/iOS or John's private
Vercel browser session. Deployment identity and production preservation are
verified independently through the Vercel API receipt.
