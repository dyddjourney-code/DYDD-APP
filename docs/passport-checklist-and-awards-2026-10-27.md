# Sandbox Passport checklist and badge decisions — 2026-10-27

Sandbox only. Production is neither migrated nor deployed by this work.

## Authoritative triggers

- `passport_lesson_completions` records explicit completion against canonical stable lesson slugs. Last-opened position, URL, localStorage, audio duration, timers and reflection grades are **not** completion evidence.
- First pass is linear within each course. Previously completed/available lessons remain revisitable. Lesson buttons and restored URLs clamp to the first incomplete lesson; the authenticated API independently rejects skipping. Complete & Next waits for pending workbook saves and confirmed checklist persistence before advancing. Final lesson needs explicit completion too.
- Canonical Journey is `dyddMainCourseOutline` (71 lessons), not the legacy two-lesson catalog placeholder. Its 8 chapter markers map Welcome & Orientation → existing DYD Journey Started, What is DYDD? → new separate chapter marker, then Identity, Expertise, Story, Desire, Gifts and Niche. Every chapter requires every lesson in that chapter. The existing Started marker now precisely describes orientation completion.
- Canonical assessment-course maps: DesignID 13, Spiritual Gifts 12, FruitLife360 19 and DesignPD 23 lessons. These course awards are separate from saved result/report awards. Legacy Design Pathways remains outside the Passport inventory; no invented new assessment badge.
- Old standalone `/learn/...` links redirect into the corresponding canonical course/lesson navigator so they cannot bypass its gate. Content, stable response IDs and saved reflection history are unchanged.
- Completed scored DesignID result/report awards DesignID and its canonical saved Primary (using `buildDesignIdContext`), never an owner/example primary, pair ordering or score tie guess. Saved Spiritual Gifts scored result/report awards Gifts assessment. Native PDF delivery failure does not erase an already saved completed scored result.
- DesignPD is the $15 optional Dig Deeper paid trail. Its report is derived from the retained saved DesignID source, not a second assessment. A native award requires its retained source and ready/success saved derived report. Historical imported completed reports remain compatible. This release changes no checkout/Stripe behavior.
- FruitLife360 needs self completion, all configured required observer responses, and a completed saved report. Opening a report page, a self-only snapshot or a ready queue without required observers does not award it.
- Niche chapter and **Niche Declared** are independent. Declared requires the latest saved nonblank revisions of all 10 canonical Pathfinder pieces (identity, story, divine reflections, love for others, talents/skills, competency/expertise, desire, gifts, resulting in, encouraged by) and `niche-working-declaration`, followed by the explicit Niche Declared completion button. No grading. Later edits retain the award.

## Persistence and compatible history

- `passport_awards` is append-only/idempotent per learner/badge key, with timestamp and evidence. Earned primary design history survives later retakes. Existing completed course/Journey enrollment records are preserved through a one-time trusted migration baseline; no fabricated per-lesson timestamps are inserted for them.
- Existing assessment snapshots, report objects, workbook revisions, reflection rounds, enrollments and positions are not rewritten or deleted.
- Both new tables have owner-only SELECT RLS. Authenticated/anonymous direct writes are revoked; the server validates canonical order, course access and saved evidence before service-role writes. Same-origin mutation protection is enforced.
- Established owner preview uses isolated private storage `preview-passport/{persona}/checklist.json`, with a write lease; its checklist/awards never update an authenticated learner. Existing demo report data stays preview-only. Signed-in test users use actual auth and database rows.
- Supabase schema changes were applied only to `atemrshtshxoqnuevvqu`, after a private sandbox backup of all 46 public tables plus columns, policies and constraints at `tmp/passport-sandbox-before.json`. Additive migration: `20261027180131_passport_lesson_completion.sql`. No resets or production data copying.

## Delivery and verification

`tests/passport-progress.mjs` is sandbox-only and creates/cleans synthetic accounts and report fixtures. It exercises real authenticated server requests, direct REST/RLS negative writes, cross-account isolation, all canonical sequential completions, result/report positives and negatives, required observers, saved Pathfinder revisions, and real desktop/mobile browser behavior. `PASSPORT_TEST_BASE` can select only the isolated local server or published sandbox alias.

Also run existing Passport inventory tests, environment isolation checks and TypeScript. Deploy only with `node scripts/deploy-sandbox.mjs` after pushing the sandbox branch. Verify alias deployment/project ID, expectedCommitSha and githubCommitSha against the exact pushed commit, plus unchanged production alias and master SHA. Release evidence is kept in `tmp/passport-release-proof.json` and signed-in published QA in `tmp/passport-published-qa.json`.

Historical FruitLife compatibility: retained imported FULL_360 reports can prove completed self/observer feedback via their original response/observer counts and completed report summary, even if they predate session self timestamps. Native reports always use configured session requirements. Award lookup checks all retained ready/sent sessions, not only the latest dashboard cards, and uses the existing email-alias matcher.

Existing `lesson_progress.completed_at` records are preserved once during the trusted migration baseline, retaining original timestamps. Only canonical course/lesson slugs count toward current checklists; retired history remains stored. Mere `last_seen_at` values never count. Legacy source rows are not rewritten or trusted dynamically.

### Audit hardening before publication

The old `lesson_progress`/`journey_enrollments` policies permit learner writes. Consequently **runtime code never trusts new writes to those legacy tables**. The one-time `20261027181744_trusted_passport_history.sql` migration freezes existing explicit lesson completions and completed enrollments into the server-owned Passport tables (retaining original lesson timestamps and trusted evidence). Replaying that baseline is prohibited; migration history records its one-time application. Both sandbox migrations have private pre-migration backups. New learner-forged legacy rows cannot grant progress or badges.

The progress endpoint also uses the strict completed scored-result/report predicates for course prerequisites, not the older permissive trail-card helper: drafts/empty snapshots, pending DesignPD reports, and incomplete self-only/missing-required-observer FruitLife records cannot authorize course completion. Established owner teaching preview stays isolated and unaffected.

Independent read-only review identified both legacy-table forgery and draft-prerequisite bypass before release; both were fixed and covered by real authenticated negative tests. Supabase security advisors reported no Passport-related findings.
