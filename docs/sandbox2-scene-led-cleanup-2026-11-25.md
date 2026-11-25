# Sandbox2 scene-led navigation — 2026-11-25

## Scope / isolation

Only `sandbox2/immersive-forest-2026-11-24` in `projects/dydd-sandbox2` and Vercel project `prj_OIFpZrQcv3uqs14PEiBD1lVngXrH` (`dydd-online-school-sandbox-2.vercel.app`). Baseline `43ec7e2092a4c06b3a71baebd8d71701e6bef7ee`. Use the existing guarded `scripts/deploy-sandbox2.mjs`; never the original-sandbox deployment script. No auth, access, database, course source, assessment, integration, email, payment or package changes.

## Presentation

- Actual existing transparent white `dydd-logo-white-correct.png`, including its icon, replaces text/icon imitation. Top location/profile, three-place route and six-button camp dock remain.
- Base Camp contains only **Welcome to Base Camp**, **Start**, artwork and navigation. No numbered walkthrough, motion toggle, explanatory hero/passport sections or trail-choice interstitial.
- Start performs a steady 6.4-second source-art camera crop towards the real steps (74%,53%) then enters the station automatically. Learning Center approaches the actual hallway (62%,45%), not the right-hand desk. Main navigation is interruptible, timer-versioned and always one click; camp→classroom automatically passes through the station without another click. Reduced-motion preference arrives immediately, including when enabled mid-travel.
- Station actions: Camp Map, Ranger Desk, Learning Center. Desk camera targets the right side of the original image (90%,59% desktop; bounded 85%,59% phone). Existing static unstaffed RangerDesk FAQ remains in a collapsed **Ranger guide** disclosure. No agent, kiosk, invented staffing or new content service.
- Existing `ArrivalReliefMap`, geography, inventory, thirteen native popups, five route overlays, links and original consumers are unchanged. Camp-map and station dock buttons now enter the same scene rather than duplicate room dialogs. Scene buttons no longer claim to open dialogs.
- Learning Center has one book action, **Explore Courses**, directly under the actual open book. It zooms towards that book (52%,62%) then opens an accessible book browser. Tabs use the six actual `allCourseSummaries` titles/descriptions. Journey uses canonical `/journey`; other class links use their existing course routes. Assessment links come from `trailDefinitions` and the genuine `/assessments` collection. No new catalog, entitlement shortcut or fabricated access state. Destination guards remain authoritative.
- Book dialog: native modal, visible-target Tab wrap, Escape/exterior/close, opener focus restoration, arrow/Home/End tabs and reduced-motion page turns.
- Candle overlays are tiny slow local warm-light alpha variations at source-image lantern coordinates; they are inside the same transformed image plane. No whole-image brightness animation. Reduced motion freezes them. Narrow screens crop the unchanged source-ratio artwork without misregistering lantern positions.

## Verification

`npm run build -- --webpack`, `npm run typecheck` and existing source/access/reflection fixtures. `tests/sandbox2-scenes.mjs` runs native desktop clicks / emulated touch, all three scenes and right desk, automatic full-motion arrivals, interruption, reduced-motion switching, book tabs/focus/links, genuine Passport and all thirteen map name+dot targets at desktop/390/320/landscape. Abort every non-GET/HEAD/OPTIONS browser request before sending; never save customer progress during visual QA.

```sh
npm run start -- --port 3152
node tests/sandbox2-scenes.mjs
QA_BASE=https://dydd-online-school-sandbox-2.vercel.app QA_PREFIX=hosted node tests/sandbox2-scenes.mjs
```

Extended preserved map mouse/touch/pinch/fullscreen/focus/bounds/real-route coverage and protected project/alias/env/artwork checks live in `outputs/dydd-scene-led-cleanup-2026-11-25/` (outside Git), together with final screenshots and release identity. Build artifacts and secrets are never committed.

## Limits

These are CSS pans/zooms of the approved generated realistic artwork, not actual realtime 3D. Native artwork remains 1672×941; no additional detail/upscaling claim. Chromium touch emulation is not physical Safari certification. Future staffed/kiosk behavior awaits the owner's unfinished instruction and is intentionally not implemented. Skip movement is a transient accessibility escape, not a motion toggle or debug-stage selector.
