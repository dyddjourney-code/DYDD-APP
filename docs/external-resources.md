# External Resources

## Vercel

- Project name: `dydd-online-school`
- Project ID: `prj_YO15mYTp64EHk0wlg6QmBTxNeV5k`
- Framework: Next.js
- Status: created and linked to the local project, not deployed from GitHub yet.
- Environment variables added: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Supabase

- Project name: `DYDD Online School`
- Project ref: `laojrzlqbkmirzcbcnyw`
- Region: `us-east-1`
- Status: created and linked locally.
- Initial migration applied: `20260805023500_initial_school_schema.sql`

Credentials are stored outside the repo in the local secrets directory. Do not commit them.

## Google Sheets

- DesignID/DesignPD live engine: `DesignID_GoogleSheets_Scoring_Template`
- Spreadsheet ID: `1544PcSoJIyGu7Ot_rYTl2Qui5fL539wpVEkdY-Ub_d4`
- Status: read access confirmed through the local Google Sheets service account on 2026-08-06.
- Use: observation and app architecture only. Treat this sheet as the live scoring engine and mirror client-safe outputs into Supabase; do not modify the working spreadsheet without explicit approval.

## GitHub

- Repo: `git@github.com:dyddjourney-code/DYDD-APP.git`
- Public URL: `https://github.com/dyddjourney-code/DYDD-APP`
- Status: connected and tracking `origin/master`.
