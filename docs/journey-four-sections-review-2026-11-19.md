# Journey: complete Story, Desire, Gifts and Niche first pass

## Authorization and environment

John requested a source-grounded deep dive and complete first-pass writing/integration of every actual class lesson in Story, Desire, Gifts and Niche, matching his established Identity/Expertise pattern. NEW drafting is authorized; this is not a literal import of missing spreadsheet copy.

- Maintained authoring checkout: `projects/dydd-online-school-sandbox`, branch `sandbox`.
- Isolated teaching review: https://dydd-online-school-sandbox.vercel.app/sandbox-review → Trailheads → Journey.
- Private live-data owner console is operational administration, not the course-authoring destination.
- Do not promote to learner production or write to the source Sheets. Preserve all 31 neighboring lessons, all existing lesson IDs/order/row metadata, companion recordings/transcripts, saved-answer keys and history.
- Starting sandbox app SHA: `d3b4c76`; unrelated existing modified Circle evidence and untracked outputs/tmp must remain unstaged.

## Current source inspection

Full rich `A1:Z85`, metadata and stable sheetId0 read ONLY from workbook `1GTyYUL883YogJ9n46WyUyhQBZpQuU9nCrMtRlbfP1l4`, current tab **DYDD Journey Course**, November19. Source snapshot: `content/journey/four-sections-source-2026-11-19.json`. Current columns A Module/B Section/C Lesson/D Title/E Focus/F Content/G Image/H CARE. Parents are sparse and carried forward. Story current rows33–44 have lesson titles but no teaching; later modules have structural rows with blank titles/copy. Therefore the existing application inventory plus John's book/process materials supply the requested expansion. App suffixes35–77 are historical stable IDs, never recomputed from sheet rows.

Inventory: Story12; Desire8; Gifts7; Niche13 = **40 lessons**. Baseline exact units and workbook experience are snapshotted in `content/journey/four-sections-baseline-2026-11-19.json`; compact original keys in `four-sections-legacy-keys-2026-11-19.json`.

Primary doctrine/voice: source library book **Discover Your Divine Design, March26,2026**, Chapters3–6. Practice/facilitation: Leaders Playbook, participant workbook and supplied DYDD Class2-26 slides. Slides are important for learned helplessness, four shadow/fear patterns and fear→alignment, which are specific actual class lessons and must not be replaced with generic Story summaries. Per-lesson filenames/headings are retained in each draft's `sources`.

## Editorial choices

- Warm direct pastoral instruction, Scripture in context, practical response and meaningful transitions/prayers; no invented autobiographical claims.
- Identity precedes contribution; being before doing, received grace before service, on purpose/for purpose.
- God redeems hurt without calling evil good or requiring public trauma disclosure. Reflection patterns are not diagnoses or fixed boxes.
- Desire is tested through Scripture, service, community and faithfulness, not every strong want equated with calling.
- Spiritual gifts serve the common good; an assessment reflects perceived patterns, not a divine verdict. Natural expertise is distinguished from spiritual empowerment without dismissing either.
- Niche is provisional discernment, not a permanent vow. Preserve exact established sentence stems, canonical declaration fields and support-team/prayer emphasis.
- Existing Pathfinder source explicitly says **stop using CARE for Niche Pathfinder**. Accordingly27 teaching lessons receive integrated CARE,10 Pathfinder lessons retain their distinctive existing controls,3 closing lessons remain field-free. Draft CARE suggestions on non-CARE lessons are editorial material, not extra unsaved controls.
- Four provisional stock photographs hosted locally under `public/images/journey-review`; replace in a later owner image pass as desired. Existing supplied media wins over fallback. Unsplash source URLs are recorded in the workspace source-map/handoff.

## Integration / persistence

`lib/journey/review-lessons.ts` normalizes the two editable JSON manuscripts and stable legacy keys. `dydd-course-outline.ts` overlays ONLY target teaching/focus/media; original titles/slugs/type/sequence/book/workbook metadata/audio remain. Generic existing semantic `JourneyLessonBody` renders Scripture callouts. Scoped `JourneyReviewCare` follows approved two-column CARE/stacked phone layout, shared real saving directions and `ReflectionAnswer`.

Each preexisting answer ID remains in the active workbook. Original stage IDs are reused; missing stages get stable `{lesson-slug}-care-{stage}` IDs. Additional old prompts are retained in their stage rather than discarded. Pathfinder prompts are byte-equivalent and shared early/final declaration keys remain shared.

