<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Journey forward authoring rule (sandbox, 2026-10-23)

Do not render the “A connected trail” / “Open Connected Trail” callout in
**Connecting Identity & Expertise** (`expertise-connecting-identity-and-expertise-32`,
source row 31 / stable app row 32), or in any later unit in course-map order.
This includes later modules and future appended lessons. Keep previously approved
lessons before that boundary unchanged; do not remove their assessment access.
The navigator gates the shared callout by the stable boundary slug, not titles or
spreadsheet row arithmetic. New lesson authors must not add equivalent callouts
inside lesson bodies. Assessment access remains available through Trailheads.

Use the existing exact DesignID reflection colors for matrix rows/cards:
Architect `#D4A451`, Artisan `#647C9B`, Shepherd `#739D5E`, Steward `#5A496B`.
Use soft tints plus dark readable text, with reflection names visible (not color-only).
Personalized primary/secondary labels must come from the authenticated learner’s
saved DesignID assessment; never hardcode the owner-preview example. Preserve
lesson text, matrix cells, and stable response keys unless explicitly authorized.
See `docs/journey-identity-expertise-followup-2026-10-23.md` for release evidence.
