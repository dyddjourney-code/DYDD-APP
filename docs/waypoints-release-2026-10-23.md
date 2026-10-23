# Waypoints authored library and saved-Primary application — sandbox only

## Scope and source of truth

`lib/waypoints/waypoints.json` is the app's actual source, not the legacy database/email release tables. All original 23 records retain their IDs, release timestamps, titles, categories, excerpts, tags and devotional paragraphs. Existing June–August duplicate date/title records are intentionally retained, not counted as new writing. Personal notes, Journey responses, assessment snapshots and scoring are not migrated or rewritten.

The release adds a full NIV quotation after the devotional paragraphs and before “For your design,” including local copyright attribution. The generic reflection and four authored Primary applications accompany every record. The archive uses the same presentation/selection as the current devotional. Search and categories remain available; unreleased records stay out of the client payload.

## Saved Primary and privacy

The server validates the actual session with `auth.getUser()` and reads only the learner's latest saved DesignID report. The existing `buildDesignIdContext` helper resolves canonical `Primary` including legacy `reportPayload` records. Scores, Secondary, integrative labels, preview personas and query parameters do not decide the variant. Exact recognized Primary names (outer whitespace tolerated) select one application; absent or unrecognized Primary selects generic. All unused variant strings are removed before passing the archive to the client.

`getAssessmentSnapshotsForUser` was consciously **not** called: it invokes `findOrAttachParticipant`, which can attach an email-matched participant on page view. Waypoints instead uses a dedicated read-only lookup: participants already owned by the authenticated user, plus unclaimed participants matching established normalized/canonical email candidates. Participants owned by another user are excluded. Snapshots explicitly owned by someone else are excluded even if their participant IDs match. No participant identity write occurs from personalization. The existing subscription-status logic is otherwise unchanged.

## Schedule decision

Four pre-existing future Fridays end November 20, 2026. Only ten more Fridays are needed through January 31, 2027 (November 27 through January 29). To honor **at least twelve additional original Waypoints** without compressing the established cadence, twelve new Fridays extend through February 12, 2027. All new releases are 13:00 UTC / 8:00 AM America/New_York (winter EST). January 31 is Sunday, so January 29 is the final January release.

## Separation from email/production

Sandbox has no release cron and no outbound email credentials. The pre-existing database-backed email release route is not executed, seeded, enabled or modified. This release schedules the app library only; it does not promise email delivery or synchronize legacy release tables. No production code/database/settings/deployment changes are authorized or performed.

## Scripture ledger

See `scripture-usage-ledger-2026-10-23.md` and `lib/scripture/usage-ledger.json` for provenance and refreshed unique-verse counting. The October 20 baseline 150 was all-translation reproduced quotation coverage, while 513 was reference inventory; they are different measures. No remaining allowance is inferred from the stale 150 or by subtracting reference-only inventory. Current text is NIV under John's reported Biblica approval and attribution notes; the signed license itself is not reinterpreted here.

## Verification and deployment

Local acceptance passes: TypeScript, sandbox isolation, independent complete NIV equality for 35 records / 25 passages, protected original metadata/body, twelve unique new works, schedule boundaries, 46 real authenticated/archive rendered-card checks, cross-identity/no-mutation checks and verified fixture cleanup. Four-width geometry passes and desktop/phone screenshots were inspected. See `waypoints-qa-2026-10-23.md`.

The refreshed ledger is **179 unique quoted verses** across the carried-forward all-surface baseline plus verified current sandbox course additions and the full authored Waypoints library, including future releases: 150 baseline + 17 new course verses + 12 Waypoints net-new. The Waypoints library alone quotes 29 distinct verses / 25 passages, with 39 verse occurrences across all 35 release records. The currently released partition plus baseline/courses is 171; future quotations are included in 179, not presented as already visible. This is not an NIV-only license adjudication or a fresh remote all-surface audit.

Implementation is committed only to Git `sandbox` and explicitly deployed only to Vercel project `dydd-online-school-sandbox`. The exact READY deployment, Git SHA, alias, live acceptance, fixture cleanup and unchanged production master reference are written after execution to workspace `outputs/waypoints-big-run-release-proof.json`; daily memory links that receipt. Production remains unchanged.
