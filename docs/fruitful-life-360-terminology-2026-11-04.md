# Fruitful Life 360 — sandbox terminology release, November 4, 2026

## Approved display contract

All customer-visible `Fruit Life 360`, `FruitLife 360`, `FruitLife360` and shortened product-name prose now read **Fruitful Life 360**. This is a display correction, not a rename of assessment types, scoring, records, integration keys or URLs. Scope is the dedicated `sandbox` branch/project/Supabase ref `atemrshtshxoqnuevvqu`, starting at Base Camp `836e3496a7c7ea90968ad516666bf05e1b449e6a`. The prior auth-email package `591272a` remains an ancestor. Production and shared live Sheets, PDFMonkey and Make are outside this release.

## Surface inventory

| Surface | Correction and verification |
| --- | --- |
| Ecosystem map | Both embedded overlay/control label sets, selected details, CTA, image alt, Ranger explanations corrected; actual owner desktop/phone map selection tested. Also corrected the obsolete product name embedded in the raster map legend, preserving routes/artwork/geometry; repeatable native-size repair script included. Correct signpost preserved. |
| Trailheads / Field Kit | Trail names, descriptions, access notices, report cards, collection labels, assessment tracker, history labels and accessible names corrected. Stable anchors/links unchanged. Actual owner desktop/phone pages checked. |
| Base Camp / Command Center / purchases | Current display labels and tool descriptions corrected; compact Base Camp layout/auth-email release preserved. |
| Classes / lessons / reflections | Fruitful Life Formation catalog and all nineteen authored lessons, related Journey/DesignPD/Spiritual Gifts references, reflection catalog/export labels and companion transcripts corrected. Lesson slugs/question IDs unchanged. All nineteen externally hosted lesson illustrations visually inventoried; logo already correct, report-detail illustration contains no obsolete brand. |
| Assessment / tracker | Setup, real self/observer form headings/accessibility, errors, progress/completion/status screens and source report prose corrected. Actual token-protected self form tested with isolated sandbox fixture, never submitted; fixture deleted. |
| Reports / downloads | Application report labels, download filename and report-bound source prose corrected. Worker/scoring/report-contract/privacy regressions pass without provider requests. Sandbox relational assessment/report tables are empty; no existing Fruitful Life PDF to exercise end-to-end. Shared PDFMonkey template remains untouched and sandbox external generation stays disabled. This release does not claim to have rebranded that external production template. |
| Badge / signpost / logos | Correct logo and wooden signpost retained. Current badge SVG/PNG regenerated with fitting ribbon label. Obsolete labels embedded in the contact-sheet PNG and raster PDF were found visually and both replaced; new PDF has extractable corrected caption. Full generator now refreshes PNG **and PDF** via the reusable preview helper. Other individual badge artwork preserved. |
| Spoken companions | Exactly two active clips (welcome and whole-Journey connection) regenerated using existing ElevenLabs credential and corrected scripts/transcripts. Other three Fruitful Life companion clips have no product-name utterance and stay unchanged. Source-to-synthesis/valid audio bytes verified; no independent speech recognition/listening claim. |
| Emails / catalog | Lifecycle recommendation and real observer/report email builders corrected. Source-based service previews and full TXT catalog regenerated. Actual hosted C04 preview exercised without Send. Prior sent email history is immutable historical evidence, not resent or edited. |
| Active database / retained storage | Read-only audit of 54 table/column combinations: zero wrong display-name rows. Empty course/session/snapshot/report tables need no data migration. Four retained JSON objects: old matches only in stable completion keys/slugs. One unrelated retained private Spiritual Gifts PDF downloaded/read-only, PDF signature and text checked: zero old-brand matches; temporary private bytes removed. |

## Compatibility and exclusions

Keep `/fruitlife360`, `fruitlife-360-formation`, `welcome-to-fruitlife-360`, `collection-fruitlife-360`, `fruit_360`, `fruitlife_360_*`, environment/provider/template IDs, CSS classes, TypeScript symbols, idempotency keys, source filenames, imported workbook header/slug contracts and historical badge aliases. Existing earned-badge filtering recognizes historical `FruitLife360` without rewriting awards. Stored completions and saved scores stay intact.

Historical release notes, migrations, source snapshots, legacy fixtures and filename/path identifiers may retain the previous term; these are not active customer labels. `tmp/`, preexisting dirty Circle evidence and unrelated docs are not committed. Legacy unused `fruit-360-logo.svg` is a separate “Fruit 360” historical mark, not an active logo; the actual current logo already says Fruitful Life 360.

## Verification and evidence

Evidence directory: `/home/openclaw/.openclaw/workspace/outputs/fruitful-life-360-cleanup-2026-11-04/`.

- Production build and TypeScript; `tests/fruitful-life-terminology.cjs` AST/customer-copy contract, generated catalog determinism and `git diff --check`.
- Environment isolation; 631 scoring/band cases, ten historical reports/1,080 values, 72 item statements and 169 template fields; mocked report worker/lifecycle, artifact privacy, PDF score units, reflection catalog, assessment/course badge independence and completion screens.
- Actual existing owner authenticated page inspections at 1280/390/320; no submissions, Send clicks, payment calls or password changes. Token-protected self-form fixtures are synthetic and deleted; non-GET browser requests are blocked.
- Current badge PDF text and rendered page; desktop/mobile map, Field Kit, class and badge images visually inspected.
- `final-deployment.json` records exact pushed SHA, READY sandbox project and canonical/legacy aliases, unchanged production deployment and email-package ancestry. Hosted evidence is separate from local checks.

### True limits

No external PDFMonkey generation/template update or shared Sheets/Make change; no Fruitful Life report existed in sandbox DB. Therefore actual protected final Fruitful Life PDF generation/body remains unverified, distinct from passing source/payload/worker regressions. Existing unrelated PDF read-only audit is not a Fruitful Life report test. Physical devices/Safari and independent audio listening/transcription are not claimed. No emails, payments, password changes, production writes or learner assessment submissions were performed.
