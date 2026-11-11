"use server";
import { standaloneDesignIdAccess } from "@/lib/public-assessments/access";
import crypto from "node:crypto";
import { claimVerifiedAssessmentParticipant } from "@/lib/public-assessments/identity";
import { isDyddAdminEmail } from "@/lib/admin-access";
import {
  applyDesignIdPresentation,
  designIdResearch,
} from "@/lib/designid/research";
import { designIdQuestionBank } from "@/lib/designid/intake";
import {
  mapsConfirmationItems,
  mapsConfirmationBuckets,
} from "@/lib/designid/maps-confirmation";
import { getDesignIdEligibility } from "@/lib/designid/retake";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  cleanReportFilename,
  createReadyPdfMonkeyReport,
  sendAssessmentReportEmail,
} from "@/lib/assessment-reporting";
import {
  designIdScoringVersion,
  designIdScorePayload,
  parseDesignIdAllocationAnswers,
  scoreDesignId,
} from "@/lib/designid/engine";
import {
  parseMapsConfirmation,
  scoreMapsConfirmation,
} from "@/lib/designid/maps-confirmation";
import {
  buildDesignIdReportPayload,
  designIdSnapshotSections,
} from "@/lib/designid/report";
import { designIdQuestionBlocks } from "@/lib/designid/intake";
import { normalizeEmail } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const productionAppUrl = "https://dydd-online-school.vercel.app";
const designIdTemplateId =
  process.env.DESIGNID_PDFMONKEY_TEMPLATE_ID ??
  "346a0595-80fa-48c3-a9e2-29f0c0312e6e";
