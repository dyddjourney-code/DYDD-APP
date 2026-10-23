# Waypoints QA — October 23, 2026

## Scope and safety

These tests are limited to the online-school sandbox (`atemrshtshxoqnuevvqu`). The browser suite accepts localhost or the exact sandbox Vercel hostname, and validates the credential project URL/ref before any writes. It uses disposable `@example.invalid` users with password authentication and confirmed email, never email delivery or an actual learner/owner account. All synthetic auth sessions, participant records, and assessment snapshots are removed in `finally`, with cleanup verification.

No production credentials, existing participant records, notes, subscriptions, or reports are modified. Test-created participant and snapshot IDs bound all deletions. Browser application writes are blocked and reported as failures. Before/after database comparisons detect unintended identity linking or snapshot, note, workbook, reflection, and subscription mutations.

## Commands

Run from the repository root:

```sh
node tests/waypoints-content.cjs
WAYPOINT_TEST_BASE=http://localhost:3138 node tests/waypoints-live.mjs
WAYPOINT_TEST_BASE=https://dydd-online-school-sandbox.vercel.app node tests/waypoints-live.mjs
```

`WAYPOINT_BASELINE_REF` can pin the original Git baseline if the baseline archive order changes later. Default original baseline `208b36c7d9c5bb6182f088b0f1f5341d9c068d8d` reads the first original 23 rows, retaining stable IDs and comparing all original body/date/reference metadata. `WAYPOINT_SKIP_NIV_NETWORK=1` explicitly skips only independent NIV-source comparison for offline debugging; it is **not** the complete content acceptance run.

## Source/content acceptance coverage

- Original 23 IDs, dates, release timestamps, bodies, titles, scripture references, categories, tags, and excerpts remain unchanged relative to Git source.
- Exactly 35 unique IDs and 12 genuinely new titles/devotional bodies.
- Unbroken weekly Friday 8 AM America/New_York schedule, including DST; January 31 cutoff ends Friday January 29, with buffer through February 12.
- Complete NIV text and attribution on every entry. Independently fetches the exact cited verse/range from BibleGateway NIV, strips verse numbers/cross-references/headings, and compares normalized word content. Rejects both omitted portions and extra verses mislabeled by a narrower citation.
- Generic plus four distinctive, developed multi-sentence reflections on every entry; generic text is not a four-type list.
- Pure `personalizeWaypoint`: exact saved Primary chooses its own variant; whitespace trims; missing/unrecognized/lowercase/prototype-key values safely choose generic. Input archive remains unchanged, full scripture survives, and all unselected variants are omitted from browser-bound objects.
- Actual saved-report reader tested across summary, reportPayload, profileLanguage, nested scores, and root report formats. Explicit saved Primary wins even when another type has much higher numeric scores.
- Release instants immediately before/at 8 AM across DST, and future archive boundaries.

## Live/authenticated acceptance coverage

- Real sandbox auth and saved snapshots for Architect, Artisan, Shepherd, Steward, missing Primary, and unrecognized Primary. No mocked browser responses.
- Numeric scores deliberately conflict with saved Primary. Older source reports are inserted after newer reports, to prove saved-report recency is not creation order or numeric ranking.
- An unclaimed email-matching legacy participant is readable but remains unclaimed. A participant claimed by another synthetic account cannot supply the viewer's Primary.
- Current, previous, and earliest archived Waypoints show complete devotional body and full NIV text, reference, attribution, and the viewer's sole selected reflection.
- Scripture placement is after devotional body and before “For your design.”
- Anonymous browser checks every released archive item, confirms generic reflections, and verifies unreleased items are absent.
- HTML/RSC payloads omit the variant map and every other Primary's reflection text, including escaped JSON forms.
- Valid owner and Heather preview queries never supply another person's Primary, for anonymous and signed-in visits.
- Desktop, 390 px, and 320 px checks; no horizontal overflow or page runtime errors.
- Before/after synthetic database state unchanged; every test-created row/account/session cleaned.

## Execution status

Integrated local acceptance **PASS** on October 23, 2026:

- `node tests/waypoints-content.cjs`: all 35 entries / 25 distinct passages independently match the exact complete NIV selections; original 23 protected fields unchanged; twelve new works, Friday 08:00 Eastern schedule and release boundaries pass. Generic plus all four authored applications present for every entry (175 instances / 125 unique texts; matching historical republications deliberately share their devotional's set).
- `npm run typecheck`: pass.
- `node tests/environment-isolation.cjs`: pass; wrong-database configuration fails closed; sandbox external email/payment/PDF guards prevent network delivery.
- `node tests/waypoints-live.mjs`: **46 rendered-card checks PASS**. All four real authenticated saved Primary values, missing/unknown fallback, latest saved source report despite conflicting scores, foreign ownership, legacy unclaimed identity/no attachment, valid preview isolation and all 19 released archive records pass. Exact stable IDs and dates are checked, not just repeated historical titles. Before/after notes/workbook/assessment/subscription state is unchanged. **All seven synthetic accounts, thirteen snapshots and two participants removed**, sessions revoked and cleanup verified; no external emails.
- `node tests/waypoints-visual.mjs`: 1280/768/390/320 px visual geometry and no-overflow checks pass. Desktop and phone screenshots privately inspected: devotional, full NIV, copyright notice, then application in that order. Screenshots and geometry receipt under `tmp/waypoints-local-*`.

The source baseline is pinned to pre-release commit `208b36c7d9c5bb6182f088b0f1f5341d9c068d8d`, not compared to changed content itself after commit.

Published sandbox verification uses the same live/visual scripts with `WAYPOINT_TEST_BASE=https://dydd-online-school-sandbox.vercel.app`. Its exact deployment/SHA and results are retained in workspace `outputs/waypoints-big-run-release-proof.json` after execution. No production promotion, cron execution, release-email queue seeding or customer notification is part of acceptance.
