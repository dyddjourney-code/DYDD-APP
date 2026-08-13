import type { AssessmentSnapshotPayload } from "./types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function ingestAssessmentSnapshot(snapshot: AssessmentSnapshotPayload) {
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
    throw new Error(participantError.message);
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
    throw new Error(error.message);
  }

  return data;
}
