# Waypoints content authoring — October 23, 2026

## Scope and state

Local content-only update in the sandbox checkout. Only `lib/waypoints/waypoints.json` and this document are owned by this work. No application code, assessment data, production checkout, commit, push, deployment, automation, or delivery schedule service was changed. The parent task owns rendering, the cross-product Scripture ledger, and subsequent integration.

- **23 existing entries retained**, in their original order. IDs, titles, human-readable dates, release timestamps, categories, Scripture references, tags, excerpts, and every body paragraph are unchanged.
- Existing generic reflections were intentionally replaced with substantive, multi-sentence reflections. Each entry now also has individually authored `Architect`, `Artisan`, `Shepherd`, and `Steward` variants.
- **12 original devotionals appended**, each with an original title, excerpt, three-paragraph body, full specified NIV passage, generic reflection, and four substantial variants.
- Every entry supplies `scriptureText`, `scriptureTranslation: "NIV"`, `scriptureAttribution`, and the four-key `reflections` object; the singular `reflection` remains the generic version.
- **35 total entries**, representing **25 distinct devotional works**: the original 23 entries include 10 republications of the same work. Those genuinely identical devotionals share the corresponding authored reflection set, rather than receiving artificial variations unrelated to their content.
- **175 reflection instances**, comprising **125 unique authored texts**. All generic and primary-specific reflections are 49–67 words and multiple sentences. Primary-specific variants are 49–67 words; word counts are descriptive, not a template used to generate the content.

## Editorial approach

Each variant addresses a particular tension in its own devotional: listening before redesigning, identity apart from approval, dependence before productivity, rest with real limits, weakness without recklessness, ordinary work without endless effort, interdependence, patient discernment, gifts as service, grace before works, flexibility beyond labels, small steps, and relational fruit. New works explore truthful gratitude, waiting, gentleness, pondering, receiving Christmas news, mercy, wisdom, repair, overlooked members, sustainable perseverance, stillness, and initiating love.

The reflection lenses are invitations, not rankings, diagnoses, vocational assignments, or a claim that an assessment reveals God's instructions. The language keeps growth open across patterns. Applications emphasize received grace, ordinary responsibility, agency, mutual care, appropriate limits, and honest dependence. In particular:

- Full Romans 12:6 includes its second sentence about prophesying; the verse is not shortened to its opening statement about different gifts.
- Full Galatians 5:22–23 includes the sentence about the law; ranges are not represented by selected phrases.
- Reconciliation does not promise immediate restored trust, impose a forgiveness timetable, or require unsafe/unwelcome contact.
- Perseverance does not require staying in every role, continuing an unhelpful method, or controlling someone else's growth.
- Gratitude is not a demand to call painful circumstances good; stillness is not avoidance of genuinely needed action.
- Devotional commentary remains distinct from the actual Scripture quotation fields.

## New release schedule

All releases are **Friday, 8:00 AM America/New_York**. Every new date falls during Eastern Standard Time, so all timestamps are **13:00:00.000Z**. Existing dates/timestamps, including the legacy Wednesday archive, were preserved.

| Eastern release date | Original devotional | Passage | UTC timestamp |
| --- | --- | --- | --- |
| November 27, 2026 | Gratitude With Room for the Truth | 1 Thessalonians 5:18 | 2026-11-27T13:00:00.000Z |
| December 4, 2026 | Hope in the Unhurried Wait | Psalm 130:5 | 2026-12-04T13:00:00.000Z |
| December 11, 2026 | Led Gently, Not Driven Harder | Isaiah 40:11 | 2026-12-11T13:00:00.000Z |
| December 18, 2026 | Make Room to Ponder | Luke 2:19 | 2026-12-18T13:00:00.000Z |
| December 25, 2026 | Good News Before Your Response | Luke 2:10-11 | 2026-12-25T13:00:00.000Z |
| January 1, 2027 | Mercy Before the New List | Lamentations 3:22-23 | 2027-01-01T13:00:00.000Z |
| January 8, 2027 | Wisdom You Can Ask For | James 1:5 | 2027-01-08T13:00:00.000Z |
| January 15, 2027 | Repair Before Moving On | Matthew 5:23-24 | 2027-01-15T13:00:00.000Z |
| January 22, 2027 | The Gift You Might Overlook | 1 Corinthians 12:22 | 2027-01-22T13:00:00.000Z |
| January 29, 2027 | Faithful Without Forcing the Harvest | Galatians 6:9 | 2027-01-29T13:00:00.000Z |
| February 5, 2027 | Stillness Is Not Surrender to Fear | Psalm 46:10 | 2027-02-05T13:00:00.000Z |
| February 12, 2027 | Love That Begins With Receiving | 1 John 4:19 | 2027-02-12T13:00:00.000Z |

January 29 is the last January release; the final two appended releases are February 5 and February 12. There are no missing weeks between November 27 and February 12 inclusive.

## NIV text verification and attribution

All **25 distinct passage selections** were fetched successfully from Bible Gateway's NIV pages on October 23, 2026. The source is explicitly labeled New International Version. Passage extraction removed headings, verse-number markers, footnote/cross-reference links, and navigation, preserving the complete words and punctuation of the specified verses. Poetic line breaks were flattened to readable spaces; typographic small-cap LORD is represented as `Lord`, matching the readable source extraction. The field contains Scripture only, not the reference or source navigation.

A verse that continues into a verse outside the specified selection retains its source punctuation: for example, James 1:19 and Colossians 3:23 end with commas, Psalm 37:23 and Romans 12:6 with semicolons. Opening quotation marks are not artificially closed when the source speech continues beyond the requested verse. No surrounding verses were silently appended.

