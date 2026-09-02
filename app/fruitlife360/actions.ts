"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendResendEmail } from "@/lib/email/resend";
import {
  fruitLifeFruits,
  fruitLifePressureQuestions,
  fruitLifeQuestionBank,
  fruitRatingField,
  type FruitLifeResponseType,
} from "@/lib/fruitlife360/intake";
import { buildFruitLifePayloadForSession } from "@/lib/fruitlife360/payload";
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
  redirect(`${path}?message=${encodeURIComponent(message)}`);
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

function isFruitLifeAdmin(email: string | null | undefined) {
  const configured = (process.env.DYDD_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => normalizeEmail(value))
    .filter(Boolean);
  return new Set(["dyddjourney@gmail.com", ...configured]).has(normalizeEmail(email));
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

  if (typedSession.intake_token_hash === hashToken(token)) {
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
  participantName,
  selfLink,
}: {
  participantName: string;
  selfLink: string;
}) {
  const safeParticipantName = escapeHtml(participantName);

  const text = `Hi ${participantName},\n\nYour FruitLife 360 reflection is ready to begin.\n\nComplete your self reflection:\n${selfLink}\n\nFruitLife 360 is designed as a formation mirror, not a grade or label.\n\nSincerely,\nDiscover Your Divine Design Team`;

  return {
    html: `
      <p>Hi ${safeParticipantName},</p>
      <p>Your FruitLife 360 reflection is ready to begin.</p>
      <p><a href="${selfLink}">Complete your FruitLife 360 self reflection</a></p>
      <p>FruitLife 360 is designed as a formation mirror, not a grade or label.</p>
      <p>Sincerely,<br>Discover Your Divine Design Team</p>
    `,
    subject: "Your FruitLife 360 self reflection",
    text,
  };
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
  const text = `${greeting}\n\n${participantName} invited you to complete a FruitLife 360 observer reflection.\n\nComplete the FruitLife 360 assessment:\n${observerLink}\n\nThis is designed as a formation mirror, not a grade or label. Your feedback should be clear, kind, and useful.\n\nSincerely,\nDiscover Your Divine Design Team`;

  return {
    html: `
      <p>${safeGreeting}</p>
      <p>${safeParticipantName} invited you to complete a FruitLife 360 observer reflection.</p>
      <p><a href="${observerLink}">Complete the FruitLife 360 assessment</a></p>
      <p>This is designed as a formation mirror, not a grade or label. Your feedback should be clear, kind, and useful.</p>
      <p>Sincerely,<br>Discover Your Divine Design Team</p>
    `,
    subject: `FruitLife 360 reflection for ${participantName}`,
    text,
  };
}

