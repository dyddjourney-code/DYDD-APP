const assert = require("node:assert/strict"),
  { NextRequest } = require("next/server");
const load = require("../scripts/fruitlife-test-load.cjs");
let snapshot = {
  id: "d5f4fa80-11a6-4229-a7b4-cb9180d6d21e",
  assessment_type: "designid",
  created_at: "2026-10-17T12:00:00Z",
  source_submitted_at: null,
  source: "test",
  scores: {
    scores: {
      Architect_Pct: 0.22,
      Architect_Pts: 22,
      Artisan_Pts: 21,
      Shepherd_Pts: 41,
      Steward_Pts: 16,
    },
    summary: {
      Primary: "Shepherd",
      Secondary: "Architect",
      Reflection_Shadow: "People-Pleasing",
      Potential_Shadow: "WRONG INTEGRATIVE WARNING",
    },
    reportPayload: { Name: "Test", Architect_Pct: "22%" },
  },
};
let archived = 0,
  generated = 0,
  fail = false;
const q = {
  select() {
    return this;
  },
  eq() {
    return this;
  },
  single: async () => ({
    data: {
      scores: snapshot.scores,
      assessment_participants: {
        display_name: "Test",
        normalized_email: "test@example.invalid",
      },
    },
  }),
  update(v) {
    snapshot = { ...snapshot, scores: v.scores };
    return this;
  },
  then(r) {
    return Promise.resolve({ error: null }).then(r);
  },
};
const route = load("app/api/artifacts/[snapshotId]/download/route.ts", {
  "@/lib/assessments/student-context": {
    assessmentLabels: {
      designid: "DesignID",
      spiritual_gifts: "Spiritual Gifts",
      designpd: "DesignPD",
    },
    displayDate: () => "Oct 17, 2026",
    snapshotHighlights: () => [],
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
  "@/lib/supabase/admin": {
    createSupabaseAdminClient: () => ({
      from: () => q,
      storage: {
        from: () => ({
          upload: async () => ({ error: null }),
          remove: async () => ({ error: null }),
        }),
      },
    }),
  },
  "@/lib/assessments/report-storage": {
    reportBucket: "assessment-report-pdfs",
    storedReportUrl: async () => "https://storage.test/private-signed.pdf",
    archiveReportPdf: async () => {
      if (fail) throw Error("expired");
      archived++;
      return {
        bucket: "assessment-report-pdfs",
        path: `designid/${snapshot.id}/report.pdf`,
        filename: "DesignID Report.pdf",
      };
    },
  },
  "@/lib/pdfmonkey/client": {
    getPdfMonkeyDocument: async () => ({
      status: "success",
      download_url: "https://provider.test/real.pdf",
    }),
    createPdfMonkeyDocument: async () => {
      generated++;
      return {
        id: "new-doc",
        status: "success",
        download_url: "https://provider.test/real.pdf",
      };
    },
  },
});
const get = (query = "", id = snapshot.id) =>
  route.GET(
    new NextRequest(
      "https://school.test/api/artifacts/" + id + "/download" + query,
    ),
    { params: Promise.resolve({ snapshotId: id }) },
  );
(async () => {
  let r = await get("?review=new&key=valid&view=snapshot");
  let text = await r.text();
  assert.equal(r.status, 200);
  assert.match(text, /<td>22<\/td>/);
  assert(!text.includes("0.22%"));
  assert(!text.includes("22%"));
  assert(!text.includes("pts"));
  assert(text.includes("People-Pleasing"));
  assert(!text.includes("WRONG INTEGRATIVE WARNING"));
  assert(!text.includes("Saved Highlights"));
  assert(!text.includes("Print / Save as PDF"));
  for (const query of ["", "?review=new&key=bad", "?review=heather&key=bad"])
    assert.equal((await get(query)).status, 404);
  assert.equal((await get("?review=new&key=valid", "foreign")).status, 404);
  r = await get("?review=new&key=valid");
  assert((await r.text()).includes("Prepare full PDF report"));
  assert.equal(generated, 0);
  snapshot.scores.pdfMonkey = {
    documentId: "doc",
    providerUrl: "https://provider.test/old.pdf",
  };
  r = await get("?review=new&key=valid");
  assert.equal(r.status, 307);
  assert.equal(
    r.headers.get("location"),
    "https://storage.test/private-signed.pdf",
  );
  assert.equal(archived, 1);
  assert(snapshot.scores.reportArtifact);
  delete snapshot.scores.reportArtifact;
  fail = true;
  r = await get("?review=new&key=valid");
  assert.equal(r.status, 200);
  assert((await r.text()).includes("Prepare full PDF report"));
  fail = false;
  delete snapshot.scores.pdfMonkey;
  r = await route.POST(
    new NextRequest(
      "https://school.test/api/artifacts/" +
        snapshot.id +
        "/download?review=new&key=valid",
      { method: "POST", headers: { Origin: "https://evil.test" } },
    ),
    { params: Promise.resolve({ snapshotId: snapshot.id }) },
  );
  assert.equal(r.status, 403);
  assert.equal(generated, 0);
  r = await route.POST(
    new NextRequest(
      "https://school.test/api/artifacts/" +
        snapshot.id +
        "/download?review=new&key=valid",
      { method: "POST", headers: { Origin: "https://school.test" } },
    ),
    { params: Promise.resolve({ snapshotId: snapshot.id }) },
  );
  assert.equal(r.status, 303);
  assert.equal(generated, 1);
  assert(snapshot.scores.reportArtifact);
  snapshot = {
    ...snapshot,
    assessment_type: "spiritual_gifts",
    scores: {
      summary: {
        Top1_Name: "Faith",
        Top1_Score: 15,
        Top2_Name: "Teaching",
        Top2_Score: 14,
      },
    },
  };
  r = await get("?review=new&key=valid&view=snapshot");
  text = await r.text();
  assert(text.includes("Faith"));
  assert(text.includes("Teaching"));
  assert(!text.includes(">15<"));
  assert(!text.includes(">14<"));
  assert(!text.includes("<i "));
  assert(!text.toLowerCase().includes("saved highlights"));
  snapshot = {
    ...snapshot,
    assessment_type: "designpd",
    scores: {
      scores: { Plan_Tendency: "Strong_Dreamer" },
      summary: { Plan_Descriptor: "Exact saved description" },
    },
  };
  r = await get("?review=new&key=valid&view=snapshot");
  text = await r.text();
  assert(text.includes("Strong Dreamer"));
  assert(text.includes("Exact saved description"));
  console.log(
    "PASS snapshot score/label fidelity, no duplicate highlights or arbitrary gift bars, explicit PDF separation, authorization/foreign denial, real PDF archival, expired-link recovery, origin check and full-template generation without email.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
