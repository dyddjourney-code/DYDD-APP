# Relief map dotted refinement — local only

Uses the `illustrated-map-experiences` skill. Scope: geography, relief component/style and this map note only. No artwork, destination inventory, course content, data, integrations or deployment changed.

## Changes

- Inspected the native 1672×941 source with a 5% coordinate grid. Waypoints is now on the **actual timber pagoda at 16.8/49.1**, not the fabricated western junction at 29.1/33.3. Removed the extra SVG fork that painted a new path over terrain.
- Start Here sits at 94/94 on the lower-right timber map frame, with its label extending inward. Its original callback and Map guide entry remain.
- Re-traced the exposed western switchback route, station/bridge approach and lower Camp Circles approach; explicit SVG `M` gaps leave intervening tree crowns/buildings/objects unpainted. Gifts uses the pagoda/switchbacks to the first ridge, Journey continues to the high route.
- Fruitful Life 360 is no longer the Fireside loop. Its separate north-west/rear-bank approach starts by the station, with gaps through occluded vegetation; its marker moves to 76.9/44.8. Return is the same approach.
- All five course routes, including water-aligned DesignID, now render **one colored dotted path each**, no continuous track or solid shadow bed. Round caps and tiny dash lengths create discrete dots; subdued glow retains each historical route color. Whole-route opacity pulses on one shared six-second phase, not traveling/staggered lights. Selection raises contrast without moving the camera. OS and in-app reduced motion stop animation.

## Evidence and limits

`outputs/map-dotted-refinement/source-grid.png` is source-coordinate inspection evidence. `capture.cjs` renders actual geography/CSS in isolated headless Chromium at 1672 and 390 widths, producing `dots-1672.png`, `dots-390.png` and computed-style receipts in `render-checks.json`. This is **isolated overlay rendering**, not full React app/gesture/dialog acceptance or physical Safari testing.

Artwork SHA256 remains `e83cd43da88d2752a90040b23cfe130d724953c6892c6efc3538922d1a273be0`; destinations file remains untouched. Typecheck was attempted but the shared checkout includes a pre-existing copied `tmp/candlelight-baseline/components/forest-navigation.tsx` in TypeScript's broad include: that copy lacks newly required `onProfile`. No error was reported in the map files. The webpack production build subsequently **passed**, including Next TypeScript and all 138 prerendered pages. A separate `tsc --noEmit` check using `outputs/map-dotted-refinement/tsconfig.verify.json` (excluding only the copied `tmp` baseline) also **passed**. Integrated interaction acceptance belongs to parent release QA; no write-capable fixture was run.

**Precision limit:** source artwork is generated, not a surveyed trail network. Dense northern undergrowth does not expose one continuous station-to-rear-bank hiking trail; gaps do not prove hidden topology. Fruitful Life 360 is consequently an image-registered conceptual approach through visible clear areas, not evidence that every hidden trail segment has been recovered. The request to precisely trace *every actual visible hiking trail* cannot honestly be certified from this single oblique raster; these route traces need user visual acceptance. No hidden path was newly painted into the artwork. All existing URLs, callbacks and all 13 targets are preserved.

No commit, push or deployment performed.

## Integrated follow-up

The combined refinement subsequently added a tightly masked source-faithful physical northern dirt trail in a NEW derivative asset, `realistic-ranger-north-water-trail-20261125.webp`. The original image remains byte-identical; new artwork is pixel-identical outside its narrow mask. This supersedes the initial isolated-render-only limitation for that northern approach. Native shared-route selection renders last to retain the chosen color; normal dots are3.6px and selected4.2px with subtle6second whole-route opacity breath. See `sandbox2-fast-scenes-book-map-2026-11-25.md` for integrated verification and exact limits.
