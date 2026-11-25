# Sandbox2 camera-led arrival and interactive relief landscape

Sandbox2 only: `dydd-online-school-sandbox-2.vercel.app`, project `prj_OIFpZrQcv3uqs14PEiBD1lVngXrH`, branch `sandbox2/immersive-forest-2026-11-24`. Deploy exclusively with `node scripts/deploy-sandbox2.mjs` after pushing the exact commit. Production, original sandbox and owner projects are outside scope.

## Arrival boundary

The existing arrival component retains six environmental/camera stops: Base Camp, forest trail, Ranger desk, relief map, Learning Center doorway, classroom. Its historical internal filename/export is retained to avoid changing the ForestNavigation boundary. It no longer imports/renders the Dydi rig, plays arrival narration, exposes voice/CC controls, or presents Dydi as its host. The ranger FAQ accepts `unhosted` only here; all other consumers retain their original default character, questions and answers. Companion lessons/audio/portraits elsewhere are unchanged.

After the desk camera approaches the physical relief table, the new source-referenced illustrated landscape opens as the interactive work surface itself, not a modal containing the old ecosystem map. `ArrivalReliefMap` keeps full uncropped art and three buttons on one 1672×941 coordinate plane. Each button has a minimum 44px target, visible focus/pressed state, live selection description, and real review-aware destination link. The generated art has no embedded text/characters; labels are accessible HTML. The final WebP is `public/brand/adventure/relief-landscape.webp`.

The three selected places are **existing ecosystem destinations**, not newly invented course names: Trailheads (branching path gateway,21%/45%), Field Kit (archive cabin,79%/45%), Fireside (campfire clearing,50%/77%). These were chosen from the current ecosystem map/navigation and drawn into the new relief image. Their routes remain `/trailheads`, `/field-kit`, `/fireside`. Future destination-specific motion series are intentionally not implemented; destination links open today's real pages. The existing Learning Center/classroom sequence and genuine Journey handoff remain available.

Account/Passport callbacks, dock/navigation, access guards, saved work, completion policy and the restored desktop/mobile Journey curriculum are untouched. Arrival/map actions do not award milestones or write progress.

## Motion and keyboard

4.2s environmental camera moves retain pause and Arrive now. OS reduced motion settles immediately, including a pending segment if changed during travel. In-app motion off also removes map entrance/hover transforms. New-stop headings receive focus after the committed stop render (including dynamic OS-motion changes), native dialogs restore their opener on Escape, and the map is inert while leaving. A scoped active-state rule preserves the percentage anchor during pointer-down; otherwise the shared forest button active transform would move the target before click. Map hotspots are normal Tab/Enter/Space buttons; the selected destination link follows them in DOM order. The instruction is outside the image, so it never overlaps phone labels. The full image is scaled uniformly at every viewport, never cropped with object-cover.

## Verification

`npm run build -- --webpack`, `npm run typecheck`, and the five existing source/access/reflection fixtures remain authoritative. Read-only browser driver, screenshots, isolation snapshots and exact hosted receipt are in workspace `outputs/dydd-relief-map-2026-11-24/`. All browser non-GET/HEAD/OPTIONS requests are aborted, including preview position bookkeeping; no customer writes are performed. Chromium phone viewport emulation is not physical Safari testing. Build locally, run `npm run start -- --port 3152`, then execute the output directory's `qa-relief.mjs` from the repo; hosted set `QA_BASE` and `QA_PREFIX=hosted`.

## November 25: pannable whole-park table

`ArrivalReliefMap` now exposes the complete old map inventory on the existing full landscape. `arrival-map-places.ts` preserves the twelve original destinations' descriptions, bullets and actual routes from `ranger-relief-map.tsx` (the obsolete Dydi guidance bullet is unhosted). Field Kit, already present in the current relief, remains the thirteenth place. The older component is untouched for other consumers.

| Original map item | New table / actual handoff |
| --- | --- |
| Start Here | Orientation detail; camera return to Base Camp |
| Base Camp | Personal starting-place detail; camera return to Base Camp |
| Ranger Station | Orientation detail; camera returns to the actual ranger desk |
| Trailheads | Gateway marker; `/trailheads` |
| Fireside | Existing painted fireside marker; `/fireside` |
| Camp Circles | Shared-journey marker; `/camp-circle` |
| Waypoints | Upper-landscape marker; `/waypoints` |
| DYDD Journey | Main trail overlay and marker; `/journey` |
| Spiritual Gifts | Trail overlay and marker; `/trailheads#spiritual-gifts` |
| Fruitful Life 360 | Trail overlay and marker; `/trailheads#fruitlife-360` |
| DesignPD | Trail overlay and marker; `/trailheads#designpd` |
| DesignID Trail | Trail overlay and marker; `/trailheads#designid` |
| Field Kit (current map) | Existing painted archive cabin marker; `/field-kit` |

Five dashed trail overlays replace the old map's five route lines/dot sequences; selecting a trail highlights its route. They are conceptual orientation lines mapped to this artwork, not measured geography or new trails/course content. The native destination index replaces the old trail-only legend and makes all thirteen entries available without needing to hit small map labels. The old panel's authored descriptions/bullets and real CTAs are retained; the old concept-image panel and fullscreen dialog are replaced by the actual pan/zoom work surface. The original fire/smoke/glow/fireside-seat embellishments were decorative, not additional destinations; existing painted fire/seating/building lighting retain the natural scene without restoring artificial loops or a teacher/character.

