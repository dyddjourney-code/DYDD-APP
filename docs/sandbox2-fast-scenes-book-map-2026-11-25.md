# Sandbox2 fast scenes, physical book and living map

Presentation-only refinement on `sandbox2/immersive-forest-2026-11-24`, based on d955079. Only deployment target `prj_OIFpZrQcv3uqs14PEiBD1lVngXrH`, stable alias `dydd-online-school-sandbox-2.vercel.app`. Guarded `scripts/deploy-sandbox2.mjs` checks exact branch/SHA/project/alias and protected deployments. Never use original-sandbox deploy script.

## Scene layout and motion

Base Camp is one source-art hero. Removed its separate green top/location ribbon, visible welcome heading, yellow Start and separate footer dock. Four routes are overlaid in the scene: Base Camp, Traveler Profile, Ranger Station, Learning Center. The six existing destinations remain a bottom-left hero dock, three-by-two on narrow phones. Hero dock anchors to the image frame, not an expanding guide. The real profile/Passport/Field Kit/Trailheads/Fireside consumers and account guards are unchanged.

All scene camera approaches and relief/room arrivals are 240ms `steps(6,end)`; the clock starts after a committed paint (normally about273ms click-to-arrival), and incoming source planes remount at their final camera to avoid a second reverse zoom; direct room requests never add another multi-second intermediate. Reduced motion arrives immediately and cancels a pending trip. Source images preserve aspect ratio; phone crops keep lamps registered to the same image plane. These are six-frame CSS crops of still generated artwork, not realtime 3D.

## Source faithful material

New lossless 1672×941 derivatives leave original public assets untouched:

- `archive-closed-divine-design-20261125.webp`: replaces only the actual open desk book with a source-lit worn leather physical volume, embossed Discover Your Divine Design. Explore Courses is centered directly under the book. No flat SVG cover overlay remains.
- `realistic-ranger-north-water-trail-20261125.webp`: adds a narrow physical tan dirt path northwest/back from Ranger Station, toward the water. Trees/objects hide parts rather than drawing guidance over their crowns.
- Small leather texture crop from the accepted cover matches the expanded explorer material.

Generation, masks, prompts, decoded pixel checks and hashes are retained in `outputs/dydd-fast-scenes-book-map-2026-11-25/art/` outside Git. Final derivatives are pixel-identical to originals outside their tightly feathered edit masks. Art is generated photographic-style imagery, not actual photography or surveyed geography.

## Atmosphere

Actual source-positioned lamps use independently phased warm halos and bright-core variations plus feathered intensity patches cropped from the actual painted glass pixels (twelve transparent lossless crops,11.8KB total; never a full-scene filter); station includes the wall-map bar light, archive includes the desk lamp. Cloud/sunbeam opacity changes only source-registered light patterns, not the entire image. A clipped duplicate of the exact original waterfall drifts a few image pixels, contained to its real white-water silhouette. Four explicit water-only masks contain river whitecap flow. No floating generic scenery overlays. Flattened foreground vines remain still: a clean, source-faithful separated vine mask was not available.

Additional ranger/archive full-room backgrounds use `RoomAtmosphere`, measuring the exact original cover-crop transform via ResizeObserver. Existing phone crop/mask remains. OS reduced motion explicitly disables ambient elements and flame pseudo-elements, preserving steady light.

## Dotted geography

All thirteen real destination records and URLs/callbacks remain. Waypoints is on the actual timber pagoda at16.8/49.1; Start Here sits on the lower-right map frame at94/94. The northern Fruitful Life path is separate from Fireside and follows the accepted physical trail. Five course routes use glowing dots only, no solid track/underlay or traveling shimmer. Every route's dots breathe together subtly; DesignID retains its strictly water-only channel with occlusion gaps. Visible trails have source-space traces and explicit breaks behind trees/buildings/rails. These are conceptual course-orientation paths, not a claim to recover hidden/surveyed terrain.

## Physical six-chapter explorer

Existing exact public catalog metadata remains the only book payload. Worn leather, aged irregular paper edges, layered page block and stitched gutter frame the unchanged six course chapters and genuine links. Increasing chapter turns a decorative two-sided leaf leftward around the spine; decreasing reverses. A900ms physical page turn is distinct from240ms scene camera travel. It never duplicates interactive links/focus, and chapter content becomes available immediately. Native dialog, Escape/exterior close/focus restore, arrow/Home/End tabs, previous/next controls and reduced motion remain. Live reduced-motion switching cancels an in-flight leaf.

## Safe verification

Inspect fixtures before running. Approved read-only source/mock fixtures only:

```
node tests/journey-authored-content.cjs
node tests/sandbox-review-auth-boundary.cjs
node tests/designpd-course-access.cjs
node tests/reflection-current-activities.cjs
node tests/environment-isolation.cjs
node tests/sandbox2-book-metadata.cjs
```

**Do not run `tests/reflection-portable.mjs`** or other write-capable integration/account fixtures for this presentation task. They can create synthetic identities. No customer/account/progress/assessment submission is required.

Build with `NODE_ENV=production npm run build -- --webpack`; native tests use built `npm run start -- --port3152`. Dev Turbopack does not support this host's preexisting shared node_modules symlink. All browser harnesses abort non-GET/HEAD/OPTIONS before sending. `tests/sandbox2-fast-scenes.mjs` checks four viewports, actual timed camera frames, scenes/profile/dock, all26name/dot activations, six chapters/focus/real links and reduced motion. Extended map gesture/fullscreen/water/atmosphere/pixel/release checks and screenshots live in the outside-Git evidence directory. Chromium touch emulation is not physical Safari certification.

### Timing protocol

Use `QA_ONLY=viewports` for the four-size control/focus/map checks, `QA_ONLY=links` for genuine handoffs, and separate fresh-browser `QA_ONLY=motion QA_WIDTHS=1440` (then390,320,844) runs for timings. This separates long-lived software-GPU cache pressure from the actual240ms/six-step camera. Actual candidate measurements:20trips, median273ms, range269–454ms,5–7painted states; a retained long-lived software-GPU stress outlier968ms is documented, not hidden. Chromium emulation is not a guarantee of identical physical-device frame delivery.

`python3 scripts/sandbox2-lamp-patches.py --check` reproduces/verifies twelve source-glass RGBA crops without writes; `--write` explicitly regenerates them. Tiny patches replace an intentionally rejected full-frame-filter prototype that caused unacceptable software-compositor stalls.
