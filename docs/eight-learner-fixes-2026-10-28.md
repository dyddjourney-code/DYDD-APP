# Eight learner fixes — October 28, 2026

Authorized scope: production and sandbox, including publish. No real learner email resends, assessment submissions, scoring changes, or customer-data repairs/deletions. Private release receipts and sanitized diagnostic artifacts live in `tmp/eight-learner-fixes/RELEASE.md`.

## Corrections

1. **DesignID emailed report:** latest real sent report's private PDF and provider document exist; issued URL is correct but a signed-out email browser encountered the artifact resolver's deliberately non-disclosing ownership 404. The learner-facing `/designid/report` entry now redirects anonymous visitors to normal sign-in and resumes the exact issued local URL afterward. Foreign signed-in accounts remain denied. Future DesignID emails explain same-account sign-in and Field Kit fallback. Existing URLs work without resends, new tokens, public files, report regeneration, or row changes.
2. **Open report:** DesignID/DesignPD completion and equivalent FruitLife status/process report actions open a separate tab using `noopener noreferrer`; Field Kit already did so. App state remains open.
3. **Continue this trail:** completion actions go to the relevant DesignID/DesignPD teaching course, rather than the Trailheads directory.
4. **False FruitLife360 badge:** actual new plus-address account inherited canonical Gmail sessions, including an old SELF_ONLY/zero-observer report. Eligibility now requires owned sessions/participants and a positive completed observer goal; Gmail delivery aliases are not account authorization. Stale assessment awards remain stored as history but cannot create current earned status. Full-360 owned session evidence still earns independently of courses; primary-only DesignID behavior remains.
5. **Review reflections:** current Journey activity projection follows the same source-defined prompts as the course player. Retired supplemental/every-lesson activities are not presented as current work. Historical answers/revisions remain available separately and in downloads; earlier dated walkthroughs retain their frozen questions. No history/key deletion. Shared course-mode lesson-boundary save behavior remains.
6. **Journey DesignID connected trail:** the correct stable DesignID anchor already existed; missing intrinsic signpost image geometry allowed delayed layout to shift the landing. Reserve known image dimensions for the directory images and realign incoming named anchors after hydration/font reflow. A bounded ResizeObserver stops correcting immediately on learner interaction. Delayed-image regression reproduces original anchor drift and verifies the correct block before/after assessment completion at desktop/phone sizes. The DesignID block offers its course when results exist and assessment when absent.
7. **Base Camp admin report:** canonical Gmail matching silently authorized an ordinary owner-alias learner. Admin reports now re-authenticate at the server data boundary, require confirmed exact explicitly-allowed identities (never aliases, user metadata, or preview personas), and gate UI on that result. Denied sessions never execute privileged history queries or receive admin data. Exact owner/configured admins retain separate legitimate access. Production Command Center exclusion remains unchanged.
8. **Gear:** book href now exactly matches the existing workbook destination; workbook is unchanged.

## Verification and release procedure

Both checkouts keep their own environment/runtime/signup/admin settings and databases. Apply scoped source/test/doc changes only; never copy `.env*`, middleware, Vercel runtime configuration, or database data between them.

Relevant checks:

```
node tests/designid-email-access.cjs
node tests/basecamp-admin-boundary.cjs
node scripts/verify-current-assessment-awards.cjs
node tests/reflection-current-activities.cjs
node tests/reflection-current-activities-browser.mjs
node tests/learner-links.cjs
node tests/environment-isolation.cjs
node tests/free-beta-boundaries.cjs
node scripts/verify-primary-badges.cjs
node tests/designid-allocation.cjs
node tests/reflection-lesson-boundary.mjs
npm run typecheck
npm run build
```

`tests/learner-links.cjs` renders actual server pages with synthetic service data, checks continuation/link attributes, and exercises a real popup plus six delayed-image desktop/mobile anchors. `LINKS_BASELINE=1` intentionally removes intrinsic geometry and demonstrates the pre-fix anchor failure.

`tests/eight-learner-published.mjs` checks a published exact alias using a newly-created confirmed `@example.invalid` account and direct synthetic saved-result/stale-award fixtures. It does not submit assessments or send mail. It verifies anonymous login/report handoff, no learner admin data in HTML/RSC, DesignID-only/current-primary/no-false-FruitLife/no-course awards, completed DesignID block at 1280/390/320, real report popup, and exact Gear links; fixtures are removed in `finally`. `EIGHT_ENV=production|sandbox` selects validated separate credentials/DB. `tests/reflection-published-fixture.mjs` verifies current deployed CARE boundary behavior with all writes intercepted, not customer persistence.

Push reviewed production HEAD to `origin/master`, then `node scripts/deploy-production-beta.mjs`. Push reviewed sandbox HEAD to `origin/sandbox`, then `node scripts/deploy-sandbox.mjs`. Verify each exact SHA/project/stable alias is READY independently. No database migration or environment change is required.

## Limits

No real learner session was impersonated; no assessment was resubmitted or email resent. Diagnostic delivery acceptance is not proof of inbox delivery. Exact authorized-admin positive evidence uses isolated mocked authentication/data; anonymous/ordinary learner boundaries are additionally verified on published applications. Physical-device/browser-exit limitations of the prior CARE release remain unchanged.
