import { NextResponse, type NextRequest } from "next/server";
import {
  isAssessmentType,
  isPlainObject,
  type AssessmentSnapshotPayload,
} from "@/lib/assessments/types";
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
  const assessmentType =
    typeof value.assessmentType === "string" ? value.assessmentType.trim() : "";
  const sourceSlug =
    typeof value.sourceSlug === "string" ? value.sourceSlug.trim() : "";

  if (!userId) {
    return { error: "userId is required." };
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
      profileLanguage: isPlainObject(value.profileLanguage)
        ? value.profileLanguage
        : undefined,
      scores: value.scores,
      sourceResponseId:
        typeof value.sourceResponseId === "string"
          ? value.sourceResponseId.trim()
          : undefined,
      sourceSlug,
      sourceSubmittedAt,
      summary: isPlainObject(value.summary) ? value.summary : undefined,
      userId,
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
  const { data, error } = await supabase
    .from("assessment_snapshots")
    .insert({
      assessment_type: snapshot.assessmentType,
      created_at: snapshot.sourceSubmittedAt ?? new Date().toISOString(),
      scores: {
        profileLanguage: snapshot.profileLanguage ?? {},
        scores: snapshot.scores,
        sourceResponseId: snapshot.sourceResponseId ?? null,
        summary: snapshot.summary ?? {},
      },
      source: snapshot.sourceSlug,
      user_id: snapshot.userId,
    })
    .select("id,assessment_type,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ snapshot: data }, { status: 201 });
}
