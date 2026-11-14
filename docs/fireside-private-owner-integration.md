# Fireside within the actual private Owner Command Center

The existing top tab links to `/command-center/fireside` on this console, not to
another application's login. All six host workspaces and the gathering editor run
inside the original console chrome. The public **View Live Fireside** action is
explicitly a sandbox guest-product link; it is not the host entrypoint.

## Trust and isolation

The existing server-only `isPrivateOwnerConsole()` gate requires owner mode,
production environment, and pinned Vercel project
`prj_Aw8o5xjiMpVY9NaGvFBsamRIM4Aq`. This deployment MUST retain Vercel Authentication
on **all deployments**; its existing platform authentication is the owner access
boundary. No browser cookie, header, review token, or second Supabase identity
enables that mode. No new identity bridge or token handoff is used.

Host routes are exclusively `/api/command-center/fireside/{host,upload}`, under
the existing private middleware allowlist and same-origin write/CSRF guard.
The API repeats the private-owner guard. GET responses are private/no-store.

`lib/fireside-owner/server.ts` uses only dedicated **server-only**, encrypted
production environment variables `FIRESIDE_SANDBOX_SUPABASE_URL` and
`FIRESIDE_SANDBOX_SERVICE_ROLE_KEY`. The URL is hard-pinned to
`https://atemrshtshxoqnuevvqu.supabase.co`. Missing/wrong configuration fails closed;
it never falls back to the original-school client or keys. Existing live-school
environment variables and other console tools are unchanged. The sandbox key is
never serialized or passed into React props. Signed upload grants target only the
existing private sandbox bucket and an individual random object path.

The scoped route uses the existing sandbox validation, transactional event and
registration RPCs, revision checks, and preview-only email renderer. It does not
activate email, payments, Zoom, or a delivery worker. No learner-production
schema/content or authentication settings are changed. Sandbox host publishing
changes sandbox content only.

## Verification boundary

Use a loopback production-mode process with the existing pinned owner environment
for authenticated-equivalent browser navigation and host API checks against the
real sandbox. Never enable owner mode on a public/shared test server. Verify
ALL-deployment protection and stable hosted aliases separately. Do not describe a
local equivalent as John's hosted SSO walkthrough. No Vercel bypass is necessary.
