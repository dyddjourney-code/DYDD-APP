import { createSupabaseAdminClient } from "@/lib/supabase/admin";
export const reportBucket = "assessment-report-pdfs";
export type StoredReport = {
  bucket: string;
  path: string;
  filename: string;
  archivedAt: string;
  bytes: number;
};
/** Keep the real provider PDF, never a printed snapshot, in private durable storage. */
export async function archiveReportPdf(
  url: string,
  key: string,
  filename: string,
): Promise<StoredReport> {
  const parsed = new URL(url);
  const trustedHost =
    /^pdfmonkey-store\.s3[.-][a-z0-9.-]+\.amazonaws\.com$/.test(
      parsed.hostname,
    ) ||
    parsed.hostname === "pdfmonkey.io" ||
    parsed.hostname.endsWith(".pdfmonkey.io");
  if (!trustedHost)
    throw Error(
      "The PDF link does not belong to the configured report provider.",
    );
  if (parsed.protocol !== "https:")
    throw Error("The report provider did not return a secure PDF link.");
  const response = await fetch(url, {
    signal: AbortSignal.timeout(45000),
    redirect: "error",
    cache: "no-store",
  });
  if (!response.ok)
    throw Error(
      `The report provider could not supply the PDF (${response.status}).`,
    );
  const bytes = Buffer.from(await response.arrayBuffer());
  if (
    bytes.length > 40 * 1024 * 1024 ||
    bytes.subarray(0, 5).toString() !== "%PDF-"
  )
    throw Error("The report provider did not return an actual PDF file.");
  const path = `${key.replace(/[^a-zA-Z0-9/_-]/g, "")}/report.pdf`;
  const s = createSupabaseAdminClient();
  const { error } = await s.storage
    .from(reportBucket)
    .upload(path, bytes, { contentType: "application/pdf", upsert: true });
  if (error)
    throw Error("Could not preserve the full PDF in your report library.");
  return {
    bucket: reportBucket,
    path,
    filename,
    archivedAt: new Date().toISOString(),
    bytes: bytes.length,
  };
}
export async function storedReportUrl(
  artifact: StoredReport,
  download = false,
) {
  if (artifact.bucket !== reportBucket || !artifact.path) return null;
  const { data, error } = await createSupabaseAdminClient()
    .storage.from(reportBucket)
    .createSignedUrl(
      artifact.path,
      300,
      download ? { download: artifact.filename } : undefined,
    );
  return error ? null : data.signedUrl;
}
