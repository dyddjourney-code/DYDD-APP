# Private owner guest grouping fix — November 19, 2026

Implements John's explicit scope in `guest-group-owner-scope-2026-11-19.md`.

- Owner-only guest memberships reference immutable `dydd_guest_sessions.id` in a separate additive table. No contact/account creation, native result copies, email claims or source changes.
- Original native assignments remain on `assessment_group_members`. A service-role-only SECURITY INVOKER function atomically validates/upserts mixed selections into the two tables. Guest selection requires retained DesignID/DesignPD evidence attached to a paid order (including group-free grants). Only active explicitly selected groups are eligible.
- Owner Command Center individual and both batch selectors accept guest identities. Guest cards remain session-specific rather than merging into native cards by email/name. Group views/counts/removal include explicit guest memberships. Removal is also scoped to the submitted group.
- Guest writes require both the pinned private-owner project runtime and existing admin actor authorization. The database guest table has RLS with no anon/authenticated policies or grants. Its assignment function is not executable by those roles.
- Marriage Design report combines active native and guest membership references, requires exactly two distinct partners, rejects canonical-email alias pairs, loads exact paid-order guest scores without recalculation/copying, and retains source result/session/order IDs in the loaded evidence. Missing/non-numeric guest capacity scores cannot become a zero chart. Guest reports are denied to Circle owners and non-private admin requests. Native two-partner behavior remains.
- Original guest purchase/download access and reporting pipelines, payment, PDF archive, scores, research, auth users and public app deployments remain untouched. Giovanni is not assigned to any real group; John chooses it.

## Verification

- Production additive schema applied with source file retained in `supabase/migrations/20261119110520_owner_guest_group_members.sql`.
- Live SQL tests in a transaction rolled back: native/native, native/guest, guest/guest; duplicate upsert; archive; invalid mixed batch atomicity; anon/authenticated table/function denial; RLS.
- Giovanni full saved result row hash and counts of native memberships, snapshots and guest sessions unchanged before/after migration and tests.
- Actual report GET handler tests (mock database fixtures): mixed, guest/guest, native/native HTML; missing scores; reversed order; missing partner; duplicate membership; Gmail alias duplicate; non-admin; unauthenticated; non-private admin. Eleven pass.
- TypeScript and optimized production build pass. Release receipt and actual UI QA recorded separately with deployment.

## Rollback

Deploy previous owner commit `3c092afbbfcefb5b29cbc3da09baa11de7f7eae1` on the same pinned protected owner project. Leave the additive table/function in place; no destructive down migration is needed. Old code does not read the new table. No public app release is part of this change.
