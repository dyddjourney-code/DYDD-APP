# Expedition hero cleanup (sandbox only)

The Expedition header now uses one unchanged original 2073×758 illustration,
full panel width at its natural aspect ratio. Removed the duplicate background
image, green tint, inset image treatment, and group-access caption/data box.
The existing Expedition title and premium team/leadership subtitle sit in a
solid green strip immediately below the image. No Design Map changes, new MAPS
assets, database edits, or production deployment.

Checks: `npm run build`, `npm run typecheck`, GET-only Chromium rendering at
1280, 390, and 320 pixels. Verified one image, natural ratio, full panel width,
no filter/opacity/tint/background duplicate, strip below image, no horizontal
overflow or JS errors; downloaded original image SHA-256 matches repository.
Screenshots and measurements: `tmp/expedition-hero/`.

Existing routing boundary: sandbox `/command-center/*` redirects to the
Vercel-protected private owner console (see navigation/session documentation).
This change deliberately preserves that routing. Local visual verification
uses only a process-local environment override to render the existing preview
page; it does not modify any deployed environment or authentication settings.
Therefore the deployed sandbox contains the cleaned header and original asset,
but its public Expedition entry continues forwarding to the owner console.
The owner console is a separate deployment and is not changed by this release.
