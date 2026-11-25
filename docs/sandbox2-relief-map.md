# Sandbox2 realistic relief-map work surface

## Isolation and release

Only `dydd-online-school-sandbox-2.vercel.app`, project `prj_OIFpZrQcv3uqs14PEiBD1lVngXrH`, branch `sandbox2/immersive-forest-2026-11-24`. Read `docs/sandbox2-immersive-forest-2026-11-24.md`. Build with `npm run build -- --webpack`, typecheck with `npm run typecheck`, push the exact branch, deploy only with `node scripts/deploy-sandbox2.mjs`. Never alter production, original sandbox, owner projects, customer records or auth/config for map presentation work.

## Artwork contract

The interactive map directly uses the preserved original `public/brand/adventure/relief-landscape.webp`, native1672×941. Inspect it and the actual station image `public/brand/environments/ranger.webp` before changing artwork. The warm realistic-looking oblique relief, with detailed rock faces, layered forest, shadows, winding water, timber cabin, gateway and fire ring, is the approved foundation. It is generated environmental artwork, not a real-world photograph, satellite terrain or a realtime3D model. Original assets remain byte-exact.

The rejected procedural/cartographic4K replacement remains archived in the repository but is not requested/rendered by the work surface. Never substitute a generic terrain painting because it has a larger pixel count. Resolution is not realism. A derivative must preserve the original visual medium, recognizable terrain, light and objects. If source-faithful generation is unavailable, use the original directly and document native-detail/fullscreen limits rather than quietly repainting it.

`ArrivalReliefMap` keeps the original complete aspect ratio and bounded image-space plane. Both embedded and fullscreen use exactly the same source. At a4K display the source is necessarily enlarged; this does not add native image detail. Zoom/pan inspect the original texture rather than generating detail. Original image and baseline asset checksums are recorded with release evidence.

## Terrain alignment

`components/arrival-map-geography.ts` is the authoritative source-aligned coordinate plane. Ranger Station79%/44% is on the actual cabin; Field Kit78%/49% is on its visible porch workbench (not an invented second cabin). Fireside50%/77% is on the fire ring; Camp Circles58%/82% occupies the adjacent seating clearing. Trailheads21%/43% sits in the real gateway. Base Camp and Start Here remain orientation places along the foreground/approach clearings, without claiming new tents or buildings.

All13 original destinations, descriptions, bullets and real review-aware links/callbacks remain. DYDD is the longest route: gateway, wooded western mountain contours, high Waypoints ridge, descent through foothills, visible central crossing, then cabin. Spiritual Gifts follows a foothill loop; Fruitful Life360 follows the lower-valley cabin path; DesignPD follows the cabin/Field Kit porch to the fire clearing. DesignID follows the actual river's bends, from the distant valley down toward foreground pools, rather than the old procedural image's eastern channel. Routes are conceptual course orientation, not surveyed trail grades or navigable-river certification. Do not redraw the river across dry forest or route walking lines across water except the source's existing central crossing.

The source art stays intact. Thin warm guidance and restrained lights appear only on the selected trail; unselected routes do not obscure the realistic landscape. Fire selection adds subtle warmth. No flat procedural painting is layered over the original source.

## Interaction preservation

The map starts at the complete landscape, unselected. Both visible names and dots open a native accessible dialog; selecting never forces zoom. Escape/close restore the opener, Tab remains contained, and genuine CTAs retain review context. No below-map destination wall or duplicate dock is present at the relief stop. A compact Map guide offers44px destination alternatives, zoom/whole-park controls and the existing Passport callback.

Mouse drag, wheel, anchored two-touch pinch, one/two-finger pan, double-click, keyboard arrows/+/-/Home share1–3× bounded coordinates. Dot/name targets counter-scale. Native fullscreen is preferred; fallback locks scrolling, contains focus and restores the trigger. Orientation callbacks exit fullscreen. OS/in-app reduced motion disables travel transitions. Chromium touch emulation is not physical iOS/Safari testing.

The original six-stop arrival/camera flow, real Ranger Station, Learning Center and Journey curriculum remain unchanged. No dependencies, APIs, access rules, saved data, course content or other projects change.

## Acceptance

Evidence: workspace `outputs/dydd-realistic-relief-2026-11-25/`. Adapted native Chromium harnesses `qa-adventure.mjs` and `qa-detail.mjs` assert the original native dimensions/source hash rather than requiring a procedural4K asset. They verify all13popups/name/dot ownership at1440/390/320/landscape, drag/pinch/bounds, keyboard handoffs, reduced motion, native/fallback fullscreen, actual4K image render dimensions, genuine Passport and Journey handoffs, ten real destination links and anchors. Every browser aborts non-GET/HEAD/OPTIONS before sending. Existing5authored/access/reflection fixture checks remain authoritative.

Run isolation.mjs before/after release to compare all4protected projects, original aliases and original sandbox env metadata. Compare every public asset hash, destination inventory and tracked change scope. Hosted QA must target the stable alias and tested SHA. Inspect source-vs-final screenshots visually, including actual fullscreen, and report limits without claiming new source detail.
