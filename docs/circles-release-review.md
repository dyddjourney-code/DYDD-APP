# Independent Circles authorization review and resolutions

The independent read-only reviewer found four concrete issues. All were resolved before release; none were waived.

1. Alternate Couple data route returned a partner’s individually consented results without mutual consent. `loadCircleData` now closes every Couple result projection unless both accepted spouses consent; legacy route also checks both-person billing. Unit and actual HTTP primary+alternate route withdrawal cases pass.
2. Cohort prompt identifiers allowed arbitrary writing. Migration225000 adds a source-derived69prompt catalog and database trigger binding prompt/lesson/session to the assigned curriculum; UI uses fixed prompt choices. HTTP arbitrary topic-writing denial and canonical count submission pass.
3. Group→Cohort conversion could retain written submissions. Migration227000 blocks conversion whenever written/noncanonical callouts exist, preserving the original group’s records and requiring a separate approved counts-only Cohort.
4. Insight consent named only DesignID/Gifts but legacy route returned DesignPD. Sandbox shared queries now read only DesignID/Gifts, never DesignPD; Couples legacy UI excludes its panels too.

Additional integration corrections: persistent Couple draft/checkout deadlock resolved; narrow service-only verified-identity SQL predicates replace forbidden broad auth table reads; actual participant long-name mobile overflow fixed; free/expired Personal grants excluded from paid counts/activity; shared spouse edits row-lock identity/billing/revision; PDF exports preserve saved read-only history.

Verification: `docs/evidence/circles-local-acceptance.json` (25actual HTTP/browser checks), `circles-schema-verification.json`, `circles-pdf-verification.json`, billing and UI receipts. Provider subscription-control tests are mocked and distinguished from completed TEST purchases. No real mail, live charge or production change.
