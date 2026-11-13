# Fireside by John Willoughby — sandbox hub

## Scope and entry points

Sandbox branch only; Vercel project `prj_5EC6sfJe9DpGYW59L94iwppeMYUg`; Supabase ref `atemrshtshxoqnuevvqu`. Runtime mutations fail closed unless all three sandbox environment/ref/URL checks match. Production source branch/database and Camp Circles are unrelated.

- Visitor: `/fireside` and `/live`.
- Verified administrator: `/command-center/fireside` (narrow sandbox middleware exception; all other Command Center routes retain their existing private-owner redirect).
- API contract: `docs/fireside-api-contract.md`.
- QA scripts: `scripts/fireside-*.mjs`. Only run against guarded sandbox configuration. HTTP fixtures use real temporary verified accounts and are removed in finally blocks.

## Supported workflows

Published gathering list and month calendar; viewer-local IANA timezone; event detail and UTC ICS export; open broadcast, teaching/masterclass, active drop-in window, whole-series registration with session schedule, in-person and hybrid formats. Host manages drafts, publication, revisions, duplication, reusable draft templates, capacity and waitlists. Seat allocation/cancellation/promotion serialize on event locks; account request keys are immutable. One seat per account (no spouse/team quantity purchase); team/couple workshops use inquiries.

Workshop requests save a subject, audience/context, timing and message rather than booking appointments. Host reviews status and exports inquiry/attendee CSV. First-touch UTM fields and referrer hostname are bounded and stored on registrations/inquiries. No ad-network API operations.

Library supports podcast, teaching, sermon, video, audio and resources, type/topic/text filters and older archive. Public versus member access is checked server-side. Host may upload MP4/MP3/M4A/WAV/PDF into a private sandbox bucket; access endpoint signs a private object for two hours after authorization. External URLs retain external-provider permission requirements. Welcome slots reference actual published media; no fake recordings or feed distributions.

Existing lifetime personal access and canonical active personal membership authorize member library. Live registration never grants member replay; membership never grants a live seat. Protected joining URL requires confirmed registration and the 30-minute-before through event-end access window (host may inspect). Zoom OAuth/remote waiting-room management is not connected.

## Email and scheduling

Durable outbox intents cover confirmation, waitlist, promotion, cancellation, changes, event cancellation, 24-hour/1-hour reminders and post-event followup. Revision and registration-cycle dedupe keys protect retries. Day-before reminders run only in the 24-to-23-hour window, so late registrations or scheduler recovery do not receive a stale “tomorrow” message near event time. Rendered HTML/text previews are escaped and inspected in a script-disabled iframe. States are pending/previewed/cancelled, never falsely reported sent or delivered.

`runFiresidePreviewWorker` is invoked only in the sandbox branch of the existing authenticated `/api/cron/lifecycle` endpoint. Existing sandbox Supabase `dydd-sandbox-lifecycle` job already runs every five minutes. No new scheduler/configuration/production cron changes. Fireside worker never imports an email provider. Existing unrelated lifecycle behavior remains intact; do not manually trigger the combined worker merely for UI screenshots.

DYDD already has a Resend integration; Fireside transport remains intentionally preview-only. Real delivery requires separately authorized provider readiness work (exact recipient scope, suppression, acceptance/webhook reconciliation and controlled tests). Paid event mode is a disabled ticket placeholder: no checkout or falsely confirmed paid registration. Existing account billing is not changed.

## Release

Run typecheck/build, schema/transaction/concurrency/drop-in/storage tests and actual browser/HTTP flows. Commit only Fireside-owned files, leaving unrelated dirty Circle evidence/tmp/outputs intact. Push `sandbox`, then explicitly run `node scripts/deploy-sandbox.mjs`. Record exact SHA/project/READY alias and verify production deployment is unchanged with `scripts/fireside-release-proof.mjs`. Workspace handoff is `outputs/fireside-event-hub-2026-11-13/`.

Private playback links last two hours so long teaching/audio range requests can finish. Authorization is checked whenever a link is issued; issued signed bearer URLs remain valid until expiry. This is storage authorization, not DRM. The storage primitive regression separately tests a 120-second fixture link.

Small private uploads (up to 4 MiB) use authenticated same-origin `/api/fireside/upload` with a bounded multipart body, avoiding browser cross-origin restrictions. Larger files use direct host-signed Storage upload (up to bucket 500 MiB). Both remain unpublished until the host saves/publishes metadata. This runtime's external Chromium preflight was network-blocked although the same Storage OPTIONS response through the authorized API path returned CORS `*`; do not claim large direct browser transport was exercised here.

## Second UX refinement (2026-11-13)

Visitor uses the established DYDD paper/green/clay palette and Satoshi/Aptos/Segoe system font stack, with compact artwork, an editorial welcome, clearly selected sections, visible result/timezone context, current-month navigation, library filter recovery and an account/membership access action instead of a knowingly denied playback attempt. Keyboard focus containment includes reverse Tab from the dialog root; reduced motion and 44px controls remain supported.

Host is an operational desk: quick create/review actions, visibility + title/topic/description search, chronologically sorted gatherings, event-to-roster shortcut, name/email/account/status/event roster filters and CSV export of precisely the filtered view. Media search and collapsed reusable formats keep large collections manageable. Dates in gathering rows are actually formatted in the displayed event timezone. Series sessions use labeled title/start/end rows, not raw JSON; hidden serialization preserves the existing API contract and server validation. Modal background scrolling is locked.

No backend contracts, RLS/auth, schema, provider state, production or Camp Circles changes. Existing branding settings remain the product-brand boundary; this refinement deliberately does not introduce tenancy.

Focused regression scripts: `scripts/fireside-refinement-host-qa.mjs` (local process-only synthetic admin allowlist; never deploy it) and `scripts/fireside-refinement-visitor-qa.mjs` (real temporary sandbox account/event, registration persistence/cancellation/timezones/actual ICS). Both clean up fixtures. Evidence and user handoff: workspace `outputs/fireside-refinement-2026-11-13/`.