function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
function fail(message: string): never {
  redirect(`/designid?message=${encodeURIComponent(message)}`);
}
async function getAppBaseUrl() {
  const requestHeaders = await headers();
  const configuredUrl =
    process.env.DYDD_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }
  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }
  const origin = requestHeaders.get("origin");
  if (origin) {
    return origin.replace(/\/$/, "");
  }
  return process.env.NODE_ENV === "production"
    ? productionAppUrl
    : "http://localhost:3000";
}
export async function saveDesignIdResponse(formData: FormData) {
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/designid")}`);
  }
  const standaloneAccess = await standaloneDesignIdAccess(user);
  if (!standaloneAccess.allowed) redirect("/assessments/designid");
  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("school_profiles")
    .select("full_name,email")
    .eq("id", user.id)
    .maybeSingle();
  const authDisplayName = String(
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
  ).trim();
  const participantName =
    profile?.full_name?.trim() ||
    authDisplayName ||
    user.email?.split("@")[0] ||
    "DesignID Participant";
  const participantEmail = normalizeEmail(user.email);
  if (!participantEmail) {
    fail("Your account needs an email address before starting DesignID.");
  }
  const eligibility = await getDesignIdEligibility(
    user.id,
    participantEmail,
    isDyddAdminEmail(user.email),
  );
  if (!eligibility.allowed)
    fail(
      `Your next DesignID assessment is available on ${eligibility.nextEligibleLabel}. Your existing report remains in Field Kit.`,
    );
  let result;
  let research;
  try {
    result = scoreDesignId(parseDesignIdAllocationAnswers(formData));
    result.mapsConfirmation = scoreMapsConfirmation(
      parseMapsConfirmation(formData),
      result,
    );
    research = designIdResearch(result, result.mapsConfirmation);
    result = applyDesignIdPresentation(result, research);
  } catch (error) {
    fail(
      error instanceof Error
        ? error.message
        : "Unable to score this DesignID assessment.",
    );
  }
  const now = new Date().toISOString();
  const sourceResponseId = `designid_app:${user.id}:${crypto.randomUUID()}`;
  if (!user.email_confirmed_at) fail("Verify your account email before completing DesignID.");
  let participant: { id: string };
  try { participant = await claimVerifiedAssessmentParticipant(user.id, participantEmail, participantName); }
  catch { fail("Unable to connect your verified assessment identity. Please contact support."); }
  const sections = designIdSnapshotSections(result);
  const reportPayload = buildDesignIdReportPayload({
    participantEmail,
    participantName,
    result,
  });
  const { data: snapshotId, error: snapshotError } = await supabase.rpc(
    standaloneAccess.standalone ? "save_public_designid_attempt" : "save_designid_attempt",
    {
      p_user_id: user.id,
      p_participant_id: participant.id,
      p_source_response_id: sourceResponseId,
      p_owner_exemption: isDyddAdminEmail(user.email),
      p_scores: {
        answers: result.answers,
        blockTotals: Object.fromEntries(
          designIdQuestionBlocks.map((block) => [block.block, 5]),
        ),
        reportPayload,
        reportPayloadFormat: "template-v1",
        channel: "native_app",
        mapsConfirmation: result.mapsConfirmation,
        research,
        instrument: {
          questions: designIdQuestionBank,
          sortItems: mapsConfirmationItems,
          sortBuckets: mapsConfirmationBuckets,
        },
        profileLanguage: sections.profileLanguage,
        questionVersion: "designid-approved-edits-2026-10-15",
        scoringVersion: designIdScoringVersion,
        rankOrder: result.rankOrder,
        scores: designIdScorePayload(result),
        sourceResponseId,
        summary: sections.summary,
        tieSummary: result.tieSummary,
      },
    },
  );
  const snapshot = snapshotId ? { id: String(snapshotId) } : null;
  if (snapshotError || !snapshot?.id) {
    fail(snapshotError?.message ?? "Unable to save your DesignID result.");
  }
  const { data: savedSnapshot, error: savedSnapshotError } = await supabase
    .from("assessment_snapshots")
    .select("scores")
    .eq("id", snapshot.id)
    .single();
  if (savedSnapshotError || !savedSnapshot)
    fail(
      "Your assessment was saved, but its report is not ready. Visit Field Kit or contact support.",
    );
  const retakePolicy = savedSnapshot.scores?.retakePolicy;
  const reportAccessUrl = `${await getAppBaseUrl()}/designid/report?snapshot=${encodeURIComponent(snapshot.id)}`;
  const pdfFilename = `DesignID Report - ${cleanReportFilename(participantName)} - ${snapshot.id.slice(0, 8)}.pdf`;
  let pdfMetadata: Record<string, unknown> = {
    filename: pdfFilename,
    status: "not_started",
  };
  let emailMetadata: Record<string, unknown> = {};
  // Persist ambiguity fence before the provider call: a crash must not permit a second PDF.
  const starting = await supabase.from('assessment_snapshots').update({scores:{...savedSnapshot.scores,pdfMonkey:{...pdfMetadata,status:'uncertain',reportAccessUrl}}}).eq('id',snapshot.id).eq('user_id',user.id);
  if (starting.error) fail('Your assessment is saved. Report creation needs recovery in Field Kit; do not repurchase.');
  try {
    const report = await createReadyPdfMonkeyReport({
      archiveKey: `designid/${snapshot.id}`,
      onCreated: async (document) => {
        pdfMetadata = { ...pdfMetadata, documentId: document.id, status: document.status || 'pending', reportAccessUrl };
        const persisted = await supabase.from('assessment_snapshots').select('scores').eq('id',snapshot.id).eq('user_id',user.id).single();
        if (persisted.error || !persisted.data) throw Error('Report creation evidence needs recovery.');
        const saved = await supabase.from('assessment_snapshots').update({scores:{...persisted.data.scores,pdfMonkey:pdfMetadata}}).eq('id',snapshot.id).eq('user_id',user.id);
        if (saved.error) throw Error('Report creation evidence needs recovery.');
      },
      filename: pdfFilename,
      payload: reportPayload,
      templateId: designIdTemplateId,
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
      error:
        error instanceof Error
          ? error.message
          : "Unable to generate DesignID PDF.",
      reportAccessUrl,
      status: "error",
    };
  }
  const { error: metadataError } = await supabase
    .from("assessment_snapshots")
    .update({
      scores: {
        answers: result.answers,
        blockTotals: Object.fromEntries(
          designIdQuestionBlocks.map((block) => [
            block.block,
            block.statements.reduce(
              (sum, statement) => sum + result.answers[statement.code],
              0,
            ),
          ]),
        ),
        channel: "native_app",
        mapsConfirmation: result.mapsConfirmation,
        research,
        instrument: {
          questions: designIdQuestionBank,
          sortItems: mapsConfirmationItems,
          sortBuckets: mapsConfirmationBuckets,
        },
        pdfMonkey: pdfMetadata,
        reportPayload,
        reportPayloadFormat: "template-v1",
        profileLanguage: sections.profileLanguage,
        questionVersion: "designid-approved-edits-2026-10-15",
        scoringVersion: designIdScoringVersion,
        rankOrder: result.rankOrder,
        reportAccessUrl,
        resultEmail: emailMetadata,
        scores: designIdScorePayload(result),
        sourceResponseId,
        summary: sections.summary,
        tieSummary: result.tieSummary,
        retakePolicy,
      },
    })
    .eq("id", snapshot.id);
  if (metadataError)
    fail(
      "Your assessment was saved, but delivery status could not be updated. Find your report in Field Kit.",
    );
  // Artifact state must be durable BEFORE a report-ready email can be opened.
  if (["ready", "success"].includes(String(pdfMetadata.status)) && pdfMetadata.storage) {
    try {
      const email = await sendAssessmentReportEmail({ assessmentName: "DesignID", participantEmail, participantName, reportUrl: reportAccessUrl });
      emailMetadata = { error: email.message ?? null, resendId: email.id ?? null, sent: email.sent, skipped: email.skipped };
    } catch { emailMetadata = { sent: false, skipped: false, error: "Report is saved; delivery needs retry." }; }
    const { data: saved } = await supabase.from("assessment_snapshots").select("scores").eq("id", snapshot.id).eq("user_id", user.id).single();
    if (saved) await supabase.from("assessment_snapshots").update({scores:{...saved.scores,resultEmail:emailMetadata}}).eq("id",snapshot.id).eq("user_id",user.id);
  }
  redirect(`/designid/thanks?snapshot=${encodeURIComponent(snapshot.id)}`);
}
