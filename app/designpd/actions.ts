"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  cleanReportFilename,
  createReadyPdfMonkeyReport,
  sendAssessmentReportEmail,
} from "@/lib/assessment-reporting";
import { getAssessmentSnapshotsForUser, latestByAssessment } from "@/lib/assessments/student-context";
import { parseDesignPdRatings, scoreDesignPd } from "@/lib/designpd/engine";
import { buildDesignPdReportPayload, designPdSnapshotSections } from "@/lib/designpd/report";
import { normalizeEmail } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const productionAppUrl = "https://dydd-online-school.vercel.app";
const designPdTemplateId =
  process.env.DESIGNPD_PDFMONKEY_TEMPLATE_ID ?? "3f9db53e-6b35-40ba-ba77-5673d6bb727c";

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

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

  return requestHeaders.get("origin")?.replace(/\/$/, "") ??
    (process.env.NODE_ENV === "production" ? productionAppUrl : "http://localhost:3000");
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
  const authDisplayName = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim();
  const participantName =
    profile?.full_name?.trim() || authDisplayName || user.email?.split("@")[0] || "DesignPD Participant";

  if (!participantEmail) {
    fail("Your account needs an email address before starting DesignPD.");
  }

  const assessmentReport = await getAssessmentSnapshotsForUser(user.id, participantEmail);
  const designIdSnapshot = latestByAssessment(assessmentReport.all).find(
    (snapshot) => snapshot.assessment_type === "designid",
  );

  if (!designIdSnapshot) {
    fail("Complete DesignID before starting DesignPD.");
  }

  let result;
  try {
    result = scoreDesignPd(parseDesignPdRatings(formData), designIdSnapshot);
  } catch (error) {
    fail(error instanceof Error ? error.message : "Unable to score this DesignPD assessment.");
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
    fail(participantError?.message ?? "Unable to connect your DesignPD record.");
  }

  const sections = designPdSnapshotSections(result);
  const { data: snapshot, error: snapshotError } = await supabase
    .from("assessment_snapshots")
    .insert({
      assessment_type: "designpd",
      participant_id: participant.id,
      scores: {
        axisScores: result.axisScores,
        axisTendencies: result.axisTendencies,
        channel: "native_app",
        designIdSnapshotId: designIdSnapshot.id,
        profileLanguage: sections.profileLanguage,
        questionVersion: "designpd-native-v1",
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
      filename: pdfFilename,
      payload: buildDesignPdReportPayload({
        designIdSnapshot,
        participantEmail,
        participantName,
        result,
      }),
      templateId: designPdTemplateId,
    });

    pdfMetadata = {
      checksum: report.document.checksum ?? null,
      documentId: report.document.id,
      error: report.document.failure_cause ?? null,
      filename: pdfFilename,
      providerUrl: report.providerUrl || null,
      reportAccessUrl,
      status: report.document.status ?? null,
    };

    if (report.ready) {
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
    }
  } catch (error) {
    pdfMetadata = {
      ...pdfMetadata,
      error: error instanceof Error ? error.message : "Unable to generate DesignPD PDF.",
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
        designIdSnapshotId: designIdSnapshot.id,
        pdfMonkey: pdfMetadata,
        profileLanguage: sections.profileLanguage,
        questionVersion: "designpd-native-v1",
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
