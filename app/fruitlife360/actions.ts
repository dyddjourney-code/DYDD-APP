"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendResendEmail } from "@/lib/email/resend";
import {
  fruitLifeFruits,
  fruitLifeQuestionBank,
  fruitRatingField,
  type FruitLifeResponseType,
} from "@/lib/fruitlife360/intake";
import { buildFruitLifePayloadForSession } from "@/lib/fruitlife360/payload";
import { normalizeEmail } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const productionAppUrl = "https://dydd-online-school.vercel.app";

type SessionLookup = {
  id: string;
  intake_token_hash: string | null;
  observer_completed_count: number;
  observer_goal: number;
  participant_id: string;
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

function getNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number(getString(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

function fail(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

function assertEmail(email: string, path: string) {
  if (!email || !email.includes("@")) {
    fail(path, "Enter a valid email address.");
  }
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

  if (process.env.NODE_ENV === "production") {
    return productionAppUrl;
  }

  return "http://localhost:3000";
}

function buildScores(formData: FormData) {
  const answers: Record<string, Record<string, number>> = {};
  const fruitAverages: Record<string, number> = {};
  const questionScores: Record<string, number> = {};

  for (const fruit of fruitLifeFruits) {
    const fruitAnswers: Record<string, number> = {};
    const fruitQuestions = fruitLifeQuestionBank.filter(
      (question) => question.fruitKey === fruit.key,
    );

    for (const question of fruitQuestions) {
      const score = Math.min(
        5,
        Math.max(1, getNumber(formData, fruitRatingField(question.code), 3)),
      );
      fruitAnswers[question.code] = score;
      questionScores[question.code] = score;
    }

    const values = Object.values(fruitAnswers);
    const averageScore = values.reduce((sum, value) => sum + value, 0) / values.length;
    fruitAnswers.visible = averageScore;
    fruitAnswers.consistent = averageScore;
    fruitAnswers.pressure = values[2] ?? averageScore;
    answers[fruit.key] = fruitAnswers;
    fruitAverages[fruit.key] = averageScore;
  }

  return { answers, fruitAverages, questionScores };
}

function getFruitRank(formData: FormData) {
  const ranks = Array.from({ length: fruitLifeFruits.length }, (_, index) =>
    getString(formData, `fruit_rank_${index + 1}`).toLowerCase().replace(/\s+/g, "_"),
  ).filter(Boolean);
  const validKeys = new Set<string>(fruitLifeFruits.map((fruit) => fruit.key));
  const uniqueRanks = Array.from(new Set(ranks)).filter((rank) => validKeys.has(rank));

  return uniqueRanks.length ? uniqueRanks : fruitLifeFruits.map((fruit) => fruit.key);
}

async function getSessionForToken(sessionId: string, token: string, path: string) {
  if (!sessionId || !token) {
    fail(path, "This FruitLife link is missing its session token.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: session, error } = await supabase
    .from("fruitlife_360_sessions")
    .select("id,intake_token_hash,observer_completed_count,observer_goal,participant_id")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    fail(path, "This FruitLife session was not found.");
  }

  const typedSession = session as SessionLookup;

  if (typedSession.intake_token_hash !== hashToken(token)) {
    fail(path, "This FruitLife link is not valid.");
  }

  return { session: typedSession, supabase };
}

async function queuePayloadJob(supabase: ReturnType<typeof createSupabaseAdminClient>, sessionId: string) {
  const payload = await buildFruitLifePayloadForSession(supabase, sessionId);
  const { data: job } = await supabase.from("fruitlife_360_report_jobs").insert({
    job_status: "queued",
    job_type: "fruitlife_360_payload",
    metadata: { trigger: "response_threshold" },
    payload,
    session_id: sessionId,
  }).select("id").single();

  await supabase.from("fruitlife_360_report_artifacts").insert({
    artifact_status: "ready",
    artifact_type: "payload",
    metadata: {
      fieldCount: Object.keys(payload).length,
      source: "vercel_payload_generator",
    },
    provider: "vercel",
    report_job_id: job?.id ?? null,
    session_id: sessionId,
  });
}

function fruitLifeInviteEmail({
  observerGoal,
  observerLink,
  participantName,
  selfLink,
}: {
  observerGoal: number;
  observerLink: string;
  participantName: string;
  selfLink: string;
}) {
  const observerText =
    observerGoal > 0
      ? `\n\nObserver link to share:\n${observerLink}\n\nShare this with ${observerGoal} trusted observer${observerGoal === 1 ? "" : "s"}.`
      : "";

  const text = `Hi ${participantName},\n\nYour FruitLife 360 reflection is ready to begin.\n\nSelf reflection link:\n${selfLink}${observerText}\n\nFruitLife 360 is designed as a formation mirror, not a grade or label.`;

  return {
    html: text
      .split("\n\n")
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
      .join(""),
    subject: "Your FruitLife 360 reflection links",
    text,
  };
}

async function recordAndSendInviteEmail({
  observerGoal,
  observerLink,
  participantEmail,
  participantName,
  selfLink,
  sessionId,
  supabase,
}: {
  observerGoal: number;
  observerLink: string;
  participantEmail: string;
  participantName: string;
  selfLink: string;
  sessionId: string;
  supabase: ReturnType<typeof createSupabaseAdminClient>;
}) {
  const email = fruitLifeInviteEmail({
    observerGoal,
    observerLink,
    participantName,
    selfLink,
  });
  const result = await sendResendEmail({
    ...email,
    to: participantEmail,
  });

  await supabase.from("fruitlife_360_report_artifacts").insert({
    artifact_status: result.sent ? "sent" : result.skipped ? "draft" : "error",
    artifact_type: "email",
    metadata: {
      error: result.message ?? null,
      observerLink,
      purpose: "initial_invite_email",
      resendSkipped: result.skipped,
      resendSent: result.sent,
      selfLink,
    },
    provider: "resend",
    provider_document_id: result.id ?? null,
    session_id: sessionId,
  });
}

async function saveResponse({
  formData,
  path,
  responseType,
}: {
  formData: FormData;
  path: string;
  responseType: FruitLifeResponseType;
}) {
  const sessionId = getString(formData, "session_id");
  const token = getString(formData, "token");
  const { session, supabase } = await getSessionForToken(sessionId, token, path);
  const reviewerName = getString(formData, "reviewer_name");
  const reviewerEmail = normalizeEmail(getString(formData, "reviewer_email"));
  const relationship = getString(formData, "relationship_label");
  const reflectionStrength = getString(formData, "reflection_strength");
  const reflectionGrowth = getString(formData, "reflection_growth");
  const reflectionEncouragement = getString(formData, "reflection_encouragement");
  const fruitRank = getFruitRank(formData);
  const { answers, fruitAverages, questionScores } = buildScores(formData);
  const submittedAt = new Date().toISOString();

  if (!reviewerName) {
    fail(path, "Enter the reviewer's name.");
  }

  if (responseType === "self") {
    assertEmail(reviewerEmail, path);
  }

  const sourceResponseId = `vercel:${responseType}:${session.id}:${crypto.randomUUID()}`;
  const { error: responseError } = await supabase.from("fruitlife_360_responses").insert({
    answers: {
      fruitRatings: answers,
      reflections: {
        encouragement: reflectionEncouragement,
        growth: reflectionGrowth,
        strength: reflectionStrength,
      },
    },
    derived_scores: {
      fruitAverages,
      growthFocus: fruitRank.slice(-3),
      mostVisible: fruitRank.slice(0, 3),
      questionScores,
    },
    fruit_rank: fruitRank,
    relationship_label: relationship || (responseType === "self" ? "Self" : null),
    response_type: responseType,
    reviewer_email: reviewerEmail || null,
    reviewer_name: reviewerName,
    session_id: session.id,
    source_response_id: sourceResponseId,
    submitted_at: submittedAt,
  });

  if (responseError) {
    fail(path, responseError.message);
  }

  if (responseType === "self") {
    const readyForReport = session.observer_goal <= session.observer_completed_count;
    const { error } = await supabase
      .from("fruitlife_360_sessions")
      .update({
        report_status: readyForReport ? "queued" : "waiting_for_responses",
        self_completed_at: submittedAt,
        session_status: readyForReport ? "ready_for_report" : "waiting_for_observers",
      })
      .eq("id", session.id);

    if (error) {
      fail(path, error.message);
    }

    if (readyForReport) {
      await queuePayloadJob(supabase, session.id);
    }
  } else {
    const completedCount = session.observer_completed_count + 1;
    const readyForReport = completedCount >= session.observer_goal;
    const { error } = await supabase
      .from("fruitlife_360_sessions")
      .update({
        observer_completed_count: completedCount,
        report_status: readyForReport ? "queued" : "waiting_for_responses",
        session_status: readyForReport ? "ready_for_report" : "waiting_for_observers",
      })
      .eq("id", session.id);

    if (error) {
      fail(path, error.message);
    }

    if (readyForReport) {
      await queuePayloadJob(supabase, session.id);
    }
  }

  redirect(
    `/fruitlife360/thanks?message=${encodeURIComponent(
      responseType === "self"
        ? "Self reflection saved. Share the observer link with the people you invited."
        : "Observer reflection saved. Thank you for helping with this FruitLife 360 report.",
    )}`,
  );
}

export async function createFruitLifeSession(formData: FormData) {
  const participantName = getString(formData, "participant_name");
  const participantEmail = normalizeEmail(getString(formData, "participant_email"));
  const observerGoal = Math.max(0, Math.min(12, getNumber(formData, "observer_goal", 3)));
  const signupSource = getString(formData, "signup_source") || "vercel-fruitlife-intake";

  if (!participantName) {
    fail("/fruitlife360", "Enter the participant name.");
  }

  assertEmail(participantEmail, "/fruitlife360");

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: participant, error: participantError } = await supabase
    .from("assessment_participants")
    .upsert(
      {
        display_name: participantName,
        normalized_email: participantEmail,
        updated_at: now,
      },
      { onConflict: "normalized_email" },
    )
    .select("id")
    .single();

  if (participantError || !participant) {
    fail("/fruitlife360", participantError?.message ?? "Unable to create participant.");
  }

  const token = makeToken();
  const sourceParticipantId = `FL360-V-${crypto.randomUUID()}`;
  const { data: session, error: sessionError } = await supabase
    .from("fruitlife_360_sessions")
    .insert({
      intake_token_hash: hashToken(token),
      observer_goal: observerGoal,
      participant_email: participantEmail,
      participant_id: participant.id,
      participant_name: participantName,
      report_status: "waiting_for_responses",
      session_status: "waiting_for_self",
      signup_source: signupSource,
      source_participant_id: sourceParticipantId,
      source_system: "vercel_intake",
      source_synced_at: now,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    fail("/fruitlife360", sessionError?.message ?? "Unable to create FruitLife session.");
  }

  const { error: inviteError } = await supabase.from("fruitlife_360_observer_invites").insert({
    invite_status: "invited",
    invite_token_hash: hashToken(token),
    invited_at: now,
    metadata: { observerGoal, sharedObserverLink: true },
    session_id: session.id,
  });

  if (inviteError) {
    fail("/fruitlife360", inviteError.message);
  }

  const baseUrl = await getAppBaseUrl();
  const selfLink = `${baseUrl}/fruitlife360/self?session=${session.id}&token=${token}`;
  const observerLink = `${baseUrl}/fruitlife360/observer?session=${session.id}&token=${token}`;

  await recordAndSendInviteEmail({
    observerGoal,
    observerLink,
    participantEmail,
    participantName,
    selfLink,
    sessionId: session.id,
    supabase,
  });

  redirect(
    `/fruitlife360/thanks?message=${encodeURIComponent(
      "FruitLife session created. Native Vercel links are ready for testing.",
    )}&self=${encodeURIComponent(selfLink)}&observer=${encodeURIComponent(observerLink)}`,
  );
}

export async function saveFruitLifeSelfResponse(formData: FormData) {
  await saveResponse({
    formData,
    path: "/fruitlife360/self",
    responseType: "self",
  });
}

export async function saveFruitLifeObserverResponse(formData: FormData) {
  await saveResponse({
    formData,
    path: "/fruitlife360/observer",
    responseType: "observer",
  });
}
