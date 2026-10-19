# Base Camp profiles and parallel development

## Delivered profile scope
- Base Camp `/hq`, including the FruitLife lane: display name, optional 600-character bio and three optional 120-character fun facts.
- Photo center-cropped/resized in the browser to 512px JPEG; input JPEG/PNG/WebP <=12MB, stored output <=1MB. Preview before save; remove/change/cancel supported.
- Private `basecamp_profiles` table plus private `basecamp-photos` bucket. Authenticated owner-only RLS, validated same-origin writes, optimistic revisions, no-store responses and private photo endpoint. No public profile directory or Circle sharing yet.
- Account email/full_name and assessment identity are not overwritten. Review/demo accounts can inspect the editor, but cannot write an actual user's profile; sign in normally to save.
- Error states preserve edits. Duplicate/parallel saves return conflicts; superseded photos cleaned up after successful profile update.

## Stable beta vs sandbox
- Stable beta: existing Vercel `dydd-online-school`, Git `master`, existing database `laojrzlqbkmirzcbcnyw`. Keep normal class/Field Guide walkthrough updates here.
- Sandbox: separate Vercel project `dydd-online-school-sandbox`, Git `sandbox`, separate Supabase branch/database `atemrshtshxoqnuevvqu`. Persistent Micro compute, published minimum $0.01344/hour plus usage. No production customers/accounts/results/reflections/objects copied.
- Sandbox initialized from schema-only production snapshot because historical migrations do not fully rebuild the current schema. Public schema/permissions and migration history were synchronized; storage bucket configurations and owner-only photo policies copied; only reference assessment/Waypoint content seeded. Never use automatic branch merge/reset to promote data.
- Sandbox uses its own accounts and authentication credentials. Password signup enabled without confirmation emails. In-app magic links/password-reset emails are blocked in sandbox. Existing live passwords do not work there.
- Sandbox env vars are allowlisted, not copied from production: own Supabase URL/key/service role, new review token, sandbox marker/reference and app URL. No Resend, Stripe, PDFMonkey, Google Sheets or production webhook credentials.
- Database config fails closed if sandbox is pointed at live school DB or any unexpected project. Email sender, payments and external PDF generation have explicit sandbox guards.
- Sandbox branch `vercel.json` has no cron jobs. Main project's preview deploys disabled so feature-branch pushes cannot accidentally run against inherited live credentials. Its production `master` deployments remain enabled.
- Sandbox Vercel project intentionally has no automatic Git linkage. Deploy explicitly with `node scripts/deploy-sandbox.mjs`; it validates separate project/database and always deploys the pushed `sandbox` ref. This prevents pushes to master changing sandbox and sandbox pushes changing live.
- Banner distinguishes sandbox. Conversation/discussion flags start OFF and cannot enable those features on stable beta through these flags.

## Working procedure
1. Continue content walkthrough and reviewed fixes on master. Record/deploy finished scoped commits as usual.
2. Develop social features in a separate sandbox checkout/worktree; never switch a shared dirty checkout. Keep curriculum edits out of feature commits.
3. Apply new feature migrations only to sandbox first. Test real separate accounts/memberships, reconnect/retry, privacy, mobile layout and disabled external delivery.
4. Push sandbox, run explicit deploy command, verify the exact deployment and stable alias. Use synthetic test accounts; invite additional testers deliberately later.
5. Promote only reviewed feature commits (cherry-pick), with reviewed additive live migration and verified rollback. Never merge sandbox runtime/cron config or copy sandbox rows to live. Turn social access on only when its membership/payment bridge and privacy checks are ready.
6. Backport finished class edits to sandbox selectively without replacing its environment protections.

## Verification
`node tests/environment-isolation.cjs`: fails-closed DB matching, live social flags OFF and sandbox outbound guards with network calls forbidden.
`node tests/basecamp-profile.mjs`: synthetic confirmed QA accounts, actual save/reload, cross-account RLS, CSRF, input/file validation, conflicts, real browser photo preparation and 1280/768/390/320px persistence/layout, removal and cleanup. `PROFILE_TEST_BASE` selects deployment; `PROFILE_TEST_CREDENTIALS` selects its own private account credential file. Never run a production credential set against the sandbox or vice versa.
`npm run typecheck`, remote Next production build, exact deployment/alias verification. QA accounts/files removed afterward.

Social chat, paid invitations/membership and Journey discussion marks are not part of the profile release. John remains owner of DesignID/Journey/leader Field Guide content review; it is not a prerequisite for parallel sandbox work.