The existing `withCurrentJourneyActivities` already upgrades ONLY the current round in both authenticated API and sandbox preview adapters; no new DB/schema/auth/scoring migration. It refreshes prompt metadata/adds new keys while preserving historical questions, entries, revisions and archived rounds. FieldKit/history/text export/reminders use the same catalog. No fake report values or replacement audio.

## Verification and release

- `node tests/journey-four-sections-review-source.cjs`
- `node tests/reflection-catalog.cjs`, `node tests/reflection-export.cjs`, `node tests/environment-isolation.cjs`, `node tests/journey-discussion-access.cjs`
- `npm run typecheck`; `npm run build`
- `node tests/journey-four-sections-review-browser.mjs`: every40lesson×1920/1280/768/390/320 =200cases, full semantic copy, exact field IDs, loaded images, responsive CARE, zero overflow/runtime errors.
- `NO_PROXY=localhost,127.0.0.1 node tests/journey-four-sections-review-sync.mjs`: real isolated sandbox user/account DB saves, FieldKit/edit/history/export/Next/private reminders, and separately intercepted failure/retry/conflict tests. Cleanup fixtures.
- Existing Pathfinder persistence/navigation regression retained and run as applicable.
- Explicit sandbox deploy only: `node scripts/deploy-sandbox.mjs`; receipt `node tests/journey-four-sections-review-release.mjs`. Baseline mode records actual current production SHA/alias before release.
- Repeat browser/persistence against `JOURNEY_TEST_BASE=https://dydd-online-school-sandbox.vercel.app`, inspect screenshots, verify established owner entry and unchanged reference lessons.
- Editable DOCX/TXT/source map generated with `python3 scripts/export-journey-review-2026-11-19.py` from integrated exact active content, delivered to workspace `outputs/dydd-journey-four-sections-2026-11-19`.

Final exact SHA/receipt/verification and limitations belong in the completion handoff, not guessed here.

## Actual current save semantics and owner navigation correction

The latest shared app intentionally saves changed answers/reminders when completing or leaving the lesson, NOT on typing pause or blur. Shared directions already say this accurately; they are unchanged. The old October autosave harness was stale and is not release evidence. The new real-DB harness verifies no pause/blur revision, two dirty fields at Complete & Next, FieldKit explicit save/history/export/reopen, private reminder note/mark/unmark, all eight early/final shared Pathfinder IDs, working-declaration source picker, and separate intercepted-failure/retry plus actual stale-revision conflict. Isolated already-completed-course fixture progress enables ordinary signed-in QA without changing real user or owner progress. No assessment fixtures are needed.

Actual owner review initially stopped at the owner persona’s unfinished checklist. The existing server-verified sandbox owner policy now adds a Journey-only read-review flag. Sidebar navigation can open any Journey lesson; completion controls retain a separate unmodified sequential canComplete predicate and the backend still rejects out-of-order completion. No progress or awards are fabricated. Ordinary learners, invalid tokens, Heather/other personas, non-sandbox and other courses do not get this flag. Tests journey-four-sections-review-access.cjs and real-DB legacy.mjs prove this.

The complete responsive matrix uses real sidebar controls and actual content/catalog APIs. ONLY position-write requests are intercepted so QA cannot move the owner’s saved bookmark; this is not save-persistence evidence. Successful saves are separately real unmocked authenticated database paths. Localhost fetches use process-scoped NO_PROXY; browser HTTPS uses the existing protected proxy credentials privately. No machine/gateway/config changes.

Local acceptance: all200 lesson/width cases; real1280/390/320 saves and eight shared Pathfinder links/source picker; real current-round legacy upgrade with unchanged old entries/archived snapshot; owner entry→Trailheads→Journey, six reference Identity/Expertise width cases and actual Story audio playback; source/access/catalog/export/environment/discussion/build/typecheck all PASS. Editorial/source audit: all40 PASS, one partial verse completed to its full2Corinthians1:3–4 citation. Final published evidence is retained in workspace outputs.

Owner forward-review acceptance: for a later lesson whose real sequential prerequisites remain incomplete, a server-authorized owner sees **Next for review**. It flushes writing through the existing lesson-boundary save path and changes lessons without invoking completion or awarding badges. Ordinary learners and normal completion behavior are unchanged. The exact local smoke test proves zero course-progress POSTs and identical completed/award arrays; only the QA bookmark write is intercepted.