async function recordAndSendInviteEmail({
  observerLinks,
  participantEmail,
  participantName,
  selfLink,
  sessionId,
  supabase,
}: {
  observerLinks?: Array<{ email: string; link: string; name: string; relationship: string }>;
  participantEmail: string;
  participantName: string;
  selfLink: string;
  sessionId: string;
  supabase: ReturnType<typeof createSupabaseAdminClient>;
}) {
  const email = fruitLifeInviteEmail({
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
      observerLinks: observerLinks ?? [],
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

async function recordAndSendObserverEmails({
  observerLinks,
  participantName,
  sessionId,
  supabase,
}: {
  observerLinks: Array<{ email: string; link: string; name: string; relationship: string }>;
  participantName: string;
  sessionId: string;
  supabase: ReturnType<typeof createSupabaseAdminClient>;
}) {
  for (const observer of observerLinks) {
    const email = fruitLifeObserverEmail({
      observerLink: observer.link,
      observerName: observer.name,
      participantName,
    });
    const result = await sendResendEmail({
      ...email,
      to: observer.email,
    });

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
    observer_invite_id: observerInviteId,
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
    const responseCount = 1 + session.observer_completed_count;
    const readyForReport = session.observer_goal <= session.observer_completed_count;
    const { error } = await supabase
      .from("fruitlife_360_sessions")
      .update({
        report_status: readyForReport ? "queued" : "waiting_for_responses",
        response_count: responseCount,
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
    const hasSelfResponse = Boolean(session.self_completed_at);
    const readyForReport = hasSelfResponse && completedCount >= session.observer_goal;
    const responseCount = (hasSelfResponse ? 1 : 0) + completedCount;
    const { error } = await supabase
      .from("fruitlife_360_sessions")
      .update({
        observer_completed_count: completedCount,
        report_status: readyForReport ? "queued" : "waiting_for_responses",
        response_count: responseCount,
        session_status: readyForReport ? "ready_for_report" : "waiting_for_observers",
      })
      .eq("id", session.id);

    if (error) {
      fail(path, error.message);
    }

    if (observerInviteId) {
      await supabase
        .from("fruitlife_360_observer_invites")
        .update({ completed_at: submittedAt, invite_status: "completed" })
        .eq("id", observerInviteId);
    }

    if (readyForReport) {
      await queuePayloadJob(supabase, session.id);
    }
  }

  const thanksParams = new URLSearchParams({
    message:
      responseType === "self"
        ? "Self reflection submitted. The session status has been updated."
        : "Observer reflection submitted. Thank you for helping with this FruitLife 360 report.",
    session: session.id,
    token,
    type: responseType,
  });

  redirect(`/fruitlife360/thanks?${thanksParams.toString()}`);
}

export async function createFruitLifeSession(formData: FormData) {
  const participantName = getString(formData, "participant_name");
  const participantEmail = normalizeEmail(getString(formData, "participant_email"));
  const observerSeeds = observerSeedsFromForm(formData);
  const observerGoalInput = Math.max(0, Math.min(12, getNumber(formData, "observer_goal", 3)));
  const observerGoal = observerSeeds.length || observerGoalInput;
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
      },
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

  const selfLink = `${baseUrl}/fruitlife360/self?session=${session.id}&token=${selfToken}`;
  const observerLinks =
    observerSeeds.length > 0
      ? observerSeeds.map((observer) => ({
          ...observer,
          link: `${baseUrl}/fruitlife360/observer?session=${session.id}&token=${makeToken()}`,
        }))
      : [
          {
            email: "",
            link: `${baseUrl}/fruitlife360/observer?session=${session.id}&token=${makeToken()}`,
            name: "",
            relationship: "",
          },
        ];

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

  const { error: inviteError } = await supabase
    .from("fruitlife_360_observer_invites")
    .insert(inviteRows);

  if (inviteError) {
    fail("/fruitlife360", inviteError.message);
  }

  await supabase
    .from("fruitlife_360_sessions")
    .update({
      metadata: {
        observerLinks,
        selfLink,
        source: "native_fruitlife_intake",
      },
    })
    .eq("id", session.id);

  await recordAndSendInviteEmail({
    observerLinks: observerLinks.filter((observer) => observer.email),
    participantEmail,
    participantName,
    selfLink,
    sessionId: session.id,
    supabase,
  });
  await recordAndSendObserverEmails({
    observerLinks: observerLinks.filter((observer) => observer.email),
    participantName,
    sessionId: session.id,
    supabase,
  });

  redirect(
    `/hq?fruitlife_session=${encodeURIComponent(session.id)}&fruitlife_token=${encodeURIComponent(
      selfToken,
    )}&fruitlife=created#fruitlife360-control`,
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

export async function sendFruitLifeReminder(formData: FormData) {
  const sessionId = getString(formData, "session_id");
  const returnTo = getString(formData, "return_to") || "/hq";

  if (!sessionId) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}fruitlife=missing_session`);
  }

  const supabase = createSupabaseAdminClient();
  const { data: session, error } = await supabase
    .from("fruitlife_360_sessions")
    .select("id,metadata,participant_email,participant_name,observer_completed_count,observer_goal")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}fruitlife=reminder_failed`);
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
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}fruitlife=not_allowed`);
  }

  const metadata = (session.metadata ?? {}) as {
    observerLinks?: Array<{ email?: string; link?: string; name?: string; relationship?: string }>;
    selfLink?: string;
  };
  const { data: pendingInvites } = await supabase
    .from("fruitlife_360_observer_invites")
    .select("observer_email,observer_name,relationship_label,metadata")
    .eq("session_id", sessionId)
    .neq("invite_status", "completed");
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
  const participantEmail = normalizeEmail(String(session.participant_email ?? ""));
  const observerLinks = Array.isArray(metadata.observerLinks) ? metadata.observerLinks : [];
  const participantResult = participantEmail && metadata.selfLink
    ? await sendResendEmail({
        ...fruitLifeInviteEmail({
          participantName,
          selfLink: metadata.selfLink,
        }),
        to: participantEmail,
      })
    : { message: "No participant email/self link available.", sent: false, skipped: true };

  await supabase.from("fruitlife_360_report_artifacts").insert({
    artifact_status: participantResult.sent ? "sent" : participantResult.skipped ? "draft" : "error",
    artifact_type: "email",
    metadata: {
      error: participantResult.message ?? null,
      purpose: "manual_reminder_email",
      resendSkipped: participantResult.skipped,
      resendSent: participantResult.sent,
    },
    provider: "resend",
    provider_document_id: participantResult.id ?? null,
    session_id: sessionId,
  });

  await recordAndSendObserverEmails({
    observerLinks: pendingObserverLinks.length
      ? pendingObserverLinks
      : observerLinks
          .filter((observer) => observer.email && observer.link)
          .map((observer) => ({
            email: String(observer.email),
            link: String(observer.link),
            name: String(observer.name ?? ""),
            relationship: String(observer.relationship ?? ""),
          })),
    participantName,
    sessionId,
    supabase,
  });

  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}fruitlife=reminder_sent`);
}

export async function getFruitLifeObserverContext(sessionId: string, token: string) {
  if (!sessionId || !token) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const tokenHash = hashToken(token);
  const { data: session } = await supabase
    .from("fruitlife_360_sessions")
    .select("id,participant_name,participant_email")
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

  if (!invite?.id || invite.invite_status === "completed") {
    return {
      participantName: String(session.participant_name ?? "the participant"),
      reviewer: null,
    };
  }

  return {
    participantName: String(session.participant_name ?? "the participant"),
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
  const isObserverToken = invites.some((invite) => invite.invite_token_hash === tokenHash);

  if (!isSelfToken && !isObserverToken) {
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
      .select("artifact_status,artifact_type,created_at,external_url,filename,provider")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    artifacts: artifacts ?? [],
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
  const returnTo = getString(formData, "return_to");

  const status = await getFruitLifeSessionStatus(sessionId, token);
  if (!status?.canManage || !inviteId) {
    fail(returnTo || "/fruitlife360/status", "This invite could not be changed.");
  }

  const supabase = createSupabaseAdminClient();
  await supabase
    .from("fruitlife_360_observer_invites")
    .update({ invite_status: "expired" })
    .eq("id", inviteId)
    .eq("session_id", sessionId);

  if (returnTo) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}fruitlife=rescind_sent#fruitlife360-control`);
  }

  redirect(
    `/fruitlife360/status?session=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(
      token,
    )}&message=${encodeURIComponent("Observer link rescinded.")}`,
  );
}
