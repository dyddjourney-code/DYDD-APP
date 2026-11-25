# Sandbox2 realistic relief-map work surface

## Isolation and release

Only `dydd-online-school-sandbox-2.vercel.app`, project `prj_OIFpZrQcv3uqs14PEiBD1lVngXrH`, branch `sandbox2/immersive-forest-2026-11-24`. Read `docs/sandbox2-immersive-forest-2026-11-24.md`. Build with `npm run build -- --webpack`, typecheck with `npm run typecheck`, push the exact branch, deploy only with `node scripts/deploy-sandbox2.mjs`. Never alter production, original sandbox, owner projects, customer records or auth/config for map presentation work.

## Artwork contract

The interactive map uses `public/brand/adventure/realistic-ranger-tabletop.webp`, a source-faithful generated close-up of the actual raised relief model visible in the original station image `public/brand/environments/ranger.webp`. Inspect the original station, original standalone `relief-landscape.webp`, and final derivative side by side before changing artwork. All original public assets remain byte-exact. The rejected procedural/cartographic4K replacement remains archived but is not requested/rendered.

The derivative is an OpenAI gpt-image-2 image edit referenced directly to the actual station image. It preserves physical timber-table context, raised rugged mountain ridges, miniature forest/valleys, warm oblique light and a winding river, while expanding tiny landmarks and visible switchbacks for exploration. The wood base edge, modeled tree crowns, rock facets and terrain cast shadows are part of the image—not a flat procedural overlay. It is a generated reconstruction/expansion, not a literal photographic crop or an exact surveyed reproduction of every tiny source landform. Generated detail is not evidence of real-world photography or a realtime3D engine.

The source edit requested3840×2160/4K; the provider ignored the resolution override and returned1672×941. This is the actual native resolution. Both embedded and fullscreen use the same full image, uncropped. At a4K display the source is enlarged; this adds no native image detail. Do not substitute a larger generic terrain image or claim resolution proves realism. If the image plugin fails, inspect the local `openclaw capability image edit` provider route; a closed fal transport did not mean OpenAI image editing was unavailable.

## Terrain alignment

`components/arrival-map-geography.ts` is the authoritative image-space plane. Ranger Station83%/44% is on the actual tiny cabin; Field Kit79%/49% is on its porch region. Fireside52%/79% is on the actual fire ring; Camp Circles59%/81% occupies its neighboring gathering clearing. Trailheads17%/49% sits in the timber gateway. Start Here and Base Camp remain orientation locations on approach/foreground clearings, not claims of new painted buildings.

All13 original destinations, authored descriptions/bullets and real review-aware links/callbacks remain. DYDD is the longest walking route: gateway, western switchbacks, high lookout, foothill descent and visible timber footbridge to the cabin. Spiritual Gifts follows a woodland foothill loop. Fruitful Life360 and DesignPD follow the lower valley and cabin-side trail to the gathering clearing; DesignPD includes the Field Kit porch. DesignID follows the actual central turquoise river bends toward the front-left edge. These are conceptual course-orientation routes, not surveyed trail grades or river-navigation certification. Western switchbacks and valley/bridge paths are now visible in the source derivative; some loop links remain conceptual woodland paths. Do not route hiking across water except the visible central bridge, or redraw the river across dry forest.

Thin warm guidance and restrained lights appear only on the selected route. Fire selection adds subtle warmth to the actual fire circle. Names/dots remain on the same transform as the image; no procedural terrain paint replaces the source.

## Interaction preservation

The map starts at the complete landscape, unselected. Both visible names and dots open a native accessible dialog; selecting never forces zoom. Escape/close restore the opener, Tab remains contained, and genuine CTAs retain review context. No below-map destination wall or duplicate dock is present at the relief stop. A compact Map guide offers44px destination alternatives, zoom/whole-park controls and the existing Passport callback.

Mouse drag, wheel, anchored two-touch pinch, one/two-finger pan, double-click, keyboard arrows/+/-/Home share1–3× bounded coordinates. Dot/name targets counter-scale. Native fullscreen is preferred; fallback locks scrolling, contains focus and restores the trigger. Orientation callbacks exit fullscreen. OS/in-app reduced motion disables travel transitions. Chromium touch emulation is not physical iOS/Safari testing.

The original six-stop arrival/camera flow, real Ranger Station, Learning Center and Journey curriculum remain unchanged. No dependencies, APIs, access rules, saved data, course content or other projects change.

## Acceptance

Evidence: workspace `outputs/dydd-realistic-relief-2026-11-25/`. Adapted native Chromium harnesses `qa-adventure.mjs` and `qa-detail.mjs` assert the actual derivative native dimensions/source hash rather than requiring a procedural4K asset. They verify all13popups/name/dot ownership at1440/390/320/landscape, drag/pinch/bounds, keyboard handoffs, reduced motion, native/fallback fullscreen, actual4K image render dimensions, genuine Passport and Journey handoffs, ten real destination links and anchors. Every browser aborts non-GET/HEAD/OPTIONS before sending. Existing5authored/access/reflection fixture checks remain authoritative.

Run isolation.mjs before/after release to compare all4protected projects, original aliases and original sandbox env metadata. Compare every public asset hash, destination inventory and tracked change scope. Hosted QA must target the stable alias and tested SHA. Inspect source-vs-final screenshots visually, including actual fullscreen, and report limits without claiming new source detail.
