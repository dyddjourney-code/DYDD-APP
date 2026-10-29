# DYDD entry navigation and session boundaries

## Exact maintained addresses

- Live learner app: https://dydd-online-school.vercel.app/base-camp (canonical account dashboard `/hq`). Signed-in `/` now redirects to `/hq`; anonymous `/` remains the free beta introduction.
- Live login: https://dydd-online-school.vercel.app/login . Live users must confirm email. A session belongs to this hostname/browser profile; incognito and normal browser do not share it.
- Teaching sandbox: https://dydd-online-school-sandbox.vercel.app/base-camp . This existing entry opens the sandbox-only teaching preview when not signed into a separate sandbox account. `/sandbox-review` opens the same preview at Trailheads. `/login` explicitly means a separate sandbox password account, not a live learner account.
- Full original owner operations: https://dydd-private-owner-console.vercel.app/command-center . Vercel Authentication gates every deployment/alias before the app. This console reads **live original-school data**, even when entered through sandbox `/owner`; it is not the sandbox database or a learner session.
- Sandbox owner forwarding entry: https://dydd-online-school-sandbox.vercel.app/owner . The legacy original-project sandbox branch alias is maintained by `scripts/repair-sandbox-branch-alias.mjs`; immutable old deployment addresses remain historical.

## Narrow changes

Live and sandbox `/` validate the existing server session with `auth.getUser()` and send signed-in learners to Base Camp. They do not establish a session, change credentials, grant ownership or reinterpret Vercel sign-in as learner authentication. Landing pages no longer display obsolete module counts or the nonfunctional staged Ask Dydi form. Live Base Camp shows an external Owner Command Center link only when its existing exact, confirmed-email `isAdmin` predicate grants access; this link does not itself grant owner access. The live app footer also provides an Owner sign-in link so an owner using a different learner identity can still reach Vercel authentication; it exposes no owner data or learner privilege.

The separate owner console header has absolute **Live Base Camp** and **Sandbox Base Camp** return links. These leave the restricted owner app and restore the ordinary app sidebar/navigation at the destination. The console deliberately cannot host learner `/hq` or `/login` internally. No review token, learner cookie or owner credential is transferred by these links; referrers are suppressed. Live return can require a live learner login if that browser has none. Sandbox return uses the existing isolated teaching preview, not Vercel-to-learner SSO.

A separate sandbox account, live learner login, sandbox teaching-review cookie, and Vercel owner authentication are distinct. Identical email addresses do not merge them. A normal-browser login does not sign in incognito. Keep these boundaries: no shared cookie domain, live account copying, production preview bypass or database merge.

## Release discipline

The production worktree is `../dydd-online-school-release`, tracking the reviewed free-beta release; `../dydd-online-school` master checkout is historical and must not be deployed simply because of its local branch name. Push only reviewed release HEAD to `origin/master`, then `node scripts/deploy-production-beta.mjs` verifies exact SHA/project/alias. Sandbox is its own branch/worktree/project/database, explicitly deployed with `node scripts/deploy-sandbox.mjs`; never merge its runtime/cron/features wholesale into live. Full owner navigation changes are committed to `owner-command-center` and deployed only to the pinned `dydd-private-owner-console` project while preserving ALL-deployment Vercel authentication.

## Verification

`node tests/entry-navigation.mjs` (live) and `ENTRY_QA_ENV=sandbox node tests/entry-navigation.mjs` (sandbox), with optional allowlisted `ENTRY_QA_BASE`, exercise anonymous responsive entry, actual separate synthetic learner cookies, signed-in `/` redirect/reload, preview precedence and cleanup. No emails, assessments, report generation or customer edits. Published target tests create then delete only their synthetic auth account. Existing `free-beta-boundaries`, `environment-isolation` and `basecamp-admin-boundary` fixtures cover retained authorization. Owner branch `tests/owner-return-navigation.cjs` renders the actual owner header and checks both external returns and the strict pinned mode gate. Published owner browser smoke uses a temporary, revoked platform QA grant; real John's Vercel/browser identity is not impersonated.
