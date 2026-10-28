# Spiritual Gifts report email / artifact ordering — 2026-10-28

## Read-only diagnosis and limits

No assessment was resubmitted, no report regenerated, no production/sandbox row
changed, and no email (real or test) was sent during this investigation. Regression
execution uses only in-memory database/PDF/mail interception. Sandbox continues
to block external PDF generation and outbound email.

Bounded service-role reads inspected the report/session metadata, lifecycle jobs,
and message intents; no names, addresses, tokens, report URLs or provider IDs are
included here. For the known owner addresses in the existing administrator map,
the most recent matching Spiritual Gifts session was submitted September 25,
2026, with successful PDF generation and recorded provider acceptance. Older
matching September sessions likewise record acceptance. These predate the durable
lifecycle/message-intent rollout, so no corresponding rows in those new tables
were found. Acceptance is not inbox delivery.

A separately inspected newest signed-in submission at October 28, 2026,
21:39:43 UTC has successful PDF metadata, attachment included, an accepted
Spiritual Gifts lifecycle job (one attempt), and an accepted message intent.
Its recipient matches both its authenticated account and saved profile. The
integrating release subsequently matched its account UUID and recipient to the
previously verified current owner-test account in the private final-eight
release evidence. `tmp/spiritual-gifts-release/current-owner-readonly-proof.json`
records that bounded GET-only association without identifiers. This establishes
current-account provider acceptance, not inbox delivery or an address correction.

Read-only Resend `GET /emails/{saved-provider-id}` returned HTTP 401 with
`restricted_api_key` using the configured DYDD key. This establishes that the
existing send-only key cannot retrieve provider delivery details, **not** that
its send permission is broken. Actual delivered/bounced/spam/inbox status is
unverified. No replay or speculative send was attempted. The observed latest
application records do not establish a missing-send failure. Make was not in
this native-app execution path; its scenarios were not changed or replayed.

## Reproduced implementation defects fixed

1. The native producer previously emailed its token locator before writing
   `session.metadata.pdfMonkey` and snapshot PDF metadata. An immediate recipient
   could resolve a locator whose backing artifact record was not saved yet;
   email or write failure could leave a generated report inaccessible.
2. The optional attachment download lived inside the PDF-generation try block.
   A network exception could overwrite successful generation/archive metadata
   with `status: error`, suppressing the link email despite an existing PDF.
3. A thrown delivery exception escaped before final report/session persistence;
   a failed snapshot insert and artifact writes were also previously unchecked.

Both artifact records are now checked/persisted before the email attempt.
Attachment download uses the provider's actual download URL rather than its
public viewer URL when available; a download failure falls back to the durable
report link without invalidating the PDF. Unexpected mail exceptions become
failed delivery results while the saved report remains ready. Post-send status
updates re-read the just-created records to preserve metadata attached by an
intervening download/recovery. `sentAt` is null when acceptance is not confirmed.
Scoring, original responses/results, report payloads/templates and routing are
unchanged by these backend hunks. No database/schema/environment change.

These are confirmed reliability defects, not a proven cause of the reported
missing inbox email. Inbox root cause remains open pending provider delivery
read access/dashboard evidence. Do not resend an accepted job without separate
provider reconciliation and authorization.

## Owned files and integration

- `app/spiritual-gifts/actions.ts`: only email/PDF persistence and failure-isolation
  hunks; other routing/identity edits in the shared file belong to the parent.
- `tests/spiritual-gifts-email-lifecycle.cjs`: intercepted producer integration.
- This document.

The owned backend hunks, test and document are ported to the sandbox sibling.
The pre-existing authenticated-recipient expression difference outside those
hunks is preserved for the parent to reconcile; no environment files are copied.
No commit, push or deployment was performed by this task.

## Verification

Run in each checkout:

```
node tests/spiritual-gifts-email-lifecycle.cjs
node tests/email-sender.cjs
node tests/report-storage.cjs
node tests/report-recovery.cjs
node tests/artifact-access.cjs
node tests/environment-isolation.cjs
npm run typecheck
```

The new test runs the actual Spiritual Gifts scoring in memory and asserts
persist-before-email, checked artifact writes/no send on failure, optional
attachment/mail exception isolation, retained ready PDF, intervening metadata
preservation, 413 attachmentless fallback, non-ready suppression, and identical
saved totals/report payload after email failure. Sender tests intercept provider
fetch and cover sandbox's no-network guard, retry/idempotency/suppression and
accepted-versus-delivered semantics. All listed unit regressions passed in both
checkouts. Both full typechecks passed. Sandbox's first typecheck was killed (exit 137);
a 768MB rerun hit its heap cap, and the final full check passed with
`NODE_OPTIONS=--max-old-space-size=2048 npm run typecheck`.
