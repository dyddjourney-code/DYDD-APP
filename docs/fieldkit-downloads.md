# Field Kit report downloads — October 19, 2026

- Each completed assessment retains a dated snapshot. Latest appears first; older records remain under Assessment history.
- Download PDF covers private archived PDFs, retained provider documents and accurate regeneration from saved full report data. Preparation begins automatically with visible progress; failures offer Retry download.
- Historical summaries lacking both a retained PDF and full report data explicitly say Snapshot only — original PDF unavailable. Never invent a full report from a partial summary.
- Recovery HTML uses Referrer-Policy: same-origin. no-referrer causes browser form Origin: null and fails the existing same-origin POST guard. Cross-origin requests remain denied; credentials are not sent to external destinations in referrers.
- FruitLife snapshot access is authorized first, then supplemented by its associated session’s retained PDF metadata. Ready session-linked reports keep their snapshot and are not duplicated.
- Early native DesignPD reports whose provider copy has expired can be recreated only from the exact same-participant linked DesignID record, with all three saved axis scores, movements and tendencies verified unchanged. Full official report language comes from the approved source library; incomplete or mismatched records are not fabricated.
- DesignPD snapshots display saved scores from legacy Score fields, native template fields, or axisScores, preserving zero and marking genuinely missing values Not retained. No rescoring.

Verification: artifact-access.cjs, artifact-download-browser.cjs (real Chromium form submission), report-recovery.cjs, report-storage.cjs, pdf-score-display.cjs; production build; actual personal-account snapshots/history/mobile and four-type real PDF recovery. Private QA artifacts remain outside Git. No emails are triggered by report recovery.
