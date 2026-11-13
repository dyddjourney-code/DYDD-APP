# Fireside sandbox API contract
All responses JSON, private/no-store. Sandbox only. No sends/payments/Zoom calls. Cookie-auth verified accounts. Mutations same-origin. Host = existing isDyddAdminEmail allowlist.

- GET /api/fireside: `{events,registrations,media,settings,actor:{signedIn,isHost,isMember},sandbox:true}`. Events public published/cancelled; own registrations only. No private URLs in lists. Media metadata only. Anonymous supported.
- POST /api/fireside/register `{eventId,action:'register'|'cancel',idempotencyKey}` -> `{registration}`. Auth required. Capacity serializes transactionally; waitlist FIFO; cancel promotes oldest. Key 8–120 chars, one immutable request per key.
- GET /api/fireside/media?id=UUID -> `{url,kind}` protected replay URL (member/host only), or live link (confirmed ticket holder/host only, access 30 minutes before until event end). No URL returned to unauthorized accounts. Member replay access never grants live ticket.
- POST /api/fireside/inquiries `{subject,message}` -> `{inquiry}` auth required.
- GET /api/fireside/host -> `{events,registrations,inquiries,media,outbox,settings}` host only.
- POST /api/fireside/host `{action:'saveEvent',event:{id?,title,description,starts_at,ends_at,timezone,capacity,waitlist_enabled,status:'draft'|'published'|'cancelled',live_url?,revision?}}` -> `{event}`. Revision required on updates; cancellation marks registrations cancelled and stops reminder intents. Reschedules cancel prior reminder revisions.
- POST /api/fireside/host `{action:'saveMedia',media:{id?,event_id?,title,description,kind:'replay'|'resource',url,published}}` -> `{media}`.
- POST /api/fireside/host `{action:'settings',settings:{title,introduction,inquiries_enabled}}` -> `{settings}`.
- POST /api/fireside/host `{action:'inquiryStatus',id,status:'open'|'reviewed'|'closed'}` -> `{inquiry}`.
- POST /api/fireside/host `{action:'previewReminders'}` -> `{outbox}` queues due 24h/1h reminder previews, never sends. Stable event+revision+recipient+reminder keys, cancelled registrations rechecked. Preview statuses pending/previewed/cancelled. Host GET includes previews; no provider integration.

Event public fields: id,title,description,starts_at,ends_at,timezone,capacity,waitlist_enabled,status,revision,created_at,updated_at,confirmed_count,waitlist_count. Registration: id,event_id,user_id,status confirmed|waitlisted|cancelled,created_at,updated_at. Host additionally sees live_url and private media URLs; clients must not expose these to ordinary listing views.
Errors `{error}` with 400 validation,401 auth,403 access,404 missing,409 capacity/state/revision/idempotency conflict,503 unavailable. UUID fields canonical UUID. Date times ISO UTC; timezone IANA. Live URLs HTTPS only. Media URLs HTTPS or storage://fireside-sandbox-private/path. No public RSVP for unverified accounts. No guest contact details collected.

## Extended fields (implemented)
Events also include `format` broadcast|masterclass|drop_in|series|in_person|hybrid, `topic`, `location`, `ticket_mode` free|paid_disabled, `sessions` JSON array (max 50, persisted display metadata; ticket covers whole event, not separate capacity). saveEvent accepts these; omitted fields default broadcast/empty/free/[]. paid_disabled registration always rejects (no checkout/payment).
Media also include `media_type` podcast|teaching|sermon|video|audio|resource, `topic`, `archived`, `access` public|member. saveMedia accepts these; defaults video/empty/false/member. Public published resources may be opened anonymously; members-only replay authorization still server checked. GET hub returns published archived metadata; archived means older library content, not withdrawn access. Unpublished content remains host-only. New live URL route: GET `/api/fireside/media?eventId=UUID`; `id=UUID` is library media only (legacy event UUID fallback remains compatible).
Settings include optional `welcome_slots:[{title,description,media_id:null|UUID}]` up to six; protected playback still uses media route. Inquiries may encode individual/couple/team audience in subject; no multi-seat registration support.

## Hardened backend additions
- Membership authorization uses `getPersonalMembershipState`: active/lifetime only, including revoked-order and paid-through checks.
- Session objects require nonempty `title`, valid `starts_at`, `ends_at` with end after start.
- Host GET roster includes safe bounded `email` and `display_name` from verified Auth admin lookup (500 registrations maximum, `rosterLimit:500`). Contact metadata never authorizes access.
- Host POST `{action:'cancelRegistration',userId,eventId,idempotencyKey}` cancels an attendee through the same locked/idempotent registration transaction.
- Host POST `{action:'createUpload',filename,contentType}` returns `{upload:{signedUrl,token,path,bucket,storageUrl,contentType},previewOnly:true}`. Allowed types MP4/MP3/M4A/WAV/PDF, bucket max 500MiB. Upload with Supabase uploadToSignedUrl(path,token,file), then saveMedia url=storageUrl. Private sandbox bucket has no browser read policies. Upload tokens are host-authorized bearer grants; no file is created merely by requesting a token.
- Authorized private playback returns `{url,kind,protection:'private_storage',expiresIn:7200}`. URL is a short-lived signed bearer link; the underlying object has no public access. External HTTPS playback returns `protection:'external_provider'` and an honest provider-permissions notice; it is not DRM.
- Transactional durable intents now include confirmation/waitlist/promotion/cancellation/event_changed/event_cancelled; scheduler adds idempotent followup and due reminders. All are preview-only, never sent. Host outbox rows include escaped-renderer `{subject,html,text,previewOnly}`; render HTML inside sandboxed iframe.

## Final attribution and drop-in semantics
Optional `source` on registration/inquiry stores bounded first-touch utm_source/medium/campaign/content/term and referrer hostname. One seat per account. Drop-in registration and cancellation promotion remain open through ends_at; other formats close registration at starts_at. Host edits preserve omitted existing event/media metadata.
