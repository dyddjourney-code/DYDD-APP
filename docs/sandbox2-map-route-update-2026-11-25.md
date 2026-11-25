# Sandbox2 camp relief routes — 2026-11-25

## Scope and identity

This is a presentation-only change in the existing isolated Sandbox2 worktree/branch. The only authorized deployment is project `prj_OIFpZrQcv3uqs14PEiBD1lVngXrH`, alias https://dydd-online-school-sandbox-2.vercel.app. Use the guarded `node scripts/deploy-sandbox2.mjs`, not other release scripts. No database, access, account, scoring, integration, course content or other project mutation belongs to this release.

## Source-faithful artwork

`realistic-ranger-camp-update.webp` is a native1672×941 **lossless localized composite** of the already approved `realistic-ranger-tabletop.webp`. Three small feathered masks add only a coherent separate miniature Field Kit outbuilding and a smaller fire/benches/path clearing to the right of Ranger Station, and a nearby physical three-way trail junction at29.1%/33.3%. Terrain, river, bridge, station, mountains and original Camp Circles clearing outside those masks are pixel-identical to the decoded approved source. Original public assets are never overwritten. Artwork is generated photographic-style physical-relief imagery, not photography or realtime3D; fullscreen enlarges native detail.

Landmark/route coordinates are authoritative in `components/arrival-map-geography.ts`, in full uncropped image-space. The station dot is on its actual roof; Base Camp is at its steps, Field Kit is on the separate outbuilding, Fireside is on the new flame, Camp Circles uses the original larger clearing, Trailheads is beside the visible bridge, and Start Here is on the lower-right approach path. Waypoints moves to the western trail fork; its small static ground spur makes the three-way junction legible.

## Course routes and animation

The exact original palette is recovered from historical `.relief-route-*` rules in `app/globals.css`: Journey green `#4fb36b`, Spiritual Gifts blue `#3d9de8`, Fruitful Life360 red `#d94f34`, DesignPD orange `#e88924`, DesignID purple `#8a67db`. Muted paths remain faint at rest; only the selected course receives a restrained dark bed, clear color and slow24-second moving highlights /8-second opacity breath. The route selection does not move the map camera.

Journey leaves the station, crosses the bridge and climbs the visible western switchbacks toward the upper lookout; its return uses the same trail. Gifts takes the shorter first left-hand ridge from Waypoints. Fruitful Life360 loops around the new station-side Fireside clearing and never crosses the river. DesignPD follows the hut/lower-valley approach to Camp Circles. DesignID is a distinct **water** adventure traced independently against the actual channel; no hiking geometry is reused for it. River flow consists of short faint glints registered only to clear water, not a filter or opacity animation on the whole image. Device and existing in-app reduced motion disable all map animation.

## Preservation and verification

All13original destinations, authored descriptions, URLs/callbacks remain intact; `arrival-map-places.ts` is byte-identical. Existing scenes, learning book, review-aware links, Passport, desktop/touch image-space transform, native dialog/focus, Map guide and native/fallback fullscreen remain.

Evidence root: `outputs/dydd-map-route-update-2026-11-25/`. Baseline asset/destination/protected-project receipts precede changes. Native Chromium acceptance aborts every non-GET/HEAD/OPTIONS request before sending; no customer progress writes are part of QA. Validate names/dots across desktop,320/390phones and landscape, gestures, bounds, reduced motion, dialogs, fullscreen, real course/destination content, access denials and exact hosted SHA+alias. Emulated Chromium touch is not physicalSafari certification.
