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

## Current Dry-Run Counts

Last checked on 2026-08-06:

- DesignID: 236 payloads
- DesignPD: 236 payloads
- Spiritual Gifts: 189 payloads
