import { sendResendEmail } from "@/lib/email/resend";
import {
  createPdfMonkeyDocument,
  getPdfMonkeyDocument,
  type PdfMonkeyDocument,
} from "@/lib/pdfmonkey/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ReportJob = {
  attempt_count: number;
  id: string;
  payload: Record<string, unknown>;
  session_id: string;
};

type FruitLifeSession = {
  participant_email: string | null;
  participant_name: string | null;
};

const fruitLifeTemplateId =
  process.env.FRUITLIFE_PDFMONKEY_TEMPLATE_ID ?? "84de6c4d-e279-42e5-a5cc-28248d1149dd";

function cleanFilename(value: string) {
  return value.replace(/[^\w .'-]+/g, " ").replace(/\s+/g, " ").trim();
}

function reportFilename(session: FruitLifeSession, jobId: string) {
  const participant = cleanFilename(session.participant_name ?? "FruitLife Participant");
  return `FruitLife 360 - ${participant} - ${jobId.slice(0, 8)}.pdf`;
}

function reportLink(document: PdfMonkeyDocument) {
  return document.public_share_link ?? document.download_url ?? document.preview_url ?? "";
}

function appBaseUrl() {
  const configuredUrl =
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    "https://dydd-online-school.vercel.app";
  return configuredUrl.startsWith("http") ? configuredUrl : `https://${configuredUrl}`;
}

function finalReportEmail({
  participantName,
  reportUrl,
}: {
  participantName: string;
  reportUrl: string;
}) {
  const text = `Hi ${participantName},\n\nYour FruitLife 360 report is ready.\n\nOpen your report here: ${reportUrl}\n\nReceive it as a formation mirror, not a grade or label.\n\nSincerely,\nDiscover Your Divine Design Team`;

  return {
    html: [
      `<p>Hi ${participantName},</p>`,
      "<p>Your FruitLife 360 report is ready.</p>",
      `<p><a href="${reportUrl}">Open Your FruitLife 360 Report</a></p>`,
      "<p>Receive it as a formation mirror, not a grade or label.</p>",
      "<p>Sincerely,<br>Discover Your Divine Design Team</p>",
    ].join(""),
    subject: "Your FruitLife 360 report is ready",
    text,
  };
}

async function waitForPdf(documentId: string, dryRun: boolean) {
  if (dryRun) {
    return null;
  }

  let document = await getPdfMonkeyDocument(documentId);

  for (
    let attempt = 0;
    attempt < 30 && ["pending", "generating"].includes(String(document.status));
    attempt += 1
  ) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    document = await getPdfMonkeyDocument(documentId);
  }

  return document;
}

export async function processFruitLifeReportJobs({
  dryRun = false,
  limit = 3,
}: {
  dryRun?: boolean;
  limit?: number;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: jobs, error: jobsError } = await supabase
    .from("fruitlife_360_report_jobs")
    .select("id,session_id,payload,attempt_count")
    .in("job_status", ["queued", "retry"])
    .order("queued_at", { ascending: true })
    .limit(limit);

  if (jobsError) {
    throw new Error(jobsError.message);
  }

  const results = [];

  for (const job of ((jobs ?? []) as ReportJob[])) {
    const now = new Date().toISOString();
    const workerId = `fruitlife-report-worker:${now}`;

    if (!dryRun) {
      const { data: lockedJob } = await supabase
        .from("fruitlife_360_report_jobs")
        .update({
          attempt_count: job.attempt_count + 1,
          job_status: "processing",
          locked_at: now,
          locked_by: workerId,
          started_at: now,
        })
        .eq("id", job.id)
        .in("job_status", ["queued", "retry"])
        .select("id")
        .maybeSingle();

      if (!lockedJob?.id) {
        results.push({
          jobId: job.id,
          skipped: true,
          status: "already_locked_or_processed",
        });
        continue;
      }
    }

    try {
      const { data: session, error: sessionError } = await supabase
        .from("fruitlife_360_sessions")
        .select("participant_email,participant_name")
        .eq("id", job.session_id)
        .single();

      if (sessionError || !session) {
        throw new Error(sessionError?.message ?? "FruitLife session was not found.");
      }

      const typedSession = session as FruitLifeSession;
      const filename = reportFilename(typedSession, job.id);
      const createdDocument = dryRun
        ? {
            filename,
            id: "dry-run",
            status: "ready",
          }
        : await createPdfMonkeyDocument({
            filename,
            payload: job.payload,
            templateId: fruitLifeTemplateId,
          });
      const readyDocument = dryRun
        ? createdDocument
        : (await waitForPdf(createdDocument.id, dryRun)) ?? createdDocument;
      const url = reportLink(readyDocument);
      const isReady = readyDocument.status === "success" || readyDocument.status === "ready";
      const reportUrl = isReady
        ? `${appBaseUrl()}/fruitlife360/report?session=${encodeURIComponent(job.session_id)}`
        : "";

      if (!dryRun) {
        const { data: existingPdf } = await supabase
          .from("fruitlife_360_report_artifacts")
          .select("id")
          .eq("report_job_id", job.id)
          .eq("artifact_type", "pdf")
          .limit(1)
          .maybeSingle();

        if (!existingPdf?.id) {
          await supabase.from("fruitlife_360_report_artifacts").insert({
            artifact_status: isReady ? "ready" : "draft",
            artifact_type: "pdf",
            content_type: "application/pdf",
            external_url: url || null,
            filename,
            metadata: {
              checksum: readyDocument.checksum ?? null,
              pdfMonkeyStatus: readyDocument.status ?? null,
              previewUrl: readyDocument.preview_url ?? null,
            },
            provider: "pdfmonkey",
            provider_document_id: readyDocument.id,
            report_job_id: job.id,
            session_id: job.session_id,
          });
        }
      }

      let emailSent = false;
      let emailSkipped = true;
      let emailMessage = "PDF is not ready yet.";

      if (isReady && reportUrl && typedSession.participant_email) {
        const { data: existingFinalEmail } = dryRun
          ? { data: null }
          : await supabase
              .from("fruitlife_360_report_artifacts")
              .select("id")
              .eq("report_job_id", job.id)
              .eq("artifact_type", "email")
              .eq("provider", "resend")
              .contains("metadata", { purpose: "final_report_email" })
              .limit(1)
              .maybeSingle();

        const emailResult = dryRun
          ? { message: "Dry run; final email not sent.", sent: false, skipped: true }
          : existingFinalEmail?.id
            ? { message: "Final report email already sent for this job.", sent: false, skipped: true }
            : await sendResendEmail({
                ...finalReportEmail({
                  participantName: typedSession.participant_name ?? "there",
                  reportUrl,
                }),
                to: typedSession.participant_email,
              });

        emailSent = emailResult.sent;
        emailSkipped = emailResult.skipped;
        emailMessage = emailResult.message ?? "";

        if (!dryRun && !existingFinalEmail?.id) {
          await supabase.from("fruitlife_360_report_artifacts").insert({
            artifact_status: emailResult.sent ? "sent" : emailResult.skipped ? "draft" : "error",
            artifact_type: "email",
            external_url: reportUrl,
            metadata: {
              error: emailResult.message ?? null,
              purpose: "final_report_email",
              resendSkipped: emailResult.skipped,
              resendSent: emailResult.sent,
            },
            provider: "resend",
            provider_document_id: emailResult.id ?? null,
            report_job_id: job.id,
            session_id: job.session_id,
          });
        }
      }

      if (!dryRun) {
        await supabase
          .from("fruitlife_360_report_jobs")
          .update({
            completed_at: isReady && emailSent ? new Date().toISOString() : null,
            job_status: isReady && emailSent ? "sent" : isReady ? "ready" : "retry",
            last_error: isReady ? null : readyDocument.failure_cause ?? "PDFMonkey document is not ready yet.",
          })
          .eq("id", job.id);

        await supabase
          .from("fruitlife_360_sessions")
          .update({
            report_status: isReady && emailSent ? "sent" : isReady ? "ready" : "queued",
            report_url: url || null,
            session_status: isReady && emailSent ? "report_sent" : isReady ? "report_ready" : "ready_for_report",
          })
          .eq("id", job.session_id);
      }

      results.push({
        documentId: readyDocument.id,
        emailSent,
        emailSkipped,
        emailMessage,
        filename,
        jobId: job.id,
        pdfReady: isReady,
        status: readyDocument.status,
        url: Boolean(url),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown FruitLife report worker error.";

      if (!dryRun) {
        await supabase
          .from("fruitlife_360_report_jobs")
          .update({
            job_status: job.attempt_count >= 5 ? "error" : "retry",
            last_error: message,
          })
          .eq("id", job.id);
      }

      results.push({
        error: message,
        jobId: job.id,
        pdfReady: false,
      });
    }
  }

  return {
    dryRun,
    processed: results.length,
    results,
  };
}
