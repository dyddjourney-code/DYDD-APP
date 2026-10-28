# Passport mobile details — sandbox only

## Problem and change

On a narrow screen the desktop detail sidebar moved below the entire badge list.
Tapping a badge updated invisible, detached content. At widths up to 980px a tap
now opens a native modal bottom sheet immediately over the current list position.
A persistent heading shows the exact selected marker and earned/ahead/next/locked
state. The visible 44px Close button stays outside the independently scrollable
Overview, Earn it by, and Connected to content. A short tap hint makes the action
explicit. Safe-area padding keeps the last line clear of the home indicator.

Native `dialog.showModal()` provides top-layer rendering, background inertness,
focus containment, and Escape semantics. Explicit first/last Tab wrapping keeps
keyboard focus in the sheet instead of detouring into browser chrome. Close/Escape/backdrop restore focus to
the exact invoking badge (including repeated markers in short trails), without
scrolling away. Background scrolling is locked while open. Crossing back to a
desktop viewport dismisses the modal and restores normal scrolling. Above 980px
the existing hover/focus/click sidebar and three-column presentation are retained.
No new dependency or animation was added.

## Preserved behavior

All badge lists, shared milestones, unique earned total, backend award triggers,
checklist/result/report logic, source records and preview progress are unchanged.
Only the presentation component and stylesheet change application behavior.
There is no migration, data write, production deploy, Stripe action, or email.

## Verification / reproduction

- `npm run typecheck`
- `node tests/basecamp-passport.cjs`
- `node tests/passport-mobile.mjs` against isolated local port 3141
- `PASSPORT_MOBILE_BASE=https://dydd-online-school-sandbox.vercel.app node tests/passport-mobile.mjs`
- `node tests/passport-release.mjs` verifies exact alias/SHA and unchanged production.

The new read-only owner preview suite uses hydrated actual touch taps at 320, 390,
and 768px and desktop clicks/hover at 1280px. It opens every badge in every section
(including earned and unearned repeated milestones), verifies the selected title,
copy, modal bounds, focus, close/Escape, unchanged totals and no horizontal overflow.
It additionally checks a genuinely scrolling long Niche declaration on a 320x568
viewport, reachable final connection text, keyboard containment, backdrop close,
outer-list scroll-position preservation, and same-document mobile-to-desktop resizing. No QA users/progress/reports/awards are created.
Before/after preview state must match and browser runtime errors must be empty.
The existing full functional suite's click helper closes a previous mobile sheet
before selecting another badge; all award and progress assertions remain intact.

Release evidence is retained under `tmp/passport-mobile-*` (QA JSON, logs, screens,
and exact release proof). The stable owner entry remains `/sandbox-review`.
