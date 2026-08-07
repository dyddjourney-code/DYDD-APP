import { NextResponse, type NextRequest } from "next/server";
import {
  isAssessmentType,
  isPlainObject,
  type AssessmentSnapshotPayload,
} from "@/lib/assessments/types";
import { canonicalizeParticipantEmail } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice("bearer ".length).trim();
}

function validatePayload(value: unknown):
  | { data: AssessmentSnapshotPayload; error?: never }
  | { data?: never; error: string } {
  if (!isPlainObject(value)) {
    return { error: "Payload must be an object." };
  }

  const userId = typeof value.userId === "string" ? value.userId.trim() : "";
  const participantEmail =
    typeof value.participantEmail === "string"
      ? canonicalizeParticipantEmail(value.participantEmail)
      : "";
  const participantKey =
    typeof value.participantKey === "string" ? value.participantKey.trim() : "";
  const participantName =
    typeof value.participantName === "string"
      ? value.participantName.trim()
      : "";
  const assessmentType =
    typeof value.assessmentType === "string" ? value.assessmentType.trim() : "";
  const sourceSlug =
    typeof value.sourceSlug === "string" ? value.sourceSlug.trim() : "";
  const syncBatchId =
    typeof value.syncBatchId === "string" ? value.syncBatchId.trim() : "";

  if (!userId && !participantEmail && !participantKey) {
    return {
      error:
        "At least one identity field is required: userId, participantEmail, or participantKey.",
    };
  }

  if (participantEmail && !participantEmail.includes("@")) {
    return { error: "participantEmail is invalid." };
  }

  if (!isAssessmentType(assessmentType)) {
    return { error: "assessmentType is invalid." };
  }

  if (!sourceSlug) {
    return { error: "sourceSlug is required." };
  }

  if (!isPlainObject(value.scores)) {
    return { error: "scores must be an object." };
  }

  const sourceSubmittedAt =
    typeof value.sourceSubmittedAt === "string"
      ? value.sourceSubmittedAt.trim()
      : undefined;

  if (sourceSubmittedAt && Number.isNaN(Date.parse(sourceSubmittedAt))) {
    return { error: "sourceSubmittedAt must be a valid date string." };
  }

  return {
    data: {
      assessmentType,
      participantEmail: participantEmail || undefined,
      participantKey: participantKey || undefined,
      participantName: participantName || undefined,
      profileLanguage: isPlainObject(value.profileLanguage)
        ? value.profileLanguage
        : undefined,
      scores: value.scores,
      syncBatchId: syncBatchId || undefined,
      sourceResponseId:
        typeof value.sourceResponseId === "string"
          ? value.sourceResponseId.trim()
          : undefined,
      sourceSlug,
      sourceSubmittedAt,
      summary: isPlainObject(value.summary) ? value.summary : undefined,
      userId: userId || undefined,
    },
  };
}

export async function POST(request: NextRequest) {
  const syncSecret = process.env.DYDD_ASSESSMENT_SYNC_SECRET;

  if (!syncSecret || getBearerToken(request) !== syncSecret) {
    return unauthorized();
  }

  const payload = validatePayload(await request.json().catch(() => null));

  if (payload.error) {
    return NextResponse.json({ error: payload.error }, { status: 400 });
  }

  if (!payload.data) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const snapshot = payload.data;
  const supabase = createSupabaseAdminClient();

  const participantRecord: {
    display_name?: string;
    dydd_participant_key?: string;
    normalized_email?: string;
    updated_at: string;
    user_id?: string;
  } = {
    updated_at: new Date().toISOString(),
  };
  let participantConflictKey = "user_id";

  if (snapshot.participantEmail) {
    participantRecord.normalized_email = snapshot.participantEmail;
    participantConflictKey = "normalized_email";
  } else if (snapshot.participantKey) {
    participantRecord.dydd_participant_key = snapshot.participantKey;
    participantConflictKey = "dydd_participant_key";
  } else if (snapshot.userId) {
    participantRecord.user_id = snapshot.userId;
  }

  if (snapshot.participantName) {
    participantRecord.display_name = snapshot.participantName;
  }

  if (snapshot.userId) {
    participantRecord.user_id = snapshot.userId;
  }

  const { data: participant, error: participantError } = await supabase
    .from("assessment_participants")
    .upsert(participantRecord, {
      onConflict: participantConflictKey,
    })
    .select("id")
    .single();

  if (participantError) {
    return NextResponse.json(
      { error: participantError.message },
      { status: 500 },
    );
  }

  const snapshotRecord = {
    assessment_type: snapshot.assessmentType,
    created_at: snapshot.sourceSubmittedAt ?? new Date().toISOString(),
    participant_id: participant.id,
    scores: {
      profileLanguage: snapshot.profileLanguage ?? {},
      scores: snapshot.scores,
      sourceResponseId: snapshot.sourceResponseId ?? null,
      summary: snapshot.summary ?? {},
    },
    source: snapshot.sourceSlug,
    source_response_id: snapshot.sourceResponseId ?? null,
    source_submitted_at: snapshot.sourceSubmittedAt ?? null,
    sync_batch_id: snapshot.syncBatchId ?? null,
    user_id: snapshot.userId ?? null,
  };

  const query = snapshot.sourceResponseId
    ? supabase
        .from("assessment_snapshots")
        .upsert(snapshotRecord, {
          onConflict: "assessment_type,source,source_response_id",
        })
    : supabase.from("assessment_snapshots").insert(snapshotRecord);

  const { data, error } = await query
    .select("id,assessment_type,created_at,participant_id,source_response_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ snapshot: data }, { status: 201 });
}
