# Owner DesignID access

Owner/Jordan token previews are not authenticated Supabase sessions. DesignID correctly requires a real session; its current assessment and save action have no purchase gate or retake limit. Existing owner account: john@discoverdivine.design. No user created, role changed, price changed, or assessment submitted for this fix.

Added /auth/confirm to exchange a one-time Supabase email token for cookie-backed authentication, with same-origin-only return destinations, no-store and no-referrer success headers. Invalid, expired and reused tokens return to ordinary login. No privileged role is inferred from the link. Links generated with the stored app service credential are delivered only privately; no token stored in tracked files.

Field Kit now labels DesignID Start DesignID / Take DesignID again and Owner access for existing server-recognized admins. Other product labels and pricing unchanged. Repeated submissions remain ordinary saved assessment results under John's real account, not isolated sandbox data.

Verification: production build, TypeScript, MAPS regression passed. Local HTTP flow verified unauthenticated redirect, invalid token and external redirect handling, real owner sign-in, DesignID HTTP 200 twice, identity displayed, Field Kit owner start/retake link and one-time token reuse rejection. No assessment/email/PDF created by verification.
