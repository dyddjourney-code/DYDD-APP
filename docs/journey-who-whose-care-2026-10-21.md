# Who vs. Whose — sandbox lesson pilot

## Scope and current source

Authorized sandbox-only Module 3 / Section 3.1 / Lesson 3, slug `identity-who-vs-whose-16`. Built on `2455cfb70d6ae155cd93f37157fcec9a58dadbd0`; all prior How to CARE changes remain. Stable checkout, branch, database and production alias are outside scope.

Read **current** Google workbook `1GTyYUL883YogJ9n46WyUyhQBZpQuU9nCrMtRlbfP1l4`, Sheet1 headers A1:H1 and row A15:H15 on October 21. Read-only grid/rich-text snapshot is `content/journey/who-whose-source-2026-10-21.json` (fetch timestamp included). Current headers differ from the earlier curriculum snapshot: A Module, B Section, C Lesson, D Lesson Title, E Lesson Focus, F Content, G Image URL, H CARE. C15=3; D15=Who Vs. Whose; E15=Who, Whose. F15 supplies all teaching paragraphs, headings, lists and 1 John 3:1 quotation unchanged. The repeated source title is represented by the existing lesson heading. G15's actual hyperlink matches its displayed Squarespace Bible image URL; no hidden teaching/CARE hyperlinks or image formulas were found. Image floats top-right inside teaching on desktop; prose uses its former space underneath. It follows teaching on narrow screens. Original companion audio object/source/transcript/player retained; this lesson's audio and estimated lesson duration badges are omitted.

H15 supplies four stages and complete prayer verbatim. `lib/journey/who-whose-care.ts` contains exact explanations/questions/prayer; the three existing reflection labels already match its first three questions. John explicitly requested a writable Explore response in the refinement. It uses stable ID `whose-tomorrow`, added to the canonical workbook prompt list, reflection catalog, history/export and private discussion eligibility. Full prayer follows grid in a separate warm-neutral reading box.

## CARE layout and persistence

A lesson-scoped component replaces only this lesson's disconnected acronym/process/answer rows, at the same place below teaching. Two explicit columns and named grid areas keep Connect top-left, Act top-right, Reflect bottom-left, Explore bottom-right at every tested width, including 320px. Absent stages render reserved cells, never shift remaining stages. Four headers use original greens `#243f27`, `#315d3c`, `#476b42`, `#739d5e`, all with white acronym letters/headings. Response blocks are integrated with each stage. On small screens padding decreases, headings stack letter/name consistently and text remains 16px; inputs retain 16px to avoid mobile zoom.

Saved-answer IDs stay `child-of-god-response`, `old-label-truth`, `whose-before-who`. The three existing answer IDs and their prompt versions remain unchanged. The new Explore prompt is canonical, not a UI-only field. Existing active Journey rounds are extended additively with this one prompt (optimistic metadata-only update for signed-in accounts; owner preview hydration persists on its next save). Historical rounds and existing answers/revisions are never rewritten. No schema migration.

The compact reference explains actual 700ms typing-pause / blur autosave and Next flush, per-answer status and same-answer Field Kit access. Bring to discussion is a **private reminder**, visible in Field Kit and useful for Circle conversations; it does not post, notify or automatically share with a Circle. Existing mark/unmark/optional note controls are reused unchanged.

## Verification / reproduction

- `npm run typecheck`, `npm run build`, `git diff --check`.
- `node tests/journey-who-whose-source.cjs`: current F/G/H source fidelity, focus, three preserved IDs plus stable Explore ID, complete original audio and every other lesson unchanged from2455cfb; canonical catalog includes Explore.
- Authored content, reflection catalog/export, environment isolation and discussion access checks.
- `node tests/journey-who-whose-browser.mjs`: actual Chromium1920/1280/768/390/320, exact module/section/lesson, all wording/focus/prayer, fixed2x2 geometry, readable font, four editable saved inputs including Explore, four green/white headers, image loaded/right-positioned, original audio actually plays, duration omitted, private controls/guidance, overflow/errors. Repeat with `JOURNEY_TEST_BASE=https://dydd-online-school-sandbox.vercel.app`.
- Existing `journey-care-introduction.mjs` five-width regression retains prior intro/body/callout/audio/badge behavior and other real CARE lessons. Its audio-badge expectation now excludes this newly authorized lesson only.
- Existing real-account `journey-fieldkit-sync.mjs`: autosave→same Field Kit→edit→Journey reopen at1280/390/320; immediateNext flush; failedsave keepsdraft/blocksnavigation/retry; concurrent edit serialization/conflict protection; synthetic QA account cleaned.
- Existing private-reminder and Jordan-preview autosave checks; preserve/restore original preview objects exactly and delete only synthetic account fixtures.
- Sandbox explicit deploy script, exact SHA/project/READY/stablealias receipt; stable production remains SHA728e88b7681067c9e78b18aa023ba689c502602a and deploymentdpl_6Cc63HvDtSydhUoxbXxi4MHSzF3p.

Browser-control service start timed out; actual Chromium/Puppeteer QA uses installed dependencies and follows the same read/action/verification loop. Screenshots/QA logs/receipt stay in untracked sandbox `tmp/who-whose-*`, not shipped curriculum.


## October 21 refinement / intended template policy

This sandbox-only prototype removes the irrelevant Teaching lesson pill from the lesson header and its course-index row while retaining book/workbook references. Screenshot inspection also caught the existing tablet index remaining sticky over CARE at 768px; this lesson alone uses a non-sticky index through 980px. The original top-right artwork floats within the lesson body above 980px; actual DOM Range text-line geometry is checked below the image, not only outer container widths. Only this lesson opts into the existing D.E.S.I.G.N wrap pilot; no course-wide rollout.

The source contains one full quoted Scripture passage, 1 John 3:1 (NIV). It is now an explicit Scripture block, with unchanged words/reference, 20px indentation and a 4px dark-green (#243f27) left bar. Ordinary quoted questions (“Who am I?” / “Whose am I?”), explanatory prose, and the full prayer are not misclassified as Bible passages. Intended future template policy: explicitly classify every authored Bible passage and render a clear indented green-bar callout; do not infer Scripture from quotation marks. Preserve source wording/references. Apply only after the prototype is reviewed.

Actual save behavior: typing pauses for 700ms and field blur trigger autosave. Next awaits a flush of every pending reflection/reminder before changing the lesson; failure retains the draft and prevents navigation, showing retry. This is implemented persistence, not copy promising a future feature. Field Kit edits use the same round/answer record and text export includes the latest saved responses. No automatic Circle posting or external delivery.

Refinement verification uses `JOURNEY_TEST_QUESTION_ID=whose-tomorrow node tests/journey-fieldkit-sync.mjs` plus the default existing Connect-ID regression; isolated synthetic accounts are deleted. Browser screenshots and exact geometry logs for local and published 1920/1280/768/390/320 live in sandbox `tmp/`. Jordan preview saves are explicitly backed up/restored by the dedicated preview test. Deployment receipt is updated after the exact pushed sandbox commit reaches READY; production is checked against its prior deployment/SHA.
