"use server";
import { hasIncludedPersonalAccess } from "@/lib/commerce/personal-access";
import crypto from "node:crypto";
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
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
export async function saveDesignPdResponse(formData: FormData) {
  const origin = courseOrigin(String(formData.get("origin") ?? ""));
  function fail(message: string): never {
    redirect(`/designpd?origin=${origin}&message=${encodeURIComponent(message)}`);
  }
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/designpd?origin=${origin}`)}`);
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
  if (!await hasIncludedPersonalAccess(user.id) && !isDyddAdminEmail(user.email)) {
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
    sourceResponseId,
    summary: sections.summary,
  };
  const { data: snapshot, error: snapshotError } = await supabase
    .from("assessment_snapshots")
    .insert({
      assessment_type: "designpd",
      participant_id: participantId,
      scores: snapshotScores,
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
  } catch (error) {
    pdfMetadata = {
      ...pdfMetadata,
      error: error instanceof Error ? error.message : "Unable to generate DesignPD PDF.",
      reportAccessUrl,
      status: "error",
    };
  }
  const savedSnapshotId = snapshot.id;
  const ownerId = user.id;
  async function persistReportState(includeReport = true) {
    const { data: current, error: readError } = await supabase.from("assessment_snapshots")
      .select("scores").eq("id", savedSnapshotId).eq("user_id", ownerId).single();
    if (readError || !current) fail("Your result is saved, but its report status could not be read. Open Field Kit or contact support.");
    const { data, error } = await supabase.from("assessment_snapshots")
      .update({ scores: { ...current.scores,
        ...(includeReport ? { pdfMonkey: pdfMetadata, reportAccessUrl } : {}),
        resultEmail: emailMetadata } })
      .eq("id", savedSnapshotId).eq("user_id", ownerId).select("id").single();
    if (error || !data) fail("Your result is saved, but its report status could not be saved. Open Field Kit or contact support.");
  }
  // Persist the ready artifact BEFORE enqueueing/sending its URL. An immediate
  // click or a deferred lifecycle send must see the same durable saved report.
  await persistReportState();
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
    await persistReportState(false);
  }
  redirect(`/designpd/thanks?snapshot=${encodeURIComponent(snapshot.id)}&origin=${origin}`);
}
