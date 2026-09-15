"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  buildSpiritualGiftScores,
  spiritualGiftQuestionBank,
  spiritualGiftRatingField,
} from "@/lib/spiritual-gifts/intake";
import { sendResendEmail } from "@/lib/email/resend";
import { normalizeEmail } from "@/lib/identity/email";
import {
  createPdfMonkeyDocument,
  getPdfMonkeyDocument,
  type PdfMonkeyDocument,
} from "@/lib/pdfmonkey/client";
import {
  heatherReviewEmail,
  heatherReviewName,
  isHeatherReviewRequest,
  isNewReviewRequest,
  jordanReviewEmail,
  jordanReviewName,
} from "@/lib/review/heather";
import { verifySpiritualGiftsAppIdentity } from "@/lib/spiritual-gifts/app-identity";
import { buildSpiritualGiftsPdfMonkeyPayload } from "@/lib/spiritual-gifts/pdfmonkey-payload";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const productionAppUrl = "https://dydd-online-school.vercel.app";
const spiritualGiftsTemplateId =
  process.env.SPIRITUAL_GIFTS_PDFMONKEY_TEMPLATE_ID ?? "1c56c723-1210-4690-968f-a1aa5e5faeb5";

type SpiritualGiftsSessionLookup = {
  created_by_user_id: string | null;
  id: string;
  intake_token_hash: string | null;
  metadata?: Record<string, unknown> | null;
  participant_email: string | null;
  participant_id: string;
  participant_name: string | null;
  report_status: string;
  result_snapshot_id: string | null;
  session_status: string;
  submitted_at: string | null;
};

