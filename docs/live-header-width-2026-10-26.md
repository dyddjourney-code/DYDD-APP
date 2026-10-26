# Live Fireside shared header width — October 26, 2026

Sandbox-only follow-up to `1173027402f71cbb2f71109fe190c0da93c6cb3e`.
Applied design-taste-frontend and source-faithful-course-lessons (including mobile-layout-review); read Next16 CSS guide.

## Cause and correction

Unlike Fireside and Camp Circles, Live's image AND companion-copy panel were
inside the padded `.fireside-live-section` event card. This introduced a second
border/padding inset: 70px narrower on desktop, 42px on 390/320px phones, and
62.75px on 844px landscape. The image itself was already uncropped.

Promote the complete Live header (image plus its unchanged two lines below) to a
direct child of the same `.journey-shell.hq-standalone-page` used by the other
tabs. Preserve the event card's existing padding and all contents, use the shared
18px header-to-content spacing, and explicitly remove the heading paragraph's
inherited prose-width cap. The original image bytes/path, native aspect ratio,
no-overlay behavior, copy, and newest ivory/green navigation remain unchanged.
No curriculum/source/auth/scoring/DB/customer writes or persistence changes.

## Verification and release

`tests/live-header-width.mjs` compares actual x/width of Live, Fireside, and Camp
Circles headers at 1920,1280,768,390,320,844x390,932x430. It compares the Live and
Circles companion-copy containers, checks real paragraph widths/max-width,
original natural image aspect, below-image placement, no overlay/overflow/errors,
and preserved 13-link mobile menu. Desktop measurement waits for the hydrated
sidebar shell, preventing a transient streamed first-column layout from being
misclassified as final geometry. Browser API mutations/prefetch are blocked.

Run build/typecheck, environment-isolation, reflection-catalog, reflection-export,
and git diff --check. Publish via `node scripts/deploy-sandbox.mjs` to the separate
sandbox project only; verify exact Git+expectedSHA/project/READY/stable alias and
unchanged production alias/master after published browser QA.

Evidence: workspace `outputs/live-header-width-2026-10-26/`, including before/local/
published seven-viewport geometry JSON, screenshots, build and release receipt.
Physical iPhone/Safari untested; Chromium touch/viewport emulation verified.
