import {createHash} from "node:crypto";
import {
  archiveReportPdf,
  type StoredReport,
} from "@/lib/assessments/report-storage";
import { sendApplicationEmail as sendResendEmail } from "@/lib/lifecycle/application-mail";
import {
  createPdfMonkeyDocument,
  getPdfMonkeyDocument,
  type PdfMonkeyDocument,
} from "@/lib/pdfmonkey/client";
export function cleanReportFilename(value: string) {
  return value
    .replace(/[^\w .'-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function pdfMonkeyReportLink(document: PdfMonkeyDocument) {
  return (
    document.public_share_link ??
    document.download_url ??
    document.preview_url ??
    ""
  );
}
export async function waitForPdfMonkeyDocument(
  documentId: string,
  attempts = 18,
) {
  let document = await getPdfMonkeyDocument(documentId);
  for (
    let attempt = 0;
    attempt < attempts &&
    ["pending", "generating"].includes(String(document.status));
    attempt += 1
  ) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    document = await getPdfMonkeyDocument(documentId);
  }
  return document;
}
export async function createReadyPdfMonkeyReport({
  filename,
  payload,
  templateId,
  archiveKey,
}: {
  filename: string;
  payload: Record<string, unknown>;
  templateId: string;
  archiveKey?: string;
}) {
  const createdDocument = await createPdfMonkeyDocument({
    filename,
    payload,
    templateId,
  });
  const readyDocument = await waitForPdfMonkeyDocument(createdDocument.id);
  const providerUrl = pdfMonkeyReportLink(readyDocument);
  let storage: StoredReport | undefined;
  let archiveError: string | undefined;
  if (
    archiveKey &&
    providerUrl &&
    ["ready", "success"].includes(String(readyDocument.status))
  ) {
    try {
      storage = await archiveReportPdf(
        readyDocument.download_url ?? providerUrl,
        archiveKey,
        filename,
      );
    } catch (error) {
      archiveError =
        error instanceof Error ? error.message : "PDF archive failed";
    }
  }
  return {
    storage,
    archiveError,
    document: readyDocument,
    providerUrl,
    ready: ["ready", "success"].includes(String(readyDocument.status)),
  };
}
export async function sendAssessmentReportEmail({
  assessmentName,
  participantEmail,
  participantName,
  reportUrl,
}: {
  assessmentName: string;
  participantEmail: string;
  participantName: string;
  reportUrl: string;
}) {
  const signInNote = assessmentName === "DesignID"
    ? "Sign in with the same account you used to complete DesignID. Your report is also available in Field Kit."
    : "";
  const text = `Hi ${participantName},\n\nYour ${assessmentName} report is ready.\n\nOpen your report here: ${reportUrl}${signInNote ? `\n\n${signInNote}` : ""}\n\nSincerely,\nDiscover Your Divine Design Team`;
  return sendResendEmail({
    templateId: "B01-"+assessmentName.toLowerCase(),
    idempotencyKey:"assessment-report-"+createHash("sha256").update(participantEmail.toLowerCase()+"|"+reportUrl).digest("hex"),
    deliveryContext:{type:"assessment_report",reportUrl},
    html: [
      `<p>Hi ${participantName},</p>`,
      `<p>Your ${assessmentName} report is ready.</p>`,
      `<p><a href="${reportUrl}">Open your ${assessmentName} report</a></p>`,
      ...(signInNote ? [`<p>${signInNote}</p>`] : []),
      "<p>Sincerely,<br>Discover Your Divine Design Team</p>",
    ].join(""),
    subject: `Your ${assessmentName} report is ready`,
    text,
    to: participantEmail,
  });
}