The original 1672×941 WebP is byte-exact, with no crop, regeneration or image replacement. Map, markers and routes share one coordinate plane. A stationary wood-toned frame/engraved edge, subtle inset shadow and compass establish the ranger-table viewpoint. The map starts at its whole-image overview; selecting any destination smoothly moves to a restrained 1.7× detail. Zoom buttons range from 1–3×, Overview restores 1×/zero translation. Drag supports mouse and one-finger touch; two-touch pinch anchors zoom around the touch midpoint. Pan is clamped to the scaled image bounds. Arrow keys pan, +/− zoom and Home resets when the map surface is focused. Visible controls/index offer alternatives to all gestures; marker hit targets counter-scale with the image. Mobile overview uses numbered pins and an always-readable index to avoid a label pile-up. Map touches never hijack page scrolling outside the image surface.

Only transform animates, with brief eased transitions for button/location moves and immediate direct manipulation during dragging. OS and in-app reduced-motion settings remove map travel transitions, while retaining useful controls. The six-stop arrival, Learning Center and original desktop/mobile Journey curriculum remain. No dependencies, APIs, access rules, progress keys, customer data or other projects changed.

Native read-only acceptance: workspace `outputs/dydd-relief-map-pan-2026-11-25/qa-pan.mjs`, run from this repository. It blocks every non-GET/HEAD/OPTIONS request before sending. Browser evidence includes overview/detail at desktop, phone, narrow phone and landscape; native mouse/touch/pinch, min/max zoom and clamped edges; all thirteen selections; ten actual external-page/trail-anchor handoffs; real camp/ranger camera returns; reduced motion; and genuine Journey lesson switch/focus. Chromium emulation is not physical-device Safari certification.

Gesture suppression distinguishes pointer clicks from keyboard activation: after a touch drag, Enter/Space still select a focused place even when the browser emitted no synthetic click. Final native acceptance explicitly checks the touch-drag → keyboard handoff.

## November 25: terrain adventure revision

The new whole-park view is a **native 4096×2730 overhead cartographic relief**, replacing the previous oblique landscape for this map only. The original landscape and every existing public asset remain untouched. The image-generation provider was unavailable; `scripts/render-sandbox2-terrain.py` authors new physical hillshade, individual forest crowns, mineral ridges, meadow clearings, river, paths, cabin and destination objects directly at full resolution. This is stylized deterministic terrain illustration, not photographic satellite data, AI regeneration, a 3D engine, or an enlargement claimed to create new detail. Render-only Python dependencies are in `scripts/requirements-sandbox2-terrain.txt`; no application dependency was added.

The renderer's exact sampled walking/river geometry is embedded in `arrival-map-geography.ts`. The DYDD route begins at the trailhead gate, climbs woodland/alpine switchbacks, reaches the ridge lookout, descends the eastern forest and ends at the sole Ranger Station cabin. Its image-space route is more than twice the length of any other walking trail. Spiritual Gifts follows the upland meadow loop; Fruitful Life 360 connects the lower valley, Base Camp tents and fire circle; DesignPD connects the ranger cabin, outdoor Field Kit table and Camp Circles gathering. DesignID follows the open river channel as a river-passage metaphor, with a small boat visible on selection. The landing is on the cabin-side bank; hiking trails do not cross the water. These are fictional park orientation routes, not surveyed hiking/navigation instructions or changed course content.

Ranger Station's dot is on the actual cabin roof (70%/65%); Fireside is on the actual fire ring (51%/77%). Base Camp, Camp Circles, Field Kit and Waypoints have corresponding tents, log gathering circle, reading/work table and lookout. All thirteen original destinations, authored descriptions/bullets and genuine review-aware links remain. Dot anchors counter-scale without drifting from their landmarks. Visible names and dots own their actual pointer targets, so transparent bounding boxes cannot steal nearby touches on narrow phones; the Map guide supplies full 44px alternative destination targets. Selected routes gain restrained warm guidance lights; the default terrain paths remain painted naturally in the image.

There is no below-map information panel, destination-button wall, caption block or duplicate next-step button at this stop. The redundant six-button Camp dock is hidden only while the relief map is shown; all destinations remain on the map, and Map guide opens the genuine existing Passport callback. Other stops/routes retain their original dock. Each name/dot opens a native accessible detail dialog, with focus containment, Escape/close and opener restoration. The existing top route navigation still reaches Base Camp, Ranger Station and Learning Center/classroom. A discreet Map guide disclosure contains accessible destination alternatives and zoom/whole-park controls; fullscreen is the only always-visible map icon. The map starts unselected at the complete overhead image. Selection does not force a camera jump.

Desktop wheel, anchored two-touch pinch, one/two-finger and mouse panning, keyboard arrows/+/-/Home and double-click inspection share one bounded coordinate plane. Embedded wheel events are released when zoom cannot change at the limit. Fullscreen reuses the exact same full-resolution source and contains the complete image initially; it letterboxes naturally to avoid cropping. Native Fullscreen API is preferred; viewport-filling fallback locks background scrolling, contains keyboard focus, restores its trigger on exit, and clears before orientation handoffs. Both OS and in-app reduced motion disable map transitions. Browser support limits remain explicit: Chromium touch emulation is not physical iOS/Safari certification.

Reproduce artwork separately (never required at app build): create a Python virtual environment outside the checkout, install `scripts/requirements-sandbox2-terrain.txt`, then run `python scripts/render-sandbox2-terrain.py /absolute/output/folder`. Source geography/control points are recorded in `docs/sandbox2-terrain-geography.json`. Any geometry/art change requires regenerating the exact overlay samples together; do not independently redraw freehand overlay lines.

Release evidence, native desktop/phone/narrow/landscape/fullscreen/popup/zoom-pan screenshots, exact hosted acceptance and protected-project isolation checks: workspace `outputs/dydd-terrain-adventure-map-2026-11-25/`. Its `qa-adventure.mjs` aborts every non-GET/HEAD/OPTIONS browser request before sending. No customer writes, progress awards, curriculum, auth, account, billing or other-project changes are part of this revision.
