# Trailheads / Field Kit unification — 2026-10-15

## Product model

- **Trailheads:** main DYDD Journey showcase, assessment/report entry, results connection, and course access for each focused trail.
- **Field Kit:** saved reports/results/resources and active FruitLife360 response tracking. No assessment catalog.
- Existing signpost images and the main DYDD logo are preserved. Reusable live-text placards use enamel-green frames, cream insets, rating markers, and terrain/gear/best-for/permit information.
- Only the permit line says Included; DesignPD remains a $15 optional expansion. Existing separate FruitLife mini-app billing is preserved.

## Progression and access

- The main Journey requires no assessment.
- DesignID, Spiritual Gifts, FruitLife360 and DesignPD course players **and standalone lessons** require a completed matching assessment/report.
- DesignPD still uses account-owned expansion access; preview records do not authorize the paid course. Pending native DesignPD PDFs do not unlock it. No payment integration was added or changed.
- The next-step button changes from assessment/report discovery to Start/Continue Course. Current FruitLife assessments link to Field Kit tracking. Reports remain accessible independently.
- Journey and course lesson positions are remembered on the current browser/device. This is navigation resume, not cloud completion or badge eligibility.

## Navigation audit

- Ranger Desk discovery links now target the appropriate Trailhead; saved-results link remains Field Kit.
- Base Camp tool discovery and command-center DesignPD discovery target Trailheads.
- Journey assessment/DesignID reflection lessons and the Spiritual Gifts assessment lesson include a connected-trail bridge and preserve the current Journey position.
- Course/standalone lesson navigation and DesignID/DesignPD submitted pages offer Return to My Journey and trail return actions.
- Retired Field Kit `#subscription-assessments` / `#optional-expansions` bookmarks forward to Trailheads.
- Field Kit artifact/download links, FruitLife active-session tokens, report delivery paths, invitation/reminder actions, and public assessment entry URLs remain intact.
- Review query construction preserves fragments correctly.

## Verification

- Production build/typecheck.
- `node tests/trails/access.cjs`: 20 prerequisite cases plus review-fragment cases, with no real learner writes.
- Browser harness: `tests/trails/navigation.mjs`; 1280/768/390 new-user layout/artwork/actions, signed-in Field Kit without assessment catalog, report-completed preview course routes, saved Journey round trip, all four course lesson resumes, resume label, retired bookmark forwarding, mini-app layouts. No assessment submissions, email sends, purchases, or report generation.

## Unchanged / deferred

Assessment content/scoring, retake limits, report generation, customer data, Stripe pricing/fulfillment, Passport badge rules, Ranger Station map/header, and site navigation names are unchanged. Persistent cross-device course completion remains separate work.
