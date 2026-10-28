# Sandbox Jordan profile persistence

John requested saveable photos, bio and three fun facts in his established Jordan owner-review account, without another login. This change exists on `sandbox` only.

- Profile JSON and its prepared photo are persisted in private sandbox Storage at `assessment-report-pdfs/sandbox-profiles/jordan.json`; no customer/account tables, schema, permissions or production data are changed.
- Every profile/photo request requires the sandbox runtime guard and the existing server-validated `review=new` owner credential. Missing/wrong credentials and other personas retain normal account authentication. Even if this code were copied to main, the preview path stays disabled outside sandbox.
- POST keeps same-origin/CSRF checks, field/photo validation, revision conflicts, and serialized saves through a private Storage lock. The profile and photo commit together as one object. Browser photo preparation matches normal profiles.
- Base Camp supports save/edit/reload. My Circles shows the same saved profile in a read-only private preview card. This does not publish profiles or claim Circle membership/profile-sharing integration is complete.
- Existing normal-account profile routes remain unchanged after the guarded preview dispatch.

Verification: `npm run typecheck`; `npm run build`; `node tests/environment-isolation.cjs`; `node tests/sandbox-preview-profile-access.cjs`; `node tests/sandbox-preview-profile.mjs` against local and deployed sandbox. Browser suite covers photo preparation/save/reload, bio/facts, private Circle card, photo removal, desktop/tablet/phone widths and no runtime errors. Its fixture is backed up and restored only if the exact QA revision remains current; newer external edits are preserved.
