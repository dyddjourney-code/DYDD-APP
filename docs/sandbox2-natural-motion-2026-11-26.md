# Sandbox2 restrained natural motion

Release only with `scripts/deploy-sandbox2.mjs`, pinned Sandbox2 branch/project
`prj_OIFpZrQcv3uqs14PEiBD1lVngXrH`. Never deploy to the other four projects.

Travel: 780ms continuous `cubic-bezier(.4,0,.2,1)`, replacing480ms/12steps.
Historical slow room approach in714b29e was4800ms; fc09982 used240ms.
This practical middle pace follows the requested700–850ms range rather than
an arithmetic midpoint to the original cinematic4.8s. Two-rAF paint guard,
source remount, navigation and physical900ms chapter leaf are preserved.

Waterfall: removed invented tiled highlight stripes. Only original alpha-masked
waterfall pixels drift1.1px over5.6s alternate, at18–30%opacity.
River: no rendered SVG white dash paths. `sandbox2-whitewater-mask.py` selects
only bright cool actual foam RGB inside the original river centerline corridor,
excluding the bridge gap. Feathered alpha; no invented texture/color.716nonzero
alpha pixels, original1672×941registration. Source overlay drifts less than1px
over7.6s; calm water, source terrain, boats, landmarks remain static.

Lights: `useNaturalLampFlicker` regenerates independent fresh duration/target
segments (1.4–4s; opacity61–69%; glass brightness97–103%). No looping pulse,
flame skew/scale or synchronized flashes. Native WAAPI handles are cancelled on
scene changes, unmount and reduced-motion changes; source positions/glass unchanged.
Reduced motion disables nature/river/travel and leaves only the selected route
steady. Existing clicked-only trail behavior and colors are unchanged.

Safe verification: optimized Webpack build, typecheck, six explicit source/mock
fixtures listed in previous runbook; never the integration fixtures. Read-only
Chromium intercepts all nonGET/HEAD/OPTIONS. Actual hosted multiframe captures,
computed motion/real rAF timing, four-size UI and selected-trail/reduced checks,
SHA/alias and four-project isolation receipts go in workspace
`outputs/dydd-natural-motion-2026-11-26/`. Chromium touch emulation is not
physical Safari certification. No customer/integration writes.
