# Sandbox2 continuous travel and visible natural motion

Sandbox2 ONLY; deploy with `scripts/deploy-sandbox2.mjs`, exact project
`prj_OIFpZrQcv3uqs14PEiBD1lVngXrH`, branch
`sandbox2/immersive-forest-2026-11-24`. Other projects/aliases are protected.

## Root cause and change

The prior source plane zoomed for780ms, then its React key changed. The incoming
art appeared at its resting transform immediately: genuine scene changes lacked
an arrival camera movement. Retain the actual departure crop as a decorative,
inert440ms dissolving overlay, while the new live source plane really zooms from
118% to its resting crop over620ms. Together with the existing780ms departure,
travel is roughly1.4s plus paint scheduling. This is source-art camera motion,
not3D travel; the brief overlap joins different approved illustrations, it does
not replace geometric zoom. Same-source Ranger Desk trips retain the native
camera transition; map arrival/departure also move. No artwork/layout changes.

Rapid route/book commands during arrival coalesce to the latest requested action,
which begins after the current visible handoff completes. Explicit Skip movement
commits the final scene with no arrival animation. Reduced-motion changes cancel
native camera/lamp animations and pending travel, then resolve the latest request.
Source clones omit UI/headings/IDs, are inert, pointer-free, and removed on finish,
new departure or unmount. Lamp lifecycle explicitly excludes transient clones.

The earlier waterfall copied the source at18–30%opacity and drifted just1.1px
across5.6s: this barely disturbed the identical foundation, especially at normal
size. Two phase-offset copies of the SAME45×76source water patch now descend6.2px
per2.6s under the unchanged source mask. Each wrap is fully transparent; the
other phase carries the flow, avoiding a visible upward reset. No stripes,
new water texture or terrain motion. Static original foundation is unchanged.

The earlier lamps wandered only61–69%opacity, making ongoing changes hard to see.
Independent source-aligned halo segments now range38–88%, with tiny source glass
brightness84–116%, each1.7–4s easing gently to fresh random targets forever.
No flame deformation, synchronized pulse or initial-only animation. Travel/book
suspension, real map-return remount, media changes and cleanup are preserved.

## Verification and repeat procedure

Build optimized Webpack, typecheck, and only the six source/mock fixtures:
`designpd-course-access`, `environment-isolation`, `journey-authored-content`,
`reflection-current-activities`, `sandbox-review-auth-boundary`,
`sandbox2-book-metadata` (all `tests/*.cjs`). Do NOT run integration fixtures.

Actual Chromium read-only harness and receipts:
`outputs/dydd-zoom-waterfall-lights-2026-11-26/` in the agent workspace.
Wait for BOTH the destination state AND absence of `[data-travel-ghost]` before
assuming arrival is visually settled; state switches at the handoff midpoint.
Capture sustained actual normal-size desktop/phone frames, source-region pixel
deltas (not only computed styles), real click/touch transitions, skip, interruption,
map-return lamps and reduced-motion cancellation/restart. Existing map trails,
source-only river foam, courses/book and thirteen destinations stay unchanged.
Block all nonGET/HEAD/OPTIONS during hosted QA. Verify exact READY SHA+alias and
all four protected projects/aliases/env metadata. Phone touch is Chromium
emulation, not physical Safari certification. GIF sampling is not native video.
