# MAPS sandbox route restoration — 2026-11-24

The sandbox sidebar/mobile navigation linked to `/command-center/maps`, but
October 29's sandbox commit `c54cf71` added only those links. The actual MAPS
foundation page, styling, and six brand assets existed exclusively in the
owner-console worktree. The sandbox therefore returned a genuine route 404,
independent of John's permissions (confirmed by hosted anonymous GET before fix).

Restored that existing authored foundation and assets without redesigning it.
Replaced its owner-console-only deployment predicate with the isolated sandbox
boundary plus genuine `auth.getUser()` and confirmed admin email. Anonymous or
expired sessions return to sandbox login preserving the MAPS destination;
unverified/non-owner identities get 404. Production fails closed before auth.
Added MAPS to the shared Command Center tab bar.

Verification: `npm run typecheck`, `npm run build`, and
`node tests/maps-sandbox-access.cjs` passed. Regression covers all three existing
John admin emails, four phases/four labs, anonymous/expired auth, learner,
editable metadata spoofing, unverified owner, and production fail-closed.
Read-only sandbox auth audit independently confirmed the existing John account.
No auth configuration, users/passwords, assessment logic/data, report generation,
email, production branch, or production deploy was changed. Existing unrelated
working-tree evidence files remain untouched. Full hosted authenticated render
requires John's actual browser session; no login credentials were fabricated.

Release target: `https://dydd-online-school-sandbox.vercel.app/command-center/maps`
via the established `scripts/deploy-sandbox.mjs` sandbox-only workflow.