function makeToken() {
  return crypto.randomBytes(24).toString("base64url");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanFilename(value: string) {
  return value.replace(/[^\w .'-]+/g, " ").replace(/\s+/g, " ").trim();
}

function pdfReportFilename(participantName: string, sessionId: string) {
  const participant = cleanFilename(participantName || "Spiritual Gifts Participant");
  return `Spiritual Gifts Report - ${participant} - ${sessionId.slice(0, 8)}.pdf`;
}

function pdfReportLink(document: PdfMonkeyDocument) {
  return document.public_share_link ?? document.download_url ?? document.preview_url ?? "";
}

async function waitForPdfMonkeyDocument(documentId: string) {
  let document = await getPdfMonkeyDocument(documentId);

  for (
    let attempt = 0;
    attempt < 12 && ["pending", "generating"].includes(String(document.status));
    attempt += 1
  ) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    document = await getPdfMonkeyDocument(documentId);
  }

  return document;
}

async function pdfAttachmentFromUrl(reportUrl: string, filename: string) {
  if (!reportUrl) {
    return null;
  }

  const response = await fetch(reportUrl);

  if (!response.ok) {
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();

  return {
    content: Buffer.from(arrayBuffer).toString("base64"),
    filename,
  };
}

function fail(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

function assertEmail(email: string, path: string) {
  if (!email || !email.includes("@")) {
    fail(path, "Enter a valid email address.");
  }
}

function assertCompleteGiftRatings(formData: FormData) {
  const missingQuestion = spiritualGiftQuestionBank.find((question) => {
    const value = String(formData.get(spiritualGiftRatingField(question.code)) ?? "");
    return !["1", "2", "3", "4", "5"].includes(value);
  });

  if (missingQuestion) {
    throw new Error("Please answer every Spiritual Gifts statement before submitting.");
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
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

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  const origin = requestHeaders.get("origin");

  if (origin) {
    return origin.replace(/\/$/, "");
  }

  return process.env.NODE_ENV === "production" ? productionAppUrl : "http://localhost:3000";
}

async function getSessionForToken(sessionId: string, token: string, path: string) {
  if (!sessionId || !token) {
    fail(path, "This Spiritual Gifts link is missing its session token.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: session, error } = await supabase
    .from("spiritual_gifts_sessions")
    .select(
      "created_by_user_id,id,intake_token_hash,metadata,participant_email,participant_id,participant_name,report_status,result_snapshot_id,session_status,submitted_at",
    )
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    fail(path, "This Spiritual Gifts session was not found.");
  }

  const typedSession = session as SpiritualGiftsSessionLookup;

  if (typedSession.intake_token_hash !== hashToken(token)) {
    fail(path, "This Spiritual Gifts link is not valid.");
  }

  return { session: typedSession, supabase };
}

function spiritualGiftsResultEmail({
  participantName,
  reportUrl,
  resultUrl,
}: {
  participantName: string;
  reportUrl?: string;
  resultUrl: string;
}) {
  const safeParticipantName = escapeHtml(participantName);
  const safeReportUrl = escapeHtml(reportUrl || resultUrl);
  const safeResultUrl = escapeHtml(resultUrl);
  const text = `Hi ${participantName},\n\nYour Spiritual Gifts Assessment report is ready.\n\nOpen your PDF report here:\n${reportUrl || resultUrl}\n\nYou can also view your result page here:\n${resultUrl}\n\nUse this report prayerfully as a confirmation tool. Spiritual gifts are best clarified through Scripture, prayer, faithful service, and trusted people who have seen your life in motion.\n\nSincerely,\nDiscover Your Divine Design Team`;

  return {
    from:
      process.env.SPIRITUAL_GIFTS_EMAIL_FROM ??
      process.env.DYDD_EMAIL_FROM ??
      process.env.FRUITLIFE_EMAIL_FROM ??
      "Discover Your Divine Design <hello@discoverdivine.design>",
    html: `
      <p>Hi ${safeParticipantName},</p>
      <p>Your Spiritual Gifts Assessment report is ready.</p>
      <p><a href="${safeReportUrl}">Open your Spiritual Gifts PDF report</a></p>
      <p><a href="${safeResultUrl}">View your result page</a></p>
      <p>Use this report prayerfully as a confirmation tool. Spiritual gifts are best clarified through Scripture, prayer, faithful service, and trusted people who have seen your life in motion.</p>
      <p>Sincerely,<br>Discover Your Divine Design Team</p>
    `,
    subject: "Your Spiritual Gifts Assessment report is ready",
    text,
  };
}

async function sendSpiritualGiftsResultEmail({
  attachment,
  participantEmail,
  participantName,
  reportUrl,
  resultUrl,
}: {
  attachment?: { content: string; filename: string } | null;
  participantEmail: string;
  participantName: string;
  reportUrl?: string;
  resultUrl: string;
}) {
  return sendResendEmail({
    ...spiritualGiftsResultEmail({ participantName, reportUrl, resultUrl }),
    ...(attachment ? { attachments: [attachment] } : {}),
    to: participantEmail,
  });
}

async function saveCompletedSpiritualGiftsResponse({
  participantId,
  participantName,
  participantEmail,
  sessionId,
  token,
  userId,
  supabase,
  formData,
  path,
  sessionMetadata,
}: {
  participantId: string;
  participantName: string;
  participantEmail: string;
  sessionId: string;
  token: string;
  userId?: string | null;
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  formData: FormData;
  path: string;
  sessionMetadata?: Record<string, unknown> | null;
}) {
  assertCompleteGiftRatings(formData);

  const othersAffirmed = getString(formData, "others_affirmed");
  const serviceFruit = getString(formData, "service_fruit");
  const serviceContext = getString(formData, "service_context");
  const growthPrayer = getString(formData, "growth_prayer");
  const nextStep = getString(formData, "next_step");
  const submittedAt = new Date().toISOString();
  const scores = buildSpiritualGiftScores(formData);
  const sourceResponseId = `vercel:spiritual_gifts:self:${sessionId}:${crypto.randomUUID()}`;
  const statusHref = `/spiritual-gifts/status?session=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(token)}`;
  const resultUrl = `${await getAppBaseUrl()}${statusHref}`;
  const reportHref = `/spiritual-gifts/report?session=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(token)}`;
  const reportAccessUrl = `${await getAppBaseUrl()}${reportHref}`;
  const topGiftPayload = scores.topGifts.map((gift, index) => ({
    definition: gift.definition,
    key: gift.key,
    label: gift.label,
    rank: index + 1,
    reportBlurb: gift.reportBlurb,
    reflections: gift.reflections,
    score: gift.score,
    percent: gift.percent,
    scriptures: gift.scriptures,
    sourceId: gift.sourceId,
    tier: gift.tier,
    tiedAtScore: gift.tiedAtScore,
  }));
  const rankedGiftPayload = scores.rankedGifts.map((gift) => ({
    alwaysCount: gift.alwaysCount,
    consistencyFloor: gift.consistencyFloor,
    definition: gift.definition,
    key: gift.key,
    label: gift.label,
    percent: gift.percent,
    rank: gift.rank,
    reportBlurb: gift.reportBlurb,
    score: gift.score,
    scriptures: gift.scriptures,
    sourceId: gift.sourceId,
    tier: gift.tier,
    tiedAtScore: gift.tiedAtScore,
  }));
  const deepDivePayload = scores.deepDiveGifts.map((gift) => ({
    definition: gift.definition,
    key: gift.key,
    label: gift.label,
    maturity: gift.maturity,
    percent: gift.percent,
    rank: gift.rank,
    reportBlurb: gift.reportBlurb,
    score: gift.score,
    scriptures: gift.scriptures,
    sourceId: gift.sourceId,
    tier: gift.tier,
    tiedAtScore: gift.tiedAtScore,
  }));
  const tierPayload = scores.tiers.map((tier) => ({
    tier: tier.tier,
    gifts: tier.gifts.map((gift) => ({
      key: gift.key,
      label: gift.label,
      percent: gift.percent,
      rank: gift.rank,
      score: gift.score,
      sourceId: gift.sourceId,
      tiedAtScore: gift.tiedAtScore,
    })),
  }));

  const { data: response, error: responseError } = await supabase
    .from("spiritual_gifts_responses")
    .insert({
      answers: {
        giftRatings: scores.answers,
        reflections: {
          growthPrayer,
          nextStep,
          othersAffirmed,
          serviceContext,
          serviceFruit,
        },
      },
      derived_scores: {
        deepDiveGifts: deepDivePayload,
        giftPercents: scores.giftPercents,
        giftScores: scores.giftScores,
        questionScores: scores.questionScores,
        rankedGifts: rankedGiftPayload,
        tieSummary: scores.tieSummary,
        tiers: tierPayload,
        topGifts: topGiftPayload,
      },
      gift_rank: scores.rankedGiftKeys,
      participant_email: participantEmail,
      participant_name: participantName,
      response_type: "self",
      session_id: sessionId,
      source_response_id: sourceResponseId,
      submitted_at: submittedAt,
    })
    .select("id")
    .single();

  if (responseError || !response?.id) {
    throw new Error(responseError?.message ?? "Unable to save Spiritual Gifts response.");
  }

  const { data: snapshot } = await supabase
    .from("assessment_snapshots")
    .insert({
      assessment_type: "spiritual_gifts",
      participant_id: participantId,
      scores: {
        channel: "native_app",
        deepDiveGifts: deepDivePayload,
        rankedGifts: rankedGiftPayload,
        statusHref,
        sourceResponseId,
        tieSummary: scores.tieSummary,
        tiers: tierPayload,
        topGifts: topGiftPayload,
        totals: scores.giftScores,
      },
      source: "spiritual_gifts_app",
      source_response_id: sourceResponseId,
      source_submitted_at: submittedAt,
      user_id: userId ?? null,
    })
    .select("id")
    .maybeSingle();

  const pdfFilename = pdfReportFilename(participantName, sessionId);
  let pdfMetadata:
    | {
        documentId: string;
        error?: string | null;
        filename: string;
        providerUrl?: string;
        reportAccessUrl?: string;
        status?: string | null;
      }
    | null = null;
  let pdfAttachment: { content: string; filename: string } | null = null;

  try {
    const createdDocument = await createPdfMonkeyDocument({
      filename: pdfFilename,
      payload: buildSpiritualGiftsPdfMonkeyPayload({
        deepDiveGifts: scores.deepDiveGifts,
        participantEmail,
        participantName,
        tieSummary: scores.tieSummary,
        topGifts: scores.topGifts,
      }),
      templateId: spiritualGiftsTemplateId,
    });
    const readyDocument = await waitForPdfMonkeyDocument(createdDocument.id);
    const providerUrl = pdfReportLink(readyDocument);

    pdfMetadata = {
      documentId: readyDocument.id,
      error: readyDocument.failure_cause ?? null,
      filename: pdfFilename,
      providerUrl: providerUrl || undefined,
      reportAccessUrl,
      status: readyDocument.status ?? null,
    };

    if (providerUrl && ["ready", "success"].includes(String(readyDocument.status))) {
      pdfAttachment = await pdfAttachmentFromUrl(providerUrl, pdfFilename);
    }
  } catch (error) {
    pdfMetadata = {
      documentId: "",
      error: error instanceof Error ? error.message : "Unable to generate Spiritual Gifts PDF.",
      filename: pdfFilename,
      reportAccessUrl,
      status: "error",
    };
  }

  const emailResult = participantEmail
    ? await sendSpiritualGiftsResultEmail({
        attachment: pdfAttachment,
        participantEmail,
        participantName,
        reportUrl: pdfMetadata?.providerUrl ? reportAccessUrl : resultUrl,
        resultUrl,
      })
    : { message: "Participant email is missing.", sent: false, skipped: true };

  await supabase
    .from("spiritual_gifts_sessions")
    .update({
      metadata: {
        ...(sessionMetadata ?? {}),
        resultEmail: {
          attachmentIncluded: Boolean(pdfAttachment),
          error: emailResult.message ?? null,
          purpose: "spiritual_gifts_result_email",
          resendId: emailResult.id ?? null,
          resendSkipped: emailResult.skipped,
          resendSent: emailResult.sent,
          sentAt: new Date().toISOString(),
        },
        pdfMonkey: pdfMetadata,
        reportAccessUrl,
        resultUrl,
      },
      report_status: emailResult.sent ? "sent" : pdfMetadata?.providerUrl ? "ready" : "error",
      result_snapshot_id: snapshot?.id ?? null,
      session_status: "completed",
      submitted_at: submittedAt,
    })
    .eq("id", sessionId);

  return {
    sessionId,
    statusHref,
    submittedAt,
    token,
    resultEmail: emailResult,
  };
}

export async function createSpiritualGiftsSession(formData: FormData) {
  const participantName = getString(formData, "participant_name");
  const participantEmail = normalizeEmail(getString(formData, "participant_email"));
  const signupSource = getString(formData, "signup_source") || "vercel-spiritual-gifts-intake";

  if (!participantName) {
    fail("/spiritual-gifts", "Enter the participant name.");
  }

  assertEmail(participantEmail, "/spiritual-gifts");

  const supabase = createSupabaseAdminClient();
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  const token = makeToken();
  const baseUrl = await getAppBaseUrl();

  const { data: participant, error: participantError } = await supabase
    .from("assessment_participants")
    .upsert(
      {
        display_name: participantName,
        normalized_email: participantEmail,
        user_id: user?.id ?? null,
      },
      { onConflict: "normalized_email" },
    )
    .select("id")
    .single();

  if (participantError || !participant?.id) {
    fail("/spiritual-gifts", participantError?.message ?? "Unable to create participant.");
  }

  const sessionMetadata = {
    channel: "native_app",
    liveProcessTouched: false,
    source: signupSource,
  };

  const { data: session, error: sessionError } = await supabase
    .from("spiritual_gifts_sessions")
    .insert({
      created_by_user_id: user?.id ?? null,
      intake_token_hash: hashToken(token),
      participant_email: participantEmail,
      participant_id: participant.id,
      participant_name: participantName,
      signup_source: signupSource,
      source_system: "spiritual_gifts_app",
      metadata: sessionMetadata,
    })
    .select("id")
    .single();

  if (sessionError || !session?.id) {
    fail("/spiritual-gifts", sessionError?.message ?? "Unable to create Spiritual Gifts session.");
  }

  const selfLink = `${baseUrl}/spiritual-gifts/self?session=${session.id}&token=${token}`;

  await supabase
    .from("spiritual_gifts_sessions")
    .update({
      metadata: {
        ...sessionMetadata,
        selfLink,
      },
      session_status: "waiting_for_self",
    })
    .eq("id", session.id);

  redirect(
    `/spiritual-gifts/status?session=${encodeURIComponent(session.id)}&token=${encodeURIComponent(
      token,
    )}&message=${encodeURIComponent("Spiritual Gifts app session created.")}`,
  );
}

export async function saveSpiritualGiftsPublicResponse(formData: FormData) {
  const signupSource = getString(formData, "signup_source") || "public-spiritual-gifts-assessment";
  const isAppChannel = signupSource === "app-spiritual-gifts-assessment";
  const reviewParams = {
    key: getString(formData, "key"),
    review: getString(formData, "review"),
  };
  const reviewIdentity = isHeatherReviewRequest(reviewParams)
    ? { email: heatherReviewEmail, name: heatherReviewName }
    : isNewReviewRequest(reviewParams)
      ? { email: jordanReviewEmail, name: jordanReviewName }
      : null;
  const signedAppIdentity = isAppChannel
    ? verifySpiritualGiftsAppIdentity({
        email: getString(formData, "reviewer_email"),
        name: getString(formData, "reviewer_name"),
        signature: getString(formData, "app_identity_signature"),
      })
    : null;
  const token = makeToken();
  const supabase = createSupabaseAdminClient();
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("school_profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  if (isAppChannel && !user && !reviewIdentity && !signedAppIdentity) {
    fail("/spiritual-gifts", "Sign in before starting your app-linked Spiritual Gifts assessment.");
  }

  const participantEmail = normalizeEmail(
    user
      ? profile?.email ?? user.email
      : reviewIdentity?.email ?? signedAppIdentity?.email ?? getString(formData, "reviewer_email"),
  );
  const userMetadataName = String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "").trim();
  const participantName = user
    ? profile?.full_name?.trim() || userMetadataName || user.email?.split("@")[0] || ""
    : reviewIdentity?.name ?? signedAppIdentity?.name ?? getString(formData, "reviewer_name");

  if (!participantName) {
    fail("/spiritual-gifts", "Enter your name.");
  }

  assertEmail(participantEmail, "/spiritual-gifts");

  const linkedUserId =
    user?.id ??
    (
      await supabase
        .from("school_profiles")
        .select("id")
        .ilike("email", participantEmail)
        .maybeSingle()
    ).data?.id ??
    null;

  const { data: participant, error: participantError } = await supabase
    .from("assessment_participants")
    .upsert(
      {
        display_name: participantName,
        normalized_email: participantEmail,
        user_id: linkedUserId,
      },
      { onConflict: "normalized_email" },
    )
    .select("id")
    .single();

  if (participantError || !participant?.id) {
    fail("/spiritual-gifts", participantError?.message ?? "Unable to create participant.");
  }

  const sessionMetadata = {
    channel: isAppChannel ? "native_app" : "public_assessment",
    liveProcessTouched: false,
    source: signupSource,
  };

  const { data: session, error: sessionError } = await supabase
    .from("spiritual_gifts_sessions")
    .insert({
      created_by_user_id: linkedUserId,
      intake_token_hash: hashToken(token),
      participant_email: participantEmail,
      participant_id: participant.id,
      participant_name: participantName,
      report_status: "not_started",
      session_status: "active",
      signup_source: signupSource,
      source_system: "spiritual_gifts_app",
      metadata: sessionMetadata,
    })
    .select("id")
    .single();

  if (sessionError || !session?.id) {
    fail("/spiritual-gifts", sessionError?.message ?? "Unable to create Spiritual Gifts record.");
  }

  try {
    await saveCompletedSpiritualGiftsResponse({
      participantEmail,
      participantId: participant.id,
      participantName,
      sessionId: session.id,
      token,
      userId: linkedUserId,
      supabase,
      formData,
      path: "/spiritual-gifts",
      sessionMetadata,
    });
  } catch (error) {
    fail(
      "/spiritual-gifts",
      error instanceof Error ? error.message : "Unable to save Spiritual Gifts response.",
    );
  }

  const resultParams = new URLSearchParams({
    channel: isAppChannel ? "app" : "public",
    message: "Your Spiritual Gifts assessment has been saved.",
    session: session.id,
    token,
  });

  redirect(`/spiritual-gifts/thanks?${resultParams.toString()}`);
}

export async function saveSpiritualGiftsSelfResponse(formData: FormData) {
  const sessionId = getString(formData, "session_id");
  const token = getString(formData, "token");
  const reviewerName = getString(formData, "reviewer_name");
  const reviewerEmail = normalizeEmail(getString(formData, "reviewer_email"));
  const path = "/spiritual-gifts/self";

  if (!reviewerName) {
    fail(path, "Enter your name.");
  }

  assertEmail(reviewerEmail, path);

  const { session, supabase } = await getSessionForToken(sessionId, token, path);
  try {
    await saveCompletedSpiritualGiftsResponse({
      participantEmail: reviewerEmail,
      participantId: session.participant_id,
      participantName: reviewerName,
      sessionId: session.id,
      token,
      userId: session.created_by_user_id,
      supabase,
      formData,
      path,
      sessionMetadata: session.metadata,
    });
  } catch (error) {
    fail(path, error instanceof Error ? error.message : "Unable to save Spiritual Gifts response.");
  }

  const resultParams = new URLSearchParams({
    channel: "app",
    message: "Your Spiritual Gifts assessment was saved inside the app.",
    session: session.id,
    token,
  });

  redirect(`/spiritual-gifts/thanks?${resultParams.toString()}`);
}

export async function getSpiritualGiftsSessionStatus(sessionId: string, token: string) {
  if (!sessionId || !token || !isUuid(sessionId)) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data: session } = await supabase
    .from("spiritual_gifts_sessions")
    .select(
      "id,intake_token_hash,metadata,participant_email,participant_name,report_status,result_snapshot_id,session_status,submitted_at,created_at,updated_at",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.intake_token_hash !== hashToken(token)) {
    return null;
  }

  const { data: responses } = await supabase
    .from("spiritual_gifts_responses")
    .select("id,derived_scores,gift_rank,participant_email,participant_name,submitted_at")
    .eq("session_id", sessionId)
    .order("submitted_at", { ascending: false });

  return {
    responses: responses ?? [],
    session,
    token,
  };
}
