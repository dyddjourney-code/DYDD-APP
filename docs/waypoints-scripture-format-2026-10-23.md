# Waypoint Scripture quotation formatting — sandbox only

A shared Waypoint-only presentation helper wraps every complete displayed Scripture
passage in one opening/closing curly double quotation pair. Biblical direct speech
is retained as nested curly single quotation marks. Where a selected NIV verse ends
before its speech closes in the larger passage (John 15:5, Matthew 11:28, Luke
2:10–11, Matthew 5:23–24), the display closes that nested quotation at the passage
boundary. Apostrophes and all passage words/punctuation are preserved.

The canonical JSON remains byte-for-byte unchanged: no Bible wording, references,
release schedules, devotional text, saved-design logic or required full NIV
attribution is edited. The redundant `(NIV)` suffix is removed from the Scripture
heading; the existing complete copyright/translation attribution remains directly
under the quotation. The common current/archive renderer covers all 35 authored
entries, including 16 prepared future entries; future entries are not released.

Verification: `npm run typecheck`; `WAYPOINT_SKIP_NIV_NETWORK=1 node
tests/waypoints-content.cjs` (all content/schedule/personalization invariants;
independent online NIV re-fetch intentionally skipped because source text unchanged);
`node tests/waypoints-scripture-format.mjs` renders the actual React component for
all 35 entries in Chromium and checks seven explicit quotation edge cases, exact
attribution and untouched devotional paragraphs. With `WAYPOINT_TEST_BASE` set to
the sandbox URL it additionally clicks all 19 released archive entries on the
hydrated published page and checks exact heading/quotation/attribution, with
1280/390 screenshots and no horizontal overflow. Existing authenticated acceptance
harness expectations are updated for the new quotation presentation; it is not
necessary to create accounts or write database fixtures for this display-only fix.

Deployment receipt: workspace `outputs/waypoints-scripture-format-release-proof.json`.
Sandbox only; production master and deployment alias are checked unchanged.
