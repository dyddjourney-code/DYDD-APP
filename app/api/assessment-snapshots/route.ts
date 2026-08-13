import { NextResponse, type NextRequest } from "next/server";
import {
  isAssessmentType,
  isPlainObject,
  type AssessmentSnapshotPayload,
} from "@/lib/assessments/types";
import { ingestAssessmentSnapshot } from "@/lib/assessments/snapshot-ingest";
import { canonicalizeParticipantEmail } from "@/lib/identity/email";

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

  try {
    const data = await ingestAssessmentSnapshot(payload.data);
    return NextResponse.json({ snapshot: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown sync error." },
      { status: 500 },
    );
  }
}
