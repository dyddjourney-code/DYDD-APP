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
  created_by_user_id: string | null;
  id: string;
  participant_id: string;
  participant_email: string | null;
  participant_name: string | null;
  source_participant_id: string | null;
};

type FruitLifeSessionBackfill = FruitLifeSession & {
  report_snapshot_id: string | null;
  report_status: string;
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

function stringPayload(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return value === null || value === undefined ? "" : String(value);
}

function numberPayload(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(String(value ?? "").replaceAll(",", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function fruitLifeSnapshotScores(payload: Record<string, unknown>) {
  return {
    profileLanguage: {
      Overview_Note: stringPayload(payload, "overview_note"),
    },
    scores: {
      Observer_Count: numberPayload(payload, "observer_count"),
      Observer_Overall: numberPayload(payload, "observer_overall"),
      Overall_Gap: numberPayload(payload, "overall_gap"),
      Response_Count: numberPayload(payload, "response_count"),
      Self_Overall: numberPayload(payload, "self_overall"),
    },
    summary: {
      Growth_Invitation_Fruit_List: stringPayload(payload, "growth_invitation_fruit_list"),
      Growth_Invitations: stringPayload(payload, "growth_invitations"),
      Most_Visible_Fruit: stringPayload(payload, "most_visible_fruit"),
      Most_Visible_Fruit_List: stringPayload(payload, "most_visible_fruit_list"),
      Participant_ID: stringPayload(payload, "participant_id"),
      Pressure_Vulnerabilities: stringPayload(payload, "pressure_vulnerabilities"),
      Report_Date: stringPayload(payload, "report_date"),
      Report_Mode: stringPayload(payload, "report_mode"),
      Reviewer_Mix: stringPayload(payload, "reviewer_mix"),
      Steady_Forming_Fruit_List: stringPayload(payload, "steady_forming_fruit_list"),
    },
  };
}

async function upsertFruitLifeSnapshot({
  payload,
  session,
  supabase,
}: {
  payload: Record<string, unknown>;
  session: FruitLifeSession;
  supabase: ReturnType<typeof createSupabaseAdminClient>;
}) {
  const submittedAt = new Date().toISOString();
  const sourceResponseId = session.source_participant_id || `fruitlife_360_session:${session.id}`;
  const { data: snapshot, error } = await supabase
    .from("assessment_snapshots")
    .upsert(
      {
        assessment_type: "fruit_360",
        participant_id: session.participant_id,
        scores: fruitLifeSnapshotScores(payload),
        source: "fruitlife_360_native_app",
        source_response_id: sourceResponseId,
        source_submitted_at: submittedAt,
        user_id: session.created_by_user_id,
      },
      { onConflict: "assessment_type,source,source_response_id" },
    )
    .select("id")
    .single();

  if (error || !snapshot?.id) {
    throw new Error(error?.message ?? "Unable to save FruitLife assessment snapshot.");
  }

  return snapshot.id as string;
}

async function backfillReadyFruitLifeSnapshots({
  limit,
  supabase,
}: {
  limit: number;
  supabase: ReturnType<typeof createSupabaseAdminClient>;
}) {
  const { data: sessions, error } = await supabase
    .from("fruitlife_360_sessions")
    .select(
      "id,created_by_user_id,participant_id,participant_email,participant_name,source_participant_id,report_snapshot_id,report_status",
    )
    .is("report_snapshot_id", null)
    .in("report_status", ["ready", "sent"])
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const backfilled = [];

  for (const session of ((sessions ?? []) as FruitLifeSessionBackfill[])) {
    const { data: job } = await supabase
      .from("fruitlife_360_report_jobs")
      .select("id,payload,job_status")
      .eq("session_id", session.id)
      .in("job_status", ["ready", "sent"])
      .order("completed_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (!job?.payload || typeof job.payload !== "object" || Array.isArray(job.payload)) {
      continue;
    }

    const snapshotId = await upsertFruitLifeSnapshot({
      payload: job.payload as Record<string, unknown>,
      session,
      supabase,
    });

    await supabase
      .from("fruitlife_360_sessions")
      .update({ report_snapshot_id: snapshotId })
      .eq("id", session.id);

    backfilled.push({
      jobId: job.id as string,
      sessionId: session.id,
      snapshotId,
    });
  }

  return backfilled;
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
  const backfilledSnapshots = dryRun
    ? []
    : await backfillReadyFruitLifeSnapshots({ limit, supabase });
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
        .select("id,created_by_user_id,participant_id,participant_email,participant_name,source_participant_id")
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
      const snapshotId = !dryRun && isReady
        ? await upsertFruitLifeSnapshot({
            payload: job.payload,
            session: typedSession,
            supabase,
          })
        : null;

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
            ...(snapshotId ? { report_snapshot_id: snapshotId } : {}),
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
    backfilledSnapshots,
    dryRun,
    processed: results.length,
    results,
  };
}
