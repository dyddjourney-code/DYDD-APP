# Guest DesignID couples membership: verified diagnosis / prepared remedy

## Verified live evidence (read-only, 2026-11-19)

- Recipient gio617215@gmail.com, display name Giovanni. Guest session `32545a44-ad1a-47ce-8bef-595ba1827a1a`.
- Saved DesignID result `112dc32b-aa9b-4e79-97b3-be16c514aeae`, completed 2026-11-19 03:26:32 UTC. Saved scores/research/report payload retained; report_state ready, PDF metadata present.
- Order `76f6bb9c-530a-4c38-b7da-918ba0e0fa74`: status paid, provider group_free. No payment/completion repair needed.
- Exact-email assessment_participants lookup returns zero rows. No account or participant was fabricated.
- Owner production is READY deployment `dpl_3FLWNKECGo7xLH7N6JFdbYFyqR1e`, SHA `3c092afbbfcefb5b29cbc3da09baa11de7f7eae1`, pinned project `prj_Aw8o5xjiMpVY9NaGvFBsamRIM4Aq`.

## Cause

`lib/public-assessments/owner-overview.ts` deliberately adds read-only synthetic participant IDs `guest:<session UUID>`, expressly without writing native participant/snapshot records or email-based claiming. Command Center disables both batch checkboxes and individual assignment forms for these IDs (`page.tsx` lines 2334, 2358, 2538).

This is not just a missing checkbox: assessment_group_members.participant_id is a UUID FK to assessment_participants. Assignment actions only persist native IDs. Couple-report loads only native assessment_snapshots for its two native membership IDs. Removing disabled would submit an invalid UUID; inserting a contact alone would produce a group member without usable DesignID evidence. Overview email consolidation is display grouping, not authority to claim an identity.

## Prepared safe remedy and decision boundary

Recommended durable implementation: explicit owner-only guest membership references to immutable guest session IDs; preserve original guest results as the source, no native result copies or auth users. This requires an additive schema migration (new assessment_group_guest_members table, or a reviewed polymorphic membership design), not an owner UI-only deploy. Guest sessions/results stay owner-only; never expose them to Circle owners merely because an email matches.

Implementation sequence:
1. Add guest-membership persistence with group FK, guest-session FK, unique group/session key, active/archived lifecycle, added_by actor, RLS and no anonymous/customer grants.
2. Owner-only assignment accepts guest session IDs, verifies group access and an eligible saved result, and writes only the explicitly selected group membership. Never pick a target group automatically.
3. Combine native and guest memberships in owner group loaders and couple-report; source exact saved scores, retain original result IDs and provenance. Require exactly two distinct active partners; reject ambiguous aliases/duplicates rather than silently email-linking identities.
4. Update individual/batch selectors and group removal. Preserve existing native flows and membership counts. Keep report download authorization unchanged and guest purchase/access checks separate.
5. Verify paid/free guest + native partner, guest+guest, two-native regression, duplicate handling, forbidden non-owner requests, archived members, absent scores, exact-score preservation, report outputs, typecheck/build and pinned protected owner deployment.

Alternative: explicitly owner-approved native contact bridge with no auth account, plus provenance-linked result loading (not score duplication). This changes the existing no-native-writes contract and still needs identity/ownership review; an automatic email-based bridge is not an acceptable hotfix.

No production writes, schema/auth changes, assignments, email, commits or deployment were performed. No live write test is claimed. Current user action: no retake/payment retry; preserve the completed guest result. Creating an account is not a verified workaround because no guest-result claim pipeline exists here. Approval of guest-group persistence is the concrete remaining architectural boundary.
