# Spiritual Gifts class header — sandbox, October 22, 2026

The Spiritual Gifts in Service class now shares the Journey / DesignID illustrated-header treatment and numbered linear module strip. Other courses retain their existing headers.

## Artwork

John supplied a mountain sunrise photograph with a left foreground rustic fence and winding grassy trail. Generated cartoon artwork with `openai/gpt-image-2`, using that photograph as the composition reference and the existing `public/brand/designid-course-cartoon-hero.png` as the style reference. The resulting fence, trail, layered mountains and sunrise are retained in the optimized 1920px WebP at `public/brand/spiritual-gifts-course-cartoon-hero.webp`. The original generated image is retained in OpenClaw managed media; no text or logo is burned into the illustration.

## Implementation boundary

Only the `spiritual-gifts-service` branch of the generic class route changes. The title/tagline use existing course data. The hero reuses `.journey-hero`; the six-module strip reuses `.dydd-progress-racetrack.journey-top-racetrack` and remains horizontally scrollable on phones. Each numbered item is an accessible link to that module's first lesson, using the course player's existing `lesson` query support. Context including the FruitLife lane and validated review query is preserved. Keyboard focus and pressed/hover affordances are scoped to this strip.

Existing course access checks, personalization, authored lessons, lesson menu, reflection logic and scoring are unchanged. No migrations, policies, production configuration, or production deployment are part of this release.

## Verification

- `npm run build`, `npm run typecheck`, `git diff --check`.
- `node tests/environment-isolation.cjs`, `node tests/reflection-catalog.cjs`, `node tests/reflection-export.cjs`.
- `node tests/spiritual-gifts-header-browser.mjs`: authentic isolated sandbox account with temporary Spiritual Gifts snapshot; 1920/1280/768/390/320px artwork/title/strip/no-overflow checks, all six actual module links, alternate lane, neighboring DesignID/Journey headers and anonymous access gate, browser runtime errors. The fixture is removed in `finally`.
- Repeat against the published stable sandbox alias with `COURSE_TEST_BASE=https://dydd-online-school-sandbox.vercel.app`.
- Explicit sandbox deploy via `node scripts/deploy-sandbox.mjs`, followed by exact project/commit/READY/alias receipt verification. Production master remains `728e88b7681067c9e78b18aa023ba689c502602a`.

Build, browser output and screenshots are retained in the untracked `tmp/spiritual-gifts-header-*` evidence files; release receipt is recorded there after deployment.
