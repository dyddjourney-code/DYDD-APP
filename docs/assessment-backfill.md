# Assessment Backfill

The first backfill path mirrors already-scored, client-safe outputs from the live Google Sheets into Supabase. It does not edit the live scoring sheets.

## Sources

- DesignID: `Export_For_Results`
- DesignPD: `DesignPD_Report_Data`
- Spiritual Gifts: `Scores`

## Identity

The importer attaches every payload to the participant identity model:

- Use `participantEmail` when the source row has a usable email.
- Use a generated `participantKey` only when email is missing or unusable.
- Use `sourceResponseId` for idempotent replays.
- Supabase stores the durable person as `assessment_participants.id`.
- Keep every submission. App views should select the latest snapshot per assessment type for the signed-in participant.

## Dry Run

Dry run is the default. It writes ignored local files under `out/assessment-import`.

```bash
npm run sync:assessments
```

Limit records while checking a source:

```bash
npm run sync:assessments -- --source designid --limit 10
npm run sync:assessments -- --source designpd --limit 10
npm run sync:assessments -- --source spiritual_gifts --limit 10
```

## Apply

Apply mode writes to `POST /api/assessment-snapshots`.

Required environment variables:

- `DESIGNID_PD_SPREADSHEET_ID`
- `SPIRITUAL_GIFTS_SPREADSHEET_ID`
- `DYDD_APP_URL`
- `DYDD_ASSESSMENT_SYNC_SECRET`

Example:

```bash
DYDD_APP_URL="https://dydd-online-school.vercel.app" npm run sync:assessments -- --apply
```

Run a one-record apply before a full import:

```bash
DYDD_APP_URL="https://dydd-online-school.vercel.app" npm run sync:assessments -- --source designid --limit 1 --apply
```

## Automatic Sync

New submissions are mirrored by the protected cron route:

```text
GET /api/cron/assessment-sync
```

The route reads the same live Google Sheet tabs as the backfill script and upserts snapshots idempotently by `(assessment_type, source, source_response_id)`, so reruns do not create duplicate submissions. It is configured in `vercel.json` to run daily on Vercel's current Hobby cron allowance. Use the manual sync command when a class or test batch needs an immediate refresh.

Required production environment variables:

- `CRON_SECRET`
- `DYDD_GOOGLE_SERVICE_ACCOUNT_B64` or `DYDD_GOOGLE_SERVICE_ACCOUNT_JSON`
- `DESIGNID_PD_SPREADSHEET_ID`
- `SPIRITUAL_GIFTS_SPREADSHEET_ID`
- `SUPABASE_SERVICE_ROLE_KEY`

Manual smoke test:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://dydd-online-school.vercel.app/api/cron/assessment-sync?dryRun=1&limit=1"
```

## Current Dry-Run Counts

Last checked on 2026-08-06:

- DesignID: 236 payloads
- DesignPD: 236 payloads
- Spiritual Gifts: 189 payloads
