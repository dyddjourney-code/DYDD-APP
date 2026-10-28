"use server";

import { hasLifetimePersonalAccess } from "@/lib/commerce/personal-access";
import crypto from "node:crypto";
import legacyInstrument from "@/lib/fruitlife360/legacy-instrument.json";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { headers } from "next/headers";
import { after } from "next/server";
import { redirect } from "next/navigation";
import {
  consumeFruitLifeEntitlement,
  getActiveFruitLifeEntitlement,
} from "@/lib/commerce/fruitlife-entitlements";
import { sendApplicationEmail as sendResendEmail } from "@/lib/lifecycle/application-mail";
import {
  fruitLifeFruits,
  fruitLifeInstrumentVersion,
  fruitLifePressureQuestions,
  fruitLifeQuestionBank,
  fruitRatingField,
  type FruitLifeResponseType,
} from "@/lib/fruitlife360/intake";
import { buildFruitLifePayloadForSession } from "@/lib/fruitlife360/payload";
import { processFruitLifeReportJobs } from "@/lib/fruitlife360/report-worker";
import { normalizeEmail } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const productionAppUrl = "https://dydd-online-school.vercel.app";

type SessionLookup = {
  id: string;
  intake_token_hash: string | null;
  metadata: Record<string, unknown> | null;
  observer_completed_count: number;
  observer_goal: number;
  participant_id: string;
  participant_email: string | null;
  participant_name: string | null;
  self_completed_at?: string | null;
};

type ObserverSeed = {
  email: string;
  name: string;
  relationship: string;
};

type ObserverInviteLookup = {
  id: string;
  completed_at: string | null;
  invite_status: string;
  invite_token_hash?: string | null;
  metadata: Record<string, unknown> | null;
  observer_email: string | null;
  observer_name: string | null;
  relationship_label: string | null;
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
  redirect(`${path}${path.includes("?") ? "&" : "?"}message=${encodeURIComponent(message)}`);
}

function appendFruitLifeStatusParam(returnTo: string, value: string) {
  const [pathAndQuery, hash] = returnTo.split("#");
  const separator = pathAndQuery.includes("?") ? "&" : "?";
  return `${pathAndQuery}${separator}fruitlife=${encodeURIComponent(value)}${hash ? `#${hash}` : ""}`;
}

