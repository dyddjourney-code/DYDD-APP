# Scripture usage ledger — October 23, 2026

## Result and scope

**179 unique quoted verses** in the historical all-surface baseline plus verified current sandbox authored course additions and actual full-text Waypoints present in the local library, including future releases. This is an **all-translations, canonical unique-verse inventory**, not an NIV-only license adjudication or a fresh remote production audit.

| Evidence partition | Unique verses / records |
| --- | ---: |
| October 20 all-surface quoted baseline | 150 verses |
| New verified course verses beyond that baseline | 17 verses |
| Baseline + current course source | 167 verses |
| Actual full-text Waypoints | 35 of 35 records |
| Distinct full-text Waypoints passages / canonical verses | 25 / 29 |
| Waypoints net new beyond baseline + courses | 12 verses |
| Union including all future authored Waypoints | 179 verses |
| Baseline + courses + date-released Waypoints only | 171 verses |
| Waypoints still reference-only, excluded | 0 records |

The original 513 was a reference inventory, not 513 quoted verses: 363 of those verses were reference-only. The historical 150 includes actual reproduced text and partial quotations, across translations. Do not reuse its old “350 remaining” arithmetic.

## What was reviewed

- Baseline CSV and quoted-count.py at `outputs/scripture-audit-2026-10-20/`, including source selections and explicit omissions. Historical production, sandbox, four published PDFMonkey templates, three workbook/static report libraries and image evidence remain in that captured universe. The CSV SHA-256 is `1f86845eb771c30f9094071b9a995fab7ccc44f94de36567941552d8dd7a98de`.
- Sandbox committed source changes from `6ed5d49839999d3a98ec648535d8b147b90824c7` through `208b36c7d9c5bb6182f088b0f1f5341d9c068d8d` across `app`, `lib`, `components`; quote-bearing authored DesignID and Journey/Expertise teaching, lists, CARE prompts and explanations were read. DesignID's new source-faithful quotations duplicate baseline verses; they do not automatically add a second verse selection.
- Reviewed Journey identity/love/Pathfinder content and Expertise Oct23 lessons add **17** previously uncounted verses. The authored “Peter 4:10” is normalized only in the ledger to **1 Peter 4:10**, supported by its actual quotation and another fully spelled-out instance; no lesson wording was edited.
- Local Waypoints source is `lib/waypoints/waypoints.json`, never the legacy database/email library. A `scripture` reference without nonempty `scriptureText` contributes no new quoted verse. Full-text records retain their actual text, translation, attribution, record ID, release time and visibility partition in the JSON evidence.
- Production's post-Oct20 source history was checked read-only: MAPS report changes add no new reproduced Bible passages in their source delta. Production, live workbooks and live PDFMonkey were **not** remotely recaptured. Their baseline evidence is carried forward, not represented as reverified today.

## New course verses beyond the baseline

| Quoted passage | New canonical verses |
| --- | ---: |
| Mark 12:28-31 | 4 |
| 1 Peter 4:8 | 1 |
| Matthew 6:21 | 1 |
| Matthew 16:26 | 1 |
| Philippians 4:13 | 1 |
| 2 Corinthians 12:10 | 1 |
| 1 Peter 2:9 | 1 |
| Romans 8:16 | 1 |
| Philippians 1:6 | 1 |
| Proverbs 1:7 | 1 |
| Proverbs 22:29 | 1 |
| Acts 4:13 | 1 |
| Hebrews 5:14 | 1 |
| Psalm 46:10 | 1 |

Exact source paths, lines and complete containing quotation contexts are in `lib/scripture/usage-ledger.json` (`evidence`) and the workspace `quote-evidence.json`. New-course set: Psalm 46:10, Proverbs 1:7, Proverbs 22:29, Matthew 6:21, Matthew 16:26, Mark 12:28, Mark 12:29, Mark 12:30, Mark 12:31, Acts 4:13, Romans 8:16, 2 Corinthians 12:10, Philippians 1:6, Philippians 4:13, Hebrews 5:14, 1 Peter 2:9, 1 Peter 4:8.

