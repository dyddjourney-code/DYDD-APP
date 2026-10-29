# MAPS owner-page foundation — 2026-10-29

## Scope

Route `/command-center/maps` is a new sibling of Design Map, not a replacement.
It is served only when `isPrivateOwnerConsole()` validates the existing pinned
private-owner project and production environment. A sandbox preview token is not
accepted by this page. The sandbox's existing Command Center prefix redirect
forwards the new desktop/mobile navigation link to the protected owner host.
Do not deploy this page to learner production or loosen Vercel Authentication.

## Sources

- Six original supplied Squarespace assets, recorded in workspace
  `memory/maps-page-assets-2026-10-29.md`; downloaded unchanged under
  `public/brand/maps/` so loading does not depend on a third-party request.
- The five supplied sentences are reproduced verbatim.
- Category labels and definitions are imported from `lib/maps-report/content.ts`.
- Practical class labs follow workspace
  `deliverables/dydd-4-week-design-in-motion-class/DYDD_4_Week_Design_In_Motion_Class_Plan.txt`:
  current-state map, planning board, decision grid, launch path.
- Reveal strengths/gaps → Align Plan / Decide / Do → Commit the next faithful step.

## Behavior

Four distinct sections use canonical Mission green, Approach blue, Process plum,
and Send gold, with visible headings and full wording (not color-only meaning).
Anchor navigation works without client state. Native disclosure panels expand
class-lab instructions. No form, database writes, emails, assessment changes,
customer operations, fake statistics, or simulated team graph is included.
Individual maps, team overviews/data/graphs, and an interactive class are explicitly
future ideas. This page tells the reader to use paper or their own notes.

## Verification

Owner and sandbox builds/typechecks plus production-build local browser checks at
1440, 768, 390, and 320 pixels. Check all images, actual element bounds (not merely
body overflow masking), exact wording, owner sibling link, anchors and expand/collapse.
Deployment must preserve `ssoProtection.deploymentType=all` and existing bypass count.
Do not create a protection-bypass grant just to take screenshots. If an already
Vercel-authenticated browser is unavailable, distinguish local rendered evidence
from deployed protection/build/route evidence; do not claim an authenticated live
render was viewed.
