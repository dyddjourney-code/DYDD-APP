# Assessment Source Map

The DYDD app should not replace working assessment engines at the start. It should read from trusted live sources, normalize client-safe outputs, then mirror those outputs into Supabase for the HQ dashboard, artifacts, Niche builder, and Companion retrieval.

## Source Rules

- Treat every live customer assessment sheet as production.
- Use read-only observation until John explicitly approves a write or automation change.
- Do not expose raw response rows, private emails, spreadsheet IDs, or scoring internals in client-facing views.
- Store spreadsheet identifiers in deployment environment variables, not hardcoded application code.
- Mirror only the results a signed-in client is allowed to see.

## Live Sources

| Assessment | Source System | Environment Key | App Use |
| --- | --- | --- | --- |
| DesignID / DesignPD | Google Sheets | `DESIGNID_PD_SPREADSHEET_ID` | Assessment snapshot, profile language, Companion context, Niche builder |
| Spiritual Gifts | Google Sheets | `SPIRITUAL_GIFTS_SPREADSHEET_ID` | Assessment snapshot, Gifts journey step, Companion context, Niche builder |
| FruitLife 360 | Google Sheets | `FRUITLIFE_360_SPREADSHEET_ID` | Fruit formation snapshot, report highlights, Companion context, future formation history |

## FruitLife 360 Vercel/Supabase Build Path

FruitLife 360 is moving in phases so the current public Make/Sheet/PDFMonkey flow can keep serving people while the app becomes the durable system of record.

Phase 1 adds app-owned workflow state beside the existing sheet mirror:

- `assessment_snapshots` keeps mirroring completed FruitLife report outputs as `fruit_360`.
- `fruitlife_360_sessions` tracks the app-owned participant/session lifecycle, report state, observer counts, source participant ID, and the linked report snapshot.
- `fruitlife_360_observer_invites` tracks observer invite state without exposing invitation write access to client code.
- `GET/POST /api/fruitlife360/session-sync` copies existing mirrored `fruit_360` snapshots into app-owned sessions. It is protected by the same server-side bearer secrets as assessment sync and supports `dryRun=1`.

Phase 2 should move intake events into Vercel:

- Signup creates a FruitLife session in Supabase.
- Self and observer responses land in app-owned tables or an app-owned API before report generation.
- Make/PDFMonkey can remain as downstream report workers until the report renderer is rebuilt in the app.

Phase 3 should make the app own the full workflow:

- Vercel handles participant record, invite links, response intake, status/retry logic, and dashboard visibility.
- Supabase holds the durable history.
- Google Sheets become content/calculation references or are retired from runtime once formulas are ported.

## Supabase Mirror Shape

Use `assessment_participants` plus `assessment_snapshots` as the first normalized target:

- `assessment_participants.id`: the app's stable internal person ID across DesignID, DesignPD, Spiritual Gifts, Fruit 360, Design Pathways, and future DYDD tools.
- `assessment_participants.normalized_email`: lowercased participant email when the source has one. This is the first cross-assessment matching key for historical submissions.
- `assessment_participants.dydd_participant_key`: optional durable DYDD-managed participant key for records where email is missing, changed, duplicated, or not trustworthy.
- `assessment_participants.user_id`: signed-in Supabase user once that person is attached to an app account.
- `assessment_snapshots.participant_id`: required for newly mirrored records so old submissions can exist before the person ever signs in.
- `assessment_snapshots.user_id`: optional direct auth-user link for submissions already connected to an app account.
- `assessment_type`: stable slug such as `designid`, `designpd`, or `spiritual_gifts`.
- `scores`: client-safe result JSON.
- `source`: source label and sync run reference, not raw private sheet data.
- `source_response_id`: original source response/row/form ID. Combined with `assessment_type` and `source`, this makes imports idempotent.
- `source_submitted_at`: original submission timestamp when available.
- `created_at`: source response or sync timestamp.

The app should never assume only new submissions matter. Historical rows from live sheets should be imported through the same endpoint with either `participantEmail` or `participantKey`, then attached to `userId` later when that person creates or claims an app account.

## Participant Identity Rule

Use this priority order when mirroring assessment records:

1. If the submission belongs to a signed-in app user, send `userId`.
2. If the source row has an email, send `participantEmail` after normalizing it to lowercase.
3. If email is missing or not reliable, send a durable `participantKey` assigned by DYDD.
4. Always send `sourceResponseId` when the source provides a row ID, form response ID, or stable submission ID.

This means the unique person is not "a DesignID row" or "a Spiritual Gifts row." The unique person is the `assessment_participants.id`, and each assessment submission becomes a snapshot attached to that person.

## Latest Snapshot Rule

Multiple submissions by the same person are allowed and should be preserved. The app-facing read model should pull only the latest snapshot per `assessment_type` for the current participant, ordered by `source_submitted_at` first and `created_at` second.

Do not delete older snapshots just because a newer one exists. Older records remain useful for history, audit, longitudinal growth, and future Companion context. The default HQ view should show the current/latest result for each assessment.

Later, add a separate admin-only audit table for source row references and sync diagnostics if needed. Keep that table out of client RLS policies.

## Initial Ingestion Endpoint

`POST /api/assessment-snapshots` is the first safe door into Supabase for normalized assessment results. It expects a server-side bearer token from `DYDD_ASSESSMENT_SYNC_SECRET` and writes with `SUPABASE_SERVICE_ROLE_KEY`.

Allowed `assessmentType` values:

- `designid`
- `designpd`
- `spiritual_gifts`
- `fruit_360`
- `design_pathways`

Example shape:

```json
{
  "participantEmail": "client@example.com",
  "participantName": "Client Name",
  "assessmentType": "spiritual_gifts",
  "sourceSlug": "spiritual_gifts_google_sheet",
  "sourceResponseId": "sheet-row-or-form-response-reference",
  "sourceSubmittedAt": "2026-08-06T20:00:00.000Z",
  "scores": {
    "teaching": 18,
    "mercy": 17
  },
  "summary": {
    "primary": "Teaching",
    "secondary": "Mercy"
  },
  "profileLanguage": {
    "clientSummary": "Client-safe explanation text goes here."
  }
}
```

## Companion Boundary

The Companion may use mirrored assessment outputs to explain, reflect, and ask next-step questions. It should not claim spiritual authority, provide counseling/medical/legal advice, expose other customers' data, or reveal scoring formulas unless John has intentionally made those formulas part of the client experience.
