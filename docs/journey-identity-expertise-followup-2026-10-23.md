# Connecting Identity & Expertise follow-up — sandbox only

Baseline `6e0b71cc84e7aca863a61b5d14bef25f20f2bc96`. User-authorized forward presentation update only. Being Vs. Doing, every other lesson definition, all companion audio, authored connecting prose, all 12 continuum cells, and both stable response IDs remain unchanged.

## Changes and authoring boundary

The shared Connected Trail callout stops at stable slug `expertise-connecting-identity-and-expertise-32` (source row31 / app row32), inclusive, through the final unit and future appended units in course-map order. Before-boundary approved behavior stays unchanged. This removes it from Connecting, Story’s four DesignID reflection units, Desire’s reflection unit, Spiritual Gifts assessment introduction and Gifts/Identity. It does not remove Trailheads, course sidebar navigation or assessments. The permanent authoring rule is in AGENTS.md.

Desktop matrix rows and mobile cards use the established palette exactly: Architect #D4A451, Artisan #647C9B, Shepherd #739D5E, Steward #5A496B. Same approved soft tints as the earlier reflections/love chart, dark #28332B text, explicit labels and colored left borders. No change to shared earlier-chart styling.

The connecting lesson uses the exact user-supplied Squarespace multicultural workshop-team photo URL, with meaningful alternative text. No source workbook write or historical source-archive alteration.

## Actual personalization source

No fix was needed: `app/journey/page.tsx` calls `supabase.auth.getUser()`; ordinary authenticated requests call `getAssessmentSnapshotsForUser(user.id, normalizeEmail(user.email))`. `lib/assessments/student-context.ts` queries saved `assessment_snapshots` restricted to that user ID and/or their linked participant, ordered by submitted/created recency. `journeyReflectionNames` in `lib/journey/designid-snapshot.ts` projects the latest DesignID saved report through `buildDesignIdContext`, including native/historical reportPayload-only snapshots. Names pass to `JourneyCourseNavigator` and `JourneyExpertiseCare`; the two response headings are not fixed Architect/Shepherd values. Explicit authorized owner review continues to use its separate existing preview-report path. Missing values display “Not available in your saved report”; no invented result fallback.

Real isolated signed-in saved reports tested: **Artisan / Architect** (normal summary), **Steward / Shepherd** (reportPayload-only), plus partial and absent report states. Engine-scored snapshots are actually inserted in sandbox, authenticated via confirm route, and read through the normal learner page; successful calls are not intercepted. Separate primary/secondary answers persist through immediate Next/reopen and remain isolated between accounts. Synthetic report/user/workbook/reminder records are deleted in finally; no real learner data touched.

## Verification / release procedure

- Source fidelity: connecting/Being/four-expertise source tests; catalog/export/discussion/environment isolation checks.
- Optimized `npm run build`, then `npm run typecheck`, `git diff --check`.
- Browser at 1920/1280/768/390/320: exact prose/matrix, exact border palette and dark labels, supplied image natural dimensions, no Connected Trail, desktop table/mobile cards, two response fields, reminder controls, no overflow/runtime errors, screenshots and owner sandbox-review/sidebar/Trailheads/Journey entry.
- Forward candidate callouts all absent; earlier DesignID assessment callout retained.
- Real authenticated profile/DB save harness above at 1280/390/320, locally and published.
- `node tests/journey-identity-expertise-release.mjs baseline` captures actual production alias/master before deploy; push sandbox only and `node scripts/deploy-sandbox.mjs`; release verifier checks READY, exact GitSHA/expectedSHA, project and stable alias, plus unchanged production alias/master.

Logs: `tmp/connecting-followup-{build,typecheck,local-browser,local-profile,published-browser,published-profile}.log`; screenshots `tmp/connecting-{local,published}-{care,teaching}-{width}.png`; exact receipt `tmp/connecting-release-proof.json`.

Review entry: https://dydd-online-school-sandbox.vercel.app/sandbox-review
Lesson: https://dydd-online-school-sandbox.vercel.app/journey?lesson=expertise-connecting-identity-and-expertise-32
