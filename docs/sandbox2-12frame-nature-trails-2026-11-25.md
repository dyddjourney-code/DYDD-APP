# Sandbox2: twelve-frame travel and localized nature

Scope: only `dydd-online-school-sandbox-2.vercel.app`, project `prj_OIFpZrQcv3uqs14PEiBD1lVngXrH`. Deploy solely through `scripts/deploy-sandbox2.mjs` on the existing pinned Sandbox2 branch. Never use the original sandbox deployment script.

## Presentation changes

- Camera transitions now480ms with `steps(12,end)`, including arrival/departure and physical-book approach. Existing two-rAF first-paint guard and incoming-source remount remain. Physical chapter leaf stays900ms.
- No route dots/glow/animation until its destination is selected. Only that route receives a whole-route2.4s soft strobe (32–100%opacity, no harsh on/off flash). Clicking a non-trail place clears route lighting. Closing details retains the selected trail. Reduced motion displays a steady selected route; other routes stay invisible.
- River highlights follow the four existing source-water-only masks/paths, now2.8s continuous downstream dash flow with more readable whitecaps. Original geography and every destination remain byte-identical.
- `BaseCampNature` decorates only the actual source waterfall and alpha-masked original foliage. The foundation is not animated for nature effects. Source artwork remains unchanged. Source waterfall mask contains a continuously repeating flow tile and subtle source-water drift; plants independently sway about2px over5.8–6.8s.
- Phone Base Camp art registration changes from−68%to−64%horizontal offset so the genuine waterfall is actually on screen; layout, source ratio, nav and destination controls remain unchanged. Additional central source leaves provide visible phone wind. Other room framing untouched.
- Approved lighting markup, exact coordinates, crops, CSS and keyframes are unchanged.

## Nature source registrations

All coordinates `(x,y,width,height)` reference unchanged1672×941`/brand/sandbox2-jungle.webp`. Four original masked patches: waterfall865/201/45/76; vine685/88/41/159; right leaf1355/527/204/88; lower leaf1456/735/175/112. Central phone-visible leaves994/451/94/81. RGBA pixels derive from the original source; no generic foliage or replacement artwork. `scripts/sandbox2-phone-plant.py` regenerates the central flower/leaf silhouette. Reduced motion stops all nature and hides water emission; untransformed source remains.

## Safe verification

Build `NODE_ENV=production npm run build -- --webpack`, then `npm run typecheck`. Only six previously inspected safe source/mock fixtures: journey-authored-content, sandbox-review-auth-boundary, designpd-course-access, reflection-current-activities, environment-isolation, sandbox2-book-metadata (`tests/*.cjs`). Never run write-capable integration fixtures for this presentation task.

Native read-only browser harnesses block every non-GET/HEAD/OPTIONS request. `tests/sandbox2-fast-scenes.mjs` now verifies480ms/12steps; run timing in fresh single-browser sessions after other capture work to avoid headless software-GPU contention. The external evidence package `outputs/dydd-12frame-nature-trails-2026-11-25/` contains actual pixel-pair motion checks, real-time hosted GIF, screenshots, protected-project baselines and exact deployed commit/alias receipts. Pixel diagnostics freeze only pre-existing daylight/lamps to isolate nature; delivered GIF is natural-time browser rendering, with no synthesized in-between frames.
