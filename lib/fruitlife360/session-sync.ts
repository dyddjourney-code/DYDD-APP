import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SnapshotRow = {
  created_at: string | null;
  id: string;
  participant_id: string | null;
  scores: unknown;
  source_response_id: string | null;
  source_submitted_at: string | null;
  assessment_participants?: {
    display_name: string | null;
    normalized_email: string | null;
  } | null;
};

export type FruitLifeSessionSyncOptions = {
  apply: boolean;
  limit: number;
};

export type FruitLifeSessionSyncResult = {
  applied: boolean;
  errors: { message: string; snapshotId?: string }[];
  processed: number;
  sessions: {
    participantEmail?: string;
    participantName?: string;
    reportMode?: string;
    sourceParticipantId: string;
    status: string;
  }[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function numberField(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function getSnapshotPayload(snapshot: SnapshotRow) {
  if (!isRecord(snapshot.scores)) return {};
  return snapshot.scores;
}

function getSummary(snapshot: SnapshotRow) {
  const payload = getSnapshotPayload(snapshot);
  return isRecord(payload.summary) ? payload.summary : {};
}

function getScores(snapshot: SnapshotRow) {
  const payload = getSnapshotPayload(snapshot);
  return isRecord(payload.scores) ? payload.scores : {};
}

function getParticipant(snapshot: SnapshotRow) {
  const participant = snapshot.assessment_participants;
  return Array.isArray(participant) ? participant[0] : participant;
}

function getSourceParticipantId(snapshot: SnapshotRow) {
  const summary = getSummary(snapshot);
  return (
    stringField(snapshot.source_response_id) ||
    stringField(summary.Participant_ID) ||
    `fruitlife_360_snapshot:${snapshot.id}`
  );
}

function getSessionStatus(summary: Record<string, unknown>, scores: Record<string, unknown>) {
  const reportMode = stringField(summary.Report_Mode).toLowerCase();
  const responseCount = numberField(scores.Response_Count);
  const observerCount = numberField(scores.Observer_Count);

  if (reportMode || responseCount > 0) return "report_ready";
  if (observerCount > 0) return "waiting_for_observers";
  return "active";
}

function buildSessionRecord(snapshot: SnapshotRow) {
  const summary = getSummary(snapshot);
  const scores = getScores(snapshot);
  const sourceParticipantId = getSourceParticipantId(snapshot);
  const reportMode = stringField(summary.Report_Mode);
  const participant = getParticipant(snapshot);

  return {
    metadata: {
      growthInvitationFruitList: stringField(summary.Growth_Invitation_Fruit_List),
      mostVisibleFruit: stringField(summary.Most_Visible_Fruit),
      mostVisibleFruitList: stringField(summary.Most_Visible_Fruit_List),
      reviewerMix: stringField(summary.Reviewer_Mix),
      sourceSnapshotId: snapshot.id,
      steadyFormingFruitList: stringField(summary.Steady_Forming_Fruit_List),
    },
    observer_completed_count: numberField(scores.Observer_Count),
    observer_goal: Math.max(numberField(scores.Observer_Count), 0),
    participant_email: participant?.normalized_email ?? null,
    participant_id: snapshot.participant_id,
    participant_name: participant?.display_name ?? null,
    report_mode: reportMode || null,
    report_snapshot_id: snapshot.id,
    report_status: "ready",
    response_count: numberField(scores.Response_Count),
    session_status: getSessionStatus(summary, scores),
    source_participant_id: sourceParticipantId,
    source_synced_at: snapshot.source_submitted_at ?? snapshot.created_at ?? new Date().toISOString(),
    source_system: "fruitlife_360_report_export",
  };
}

export async function syncFruitLifeSessionsFromSnapshots({
  apply,
  limit,
}: FruitLifeSessionSyncOptions): Promise<FruitLifeSessionSyncResult> {
  const supabase = createSupabaseAdminClient();
  const errors: FruitLifeSessionSyncResult["errors"] = [];
  const sessions: FruitLifeSessionSyncResult["sessions"] = [];

  const { data: snapshots, error } = await supabase
    .from("assessment_snapshots")
    .select(
      "id,participant_id,source_response_id,source_submitted_at,created_at,scores,assessment_participants(display_name,normalized_email)",
    )
    .eq("assessment_type", "fruit_360")
    .order("source_submitted_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  for (const snapshot of ((snapshots ?? []) as unknown as SnapshotRow[])) {
    if (!snapshot.participant_id) {
      errors.push({ message: "FruitLife snapshot is missing participant_id.", snapshotId: snapshot.id });
      continue;
    }

    const record = buildSessionRecord(snapshot);

    sessions.push({
      participantEmail: record.participant_email ?? undefined,
      participantName: record.participant_name ?? undefined,
      reportMode: record.report_mode ?? undefined,
      sourceParticipantId: record.source_participant_id,
      status: record.session_status,
    });

    if (!apply) continue;

    const { error: upsertError } = await supabase
      .from("fruitlife_360_sessions")
      .upsert(record, {
        onConflict: "source_participant_id",
      });

    if (upsertError) {
      errors.push({ message: upsertError.message, snapshotId: snapshot.id });
    }
  }

  return {
    applied: apply,
    errors,
    processed: snapshots?.length ?? 0,
    sessions,
  };
}
