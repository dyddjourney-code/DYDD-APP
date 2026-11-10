import "server-only";
import type { User } from "@supabase/supabase-js";
import { hasPublicAssessmentEntitlement } from "@/lib/public-assessments/ledger";
import { isSandbox } from "@/lib/environment";
import { hasTestEntitlement } from "@/lib/commerce/test-entitlements";
import { hasIncludedPersonalAccess } from "@/lib/commerce/personal-access";
import { matchingReadyDesignPd, designPdPendingUnlockMessage, type DesignPdReservation } from "@/lib/designpd/generation";
import { courseOrigin } from "@/lib/trails/course-origin";
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
  findOrAttachParticipant,
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
const productionAppUrl = "https://dydd-online-school.vercel.app";
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
export async function generateDesignPdForUser(user: User, formData: FormData, background = false) {
  if (!user.email_confirmed_at) redirect("/assessments/designpd?message=Verify+your+account+email+first");
  const origin = courseOrigin(String(formData.get("origin") ?? ""));
  const selectedDesignId = String(formData.get("designIdSnapshotId") || "");
  function fail(message: string): never {
    if (background) throw new Error(message);
    redirect(`/designpd?origin=${origin}&snapshot=${encodeURIComponent(selectedDesignId)}&message=${encodeURIComponent(message)}`);
  }
  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("school_profiles")
    .select("full_name,email")
    .eq("id", user.id)
    .maybeSingle();
  const participantEmail = normalizeEmail(user.email);
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
  const designIdSnapshot = (selectedDesignId ? assessmentReport.all : latestByAssessment(assessmentReport.all)).find(
    (snapshot) => snapshot.assessment_type === "designid" && (!selectedDesignId || snapshot.id === selectedDesignId),
  );
  if (!designIdSnapshot) {
    fail("Complete DesignID before starting DesignPD.");
  }
  // A sandbox source-template preview is already a saved derived result, not a
  // failed provider job to repeat. Reopen it without a new reservation/email.
  const sandboxSaved = isSandbox() ? assessmentReport.all.find(snapshot => snapshot.assessment_type === "designpd" && snapshot.scores.designIdSnapshotId === designIdSnapshot.id && snapshot.scores.contentVersion === designPdContentVersion && snapshot.scores.reportPayload && String((snapshot.scores.pdfMonkey as Record<string,unknown> | undefined)?.error || "").startsWith("Sandbox report preview is available")) : null;
  if (sandboxSaved && background) return sandboxSaved.id;
  if (sandboxSaved) redirect(`/assessments/report/${encodeURIComponent(sandboxSaved.id)}`);
  // Reopening never creates a job, sends mail, or consumes an unlock.
  const existing = matchingReadyDesignPd(assessmentReport.all, designIdSnapshot.id, designPdContentVersion);
  if (existing && background) return existing.id;
  if (existing) redirect(`/designpd/report?snapshot=${encodeURIComponent(existing.id)}`);
  const publicAccess = await hasPublicAssessmentEntitlement(user.id,"designpd",designIdSnapshot.id);
  // Legacy TEST entitlements remain exact-source scoped. A future account unlock
  // needs an explicit commercial migration; never infer it from a prior payment.
  if (!await hasIncludedPersonalAccess(user.id) && !isDyddAdminEmail(user.email) && !await hasTestEntitlement(user.id,"designpd",designIdSnapshot.id) && !publicAccess) {
    fail(designPdPendingUnlockMessage);
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
  let participantId = await findOrAttachParticipant(user.id, participantEmail);
  if (!participantId) {
    // Never upsert user_id on email conflict: that can reassign another account's
    // participant and strand (or expose) previously emailed report links.
    const { data: participant, error: participantError } = await supabase
      .from("assessment_participants")
      .insert({ display_name: participantName, normalized_email: participantEmail,
        user_id: user.id, updated_at: now })
      .select("id").single();
    if (participantError || !participant?.id)
      fail("Unable to connect your DesignPD record. Please contact support.");
    participantId = participant.id;
  }
  const sections = designPdSnapshotSections(result, reportPayload);
  const snapshotScores = {
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
    summary: sections.summary,
  };
  const { data: reservationData, error: reservationError } = await supabase.rpc("reserve_designpd_generation", {
    p_user: user.id, p_source: designIdSnapshot.id, p_version: designPdContentVersion,
    p_participant: participantId, p_scores: snapshotScores,
  });
  if (reservationError || !reservationData) fail("Your report could not be reserved. Please retry; no new generation was started.");
  const reservation = reservationData as DesignPdReservation;
  if (reservation.status === "ready" && background) return reservation.snapshotId;
  if (reservation.status === "ready") redirect(`/designpd/report?snapshot=${encodeURIComponent(reservation.snapshotId)}`);
  if (reservation.status !== "reserved" || !reservation.token) {
    fail(reservation.status === "retry_later" ? "This report failed. Wait one minute before retrying the same saved report."
      : reservation.status === "exhausted" ? "This report has reached its technical retry limit. Your saved result is preserved; contact support."
      : "This report is already being prepared or needs technical recovery. Open the saved report in Field Kit; no duplicate generation was started.");
  }
  const snapshot = { id: reservation.snapshotId };
  const reportAccessUrl = `${await getAppBaseUrl()}/designpd/report?snapshot=${encodeURIComponent(snapshot.id)}`;
  const pdfFilename = `DesignPD Report - ${cleanReportFilename(participantName)} - ${snapshot.id.slice(0, 8)}.pdf`;
  let pdfMetadata: Record<string, unknown> = {
    filename: pdfFilename,
    status: "not_started",
  };
  let emailMetadata: Record<string, unknown> = {};
  try {
    if (isSandbox()) throw new Error("Sandbox report preview is available; paid PDF generation and customer email remain disconnected.");
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
  } catch (error) {
    pdfMetadata = {
      ...pdfMetadata,
      error: error instanceof Error ? error.message : "Unable to generate DesignPD PDF.",
      reportAccessUrl,
      status: isSandbox() ? "failure" : "error",
    };
  }
  const savedSnapshotId = snapshot.id;
  const ownerId = user.id;
  // Atomically save artifact metadata and close the reservation BEFORE email.
  const { data: finished, error: finishError } = await supabase.rpc(publicAccess ? "finish_public_designpd_generation" : "finish_designpd_generation", {
    p_user: user.id, p_source: designIdSnapshot.id, p_version: designPdContentVersion,
    p_token: reservation.token, p_pdf: pdfMetadata, p_report_url: reportAccessUrl,
  });
  if (finishError || finished !== true) fail("Your result is saved, but its report status needs recovery. Open Field Kit or contact support; do not create another report.");
  async function persistEmailState() {
    const { data: current, error: readError } = await supabase.from("assessment_snapshots")
      .select("scores").eq("id", savedSnapshotId).eq("user_id", ownerId).single();
    if (readError || !current) fail("Your report is saved, but its email status could not be read.");
    const { data, error } = await supabase.from("assessment_snapshots")
      .update({ scores: { ...current.scores, resultEmail: emailMetadata } })
      .eq("id", savedSnapshotId).eq("user_id", ownerId).select("id").single();
    if (error || !data) fail("Your report is saved, but its email status could not be saved.");
  }
  if (["ready", "success"].includes(String(pdfMetadata.status))) {
    if (!isDyddAdminEmail(user.email) || formData.get("emailReport") === "yes") {
      try {
        const email = await sendAssessmentReportEmail({ assessmentName: "DesignPD",
          participantEmail, participantName, reportUrl: reportAccessUrl });
        emailMetadata = { error: email.message ?? null, resendId: email.id ?? null,
          sent: email.sent, skipped: email.skipped };
      } catch (error) {
        // Email failure must not turn an already-ready PDF into a failed report.
        emailMetadata = { sent: false, skipped: false,
          error: error instanceof Error ? error.message : "Unable to email your report link." };
      }
    } else {
      emailMetadata = { sent: false, skipped: true, reason: "owner_review_without_email" };
    }
    await persistEmailState();
  }
  if (background) return snapshot.id;
  if (isSandbox()) redirect(`/assessments/report/${encodeURIComponent(snapshot.id)}`);
  redirect(`/designpd/thanks?snapshot=${encodeURIComponent(snapshot.id)}&origin=${origin}`);
}
