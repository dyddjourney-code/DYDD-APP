# Sandbox-wide mobile artwork and ecosystem map — 2026-10-25

## Scope and environment

Sandbox checkout/branch only: `projects/dydd-online-school-sandbox`, `sandbox`.
Publish only with `node scripts/deploy-sandbox.mjs` to the separate sandbox Vercel
project and Supabase ref `atemrshtshxoqnuevvqu`. Never merge/deploy this branch to
production as part of this task. No database, schema, source curriculum, scoring,
account/authentication, reflection, or save API changes.

## Presentation contract

At widths up to 980px, primary lesson artwork precedes teaching prose. Existing
companion audio stays before the artwork, including Journey's after-teaching-audio
and DesignID Lens special cases. Generic assessment and standalone lesson routes,
DesignID authored/Welcome/compact/Capacity variants, Journey wrapped/ordinary
lessons, and Applied Capacity use their existing artwork/content. Embedded
illustrations inside authored prose retain their source placement. CARE's
introductory lesson still deliberately has no primary artwork.

Existing desktop lesson compositions (including side-by-side and wrapped artwork)
are unchanged at 981px and wider. The compact/capacity reset explicitly overrides
the higher-specificity historical float rules.

Phone/landscape headers show the complete original illustration at its native
aspect ratio, followed by copy with readable sizing/contrast. Background-artwork
headers get a dedicated no-crop artwork region rather than `cover` behind text.
Base Camp, Ranger Station, Waypoints/Live and Field Kit notebook images retain
natural proportions. Expedition reuses its existing image once, without duplicating
its background illustration. The narrow Live status and Command Center intrinsic
form/filter widths were also repaired after browser-measured overflow.

## Ecosystem map

The map canvas always fits its available width. Narrow canvases use numbered
markers with all 12 full-name, at-least-44px place controls below. Numbers retain
accessible place names; selection is exposed by `aria-pressed`. The existing
selected-place text, artwork, bullets, links, trails and active animations remain.
Edge markers are kept inside the canvas; the closely positioned Base Camp marker
is offset on very narrow canvases to avoid covering Ranger Station.

Expand map opens a viewport-filling, labelled native modal dialog with map-only
selection controls. Landscape gets a height-fitted map with independently scrollable place controls beside it, so focusing a place does not scroll the map out of view. Close and Escape return
focus to Expand map; tab/shift-tab stay inside the modal, background interaction
is inert, body scrolling is restored, and the chosen place survives closing.
The expanded map does not navigate away or change orientation automatically.

## Repeatable verification

`tests/mobile-artwork-map.mjs` uses existing Puppeteer/Chromium, the established
sandbox owner entry and read-only layout inspection. It blocks non-GET API writes,
so it cannot change owner/learner answers, profile, discussion marks or position.
It writes sanitized JSON evidence and screenshots under `tmp/` (not committed).

```sh
MOBILE_TEST_SECTION=headers node tests/mobile-artwork-map.mjs
MOBILE_TEST_SECTION=lessons node tests/mobile-artwork-map.mjs
MOBILE_TEST_SECTION=map node tests/mobile-artwork-map.mjs
COURSE_TEST_BASE=https://dydd-online-school-sandbox.vercel.app MOBILE_TEST_SECTION=map node tests/mobile-artwork-map.mjs
```

The inventory covers 145 lessons across seven course families (Journey71,
DesignID13, DesignPD23, Spiritual Gifts12, Design Pathways5, FruitLife36019 and
Discover Your Divine Design2), primary artwork/audio/prose geometry, standalone
routes, header surfaces, 320/390/430px phones, 844×390 landscape and 1280px desktop.
The map suite also checks every place, edge-marker visibility, all relevant hit
sizes, selected-panel updates, modal open/close/Escape, focus trap/restoration,
preserved selection and absence of horizontal scrolling.

Preservation checks: build/typecheck, environment isolation, reflection catalog,
reflection export and Journey discussion access. There are no new dependencies.

The exact release SHA/deployment receipt is retained in `tmp/mobile-release-proof.json`
after publication and in the release handoff; `tmp/mobile-artwork-*-*-qa.json` is the detailed browser evidence.

### Verification details

- Header inventory: 22 actual illustrated surfaces, including My Circles and the
  Journey/DesignID saved-reflection notebook variants. Other app routes were
  statically reviewed; logo-only/plain headers did not need an illustration crop fix.
- A separate browser comparison disables the modified global stylesheet, injects
  the exact original `826b34d` stylesheet, and compares real course geometry and
  computed fonts/grid/float values: eight course variants at both1280 and1920px.
  All16 comparisons passed with unchanged desktop lesson/header composition.
- Course selection is initialized on hydration. The verifier waits for the exact
  requested lesson heading and network settlement before measuring, avoiding
  accidentally measuring the initial first-lesson render.
- `MOBILE_LESSON_START=145` skips the exhaustive inventory walk for a published
  smoke run while retaining all64 representative lesson/width checks and28
  standalone checks. Evidence distinguishes this from the complete145-lesson run.
- The original Command Center had fixed form/filter minimums overflowing even
  inside its1280px desktop two-column shell. Panel-width container queries wrap
  those controls without changing the desktop two-column shell or course layouts.
