"use server";
import crypto from "node:crypto";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  cleanReportFilename,
  createReadyPdfMonkeyReport,
  sendAssessmentReportEmail,
} from "@/lib/assessment-reporting";
import {
  getAssessmentSnapshotsForUser,
  latestByAssessment,
} from "@/lib/assessments/student-context";
import { designPdScoringVersion, scoreDesignPd } from "@/lib/designpd/engine";
import {
  buildDesignPdReportPayload,
  designPdSnapshotSections,
  designPdContentVersion,
  designPdTemplateId,
} from "@/lib/designpd/report";
import { normalizeEmail } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const productionAppUrl = "https://dydd-online-school.vercel.app";
function fail(message: string): never {
  redirect(`/designpd?message=${encodeURIComponent(message)}`);
}
async function getAppBaseUrl() {
  const requestHeaders = await headers();
  const configuredUrl =
    process.env.DYDD_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelUrl)
    return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  return (
    requestHeaders.get("origin")?.replace(/\/$/, "") ??
    (process.env.NODE_ENV === "production"
      ? productionAppUrl
      : "http://localhost:3000")
  );
}
export async function saveDesignPdResponse(formData: FormData) {
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/designpd")}`);
  }
  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("school_profiles")
    .select("full_name,email")
    .eq("id", user.id)
    .maybeSingle();
  const participantEmail = normalizeEmail(profile?.email ?? user.email);
  const authDisplayName = String(
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
  ).trim();
  const participantName =
    profile?.full_name?.trim() ||
    authDisplayName ||
    user.email?.split("@")[0] ||
    "DesignPD Participant";
  if (!participantEmail) {
    fail("Your account needs an email address before starting DesignPD.");
  }
  const assessmentReport = await getAssessmentSnapshotsForUser(
    user.id,
    participantEmail,
  );
  const designIdSnapshot = latestByAssessment(assessmentReport.all).find(
    (snapshot) => snapshot.assessment_type === "designid",
  );
  if (!designIdSnapshot) {
    fail("Complete DesignID before starting DesignPD.");
  }
  // Existing reports remain accessible; generating for a new DesignID requires
  // a per-attempt unlock. Stripe fulfillment is intentionally not enabled yet.
  if (!isDyddAdminEmail(user.email)) {
    const existing = assessmentReport.all.find(
      (snapshot) =>
        snapshot.assessment_type === "designpd" &&
        snapshot.scores.designIdSnapshotId === designIdSnapshot.id &&
        snapshot.scores.contentVersion === designPdContentVersion &&
        ["success", "ready"].includes(
          String(
            (snapshot.scores.pdfMonkey as Record<string, unknown> | undefined)
              ?.status,
          ),
        ),
    );
    if (existing)
      redirect(`/designpd/report?snapshot=${encodeURIComponent(existing.id)}`);
    fail(
      "DesignPD is a $15 add-on for each DesignID result. Checkout is not available yet.",
    );
  }
  let result;
  let reportPayload;
  try {
    result = scoreDesignPd(designIdSnapshot);
    reportPayload = buildDesignPdReportPayload({
      designIdSnapshot,
      participantEmail,
      participantName,
      result,
    });
  } catch (error) {
    fail(
      error instanceof Error
        ? error.message
        : "Unable to score this DesignPD assessment.",
    );
  }
  const now = new Date().toISOString();
  const sourceResponseId = `designpd_app:${user.id}:${crypto.randomUUID()}`;
  const { data: participant, error: participantError } = await supabase
    .from("assessment_participants")
    .upsert(
      {
        display_name: participantName,
        normalized_email: participantEmail,
        user_id: user.id,
        updated_at: now,
      },
      { onConflict: "normalized_email" },
    )
    .select("id")
    .single();
  if (participantError || !participant?.id) {
    fail(
      participantError?.message ?? "Unable to connect your DesignPD record.",
    );
  }
  const sections = designPdSnapshotSections(result, reportPayload);
  const { data: snapshot, error: snapshotError } = await supabase
    .from("assessment_snapshots")
    .insert({
      assessment_type: "designpd",
      participant_id: participant.id,
      scores: {
        axisScores: result.axisScores,
        axisTendencies: result.axisTendencies,
        channel: "native_app",
        contentVersion: designPdContentVersion,
        reportPayload,
        reportPayloadFormat: "template-v1",
        reportTemplateId: designPdTemplateId,
        designIdSnapshotId: designIdSnapshot.id,
        profileLanguage: sections.profileLanguage,
        questionVersion: "designpd-derived-from-designid-v1",
        scoringVersion: designPdScoringVersion,
        movement: result.movement,
        ratings: result.ratings,
        sourceResponseId,
        summary: sections.summary,
      },
      source: "designpd_app",
      source_response_id: sourceResponseId,
      source_submitted_at: now,
      sync_batch_id: "native-app",
      user_id: user.id,
    })
    .select("id")
    .single();
  if (snapshotError || !snapshot?.id) {
    fail(snapshotError?.message ?? "Unable to save your DesignPD result.");
  }
  const reportAccessUrl = `${await getAppBaseUrl()}/designpd/report?snapshot=${encodeURIComponent(snapshot.id)}`;
  const pdfFilename = `DesignPD Report - ${cleanReportFilename(participantName)} - ${snapshot.id.slice(0, 8)}.pdf`;
  let pdfMetadata: Record<string, unknown> = {
    filename: pdfFilename,
    status: "not_started",
  };
  let emailMetadata: Record<string, unknown> = {};
  try {
    const report = await createReadyPdfMonkeyReport({
      archiveKey: `designpd/${snapshot.id}`,
      filename: pdfFilename,
      payload: reportPayload,
      templateId: designPdTemplateId,
    });
    pdfMetadata = {
      storage: report.storage ?? null,
      archiveError: report.archiveError ?? null,
      checksum: report.document.checksum ?? null,
      documentId: report.document.id,
      error: report.document.failure_cause ?? null,
      filename: pdfFilename,
      providerUrl: report.providerUrl || null,
      reportAccessUrl,
      status: report.document.status ?? null,
    };
    if (
      report.ready &&
      (!isDyddAdminEmail(user.email) || formData.get("emailReport") === "yes")
    ) {
      const email = await sendAssessmentReportEmail({
        assessmentName: "DesignPD",
        participantEmail,
        participantName,
        reportUrl: reportAccessUrl,
      });
      emailMetadata = {
        error: email.message ?? null,
        resendId: email.id ?? null,
        sent: email.sent,
        skipped: email.skipped,
      };
    } else if (report.ready) {
      emailMetadata = {
        sent: false,
        skipped: true,
        reason: "owner_review_without_email",
      };
    }
  } catch (error) {
    pdfMetadata = {
      ...pdfMetadata,
      error:
        error instanceof Error
          ? error.message
          : "Unable to generate DesignPD PDF.",
      reportAccessUrl,
      status: "error",
    };
  }
  await supabase
    .from("assessment_snapshots")
    .update({
      scores: {
        axisScores: result.axisScores,
        axisTendencies: result.axisTendencies,
        channel: "native_app",
        contentVersion: designPdContentVersion,
        reportPayload,
        reportTemplateId: designPdTemplateId,
        designIdSnapshotId: designIdSnapshot.id,
        pdfMonkey: pdfMetadata,
        reportPayloadFormat: "template-v1",
        profileLanguage: sections.profileLanguage,
        questionVersion: "designpd-derived-from-designid-v1",
        scoringVersion: designPdScoringVersion,
        movement: result.movement,
        ratings: result.ratings,
        reportAccessUrl,
        resultEmail: emailMetadata,
        sourceResponseId,
        summary: sections.summary,
      },
    })
    .eq("id", snapshot.id);
  redirect(`/designpd/thanks?snapshot=${encodeURIComponent(snapshot.id)}`);
}
