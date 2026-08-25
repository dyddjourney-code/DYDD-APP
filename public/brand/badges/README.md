# DYDD Trail Badges

Badge assets for the DYDD app gamification system.

- `*-badge.svg`: vector badge artwork.
- `*-badge.png`: app-ready raster badge artwork, used when badges include embedded tool logo icons.
- `dydd-trail-badges-preview.png`: contact-sheet preview of the current set.
- `dydd-trail-badges-preview.pdf`: PDF review sheet of the current set.
- `references/outdoor-badge-reference-2026-08-25.pdf`: uploaded outdoor badge reference from John.
- `references/outdoor-badge-reference-1.png`: rendered image reference from the PDF.
- `../tools/badge-icons/`: extracted center marks from the existing DYDD assessment/tool logo files.
- `../tools/spiritual-gifts-icon-correct.png`: John-provided Spiritual Gifts Assessment flame/puzzle icon.
- `../reflection-badges/`: exact Reflection companion patch crops used in Shepherd, Artisan, Architect, and Steward badges.

The badge text and earn conditions are wired in `app/hq/page.tsx` so labels stay editable in code. Regenerate badge assets with `node scripts/generate-trail-badges.mjs`.
