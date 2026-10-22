# Approved DesignID Lens CARE — sandbox only

Baseline: `3d99c160d51bb893d56501a19c4174989f0f083a`. Journey Module 3 / Section 3.2 / Lesson 2, stable lesson `identity-the-designid-lens-what-is-in-the-report-19`.

John approved `outputs/designid/unpack-your-reflections-care-draft.txt`; preserved verbatim in `content/journey/designid-lens-care-approved-2026-10-22.txt`. This approved direct copy supersedes the empty row19 H source. Current source read-only snapshot `content/journey/assessment-image-source-2026-10-22.json` records headers AModule/BSection/CLesson/DTitle/EFocus/FContent/GImage/HCARE and empty row19 F/G/H. No spreadsheet writes. Top teaching, all lesson definitions, companion audio and instruction-only How to CARE introduction unchanged.

## Learner experience

Four stage headings Connect / Act / Reflect / Explore, each immediately followed by its approved explanation, question and answer. No isolated acronym letters in this CARE. Fixed 2×2 desktop/tablet; readable one-column phone order. Existing legitimate `/brand/tools/badge-icons/designid-icon.png` appears compactly at the right of the CARE heading. Scoped tablet navigation fix prevents the inherited sticky course index covering this CARE; no other lesson layout changed.

Every actual Journey CARE (including Who vs. Whose and DesignID reflections, excluding instruction-only demonstration and Pathfinder drafting) uses `JourneyCareDirections`:

> Your reflections save automatically when you pause typing or leave a field. Moving to Next also saves your answers and reminders before you leave. Check for Saved; if saving fails, stay here and retry. Revisit your answers in Field Kit. Use **Take to Class** to mark a private reminder (with an optional note) in Field Kit → My discussion reminders. It does not post or send anything to your class or Circle.

The shared reminder button is now **Take to Class** / **Marked for Class**, with `aria-pressed` state; toggling off preserves the answer. Existing optional note, revision handling, failure/retry and Field Kit filter unchanged. Journey DesignID CARE prompts join the existing Journey-only private reminder allowlist; Pathfinder/assessment-course prompts remain excluded. No posting, facilitator sends or notifications added.

## Persistence/history

Inspected existing automatic 700ms pause/blur saving and serialized answer/reminder/navigation flush before writing directions. Failed writes retain drafts and block navigation. Connect and Reflect retain original `${lesson}-designid-connect` / `-designid-reflect` IDs. Act/Explore add `-designid-act` / `-designid-explore`. Current-round-only `withDesignIdLens` refreshes approved prompt metadata and adds missing keys for authenticated and owner-preview workbooks, idempotently. Old answer entries/revisions and all archived question snapshots are unchanged; retired supplementary canonical prompts remain available. Field Kit and plain-text exports use the same catalog/entries, not duplicate storage. No schema/RLS/scoring/report changes.

## Repeatable QA and release

- `npm run build`, `npm run typecheck`, `node tests/reflection-catalog.cjs`, `node tests/reflection-export.cjs`, `node tests/environment-isolation.cjs`, `node tests/journey-discussion-access.cjs`, `node tests/designid-final-module-source.cjs`, `git diff --check`.
- `node tests/journey-designid-lens-care.mjs`: five widths1920/1280/768/390/320, approved source, loaded compact right icon, editable controls/marks, no overflow; real isolated pre-existing current/archived rounds, old answers, current upgrade, Act database save/private mark/immediateNext/FieldKit/reopen/unmark/export. Fixture cleanup in finally.
- `JOURNEY_TEST_QUESTION_ID=identity-the-designid-lens-what-is-in-the-report-19-designid-connect node tests/journey-fieldkit-sync.mjs`: actual auth/database pause/blur, immediateNext, FieldKit edit/reopen/export/history; intercepted transport failure/retry, in-flight edits and stale-tab conflict at1280/390/320. Not mock success saves.
- Same `JOURNEY_TEST_QUESTION_ID` with suffix`act` for `tests/journey-discussion-reminders.mjs`: mark/note/Next/cross-view/unmark; failed reminder save/retry, CAS/access validation/other-owner/direct-storage isolation; exact original preview restoration.
- `tests/journey-care-introduction.mjs` checks unchanged introduction and editing/marks on three neighboring CAREs. `tests/journey-who-whose-browser.mjs` retains neighbor five-width source/presentation/audio/control regression with new shared directions.
- Browser harnesses use DOMContentLoaded plus explicit async control/image readiness; unrelated network-idle timeout does not indicate application failure. Existing final-module source freeze is retained for its original catalog prefix while allowing the new separately tested Journey-only upgrade function.

Publish pushed sandbox only using `node scripts/deploy-sandbox.mjs`. Verify READY, exact git SHA/expectedCommitSha, sandbox project `prj_5EC6sfJe9DpGYW59L94iwppeMYUg`, and stable alias. Repeat critical browser suites against `JOURNEY_TEST_BASE=https://dydd-online-school-sandbox.vercel.app`. Local/published screenshots and logs under untracked `tmp/designid-care-*`; receipt `tmp/designid-care-release-receipt.json`. Production master and alias read-only receipt prove unchanged. Stop local server and remove isolated fixture users/rounds/entries/reminder objects; no customer/production data, spreadsheet or outbound emails.
