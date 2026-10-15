# DesignID MAPS confirmation sort

## Source and scope

Read-only source: `DesignID Journey Mapping.xlsx`, Drive ID `1wsM19c2KRkq5ofqcXypYvp9v41lfnhKc`, version 288, modified October 14, 2026. The `MAPS` and `DesignID MAPS` tabs agree on 12 subcategories. Current terms are Kingdom Impact, Development, Observable, Clear Roles, Move Forward, Multiply and Closure; wording in the older planning phrases was reconciled with those terms. No source workbook, legacy assessment or PDFMonkey template was edited.

## Participant flow

Account identity → 20 existing ranked sets → MAPS confirmation → review/submit → report preparation + confirmation summary.

The 12 cards use the approved subcategory words with explanatory statements and their three source terms. Phase/reflection keys are not displayed during sorting. Cards are interleaved, not grouped in scoring order. Four preference groups each accept exactly three words: Most / Often / Sometimes / Least like me. Native desktop drag/drop, pointer/touch grips with reachable drop targets, tap/select then place, and keyboard-accessible menus are provided. Participants can return words to the bank or change a placement before submission. Client and server both require completion; the server rejects missing, unknown, duplicate or unbalanced inputs.

## Interpretation

Primary DesignID scoring, capacity bands, order, pair and all original answers remain unchanged. MAPS uses 3/2/1/0 weights. Reflection links follow the existing app MAPS content; because item counts differ (Architect 4, Artisan 2, Shepherd 2, Steward 4), comparisons use mean item weights, not raw totals. Phase scores are stored independently.

Agreement is descriptive (aligned / complementary / explore), not a measured psychometric confidence probability. Only main reflections within three points of the top score are considered for a suggested tie-reflection clue. MAPS never changes the original primary/secondary reflection, pair, scores or report identity, including exact ties. Equal MAPS means leave the clue unresolved. These rules require future participant evidence before claims of improved reliability/validity.

## Persistence and reports

No schema migration. Versioned `scores.mapsConfirmation` JSON on the existing `assessment_snapshots` row stores assignments, phase scores, normalized reflection weights, agreement, leading reflections and a tie clue. Both the initial insert and report-metadata update include it. The saved summary/report payload also contains a MAPS note. The existing PDF summary receives this note; no live PDFMonkey template changes were made. The submitted view loads only an authenticated account's own DesignID snapshot.

## Verification

- `node tests/designid-maps-confirmation.cjs`: input rejection, normalization, main-score invariance, clear-score protection, tie clues, unresolved ties and report payload integration.
- Chromium QA uses a temporary localhost-only form harness, removed before build/commit. No QA route is deployed.
- App-specific Supabase credential successfully probed the existing `assessment_snapshots` JSON contract read-only. Generic DPG credentials point to a different database; local exported Vercel env files contain placeholders. No credential/config changes were made.
- No test participant email or production assessment submission is sent during these checks. The new live report layout/email delivery still needs John's walkthrough.

### Completed checks

- All 12 labels and 36 source terms exactly match workbook v288.
- Scoring/validation regression suite passed.
- Chromium: 20 ranked sets, incomplete MAPS blocking, native drag/drop event path, tap/placement handlers, menu placement, full-bucket rejection, back-navigation state preservation, real touchscreen grip movement, 390px layout without horizontal overflow, and all 80 main + 12 MAPS fields handed to the form action; no browser page errors.
- Mobile screenshot reviewed; fixed pre-existing start-card persistence/progress-panel overlap in the DesignID form.
- Production build, TypeScript and diff whitespace checks passed. Local test route absent from the production route list.
- Authenticated production submission/PDF/email still awaits participant walkthrough; no test emails sent.
