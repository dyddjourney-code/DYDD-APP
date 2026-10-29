# Expedition team-preparation demo

The protected owner `/command-center/expedition` now hosts an explicitly fictional,
browser-local demo. The existing teaching sandbox redirects here unchanged. The
server page's existing authentication/owner checks are unchanged. No live data is
passed to the demo; the client imports only four fixed fictional fixtures. No
server actions, API requests, invitation services, assessment submissions, group
creation, billing or assignment writes exist in the demo.

## State and semantics

- Only `dydd:expedition:fictional-team-demo:v1` is read/written in localStorage.
  Version/schema validation rejects incompatible data. Reset restores only this
  key's fixture state. Browser storage failures leave a usable session with notice.
- Four people have fabricated 100-point DesignID allocations, ranked five-gift
  lists, and DesignPD movements derived from those same DesignID scores.
- DesignID: Architect, Artisan, Shepherd, Steward; raw 0–60 points, total 100.
  Capacity bars average **completed** profiles; underlying points are visible.
  Exact approved reflection colors are preserved.
- DesignPD: current `lib/designpd/engine.ts` formula and Command Center poles.
  Plan −/+ = Doer/Dreamer; Decide −/+ = Think It/Feel It; Do −/+ = Together/Solo.
  Signed movements are −50…+50 percentage points. Scatter uses Plan horizontally,
  Decide vertically, and lists Do numerically in its legend. No invented third
  spatial axis, psychometric readiness, compatibility, or performance metric.
- Gift overlay counts membership in completed profiles' ranked top five. A table
  exposes per-person rank and counts; it does not imply measured gift strength.
- Incomplete/unassigned assessments never chart. Returning DesignID to pending
  makes DesignPD pending; PD completion requires completed DesignID.
- Demo starts 9/12 completed. Completing all enables a **demo-only** launch
  checklist; this is not final product access policy. Any preparation edit clears
  the local launch state.
- Optional summary/course-review tracking is local, with fictional summaries only.
  Existing DesignID Foundations, Design Map, and MAPS links retain existing access.
  Design Map is exploratory, not required; MAPS integration is not implemented.

## Verification

Run from repository root:

```
npm run build
npm run typecheck
node scripts/verify-expedition-demo.mjs
node scripts/verify-expedition-demo-browser.mjs
```

The browser verifier expects the production server at `127.0.0.1:3158` using the
existing private-owner local verification setup and outputs evidence into
`tmp/expedition-team-demo/`. It blocks any non-GET/HEAD/OPTIONS browser request.
It checks desktop/390/320 rendering, actual UI transitions, fixture/plot values,
local persistence/reset, empty states and incompatible storage recovery.
The separate model verifier compares every PD movement to the real scoring engine.

Release evidence and deployment receipt are copied to the workspace
`outputs/expedition-team-demo/`. Use its deploy-only `release.mjs`, never the older
repository provisioning script (which changes settings/environment). Preserve
all-deployment Vercel Authentication and zero bypass grants. Do not deploy this
owner branch to learner production.
