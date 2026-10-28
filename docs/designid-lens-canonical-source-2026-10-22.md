# DesignID canonical shadow source research

Read-only live retrieval: 2026-10-22T19:51:51.670Z.

Source: [DesignID_GoogleSheets_Scoring_Template](https://docs.google.com/spreadsheets/d/1544PcSoJIyGu7Ot_rYTl2Qui5fL539wpVEkdY-Ub_d4/edit#gid=1827035978), `Shadow!A1:G5` (gid 1827035978). Exact raw values and lookup/split formulas preserved in `designid-canonical-shadow-source.json`.

## Verified binding

Scored!BA2:BF2 match Scored!Z2 (Primary) against Shadow!A:A and read B:G respectively. Export_For_Results!BA:BF are Reflection_Shadow, Shadow_Overview, Shadow_Risks, Shadow_Root_Cause, Shadow_Redemption, Shadow_Scripture. Export_For_Results!BH:BS split BC/BD/BE on newline into Risks A-D, Roots A-D, Redemptions A-D, trimming each value. Local Make payload maps module20 zero-based columns52 and59-70 to these exact report fields. Local PDFMonkey template renders the 4x3 matrix at lines1010-1032. Bound Apps Script was not needed or inspected; workbook formulas directly prove lookup and split behavior.

## Exact canonical matrix

### Architect — Reflection_Shadow: Control

Source: Shadow!A2:G2

| Row | Risk | Root cause | Redemption |
| --- | --- | --- | --- |
| A | Control | Fear of failure or loss of vision | Yield outcomes to God. |
| B | Impatience | Drive outpaces discernment | Learn to pause and listen. |
| C | Isolation | Over Reliance on self | Invite collaboration. |
| D | Pride | Mistaking confidence for calling | Recenter on service. |

### Artisan — Reflection_Shadow: Perfectionism

Source: Shadow!A3:G3

| Row | Risk | Root cause | Redemption |
| --- | --- | --- | --- |
| A | Perfectionism | Mistaking excellence for worth | Practice grace over outcome. |
| B | Overcontrol | Fear of unpredictability | Trust collaboration and faith in the process. |
| C | Criticism | Overidentification with correctness | Choose encouragement over critique. |
| D | Analysis Paralysis | Fear of failure or disorder | Move from “knowing” to “doing.” |

### Shepherd — Reflection_Shadow: People-Pleasing

Source: Shadow!A4:G4

| Row | Risk | Root cause | Redemption |
| --- | --- | --- | --- |
| A | People-Pleasing | Fear of rejection | Seek truth with love. |
| B | OverIdentification | Carrying others’ burdens alone | Set boundaries in grace. |
| C | Avoidance | Conflict aversion | Choose courage over comfort. |
| D | Emotional Fatigue | Lack of self-care | Rest and renew in solitude. |

### Steward — Reflection_Shadow: Rigidity

Source: Shadow!A5:G5

| Row | Risk | Root cause | Redemption |
| --- | --- | --- | --- |
| A | Rigidity | Fear of change | Practice adaptability. |
| B | Overcontrol | Insecurity | Delegate in trust. |
| C | Resistance | Preference for familiarity | Welcome innovation. |
| D | Work-Based Worth | Identity in performance | Rest in grace. |

## Implementation recommendation

Bind native report generation to this exact per-Primary source record: Reflection_Shadow, Shadow_Overview, Shadow_Scripture, the three multiline fields, and all twelve Shadow_Risk/Root/Red_A..D fields. Preserve saved actual report payloads for display; do not select by integrative pair, secondary reflection, or Potential_Shadow. If repairing known generic placeholders, match/report those placeholders explicitly and bind canonical values from the saved Primary without recalculating scores. Unknown/missing Primary must remain unavailable, not a fabricated default.

Artisan exact live spelling is **Overcontrol** (one word), matching the user’s “over control” concept; preserve source spelling. Shepherd exact source spelling is **OverIdentification**. No application code, remote data, or user reports were changed. Only these two research artifacts were written.
