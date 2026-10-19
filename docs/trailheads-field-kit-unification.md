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
- Review query construction preserves fragments correctly. Ranger Desk, Journey bridges, main-Journey start/continue, and course return links retain the selected sample account throughout the loop.

## Verification

- Production build/typecheck.
- `node tests/trails/access.cjs`: 20 prerequisite cases plus review-fragment cases, with no real learner writes.
- Focused preview-context regression: `tests/trails/preview-navigation.mjs` checks Ranger Desk → DesignID Trailhead → course → Journey → connected trail → same lesson, retaining the same review account without sign-in or data submission.
- Browser harness: `tests/trails/navigation.mjs`; 1280/768/390 new-user layout/artwork/actions, signed-in Field Kit without assessment catalog, report-completed preview course routes, saved Journey round trip, all four course lesson resumes, resume label, retired bookmark forwarding, mini-app layouts. No assessment submissions, email sends, purchases, or report generation.

## Unchanged / deferred

Assessment content/scoring, retake limits, report generation, customer data, Stripe pricing/fulfillment, Passport badge rules, Ranger Station map/header, and site navigation names are unchanged. Persistent cross-device course completion remains separate work.

## Trailheads refinement — 2026-10-17

- Hero: “Take your next faithful step.” Trailheads are defined as courses pairing assessments with practical teaching.
- Main Journey: “Understand your design. Live with purpose.” No initial assessment requirement.
- Focused Trails: “Practical first steps.” DesignID, Spiritual Gifts, FruitLife360 only.
- Extended Trails: DesignPD, with a short explanation of its DesignID foundation. Existing gates and pricing unchanged.
- Placards retain their signposts, green/cream frame, fact grid and progression. Larger text, commitment label left/rating right (also on phones), bottom-right “Explore this trail” button.
- Five centered native modal dialogs provide purpose, audience, prerequisites, course experience, clearly labeled time estimates, outcomes, access/cost and expandable complete curriculum. Counts derive from current course modules and actual Journey outline, not the older catalog placeholder. DesignPD description notes existing new-purchase checkout availability.
- Separate white-matte-corrected logo asset fixes enclosed letter counters without changing logos elsewhere. Bottom Field Kit banner removed; results links remain.
- `node tests/trails/details.mjs`: 1280/768/390/320 layouts, five modal interactions, real curriculum counts, keyboard focus containment/restore, Escape/Close/backdrop, mobile commitment label, enlarged type, no overflow, mini-app two-trail scope.
- October 17 verification: build/typecheck, 20 access cases, all new modal/responsive checks, and existing authenticated navigation/Field Kit/Journey round-trip checks pass. Existing review-navigation fixture expects a completed DesignID report that the current sample no longer has: it fails identically on unchanged production and locally (`/designid` vs expected course URL). No sample/customer data changed to satisfy that outdated fixture; completed-state authorization remains covered by the access matrix. Actual main Journey is 8 modules / 70 units.

## Trail readability and action hierarchy — 2026-10-19

- All five placards use consistent dark green ink: Trail commitment matches Terrain/Gear/Best for labels; rating explanations and prerequisite/results notes are stronger and darker. Progress captions and footer text no longer rely on faint type.
- “Review trail guide” replaces “Explore this trail” in visible and accessible trigger labels. It is a secondary underlined text action before the prerequisite/primary start controls, leaving Start/Continue Journey or assessment/course as the clear next step.
- Guide paragraphs, statistics labels, and module lesson counts use the same dark ink; small module counts are now 16px. Existing artwork, course content, dialogs, assessment gates, prices, and learner records are unchanged.
- Verification: production build, 20 existing prerequisite cases, existing five-guide modal/responsive suite (1280/768/390/320 plus mini lane), and rendered-font/action-order audit (1280/390/320) pass. Dark ink on cream contrast is 10.69:1.
