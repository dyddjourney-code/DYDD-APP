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

## Supabase Mirror Shape

Use `assessment_snapshots` as the first normalized target:

- `user_id`: signed-in app user.
- `assessment_type`: stable slug such as `designid`, `designpd`, or `spiritual_gifts`.
- `scores`: client-safe result JSON.
- `source`: source label and sync run reference, not raw private sheet data.
- `created_at`: source response or sync timestamp.

Later, add a separate admin-only audit table for source row references and sync diagnostics if needed. Keep that table out of client RLS policies.

## Initial Ingestion Endpoint

`POST /api/assessment-snapshots` is the first safe door into Supabase for normalized assessment results. It expects a server-side bearer token from `DYDD_ASSESSMENT_SYNC_SECRET` and writes with `SUPABASE_SERVICE_ROLE_KEY`.

Allowed `assessmentType` values:

- `designid`
- `designpd`
- `spiritual_gifts`

Example shape:

```json
{
  "userId": "supabase-auth-user-id",
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
