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

The map canvas always fits its available width. **October 26 correction:**
John rejected the added numbered markers and duplicate numbered place lists.
All 12 original word labels remain directly on the artwork, with original place
content, selected-place details, links, trails and active animations preserved.
Small canvases use compact high-contrast word labels; the clustered Trailheads,
Base Camp and main Journey labels are separated without changing their meaning.
Phone map panels remove nested side padding and use the full viewport width.
No map or page horizontal scrolling is needed.

Expand map opens a viewport-filling labelled native modal dialog. Portrait gives
a short sideways-phone prompt; rotating the open dialog keeps its selection and
fits the complete labelled map into the landscape viewport. The landscape map
uses all height available beneath a compact toolbar, with no duplicate control
column. The selected name/title remains announced to assistive technology.
Close and Escape restore focus to Expand map, tab/shift-tab remain inside the
modal, background interaction is inert, and body scrolling is restored.

Base Camp phone artwork is full-viewport-width and complete, with no added text
on the artwork. A single full-width “On Purpose, For Purpose” bar follows it,
then the compact personalized welcome. All changes are limited to <=980px;
desktop Base Camp is unchanged. The global mobile menu closes in the destination
click event, including the current destination, without cancelling navigation.
Its destination list scrolls within the available viewport height in landscape,
so every item remains reachable.

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
The October 26 correction suite (`tests/mobile-corrections.mjs`) is also used by
the map section of `tests/mobile-artwork-map.mjs`. It checks
320/390/430px portrait, 844×390 landscape and 1280/1920px desktop; full-width
hero/image/bar/welcome geometry; all 13 actual mobile destinations and same-page
selection; the immediate click-event close state; all 12 named map touch controls;
expanded view, rotation, Escape/close and modal keyboard focus. It blocks non-GET
API writes and does not modify owner/customer records. Run locally or published:

```sh
node tests/mobile-corrections.mjs
COURSE_TEST_BASE=https://dydd-online-school-sandbox.vercel.app node tests/mobile-corrections.mjs
```

The previous lesson/header suites remain available for course artwork regression;
none of their lesson/header CSS or markup was changed in the correction.

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

### Navigation-readiness and recovery

The verifier aborts opportunistic Next RSC/router prefetch requests only. They are
not the hard navigation or actual workbook/profile API reads being tested, and
can keep desktop pages continuously busy. This prevents false network-idle
navigation timeouts without altering application auth, navigation or saving.
Progress JSON is checkpointed during long runs. `MOBILE_TEST_SECTION=standalone`
can resume the28 direct-lesson checks after a test-server lifetime interruption.
Keep long-lived local test servers on an explicit adequate runtime; final testing
uses the clean production build, not only the development server.

### October 26 correction validation

- Production build and TypeScript passed. Environment-isolation, reflection
  catalog/export and Journey discussion-access checks passed; no API/schema,
  source curriculum, assessment, account or save behavior was changed.
- Actual read-only Chromium/touch checks passed at 320/390/430px portrait,
  844×390 landscape and 1280/1920px desktop. Every mobile menu destination,
  same-page selection, all 12 named map controls, expanded-map fit, rotation,
  selection retention, Escape/Close and focus restoration were exercised.
- All 22 illustrated header surfaces passed at five widths (110 cases).
  Exact previous-release stylesheet comparison passed 20 desktop compositions
  at 1280/1920px: Base Camp, Ranger header and eight course variants.
- Independent read-only source review found no blocking issues. The exact final
  deployment/SHA/alias and unchanged-production evidence is recorded with the
  release receipt in `tmp/mobile-corrections-release-proof.json`; published
  six-width interaction evidence is `tmp/mobile-corrections-published.json`.
- Physical iOS/Safari was not exercised; browser evidence is Chromium mobile/
  touch emulation and actual viewport rotation, not a physical-device claim.