function safeReturnPath(value: string, fallback = "/field-kit#current-assessment-process") {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function assertEmail(email: string, path: string) {
  if (!email || !email.includes("@")) {
    fail(path, "Enter a valid email address.");
  }
}

const isFruitLifeAdmin = isDyddAdminEmail;

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

    const pressureQuestion = fruitLifePressureQuestions.find(
      (question) => question.fruitKey === fruit.key,
    );
    const pressureScore = pressureQuestion
      ? Math.min(5, Math.max(1, getNumber(formData, fruitRatingField(pressureQuestion.code), 3)))
      : 0;
    if (pressureQuestion) {
      fruitAnswers[pressureQuestion.code] = pressureScore;
      questionScores[pressureQuestion.code] = pressureScore;
    }

    const visibleValues = fruitQuestions.map((question) => fruitAnswers[question.code] ?? 0);
    const averageScore = visibleValues.reduce((sum, value) => sum + value, 0) / visibleValues.length;
    fruitAnswers.visible = averageScore;
    fruitAnswers.consistent = averageScore;
    fruitAnswers.pressure = pressureScore || averageScore;
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

function observerSeedsFromForm(formData: FormData) {
  const seeds: ObserverSeed[] = [];

  for (let index = 1; index <= 12; index += 1) {
    const email = normalizeEmail(getString(formData, `observer_email_${index}`));
    const name = getString(formData, `observer_name_${index}`);
    const relationship = getString(formData, `observer_relationship_${index}`);

    if (email) {
      seeds.push({ email, name, relationship });
    }
  }

  return seeds;
}

async function getSessionForToken(
  sessionId: string,
  token: string,
  path: string,
  responseType: FruitLifeResponseType,
) {
  if (!sessionId || !token) {
    fail(path, "This FruitLife link is missing its session token.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: session, error } = await supabase
    .from("fruitlife_360_sessions")
    .select(
      "id,intake_token_hash,metadata,observer_completed_count,observer_goal,participant_id,participant_email,participant_name,self_completed_at",
    )
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    fail(path, "This FruitLife session was not found.");
  }

  const typedSession = session as SessionLookup;
  let observerInviteId: string | null = null;

  if (responseType === "self" && typedSession.intake_token_hash === hashToken(token)) {
    if (typedSession.self_completed_at) fail(path, "This self reflection has already been submitted. Open Field Kit to view progress.");
    return { observerInviteId, session: typedSession, supabase };
  }

  if (responseType === "observer") {
    const { data: invite } = await supabase
      .from("fruitlife_360_observer_invites")
      .select("id,invite_status")
      .eq("session_id", sessionId)
      .eq("invite_token_hash", hashToken(token))
      .maybeSingle();

    if (invite?.id) {
      if (!["invited", "draft", "opened"].includes(invite.invite_status)) fail(path, "This observer link is no longer active.");
      if (invite.invite_status === "completed") {
        fail(path, "This observer reflection link has already been submitted.");
      }
      observerInviteId = String(invite.id);
      return { observerInviteId, session: typedSession, supabase };
    }
  }

  if (!observerInviteId) {
    fail(path, "This FruitLife link is not valid.");
  }

  return { observerInviteId, session: typedSession, supabase };
}

async function queuePayloadJob(supabase: ReturnType<typeof createSupabaseAdminClient>, sessionId: string) {
  const { data: existingJob } = await supabase
    .from("fruitlife_360_report_jobs")
    .select("id")
    .eq("session_id", sessionId)
    .in("job_status", ["queued", "processing", "ready", "sent"])
    .maybeSingle();

  if (existingJob?.id) {
    return;
  }

  const payload = await buildFruitLifePayloadForSession(supabase, sessionId);
  const { data: job, error: jobError } = await supabase.from("fruitlife_360_report_jobs").insert({
    id: sessionId,
    job_status: "queued",
    job_type: "fruitlife_360_payload",
    metadata: { trigger: "response_threshold" },
    payload,
    session_id: sessionId,
  }).select("id").single();

  if (jobError) { if (jobError.code === "23505") return; throw new Error(jobError.message); }
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

async function refreshFruitLifeCompletion(supabase: ReturnType<typeof createSupabaseAdminClient>, sessionId: string) {
  const [{ data: responses, error: responseError }, { data: invites, error: inviteError }] = await Promise.all([
    supabase.from("fruitlife_360_responses").select("response_type,submitted_at,observer_invite_id").eq("session_id", sessionId),
    supabase.from("fruitlife_360_observer_invites").select("id,invite_status").eq("session_id", sessionId)
      .in("invite_status", ["invited", "draft", "opened", "completed"]),
  ]);
  if (responseError || inviteError) throw new Error(responseError?.message ?? inviteError?.message);
  const self = responses?.find(response => response.response_type === "self");
  const observerCount = new Set((responses ?? []).filter(response => response.response_type === "observer").map(response => response.observer_invite_id)).size;
  const observerGoal = invites?.length ?? 0;
  const ready = Boolean(self && observerCount >= observerGoal);
  const { error } = await supabase.from("fruitlife_360_sessions").update({
    observer_goal: observerGoal, observer_completed_count: observerCount,
    response_count: (self ? 1 : 0) + observerCount, self_completed_at: self?.submitted_at ?? null,
    report_status: ready ? "queued" : "waiting_for_responses",
    session_status: ready ? "ready_for_report" : self ? "waiting_for_observers" : "waiting_for_self",
  }).eq("id", sessionId).not("session_status", "in", "(report_ready,report_sent,completed,sent,archived)");
  if (error) throw new Error(error.message);
  if (ready) { await queuePayloadJob(supabase, sessionId); await processQueuedFruitLifeReport(); }
}

async function processQueuedFruitLifeReport() {
  after(async () => {
    try { await processFruitLifeReportJobs({ limit: 1 }); }
    catch (error) { console.error("FruitLife report worker will retry on its next scheduled run.", error); }
  });
}

function fruitLifeObserverEmail({
  observerName,
  observerLink,
  participantName,
}: {
  observerLink: string;
  observerName: string;
  participantName: string;
}) {
  const greeting = observerName ? `Hi ${observerName},` : "Hi,";
  const safeGreeting = escapeHtml(greeting);
  const safeParticipantName = escapeHtml(participantName);
  const text = `${greeting}\n\n${participantName} invited you to complete a FruitLife360 observer reflection.\n\nComplete the FruitLife360 assessment:\n${observerLink}\n\nThis is designed as a formation mirror, not a grade or label. Your feedback should be clear, kind, and useful.\n\nSincerely,\nDiscover Your Divine Design Team`;

  return {
    html: `
      <p>${safeGreeting}</p>
      <p>${safeParticipantName} invited you to complete a FruitLife360 observer reflection.</p>
      <p><a href="${observerLink}">Complete the FruitLife360 assessment</a></p>
      <p>This is designed as a formation mirror, not a grade or label. Your feedback should be clear, kind, and useful.</p>
      <p>Sincerely,<br>Discover Your Divine Design Team</p>
    `,
    subject: `FruitLife360 reflection for ${participantName}`,
    text,
  };
}

async function recordAndSendObserverEmails({
  observerLinks,
  participantName,
  sessionId,
  supabase,
  reminder=false,
}: {
  reminder?:boolean;
  observerLinks: Array<{ email: string; link: string; name: string; relationship: string }>;
  participantName: string;
  sessionId: string;
  supabase: ReturnType<typeof createSupabaseAdminClient>;
}) {
  let failed = false;
  let sent = 0;
  for (const observer of observerLinks) {
    const email = fruitLifeObserverEmail({
      observerLink: observer.link,
      observerName: observer.name,
      participantName,
    });
    const result = await sendResendEmail({
      ...email,
      to: observer.email,
      templateId:reminder?"B03":"B02",
      idempotencyKey:`fruitlife-observer-${sessionId}-${hashToken(observer.link)}${reminder?"-manual-"+new Date().toISOString().slice(0,10):""}`,
      deliveryContext:{type:"fruitlife_observer",sessionId,observerEmail:observer.email,observerLink:observer.link},
    });

    if (!result.sent) failed = true;
    if (result.sent) sent += 1;
    await supabase.from("fruitlife_360_report_artifacts").insert({
      artifact_status: result.sent ? "sent" : result.skipped ? "draft" : "error",
      artifact_type: "email",
      metadata: {
        error: result.message ?? null,
        observerEmail: observer.email,
        observerLink: observer.link,
        observerName: observer.name,
        purpose: "observer_invite_email",
        relationship: observer.relationship,
        resendSkipped: result.skipped,
        resendSent: result.sent,
      },
      provider: "resend",
      provider_document_id: result.id ?? null,
      session_id: sessionId,
    });
  }
  return { failed, sent };
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
  path = `${path}?session=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(token)}`;
  const { observerInviteId, session, supabase } = await getSessionForToken(
    sessionId,
    token,
    path,
    responseType,
  );
  const reviewerName = getString(formData, "reviewer_name");
  const reviewerEmail = normalizeEmail(getString(formData, "reviewer_email"));
  const relationship = getString(formData, "relationship_label");
  const reflectionStrength = getString(formData, "reflection_strength");
  const reflectionGrowth = getString(formData, "reflection_growth");
  const reflectionEncouragement = getString(formData, "reflection_encouragement");
  const expectedRanks = fruitLifeFruits.map(fruit => fruit.key);
  const rawRanks = Array.from({ length: 9 }, (_, index) => getString(formData, `fruit_rank_${index + 1}`));
  if (new Set(rawRanks).size !== 9 || rawRanks.some(rank => !expectedRanks.includes(rank as typeof expectedRanks[number]))) {
    fail(path, "Rank each of the nine fruits once before submitting.");
  }
  for (const question of [...fruitLifeQuestionBank, ...fruitLifePressureQuestions]) {
    const raw = getString(formData, fruitRatingField(question.code));
    if (!/^[1-5]$/.test(raw)) fail(path, "Answer every reflection item using a whole number from 1 to 5.");
  }
  if (!reflectionGrowth || (responseType === "observer" && (!reflectionStrength || !reflectionEncouragement))) fail(path, "Complete the reflection notes before submitting.");
  const fruitRank = getFruitRank(formData);
  const { answers, fruitAverages, questionScores } = buildScores(formData);
  const submittedAt = new Date().toISOString();

  if (!reviewerName) {
    fail(path, "Enter the reviewer's name.");
  }

  if (responseType === "self") {
    assertEmail(reviewerEmail, path);
  }

  const sourceResponseId = `vercel:${responseType}:${session.id}:${observerInviteId ?? "self"}`;
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
    observer_invite_id: observerInviteId,
    relationship_label: relationship || (responseType === "self" ? "Self" : null),
    response_type: responseType,
    reviewer_email: reviewerEmail || null,
    reviewer_name: reviewerName,
    session_id: session.id,
    source_response_id: sourceResponseId,
    metadata: { instrumentVersion: session.metadata?.instrumentVersion ?? legacyInstrument.version, scoringVersion: session.metadata?.instrumentVersion === fruitLifeInstrumentVersion ? "fruitlife-workbook-display-rank-v1" : "fruitlife-native-v0", instrument: session.metadata?.instrumentVersion === fruitLifeInstrumentVersion ? { questions: fruitLifeQuestionBank, pressureQuestions: fruitLifePressureQuestions } : legacyInstrument },
    submitted_at: submittedAt,
  });

  if (responseError) {
    fail(path, responseError.message);
  }

  if (observerInviteId) {
    const { error } = await supabase.from("fruitlife_360_observer_invites")
      .update({ completed_at: submittedAt, invite_status: "completed" })
      .eq("id", observerInviteId).in("invite_status", ["invited", "draft", "opened"]);
    if (error) fail(path, error.message);
  }
  await refreshFruitLifeCompletion(supabase, session.id);

  const thanksParams = new URLSearchParams({
    message:
      responseType === "self"
        ? "Your self reflection has been submitted."
        : "Observer reflection submitted. Thank you for helping with this FruitLife360 report.",
    return_to: "/field-kit#current-assessment-process",
    session: session.id,
    token,
    type: responseType,
  });

  redirect(`/fruitlife360/thanks?${thanksParams.toString()}`);
}

export async function createFruitLifeSession(formData: FormData) {
  const observerSeeds = observerSeedsFromForm(formData);
  const signupSource = getString(formData, "signup_source") || "vercel-fruitlife-intake";
  const returnTo = safeReturnPath(getString(formData, "return_to"));
  const legacyLane = returnTo.includes("lane=fruitlife");

  const supabase = createSupabaseAdminClient();
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  const now = new Date().toISOString();
  const activeEntitlement = user?.id ? await getActiveFruitLifeEntitlement(user.id) : null;
  const lifetimeAccess = user?.id ? await hasLifetimePersonalAccess(user.id) : false;
  const canCreatePaidSession =
    Boolean(user?.id && (lifetimeAccess || activeEntitlement)) || isFruitLifeAdmin(user?.email);

  if (!user) redirect(`/login?next=${encodeURIComponent("/fruitlife360")}`);
  // Participant identity comes from the signed-in account, never editable form data.
  const { data: profile } = await serverSupabase.from("school_profiles")
    .select("full_name").eq("id", user.id).maybeSingle();
  const participantName = profile?.full_name?.trim() || String(user.user_metadata?.full_name ?? "").trim();
  const participantEmail = normalizeEmail(user.email);
  if (!participantName) fail("/fruitlife360", "Add your name to your app account profile before starting your reflection.");
  assertEmail(participantEmail, "/fruitlife360");
  if (new Set(observerSeeds.map(observer => observer.email)).size !== observerSeeds.length || observerSeeds.some(observer => observer.email === participantEmail)) {
    fail("/fruitlife360", "Use a different email for each observer, separate from your own email.");
  }
  if (legacyLane && !canCreatePaidSession) {
    redirect(
      `/trailheads?lane=fruitlife&checkout=required#fruitlife-360`,
    );
  }

  if (!legacyLane) {
    const { data: active } = await supabase.from("fruitlife_360_sessions").select("id")
      .eq("created_by_user_id", user.id).not("session_status", "in", "(report_ready,report_sent,completed,sent,archived)").limit(1).maybeSingle();
    if (active) redirect("/field-kit#current-assessment-process");
  }

  const { data: linkedParticipant } = user
    ? await supabase
        .from("assessment_participants")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const participantResult = linkedParticipant?.id
    ? await supabase
        .from("assessment_participants")
        .update({
          display_name: participantName,
          updated_at: now,
        })
        .eq("id", linkedParticipant.id)
        .select("id")
        .single()
    : await supabase
        .from("assessment_participants")
        .upsert(
          {
            display_name: participantName,
            normalized_email: participantEmail,
            ...(user?.id ? { user_id: user.id } : {}),
            updated_at: now,
          },
          { onConflict: "normalized_email" },
        )
        .select("id")
        .single();

  const { data: participant, error: participantError } = participantResult;

  if (participantError || !participant) {
    fail("/fruitlife360", participantError?.message ?? "Unable to create participant.");
  }

  const selfToken = makeToken();
  const sourceParticipantId = `FL360-V-${crypto.randomUUID()}`;
  const baseUrl = await getAppBaseUrl();
  const { data: session, error: sessionError } = await supabase
    .from("fruitlife_360_sessions")
    .insert({
      intake_token_hash: hashToken(selfToken),
      metadata: {
        observerSeedCount: observerSeeds.length,
        source: "native_fruitlife_intake",
        instrumentVersion: fruitLifeInstrumentVersion,
      },
      observer_goal: observerSeeds.length,
      participant_email: participantEmail,
      participant_id: participant.id,
      participant_name: participantName,
      created_by_user_id: user?.id ?? null,
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

  if (!lifetimeAccess && legacyLane && user?.id && activeEntitlement) {
    try {
      await consumeFruitLifeEntitlement(user.id, session.id);
    } catch (error) {
      fail(
        "/fruitlife360",
        error instanceof Error
          ? error.message
          : "Unable to connect your FruitLife purchase to this session.",
      );
    }
  }

  const selfLink = `${baseUrl}/fruitlife360/self?session=${session.id}&token=${selfToken}`;
  const observerLinks = observerSeeds.map((observer) => ({
    ...observer,
    link: `${baseUrl}/fruitlife360/observer?session=${session.id}&token=${makeToken()}`,
  }));

  const inviteRows = observerLinks.map((observer) => {
    const token = new URL(observer.link).searchParams.get("token") ?? "";

    return {
      invite_status: observer.email ? "invited" : "draft",
      invite_token_hash: hashToken(token),
      invited_at: observer.email ? now : null,
      metadata: {
        observerLink: observer.link,
        sharedObserverLink: !observer.email,
      },
      observer_email: observer.email || null,
      observer_name: observer.name || null,
      relationship_label: observer.relationship || null,
      session_id: session.id,
    };
  });

  if (inviteRows.length) {
    const { error: inviteError } = await supabase
      .from("fruitlife_360_observer_invites")
      .insert(inviteRows);

    if (inviteError) {
      fail("/fruitlife360", inviteError.message);
    }
  }

  await supabase
    .from("fruitlife_360_sessions")
    .update({
      metadata: {
        observerLinks,
        selfLink,
        source: "native_fruitlife_intake",
        instrumentVersion: fruitLifeInstrumentVersion,
        channel: legacyLane ? "legacy_lane" : "current_app",
      },
    })
    .eq("id", session.id);

  // The participant continues in-app; only observers receive invitations.
  const observerInviteResult = await recordAndSendObserverEmails({
    observerLinks: observerLinks.filter((observer) => observer.email),
    participantName,
    sessionId: session.id,
    supabase,
  });

  await supabase.from("fruitlife_360_sessions").update({ metadata: {
    observerLinks, selfLink, source: "native_fruitlife_intake",
        instrumentVersion: fruitLifeInstrumentVersion, channel: legacyLane ? "legacy_lane" : "current_app",
    invitationDeliveryIssue: observerInviteResult.failed,
  } }).eq("id", session.id);
  redirect(legacyLane ? appendFruitLifeStatusParam(returnTo, "created") : `/fruitlife360/self?session=${encodeURIComponent(session.id)}&token=${encodeURIComponent(selfToken)}`);
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

export async function sendFruitLifeReminder(formData: FormData) {
  const sessionId = getString(formData, "session_id");
  const returnTo = safeReturnPath(getString(formData, "return_to"), "/field-kit");

  if (!sessionId) {
    redirect(appendFruitLifeStatusParam(returnTo, "missing_session"));
  }

  const supabase = createSupabaseAdminClient();
  const { data: session, error } = await supabase
    .from("fruitlife_360_sessions")
    .select("id,metadata,participant_email,participant_name,observer_completed_count,observer_goal,self_completed_at")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    redirect(appendFruitLifeStatusParam(returnTo, "reminder_failed"));
  }

  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  const userEmail = normalizeEmail(user?.email);
  const canSendReminder =
    Boolean(user) &&
    (isFruitLifeAdmin(userEmail) || userEmail === normalizeEmail(String(session.participant_email ?? "")));

  if (!canSendReminder) {
    redirect(appendFruitLifeStatusParam(returnTo, "not_allowed"));
  }

  const metadata = (session.metadata ?? {}) as {
    observerLinks?: Array<{ email?: string; link?: string; name?: string; relationship?: string }>;
    selfLink?: string;
  };
  const { data: pendingInvites } = await supabase
    .from("fruitlife_360_observer_invites")
    .select("observer_email,observer_name,relationship_label,metadata")
    .eq("session_id", sessionId)
    .in("invite_status", ["invited", "draft", "opened"]);
  const pendingObserverLinks = (pendingInvites ?? [])
    .map((invite) => {
      const inviteMetadata = (invite.metadata ?? {}) as { observerLink?: string };
      return {
        email: normalizeEmail(String(invite.observer_email ?? "")),
        link: inviteMetadata.observerLink ?? "",
        name: String(invite.observer_name ?? ""),
        relationship: String(invite.relationship_label ?? ""),
      };
    })
    .filter((observer) => observer.email && observer.link);
  const participantName = String(session.participant_name ?? "your FruitLife participant");
  // Self participants are never chased by email, even while observers are pending.
  const observerResult = await recordAndSendObserverEmails({
    reminder:true,
    observerLinks: pendingObserverLinks,
    participantName,
    sessionId,
    supabase,
  });

  const failed = observerResult.failed;
  await supabase.from("fruitlife_360_sessions").update({ metadata: { ...metadata, invitationDeliveryIssue: failed } }).eq("id", sessionId);
  redirect(appendFruitLifeStatusParam(returnTo, failed ? "reminder_failed" : observerResult.sent ? "reminder_sent" : "no_reminders_needed"));
}

export async function getFruitLifeObserverContext(sessionId: string, token: string) {
  if (!sessionId || !token) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const tokenHash = hashToken(token);
  const { data: session } = await supabase
    .from("fruitlife_360_sessions")
    .select("id,participant_name,participant_email,metadata")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return null;
  }

  const { data: invite } = await supabase
    .from("fruitlife_360_observer_invites")
    .select("id,observer_name,observer_email,relationship_label,invite_status")
    .eq("session_id", sessionId)
    .eq("invite_token_hash", tokenHash)
    .maybeSingle();

  if (!invite?.id || !["invited", "draft", "opened"].includes(invite.invite_status)) return null;

  return {
    participantName: String(session.participant_name ?? "the participant"),
    instrumentVersion: String(session.metadata?.instrumentVersion ?? legacyInstrument.version),
    reviewer: {
      email: String(invite.observer_email ?? ""),
      name: String(invite.observer_name ?? ""),
      relationship: String(invite.relationship_label ?? ""),
    },
  };
}

export async function getFruitLifeSessionStatus(sessionId: string, token: string) {
  if (!sessionId || !token) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const tokenHash = hashToken(token);
  const { data: session } = await supabase
    .from("fruitlife_360_sessions")
    .select(
      "id,intake_token_hash,metadata,observer_completed_count,observer_goal,participant_email,participant_name,report_status,report_url,response_count,self_completed_at,session_status,created_at,updated_at",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return null;
  }

  const isSelfToken = session.intake_token_hash === tokenHash;
  const { data: inviteRows } = await supabase
    .from("fruitlife_360_observer_invites")
    .select("id,completed_at,invite_status,invite_token_hash,metadata,observer_email,observer_name,relationship_label,invited_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  const invites = (inviteRows ?? []) as Array<ObserverInviteLookup & { invited_at: string | null }>;
  // Observer tokens authorize only their own reflection, never the participant roster or report.
  if (!isSelfToken) {
    return null;
  }

  const [{ data: responses }, { data: artifacts }] = await Promise.all([
    supabase
      .from("fruitlife_360_responses")
      .select("id,response_type,reviewer_name,reviewer_email,relationship_label,submitted_at")
      .eq("session_id", sessionId)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("fruitlife_360_report_artifacts")
      .select("artifact_status,artifact_type,created_at,external_url,filename,provider,metadata")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    artifacts: (artifacts ?? []).map(({ metadata: _metadata, ...artifact }) => artifact),
    selfInvitationSent: isSelfToken && (artifacts ?? []).some((artifact) =>
      artifact.artifact_type === "email" && artifact.artifact_status === "sent" &&
      artifact.metadata?.purpose === "initial_invite_email"
    ),
    canManage: isSelfToken,
    invites,
    responses: responses ?? [],
    session,
    token,
  };
}

export async function rescindFruitLifeObserverInvite(formData: FormData) {
  const sessionId = getString(formData, "session_id");
  const token = getString(formData, "token");
  const inviteId = getString(formData, "invite_id");
  const returnTo = safeReturnPath(getString(formData, "return_to"), "/field-kit");

  const status = await getFruitLifeSessionStatus(sessionId, token);
  if (!status?.canManage || !inviteId) {
    fail(returnTo || "/fruitlife360/status", "This invite could not be changed.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: changed, error } = await supabase
    .from("fruitlife_360_observer_invites")
    .update({ invite_status: "expired" })
    .eq("id", inviteId)
    .eq("session_id", sessionId)
    .in("invite_status", ["invited", "draft", "opened"])
    .select("id").maybeSingle();
  if (error || !changed) fail("/field-kit", "This invitation is already completed or no longer active.");
  await refreshFruitLifeCompletion(supabase, sessionId);

  if (returnTo) {
    redirect(appendFruitLifeStatusParam(returnTo, "rescind_sent"));
  }

  redirect(
    `/fruitlife360/status?session=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(
      token,
    )}&message=${encodeURIComponent("Observer link rescinded.")}`,
  );
}
