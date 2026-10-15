# Approved DesignID policy, research and owner review — October 15, 2026

John authorized implementation and deployment in Telegram after approving the full sender name, completion wording, six-calendar-month interval and owner-only research view. This explicitly updates the earlier no-order-change contract: original numeric scores and ties remain unchanged, but the secondary sort may order **exact numeric ties** for primary/secondary and integrated report language. Near ties are never reordered. Equal sort means retain the original stable fallback order. Historical reports/snapshots are not rewritten.

## Delivery and review

- `/designid/preview` is authenticated-admin-only, reuses the real form, and never saves or emails. `/designid/preview?sort=1` jumps directly to the word-sort page. The final preview action is an empty server action, so even a scripted invocation cannot create a real result; normal preview submission is intercepted client-side with a visible completion message.
- All Resend display names normalize to **Discover Your Divine Design** while preserving the selected configured address, including explicit sender overrides. Subjects and body content are unchanged.
- Thanks checks snapshot ownership and actual persisted PDF/email status. Only successful PDF plus provider-accepted email says the report is ready in Field Kit and a link has been emailed. Pending/error/skipped outcomes have accurate alternate wording. Provider acceptance is not inbox-delivery proof.

## Retake policy

- Ordinary accounts: six calendar months from their latest completed/saved DesignID result, including linked imported history. Entry and submit gates; database operation serializes concurrent submits and rechecks before saving. No waiting period is started by viewing/starting a form.
- Owner self-access remains exempt, for testing/coaching. An authenticated admin can issue a one-use participant exception in Command Center, with mandatory reason and 30-day expiry. Tokenless preview access does not authorize the grant action. Overrides record the granting owner, reason, creation/expiry and consuming snapshot/time.
- Existing report/course/companion access is unchanged. Field Kit shows the next date and links to the report instead of another start button. Other assessments are not restricted.
- Unfinished ordinary forms retain a versioned, account-email-keyed local browser draft across reloads, without storing incomplete attempts as completed results. Cross-device draft sync is not implemented. Preview never loads/stores these drafts.
- New database table `designid_retake_overrides` has RLS and no anon/authenticated privileges; service role only. `save_designid_attempt` is invoker-security, fixed search path, executable only by service role, and uses the existing snapshots/participants tables. No historical rows or existing policies changed. Migration history is recorded.

## Research contract

- Spearman = Pearson correlation of the four **average ranks** of original allocation scores versus normalized mean sort weights. This handles ties and returns null for an all-equal vector; never labels a percentage of accuracy or psychometric validity.
- Each new snapshot retains original allocations, full question/item/bucket content and mapping, question/scoring/sort/alignment versions, original score order, average ranks, coefficient, exact tie groups, leading-reflection agreement, sort groups, presentation order and changes. Stable participant ID, unique snapshot/source-response ID and submitted timestamp link attempts. Prior attempt/exception references are recorded by the atomic save.
- Only after computing alignment is an exact-score tie ordered by descending sort mean. All points, fractions, bands, movement and DesignPD numeric inputs remain unchanged. PDF primary/secondary, pair and integrated language use the resulting presentation order. Customer integrated summary no longer includes private MAPS explanatory text.
- Command Center panel is gated by existing admin authorization, not merely group ownership. It shows words grouped by their actual selected categories and reflection average ranks (equal ranks labeled tied), coefficient and presentation change. There is **no captured within-category preference order**; alphabetical/card order is not represented as ranking.
- Compatible older native snapshots can be analyzed read-only in Command Center. Their suggested current-policy order is labeled separately; historical report content is unchanged. Incompatible or missing sort data displays unavailable, not a fabricated coefficient.
- This delivers per-attempt tracking and the private person view, not a cohort research dashboard, external validation study, consent workflow, or automatic re-analysis/backfill of historical reports. Existing snapshot export retains underlying data for future work.

## Verification

- `tests/designid-research-retakes.cjs`: known +0.80, perfect/reversed/flat/tied ranks, exact tie versus unequal-score ordering, stable fallback, integrated-pair selection, numeric payload invariance, calendar/end-month/leap-year dates, sender address preservation.
- Original allocation regressions: 80 approved statements/mappings, all 40 legal patterns, invalid inputs and all 130,931 feasible DesignPD vectors. Private read-only fixture: 240 historical rows.
- Rollback-only database test: owner exemption, ordinary refusal, one-use exception, consumption/replay refusal and untrusted role privilege checks; zero test rows remain; no generated PDFs or sends.
- Real component desktop/mobile UI, authenticated preview, existing real report/thanks and owner research checks are recorded in release notes after completion. A test-only harness must be removed before build/push.

Security advisor: no new warning/error on the added objects. One informational `rls_enabled_no_policy` finding is intentional for the service-only overrides table: RLS is enabled, direct client privileges revoked, no user policy grants access.

Local release checks passed: all 20 allocation sets on desktop and real touch/mobile; native drag, grip movement, tap/menu placement and group limits; 92 captured fields/100 points. Authenticated owner preview passed desktop1280/phone390, including final interception with zero POST. Existing native snapshot thanks page confirms ready/emailed wording. Private John’s Tests Command Center panel confirms +0.80 and grouped words; default global view intentionally excludes that internal test group. Local browser draft reload/resume passed. Service RPC no-write REST identity validation probe passed. No assessment test writes remain, and no test reports/emails were generated.
