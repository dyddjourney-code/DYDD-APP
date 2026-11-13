# DYDD page refinements — November 13, 2026

UI-only refinement shared surgically between live and sandbox; environment-specific billing, timing, course access, owner previews and Circles remain intact.

- Trailheads completed-assessment actions target `/field-kit#results-designid`, `#results-spiritual-gifts`, `#results-fruitlife-360` and `#results-designpd`, retaining existing review/lane query parameters. Journey has a matching `#results-journey` collection destination (no invented Journey assessment report).
- The shared `TrailAnchor` aligns the visible **Reports** panel in the named collection, opens its mobile disclosure, reserves at least 100px for navigation, and settles initial load, client navigation, same-page hash navigation and browser history. It stops correction on deliberate user input. Existing `#collection-*` links remain supported.
- Fruitful Life standalone lane has the corresponding results anchor while retaining its legacy `#artifacts` marker.
- Journey placard uses the exact existing DYDD puzzle emblem cropped from the approved transparent brand logo; desktop placement matches other placard icons, and existing compact mobile signpost treatment is retained.
- Gear workshops have one green/yellow contact CTA opening the existing marketing contact page in a new tab with `noopener noreferrer`.
- Fireside now displays the entire original 1742×903 campfire frame, with copy below so neither faces nor fire are cropped or covered. Existing artwork is unchanged; no animation was added.
- Ranger Station Suggested Trail Route captions are noninteractive ordered labels. The approved aerial banner is deliberately unchanged pending John's new ground-level photo. Sandbox receives this same existing banner because its earlier branch did not include the route component.

No dependencies, database schema, access policy, checkout, course-content, assessment-scoring or notification logic changed. Local synthetic report fixtures were used to exercise the real shared collection and Next Link navigation; fixtures are not part of the release. Do not describe those as authenticated hosted learner verification.
