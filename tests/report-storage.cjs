const assert = require("node:assert/strict"),
  load = require("../scripts/fruitlife-test-load.cjs");
let sent,
  valid = true;
global.fetch = async () =>
  new Response(
    valid
      ? Buffer.from("%PDF-1.7\nreal provider report")
      : Buffer.from("<html>Expired</html>"),
    { status: 200 },
  );
const storage = load("lib/assessments/report-storage.ts", {
  "@/lib/supabase/admin": {
    createSupabaseAdminClient: () => ({
      storage: {
        from: (bucket) => ({
          upload: async (path, bytes, options) => {
            sent = { bucket, path, bytes, options };
            return { error: null };
          },
          createSignedUrl: async () => ({
            data: { signedUrl: "https://storage.test/signed" },
          }),
        }),
      },
    }),
  },
});
(async () => {
  const a = await storage.archiveReportPdf(
    "https://pdfmonkey-store.s3.eu-west-3.amazonaws.com/report.pdf",
    "designid/id",
    "DesignID Report.pdf",
  );
  assert.equal(sent.bucket, "assessment-report-pdfs");
  assert(sent.bytes.subarray(0, 5).toString() === "%PDF-");
  assert.equal(sent.options.contentType, "application/pdf");
  assert(a.bytes > 20);
  assert.equal(await storage.storedReportUrl(a), "https://storage.test/signed");
  assert.equal(
    await storage.storedReportUrl({ ...a, bucket: "unrelated-private-data" }),
    null,
  );
  valid = false;
  await assert.rejects(
    () =>
      storage.archiveReportPdf(
        "https://pdfmonkey-store.s3.eu-west-3.amazonaws.com/expired",
        "id",
        "report.pdf",
      ),
    /actual PDF/,
  );
  await assert.rejects(
    () =>
      storage.archiveReportPdf(
        "http://pdfmonkey-store.s3.eu-west-3.amazonaws.com/report",
        "id",
        "report.pdf",
      ),
    /secure PDF/,
  );
  console.log(
    "PASS real PDF magic-byte validation, private bucket archive, signed access and rejection of HTML/unsafe transport/unrelated buckets.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
