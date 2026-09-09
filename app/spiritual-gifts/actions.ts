"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  buildSpiritualGiftScores,
  spiritualGiftQuestionBank,
  spiritualGiftRatingField,
} from "@/lib/spiritual-gifts/intake";
import { normalizeEmail } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const productionAppUrl = "https://dydd-online-school.vercel.app";

type SpiritualGiftsSessionLookup = {
  created_by_user_id: string | null;
  id: string;
  intake_token_hash: string | null;
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

function fail(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

function assertEmail(email: string, path: string) {
  if (!email || !email.includes("@")) {
    fail(path, "Enter a valid email address.");
  }
}

function assertCompleteGiftRatings(formData: FormData, path: string) {
  const missingQuestion = spiritualGiftQuestionBank.find((question) => {
    const value = String(formData.get(spiritualGiftRatingField(question.code)) ?? "");
    return !["1", "2", "3", "4", "5"].includes(value);
  });

  if (missingQuestion) {
    fail(path, "Please answer every Spiritual Gifts statement before submitting.");
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
      "created_by_user_id,id,intake_token_hash,participant_email,participant_id,participant_name,report_status,result_snapshot_id,session_status,submitted_at",
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
}) {
  assertCompleteGiftRatings(formData, path);

  const othersAffirmed = getString(formData, "others_affirmed");
  const serviceFruit = getString(formData, "service_fruit");
  const serviceContext = getString(formData, "service_context");
  const growthPrayer = getString(formData, "growth_prayer");
  const nextStep = getString(formData, "next_step");
  const submittedAt = new Date().toISOString();
  const scores = buildSpiritualGiftScores(formData);
  const sourceResponseId = `vercel:spiritual_gifts:self:${sessionId}:${crypto.randomUUID()}`;
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

  await supabase
    .from("spiritual_gifts_sessions")
    .update({
      report_status: "ready",
      result_snapshot_id: snapshot?.id ?? null,
      session_status: "completed",
      submitted_at: submittedAt,
    })
    .eq("id", sessionId);

  return {
    sessionId,
    submittedAt,
    token,
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
      metadata: {
        channel: "native_app",
        liveProcessTouched: false,
        source: signupSource,
      },
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
        channel: "native_app",
        liveProcessTouched: false,
        selfLink,
        source: signupSource,
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

  if (isAppChannel && !user) {
    fail("/spiritual-gifts", "Sign in before starting your app-linked Spiritual Gifts assessment.");
  }

  const participantEmail = normalizeEmail(
    user ? profile?.email ?? user.email : getString(formData, "reviewer_email"),
  );
  const participantName = user
    ? profile?.full_name ?? user.email?.split("@")[0] ?? ""
    : getString(formData, "reviewer_name");

  if (!participantName) {
    fail("/spiritual-gifts", "Enter your name.");
  }

  assertEmail(participantEmail, "/spiritual-gifts");

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

  const { data: session, error: sessionError } = await supabase
    .from("spiritual_gifts_sessions")
    .insert({
      created_by_user_id: user?.id ?? null,
      intake_token_hash: hashToken(token),
      participant_email: participantEmail,
      participant_id: participant.id,
      participant_name: participantName,
      report_status: "not_started",
      session_status: "active",
      signup_source: signupSource,
      source_system: "spiritual_gifts_app",
      metadata: {
        channel: isAppChannel ? "native_app" : "public_assessment",
        liveProcessTouched: false,
        source: signupSource,
      },
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
      userId: user?.id ?? null,
      supabase,
      formData,
      path: "/spiritual-gifts",
    });
  } catch (error) {
    fail(
      "/spiritual-gifts",
      error instanceof Error ? error.message : "Unable to save Spiritual Gifts response.",
    );
  }

  const resultParams = new URLSearchParams({
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
    });
  } catch (error) {
    fail(path, error instanceof Error ? error.message : "Unable to save Spiritual Gifts response.");
  }

  const resultParams = new URLSearchParams({
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
