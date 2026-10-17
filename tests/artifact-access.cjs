const assert = require("node:assert/strict");
const { NextRequest } = require("next/server");
const load = require("../scripts/fruitlife-test-load.cjs");
let snapshot = {
    id: "d5f4fa80-11a6-4229-a7b4-cb9180d6d21e",
    assessment_type: "designid",
    created_at: "2026-10-17T12:00:00Z",
    source_submitted_at: null,
    scores: { Primary: "Architect", Architect_Pct: 0.22, Architect_Pts: 22 },
    source: "test",
  },
  fail = false;
const route = load("app/api/artifacts/[snapshotId]/download/route.ts", {
  "@/lib/assessments/student-context": {
    assessmentLabels: { designid: "DesignID" },
    displayDate: () => "Oct 17, 2026",
    snapshotHighlights: () => [{ label: "Primary", value: "Architect" }],
    getAssessmentSnapshotsForUser: async () => ({ all: [snapshot] }),
  },
  "@/lib/review/heather": {
    isHeatherReviewRequest: (p) => p.review === "heather" && p.key === "valid",
    getHeatherReviewReport: async () => ({ all: [snapshot] }),
    isNewReviewRequest: (p) => p.review === "new" && p.key === "valid",
    getNewReviewReport: async () => ({ all: [snapshot] }),
  },
  "@/lib/owner-preview": { isOwnerPreviewRequest: () => false },
  "@/lib/supabase/server": {
    createSupabaseServerClient: async () => ({
      auth: { getUser: async () => ({ data: { user: null } }) },
    }),
  },
  "@/lib/pdfmonkey/client": {
    getPdfMonkeyDocument: async () => {
      if (fail) throw Error("temporary provider outage");
      return { download_url: "https://example.invalid/fresh-report.pdf" };
    },
  },
});
const get = async (query = "", id = snapshot.id) =>
  route.GET(
    new NextRequest(`https://school.test/api/artifacts/${id}/download${query}`),
    { params: Promise.resolve({ snapshotId: id }) },
  );
(async () => {
  snapshot.scores.Architect_Pct = 0.22;
  snapshot.scores.Architect_Pts = 22;
  let r = await get("?review=new&key=valid");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("Content-Disposition"), /^inline/);
  assert.equal(r.headers.get("Cache-Control"), "private, no-store");
  const rendered = await r.text();
  assert(rendered.includes("Print / Save as PDF"));
  assert(rendered.includes("22%"));
  assert(!rendered.includes("0.2%"));
  r = await get("?review=new&key=valid&download=1");
  assert.match(r.headers.get("Content-Disposition"), /^attachment/);
  for (const query of [
    "",
    "?review=new&key=invalid",
    "?review=heather&key=invalid",
  ])
    assert.equal((await get(query)).status, 404);
  assert.equal((await get("?review=new&key=valid", "foreign-id")).status, 404);
  snapshot.scores.pdfMonkey = {
    documentId: "doc",
    providerUrl: "https://example.invalid/old.pdf",
  };
  r = await get("?review=new&key=valid");
  assert.equal(r.status, 307);
  assert.equal(
    r.headers.get("Location"),
    "https://example.invalid/fresh-report.pdf",
  );
  fail = true;
  r = await get("?review=new&key=valid");
  assert.equal(r.headers.get("Location"), "https://example.invalid/old.pdf");
  snapshot.scores.pdfMonkey = { documentId: "doc" };
  r = await get("?review=new&key=valid");
  assert.equal(r.status, 200);
  console.log(
    "PASS review access, foreign/anonymous denial, inline old results, explicit download, fresh PDF resolution and provider-outage fallback. No reports generated or emailed.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
