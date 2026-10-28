# Current-primary DesignID badges and Field Kit assessment entry — 2026-10-28

## Contract and root cause

Only the current/latest completed saved DesignID **Primary** earns a design-type badge, shared by the main Passport and DesignID short trail. Assessment completion and course completion remain independent. A saved assessment/report never auto-completes its teaching course.

The old sync accumulated each historical result's primary into the durable award ledger, and the renderer deliberately displayed historical reflection awards alongside the current one. This was not an erroneous secondary calculation: the affected returning learner's extra Artisan badge came from an older saved primary. Current result: Architect 34, Shepherd 32, Artisan 28, Steward 6 (100 total). Current Primary is Architect; Secondary is Shepherd. No exact tie; two-point gap is the existing near-tie language only.

- Sync now awards only the latest verified completed DesignID's canonical saved Primary.
- Returned course-progress award state filters historical reflection keys against that current primary.
- Shared Passport badge builder never re-adds historical reflection keys, so main Passport and short trail agree.
- Historical ledger rows and assessment snapshots remain unchanged; no migrations, deletes, rescoring or account data repairs.
- Saved Primary is authoritative. Existing native engine orders total points descending and breaks exact ties Architect → Artisan → Shepherd → Steward. Exact/near ties do not earn a second badge. This patch changes no scoring or presentation language in reports.

## Field Kit

Missing-report collections show a clear **Take assessment** action in desktop reports and the always-visible mobile summary. Destinations reuse the real existing routes: `/designid`, `/spiritual-gifts?channel=app`, `/fruitlife360`, `/designpd`. DesignPD without a connected DesignID report instead links to `/designid` with prerequisite copy. Native routes retain their existing authentication/access/active-session handling. No new entitlement or prerequisite bypass is introduced. Existing reports keep their report/PDF/course/reflection actions.

## Profile finding (read-only)

The affected stable account has its identity in `school_profiles`, but no saved `basecamp_profiles` record. An empty optional Base Camp profile is therefore expected; assessment imports do not populate personal biography, fun facts or photo. No personal data was invented or changed. The same target email has no corresponding sandbox account/history; sandbox owner preview is a distinct isolated identity, not that production account.

## Verification

- `node scripts/verify-primary-badges.cjs` passes independently in both checkouts: every possible primary; stale/all-four historical awards; saved exact tie; fresh empty account; latest-only sync; no course auto-awards; native Field Kit routes and DesignPD prerequisite.
- Typecheck + production build passed both environments.
- Read-only projection of actual returning learner's saved latest/historical snapshots and existing award ledger yields Architect alone and zero short-course auto-awards.
- Actual FieldKitCollection server-rendered with production CSS, empty and returning states × 320/390/768/1280: one visible assessment CTA per missing report, correct prerequisite/native routes, no horizontal overflow. Screenshots visually reviewed.
- Browser rendering uses read-only fixture projections, not a newly created or impersonated live account. No live authenticated account save, assessment submit, PDF generation or email test is claimed. Published identity/alias and public/auth-redirect/beta-boundary probes recorded separately.
- Stable public beta and sandbox admin/runtime boundaries are preserved: only four shared source files plus this verification script/document changed; environment/signup/admin/scoring code untouched. Sandbox-only discussion-reminder condition is preserved.

## Evidence

Private local receipts (not committed): `tmp/primary-badge-readonly.json`; `tmp/primary-badges/real-result-projection-proof.json`; `tmp/primary-badges/browser-proof.json`; responsive screenshots under `tmp/primary-badges/`; typecheck/build logs; final deploy proofs in each environment's `tmp/`.
