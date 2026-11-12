# Protected owner public-assessment integration — 2026-11-12

Actual owner repository/branch: `dydd-owner-full` / `owner-command-center`, deployed
only to `prj_Aw8o5xjiMpVY9NaGvFBsamRIM4Aq`, alias
https://dydd-private-owner-console.vercel.app. Private mode remains pinned to
this project and production; Vercel Authentication must remain `all` deployments.
The public assessment app's Command Center remains unavailable.

## Changes

- Read-only canonical public-results overlay adds every retained guest result,
  original contact, paid/coupon/free grant provenance, order/session/source IDs,
  and current purchase state without changing native saved scores.
- Public Spiritual Gifts saved snapshots retain original session contact/channel;
  a saved response without a snapshot is represented from retained derived scores,
  never rescored. Existing snapshot/response records are deduplicated by exact ID.
- Legacy excluded native test groups still hide their native results. Public
  submissions on those same merged contact cards remain visible: hiding the
  whole participant would otherwise conceal the user's real paid guest results.
- New nav opens protected `/owner/guest-access`. This is the ONLY additional path
  allowed by private owner middleware. Grant actions resolve a real confirmed
  admin Auth user for audit provenance, retain same-origin write protection,
  require explicit owner inputs, hash capabilities, and return a one-time absolute
  public app link. No actual group/coupon or enrollment is seeded by this release.
- Owner guest report route reads only ready original private stored PDF at
  `assessment-report-pdfs/guest/<exact-result-id>/report.pdf` and returns a
  five-minute signed URL. No generation, payment, email or scoring dependency.
- Existing owner Accounts, Design Map, MAPS, Expedition, native report resolvers,
  group management, and app-return navigation preserved.

## Dependencies and verification

Public project owns migrations and deployment. Production canonical DB remains
`laojrzlqbkmirzcbcnyw`; guest migration `20261112142808` must precede this release.
Owner project adds only five public-ledger readiness/origin settings; no existing
DB/auth/email/payment provider settings or protection settings are replaced.

`npm run typecheck`, `npm run build`, `node tests/owner-public-overview.cjs`,
`node tests/owner-visible-records.cjs`, and `git diff --check` verify this change.
Read-only local production-build browser QA uses the actual production DB and
pinned private-owner server mode, desktop/390/320 viewports, exact original PDF
paths, and blocks all non-GET browser requests. Runtime evidence and release
receipt: `outputs/dydd-guest-cleanup-2026-11-12/OWNER-INTEGRATION-STATUS.md` and
`owner-*.json` in the agent workspace.

Hosted authenticated browser UI is unverified when no preexisting authorized
Vercel bypass credential exists. Do not generate a new bypass or relax protection
for this check. Instead verify exact deployed SHA/project/production alias and
anonymous Vercel-auth boundary. Report this limitation explicitly.