## Waypoints reconciliation

Original baseline library: **23 records, 13 distinct reference strings**; Galatians 5:22–23 spans two verses, so 13 passages is not automatically 13 canonical verses. Original record IDs identify upgrades versus additions. Current new record count is **12**; **0** of the planned twelve additions are not yet present in source and cannot yet be counted or assigned verse IDs. The original 13 full-text passages would add four baseline-absent verses: 1 Corinthians 12:18, Galatians 2:20, Proverbs 20:5, Psalm 37:23; do not count these until quotation text actually exists.

Current Waypoints net-new verses after course/baseline deduplication: **Psalm 37:23, Psalm 130:5, Proverbs 20:5, Matthew 5:23, Matthew 5:24, Luke 2:10, Luke 2:11, Luke 2:19, 1 Corinthians 12:18, 1 Corinthians 12:22, Galatians 2:20, 1 Thessalonians 5:18**

| Waypoint record | Actual quoted passage | Verses | Date visibility |
| --- | --- | ---: | --- |
| legacy-leadership-that-listens-first-2026-06-17 | James 1:19 | 1 | Released |
| legacy-named-by-grace-not-output-2026-06-24 | Galatians 2:20 | 1 | Released |
| legacy-belonging-before-building-2026-07-08 | John 15:5 | 1 | Released |
| legacy-when-your-design-needs-rest-2026-07-15 | Matthew 11:28 | 1 | Released |
| legacy-called-before-you-feel-ready-2026-07-22 | 2 Corinthians 12:9 | 1 | Released |
| legacy-faithfulness-in-the-ordinary-work-2026-07-29 | Colossians 3:23 | 1 | Released |
| legacy-the-shape-of-faithful-strength-2026-08-05 | 1 Corinthians 12:18 | 1 | Released |
| legacy-the-courage-to-name-what-matters-2026-08-05 | Proverbs 20:5 | 1 | Released |
| legacy-when-your-gifts-need-room-to-breathe-2026-08-12 | 1 Peter 4:10 | 1 | Released |
| legacy-begin-with-who-god-says-you-are-2026-08-19 | Ephesians 2:10 | 1 | Released |
| legacy-designed-to-move-with-grace-2026-08-26 | Romans 12:6 | 1 | Released |
| grace-for-the-step-you-can-take | Psalm 37:23 | 1 | Released |
| fruit-that-can-be-seen | Galatians 5:22-23 | 2 | Released |
| designed-to-move-with-grace | Romans 12:6 | 1 | Released |
| begin-with-who-god-says-you-are | Ephesians 2:10 | 1 | Released |
| when-your-gifts-need-room-to-breathe | 1 Peter 4:10 | 1 | Released |
| the-shape-of-faithful-strength | 1 Corinthians 12:18 | 1 | Released |
| when-your-design-needs-rest | Matthew 11:28 | 1 | Released |
| the-courage-to-name-what-matters | Proverbs 20:5 | 1 | Released |
| called-before-you-feel-ready | 2 Corinthians 12:9 | 1 | Future |
| belonging-before-building | John 15:5 | 1 | Future |
| named-by-grace-not-output | Galatians 2:20 | 1 | Future |
| faithfulness-in-the-ordinary-work | Colossians 3:23 | 1 | Future |
| gratitude-with-room-for-the-truth | 1 Thessalonians 5:18 | 1 | Future |
| hope-in-the-unhurried-wait | Psalm 130:5 | 1 | Future |
| led-gently-not-driven-harder | Isaiah 40:11 | 1 | Future |
| make-room-to-ponder | Luke 2:19 | 1 | Future |
| good-news-before-your-response | Luke 2:10-11 | 2 | Future |
| mercy-before-the-new-list | Lamentations 3:22-23 | 2 | Future |
| wisdom-you-can-ask-for | James 1:5 | 1 | Future |
| repair-before-moving-on | Matthew 5:23-24 | 2 | Future |
| the-gift-you-might-overlook | 1 Corinthians 12:22 | 1 | Future |
| faithful-without-forcing-the-harvest | Galatians 6:9 | 1 | Future |
| stillness-is-not-surrender-to-fear | Psalm 46:10 | 1 | Future |
| love-that-begins-with-receiving | 1 John 4:19 | 1 | Future |

