# Historical implementation — superseded arrival

The current Sandbox2 arrival removes Dydi and makes new relief artwork interactive. See [sandbox2-relief-map.md](sandbox2-relief-map.md). The notes below describe the prior77090b6 benchmark, not the current arrival UI.

# Sandbox2 Dydi arrival prototype

Target is exclusively `dydd-online-school-sandbox-2.vercel.app`, project `prj_OIFpZrQcv3uqs14PEiBD1lVngXrH`, branch `sandbox2/immersive-forest-2026-11-24`. Use only `scripts/deploy-sandbox2.mjs`; never the original sandbox deploy script.

## Presentation boundary

`DydiAdventure` replaces only the Base Camp visual arrival inside `ForestNavigation`. Original account, Passport, dock and all course routes remain mounted through their existing owners. Six stops connect Camp, forest trail, ranger desk, relief table, labeled Learning Center doorway and classroom. Real map and desk components are reused. The last link opens the existing `/journey` route through `ReviewAwareLink`, preserving review parameters and existing access guards.

No arrival actions award badges, create progress, write accounts or call save APIs. Passport explanation opens the real connected Passport. Focused-trail/ready-to-begin choices change the presentation route, not lesson access.

`JourneyCourseNavigator` keeps the existing article and save/flush/completion logic. Only the outer curriculum wrapper is changed: sticky left desktop menu, mobile disclosure with the same original module/section/lesson tree. Its styles are locally scoped. Cabin backdrop/wider main Journey canvas uses `:has(.dydd-journey-class)` to leave other courses unchanged.

## Animation/media

`DydiCharacter` is a twelve-layer articulated 2.5D cutout made from the existing adult illustrated explorer. Thigh, knee, boot, arm, head and small mouth transforms are independently animated. Position/perspective travel uses explicit Web Animations transform endpoints (not unregistered-variable CSS transitions), and scene camera choreography belongs to `DydiAdventure`; a source-coordinate alpha matte puts Dydi behind the physical relief and classroom reading tables as she crosses the rooms, matching the actual room image scale/crop on desktop and mobile with one shared lighting stack; only active travel animates position so resizing does not strand the character offscreen. A `ResizeObserver` provides actual stage dimensions. Reduced motion arrives immediately; the motion control can end active travel, and Arrive now skips a cinematic segment.

This is **not** a newly illustrated multi-angle walk-cycle or 3D/video character. The original book/pocket pose constrains gestures; arm-led pointing is not an extended index finger. Mouth/head movement is expressive, not phoneme lip-sync. No claim of full character animation should hide these limits.

Rebuild layers with `python3 scripts/build-dydi-rig.py`; rebuild the physical table mask with `python3 scripts/build-room-table-masks.py`. Narration generator `scripts/generate-dydi-adventure-audio.mjs` uses the existing Dydi ElevenLabs voice/settings, reads the approved local credential without output, and skips existing clips unless forced. Seven clips have exact transcript receipts and genuine `normalized_alignment` WebVTT sentence cues. Voice is off by default and user-enabled; captions are initially on. Audio load/play failure leaves captions and retry available.

## Verification/release

Evidence and safe Chromium drivers are in workspace `outputs/dydd-dydi-adventure-2026-11-24`. All non-GET/HEAD/OPTIONS browser requests must be intercepted during QA: never exercise real progress/payment/support/email writes. Existing authored/source/access tests remain authoritative. Verify exact hosted commit, stable alias and protected-project/env snapshots after release.

This environment's linked dependencies break Next dev's filesystem boundary/middleware transforms. Use `npm run build -- --webpack` then `npm run start -- --port 3151` for faithful local QA; do not change the shared dependency installation or other projects. Native Node fetch to localhost may fail with `UND_ERR_SOCKET`; use curl status-only for readiness and real Chromium for UI. Never print redirect headers because review keys can occur there.
