# Circle experience lane — integration handoff (local only)

Files owned: components/circle-operations-workspace.tsx, components/circle-operations.module.css, components/circle-participant-guide.tsx, components/circle-couple-planning.tsx; app/camp-circle/my-circles/page.tsx, app/camp-circle/page.tsx, app/admin/circles/page.tsx; app/api/circles/couples/route.ts; lib/circles/couples-shared.ts.

- Frontend and assessment verification skills applied; Supabase skill read for minimal consented snapshot projection. No schema writes, no real sends, no commits or deploy by experience lane.
- New My Circles uses operations accepted-member list and exact-Circle server role, never global role. Participant calendar/prep/own progress; no leader administration rendered to participant. Leader planner preserved in collapsible legacy workspace, not modified.
- UI normalizes operations detail callouts.counts + submissions and consents array. Callout sessions sent as string, audience explicit even counts-only. Cohort never renders text field/submissions. Consent and callout withdrawal remain enabled in read-only state.
- Couples GET independently verifies actual email-confirmed Supabase identity, exact creator/accepted membership, Couple format/two-seat cap, active exact Couples unlock, both partners insights=true. It reads DesignID and Spiritual Gifts only; no DesignPD query or report payload returned. Names respect separate people consent. Pending states do not disclose individual completion.
- Owner-review GET uses existing /api/circles preview scopes for saved plans only; actions disabled and new result endpoint does not accept preview token as identity. No fake data.
- Experience leaf uses existing /api/course-progress for signed-in user's own Journey. Existing /journey route, no fabricated lesson path.
- Actual backend held invitation payload.token rendered to creator as existing /camp-circle/invitation URL.
- Existing invitation component GET string appears corrupted in baseline; parent owns existing invitation route/component integration. Participant-safe Field Guide is connected below.

Update: participant-safe `/api/circles/field-guide?circle=` is now consumed by new `components/circle-participant-guide.tsx` (requires server participant:true projection). Preparation, prompts and follow-through only; rejects creator/full-content response for this participant component. Exact Journey lesson navigation uses `/journey?lesson=...`. Typecheck passed after final projection alignment (see /tmp/circle-ui-typecheck.log). Parent QA harness labels Current section / Next meeting now match actual UI.

Remaining cross-lane product points: backend list/detail currently gives no leader display-name field; UI honestly says "Your Circle organizer" unless server adds safe leaderName. Both-spouse date/holiday editing was completed in this lane using POST /api/circles/couples: exact accepted Couple identity, active tools/personal requirement, narrow schedule-only allowlist, validatePlan, compare-and-swap revision, no identity/results/roster edits. Uses parent-added service-only dydd_circle_save_shared_plan RPC (migration223000) so identity, own Personal, billing and revision are rechecked under row lock at mutation time. New CircleCouplePlanning offers either partner date/time/location plus holiday pause. Existing creator planner remains preserved. Parent may add real-DB QA coverage of POST and its cross-Circle/forged patch/conflict gates.

## Verification completed
- `npm run typecheck`: PASS after all changes, including transaction-backed Couples POST.
- `git diff --check`: PASS.
- `node tests/circles-experience-browser.mjs`: PASS using one real temporary verified sandbox auth account and intercepted synthetic UI API transport. Account deleted in finally. No actual Circle, invite, checkout or mail was written by this UI-only test.
- Browser widths1280/390/320: participant calendar/prep/own progress, no leader controls, no overflow/runtime exceptions. Also asserts consent and callout payloads, counts-only Cohort, Couples pending, and disabled transition invitations.
- Evidence: docs/evidence/circles-ui/result.json and participant-{1280,390,320}.png. Parent independent real-DB harness remains authoritative for actual membership/payment/capacity/end-to-end server behavior.
- Dev startup3148 was refused because parent's3138 already runs. No competing dev server kept running; tests used parent127.0.0.1:3138.
