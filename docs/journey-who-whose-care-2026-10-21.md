# Who vs. Whose — sandbox lesson pilot

## Scope and current source

Authorized sandbox-only Module 3 / Section 3.1 / Lesson 3, slug `identity-who-vs-whose-16`. Built on `2455cfb70d6ae155cd93f37157fcec9a58dadbd0`; all prior How to CARE changes remain. Stable checkout, branch, database and production alias are outside scope.

Read **current** Google workbook `1GTyYUL883YogJ9n46WyUyhQBZpQuU9nCrMtRlbfP1l4`, Sheet1 headers A1:H1 and row A15:H15 on October 21. Read-only grid/rich-text snapshot is `content/journey/who-whose-source-2026-10-21.json` (fetch timestamp included). Current headers differ from the earlier curriculum snapshot: A Module, B Section, C Lesson, D Lesson Title, E Lesson Focus, F Content, G Image URL, H CARE. C15=3; D15=Who Vs. Whose; E15=Who, Whose. F15 supplies all teaching paragraphs, headings, lists and 1 John 3:1 quotation unchanged. The repeated source title is represented by the existing lesson heading. G15's actual hyperlink matches its displayed Squarespace Bible image URL; no hidden teaching/CARE hyperlinks or image formulas were found. Image appears right of teaching on desktop and follows teaching on narrow screens. Original companion audio object/source/transcript/player retained; this lesson's audio and estimated lesson duration badges are omitted.

H15 supplies four stages and complete prayer verbatim. `lib/journey/who-whose-care.ts` contains exact explanations/questions/prayer; the three existing reflection labels already match its first three questions. No additional Explore field was invented: existing workbook has Connect, Act and Reflect fields only. Explore's explanation and question remain visible for contemplation. Full prayer follows grid in a separate warm-neutral reading box.

## CARE layout and persistence

A lesson-scoped component replaces only this lesson's disconnected acronym/process/answer rows, at the same place below teaching. Two explicit columns and named grid areas keep Connect top-left, Act top-right, Reflect bottom-left, Explore bottom-right at every tested width, including 320px. Absent stages render reserved cells, never shift remaining stages. Four headers use original greens `#243f27`, `#315d3c`, `#476b42`, `#739d5e`, all with white acronym letters/headings. Response blocks are integrated with each stage. On small screens padding decreases, headings stack letter/name consistently and text remains 16px; inputs retain 16px to avoid mobile zoom.

Saved-answer IDs stay `child-of-god-response`, `old-label-truth`, `whose-before-who`. Reflection catalog, prompt versions, storage, autosave, exports, history, Field Kit and navigation code are unchanged. Existing saved answers remain attached; no schema/customer-record migration or new question keys.

The compact reference explains actual 700ms typing-pause / blur autosave and Next flush, per-answer status and same-answer Field Kit access. Bring to discussion is a **private reminder**, visible in Field Kit and useful for Circle conversations; it does not post, notify or automatically share with a Circle. Existing mark/unmark/optional note controls are reused unchanged.

## Verification / reproduction

- `npm run typecheck`, `npm run build`, `git diff --check`.
- `node tests/journey-who-whose-source.cjs`: current F/G/H source fidelity, focus, all three stable IDs, complete original audio and every other lesson unchanged from2455cfb; catalog source untouched.
- Authored content, reflection catalog/export, environment isolation and discussion access checks.
- `node tests/journey-who-whose-browser.mjs`: actual Chromium1920/1280/768/390/320, exact module/section/lesson, all wording/focus/prayer, fixed2x2 geometry, readable font, three editable inputs/noExploreinput, four green/white headers, image loaded/right-positioned, original audio actually plays, duration omitted, private controls/guidance, overflow/errors. Repeat with `JOURNEY_TEST_BASE=https://dydd-online-school-sandbox.vercel.app`.
- Existing `journey-care-introduction.mjs` five-width regression retains prior intro/body/callout/audio/badge behavior and other real CARE lessons. Its audio-badge expectation now excludes this newly authorized lesson only.
- Existing real-account `journey-fieldkit-sync.mjs`: autosave→same Field Kit→edit→Journey reopen at1280/390/320; immediateNext flush; failedsave keepsdraft/blocksnavigation/retry; concurrent edit serialization/conflict protection; synthetic QA account cleaned.
- Existing private-reminder and Jordan-preview autosave checks; preserve/restore original preview objects exactly and delete only synthetic account fixtures.
- Sandbox explicit deploy script, exact SHA/project/READY/stablealias receipt; stable production remains SHA728e88b7681067c9e78b18aa023ba689c502602a and deploymentdpl_6Cc63HvDtSydhUoxbXxi4MHSzF3p.

Browser-control service start timed out; actual Chromium/Puppeteer QA uses installed dependencies and follows the same read/action/verification loop. Screenshots/QA logs/receipt stay in untracked sandbox `tmp/who-whose-*`, not shipped curriculum.
