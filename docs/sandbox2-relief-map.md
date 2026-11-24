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