Every entry carries the same complete copyright notice copied from the NIV publisher notice displayed on Bible Gateway:

> Holy Bible, New International Version®, NIV® Copyright ©1973, 1978, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide.

This is the publisher's attribution wording, not an independent finding that the license covers a particular use or that a verse allowance remains available.

### Source URLs

| Specified full passage | Verified NIV source |
| --- | --- |
| James 1:19 | [Bible Gateway](https://www.biblegateway.com/passage/?search=James%201%3A19&version=NIV) |
| Galatians 2:20 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Galatians%202%3A20&version=NIV) |
| John 15:5 | [Bible Gateway](https://www.biblegateway.com/passage/?search=John%2015%3A5&version=NIV) |
| Matthew 11:28 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Matthew%2011%3A28&version=NIV) |
| 2 Corinthians 12:9 | [Bible Gateway](https://www.biblegateway.com/passage/?search=2%20Corinthians%2012%3A9&version=NIV) |
| Colossians 3:23 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Colossians%203%3A23&version=NIV) |
| 1 Corinthians 12:18 | [Bible Gateway](https://www.biblegateway.com/passage/?search=1%20Corinthians%2012%3A18&version=NIV) |
| Proverbs 20:5 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Proverbs%2020%3A5&version=NIV) |
| 1 Peter 4:10 | [Bible Gateway](https://www.biblegateway.com/passage/?search=1%20Peter%204%3A10&version=NIV) |
| Ephesians 2:10 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Ephesians%202%3A10&version=NIV) |
| Romans 12:6 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Romans%2012%3A6&version=NIV) |
| Psalm 37:23 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Psalm%2037%3A23&version=NIV) |
| Galatians 5:22-23 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Galatians%205%3A22-23&version=NIV) |
| 1 Thessalonians 5:18 | [Bible Gateway](https://www.biblegateway.com/passage/?search=1%20Thessalonians%205%3A18&version=NIV) |
| Psalm 130:5 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Psalm%20130%3A5&version=NIV) |
| Isaiah 40:11 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Isaiah%2040%3A11&version=NIV) |
| Luke 2:19 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Luke%202%3A19&version=NIV) |
| Luke 2:10-11 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Luke%202%3A10-11&version=NIV) |
| Lamentations 3:22-23 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Lamentations%203%3A22-23&version=NIV) |
| James 1:5 | [Bible Gateway](https://www.biblegateway.com/passage/?search=James%201%3A5&version=NIV) |
| Matthew 5:23-24 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Matthew%205%3A23-24&version=NIV) |
| 1 Corinthians 12:22 | [Bible Gateway](https://www.biblegateway.com/passage/?search=1%20Corinthians%2012%3A22&version=NIV) |
| Galatians 6:9 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Galatians%206%3A9&version=NIV) |
| Psalm 46:10 | [Bible Gateway](https://www.biblegateway.com/passage/?search=Psalm%2046%3A10&version=NIV) |
| 1 John 4:19 | [Bible Gateway](https://www.biblegateway.com/passage/?search=1%20John%204%3A19&version=NIV) |

### Permission-context notes inspected

A targeted workspace search located these existing notes; no signed agreement was examined:

- `/home/openclaw/.openclaw/workspace/memory/2026-09-03.md:25` records a Biblica permission **offer**, including up to 500 verse selections, an attribution requirement, a two-year renewable term, and other conditions. That offer is not treated as the signed license.
- `/home/openclaw/.openclaw/workspace/memory/2026-10-20.md:82` records John's report of final licensing approval for up to 500 Scripture verses and explicitly says the agreement/terms were not examined.
- That October 20 note records **513 unique explicitly identified reference verses** across a broader inventory, including reference-only mentions and multiple translations. It explicitly says this is **not an exact reproduced NIV quotation count**. It must not be used to infer either an overage or available headroom.
- A direct request to [Biblica's permissions page](https://www.biblica.com/permissions/) returned Cloudflare HTTP 403. Passage and publisher-notice verification succeeded through Bible Gateway instead.

Within this Waypoints file only, the 35 entries contain **39 quoted verse instances**, representing **29 distinct verses** in **25 passage selections**. The 12 new works account for 15 distinct verses. These are local content counts, not a cross-product license tally. No conclusion is made about which verses are net-new to the larger ecosystem or whether any allowance is available. The parent task must deduplicate against its cross-product ledger and preserve the distinction between a reference-only citation and an actual reproduced quotation.

## Verification performed

A content validation read the written JSON back from disk and checked:

1. Exactly 23 original entries plus 12 appended entries, with 35 unique IDs.
2. Deep equality of every protected original field: `id`, `title`, `date`, `releaseAt`, `category`, `scripture`, `tags`, `excerpt`, and `body`.
3. A nonempty NIV Scripture quotation and identical publisher attribution on every entry.
4. The exact four reflection keys on every entry, plus a multi-sentence generic reflection; all five texts substantive and distinct within a devotional.
5. No Bible Gateway navigation or translation-selection text leaking into quotations.
6. Exactly 12 consecutive weekly dates from November 27, 2026 through February 12, 2027, all Friday at 08:00 Eastern / 13:00 UTC, with January 29 the final January release.
7. Matching full fetched passage text after only documented presentation cleanup; complete specified ranges and the often-truncated second sentence of Romans 12:6 are retained.
8. New titles, IDs, excerpts, bodies, and reflection sets are distinct from the existing works and each other.

No application tests or browser rendering were run in this content-only scope. Rendering and release gating remain parent integration checks. The prepared local data is complete; no content blocker remains. The signed agreement and global quoted-verse usage were not independently verified.
