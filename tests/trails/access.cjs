const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function load(file, dependencies) {
  const mod = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("require", "module", "exports", js)(
    (name) => {
      if (!(name in dependencies)) throw Error(`Unexpected import ${name}`);
      return dependencies[name];
    },
    mod,
    mod.exports,
  );
  return mod.exports;
}
const catalog = load("lib/trails/catalog.ts", {});
const pd = load("lib/designpd/access.ts", {
  "@/lib/admin-access": {
    isDyddAdminEmail: (email) => email === "owner@example.test",
  },
});
let nativeReports = [];
const { requireTrailCourseAssessment: guard } = load(
  "lib/trails/course-access.ts",
  {
    "next/navigation": {
      redirect: (href) => {
        throw Object.assign(new Error("redirect"), { href });
      },
    },
    "@/lib/fruitlife360/dashboard": {
      getFruitLifeDashboardSessions: async () => nativeReports,
      fruitLifeReportArtifact: (s) => s.ready,
    },
    "@/lib/designpd/access": pd,
    "./catalog": catalog,
    "@/lib/review/heather": { withReviewQuery: (path) => path },
  },
);
const snapshot = (type, extra = {}) => ({
  assessment_type: type,
  id: type,
  created_at: "2026-10-15",
  scores: {},
  source: "legacy",
  source_submitted_at: null,
  ...extra,
});
async function denied(args, pattern) {
  await assert.rejects(
    () =>
      guard({
        snapshots: [],
        email: "test@example.test",
        signedIn: true,
        preview: false,
        ...args,
      }),
    (e) => pattern.test(e.href),
  );
}
(async () => {
  let count = 0;
  for (const trail of catalog.trailDefinitions) {
    await denied(
      { slug: trail.courseSlug },
      new RegExp(`/trailheads#${trail.id}`),
    );
    count++;
    await denied({ slug: trail.courseSlug, signedIn: false }, /login/);
    count++;
    await guard({
      slug: trail.courseSlug,
      snapshots: [snapshot(trail.assessmentType)],
      email: "test@example.test",
      signedIn: true,
      preview: false,
    });
    count++;
  }
  await denied(
    { slug: "designpd-alignment", snapshots: [snapshot("designid")] },
    /#designpd/,
  );
  count++;
  await denied(
    { slug: "designpd-alignment", email: "owner@example.test" },
    /#designpd/,
  );
  count++;
  await denied(
    {
      slug: "designpd-alignment",
      snapshots: [
        snapshot("designpd", {
          source: "designpd_app",
          scores: { pdfMonkey: { status: "pending" } },
        }),
      ],
    },
    /#designpd/,
  );
  count++;
  await guard({
    slug: "designpd-alignment",
    snapshots: [
      snapshot("designpd", {
        source: "designpd_app",
        scores: { pdfMonkey: { status: "ready" } },
      }),
    ],
    email: "test@example.test",
    signedIn: true,
    preview: false,
  });
  count++;
  await denied(
    {
      slug: "designpd-alignment",
      signedIn: false,
      preview: true,
      snapshots: [snapshot("designpd")],
    },
    /login/,
  );
  count++;
  await denied(
    { slug: "fruitlife-360-formation", params: { lane: "fruitlife" } },
    /\?lane=fruitlife#fruitlife-360/,
  );
  count++;
  nativeReports = [{ ready: true }];
  await guard({
    slug: "fruitlife-360-formation",
    snapshots: [],
    email: "test@example.test",
    signedIn: true,
    preview: false,
  });
  count++;
  nativeReports = [{ ready: false }];
  await denied({ slug: "fruitlife-360-formation" }, /#fruitlife-360/);
  count++;
  console.log(
    `PASS ${count} assessment-first access cases: fresh, completed, native report, pending report, expansion, anonymous, preview, owner, mini lane.`,
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

// Review links keep credentials in the query string, before the fragment.
const review = load("lib/review/heather.ts", {
  "@/lib/assessments/student-context": {},
});
const previousToken = process.env.DYDD_REVIEW_TOKEN;
process.env.DYDD_REVIEW_TOKEN = "test-review-link-token";
const params = { review: "new", key: "test-review-link-token" };
assert.equal(
  review.withReviewQuery("/trailheads#designid", params),
  "/trailheads?review=new&key=test-review-link-token#designid",
);
assert.equal(
  review.withReviewQuery("/trailheads?lane=fruitlife#fruitlife-360", params),
  "/trailheads?lane=fruitlife&review=new&key=test-review-link-token#fruitlife-360",
);
if (previousToken === undefined) delete process.env.DYDD_REVIEW_TOKEN;
else process.env.DYDD_REVIEW_TOKEN = previousToken;
console.log("PASS review query/fragment preservation.");