Released and future sets can overlap; their totals must not be added without deduplication. Future scripture stored in the authored library is included in the authored union even when not yet visible to learners. “Released” here is computed from `releaseAt` against the recorded audit timestamp, not a live browser or deployment check. Local changes must not be described as already deployed.

## Method, boundaries and text completeness

1. Preserve each of the 150 baseline canonical book/chapter/verse IDs and its source provenance. This is a conservative carry-forward universe, not a claim that every original surface still prints every verse.
2. Add only manually reviewed actual quotation contexts, including partial text. Normalize book names, expand verse ranges, deduplicate verse IDs across all sources/translations. Track occurrences separately from distinct verses.
3. Inspect quoted text, not citation range alone. Matthew 5:15 remains excluded from the shortened DesignID Matthew 5:14–16 quote; 1 Peter 5:3 remains excluded from the historical shortened quote. Isaiah 61:3 was already quoted in FruitLife Joy prose; Isaiah 61:1–2 are not inferred from a broad citation.
4. Exclude chapter-only references, anchor/reference-only fields, suggested readings, table framework references and explanatory paraphrases. In particular, the new One Another CARE reading references are not themselves quotations.
5. Historical course excerpts remain historical excerpts; this audit does not silently expand them into full quotations. Waypoints newly declared full NIV passages are inventoried from their full-text field; the authoring verification must additionally establish exact NIV wording and absence of omitted verses. The ledger does not certify every old mixed-translation quotation as NIV.
6. Recompute all unions from sets, never add passage counts to verse counts. Hash the current inputs and retain quote evidence. The sandbox-source-evidence subset (baseline sandbox evidence + courses + local future Waypoints) is **138**; it is not a newly measured live sandbox total. Historical sandbox-only provenance was 102 versus historical production-only provenance 87, with overlap and workbook/report evidence outside either subset.

## Permission and attribution evidence

- `memory/2026-09-03.md:25`: Biblica offer to 4D Education Inc. for DYDD, up to 500 NIV verse selections; electronic worldwide commercial distribution; two-year renewable term; attribution required; NIV default. This is the remembered offer, not the signed agreement.
- `memory/2026-10-20.md:83`: John reported final approval for up to 500 verses. The signed license and definition of “verse selections” were not examined in this audit.
- Public attribution source checked October23: [Bible Gateway NIV version information](https://www.biblegateway.com/versions/New-International-Version-NIV-Bible/), HTTP200; its permissions section gives: **THE HOLY BIBLE, NEW INTERNATIONAL VERSION®, NIV® Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide.** Direct [Biblica permissions](https://www.biblica.com/permissions/) returned Cloudflare403. Public general quotation rules do not replace John's specific approval.
- All newly counted Waypoints records require `scriptureTranslation: NIV` and nonempty `scriptureAttribution`; attribution strings are retained verbatim as evidence. This audit does not install or change attribution UI, and does not infer that every old course/report has been relabeled.

**No fresh license-remaining figure is asserted.** The refreshed authored all-translation union is the planning evidence; NIV-only attribution, the signed terms and uncaptured external changes remain separate questions.

## Reproduce and handoff

Run `python3 scripts/refresh-scripture-ledger.py` from the sandbox checkout. It writes this document, `lib/scripture/usage-ledger.json`, and workspace `outputs/scripture-ledger-2026-10-23/{usage-ledger.json,quoted-verses.csv,quote-evidence.json}`. It reads but never changes course/Waypoints sources. If another author has not yet written full Waypoints text, rerun after that write; pending references remain excluded until then. No commit, push, deployment, scenario run, report generation or external content mutation was performed by this audit.

Audit snapshot: 2026-10-23T19:12:06.737259+00:00.
