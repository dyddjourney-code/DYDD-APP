import { buildDesignIdContext, type AssessmentSnapshotSummary } from "@/lib/assessments/student-context";
import { participantEmailCandidates } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Read-only saved report lookup: viewing a devotional must never attach identities. */
export async function getSavedWaypointPrimary(userId: string, email: string) {
  const admin = createSupabaseAdminClient();
  const { data: owned, error: ownedError } = await admin.from("assessment_participants")
    .select("id").eq("user_id", userId);
  if (ownedError) return "";
  const ids = new Set((owned ?? []).map((p: { id: string }) => p.id));
  const candidates = participantEmailCandidates(email);
  if (candidates.length) {
    const { data: unclaimed, error } = await admin.from("assessment_participants")
      .select("id").is("user_id", null).in("normalized_email", candidates);
    if (error) return "";
    for (const participant of unclaimed ?? []) ids.add(participant.id);
  }
  const { data, error } = await admin.from("assessment_snapshots")
    .select("id,assessment_type,created_at,scores,source,source_submitted_at")
    .eq("assessment_type", "designid")
    .or(ids.size
      ? `user_id.eq.${userId},and(user_id.is.null,participant_id.in.(${[...ids].join(",")}))`
      : `user_id.eq.${userId}`)
    .order("source_submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false }).limit(1);
  if (error) return "";
  const all = (data ?? []) as AssessmentSnapshotSummary[];
  return buildDesignIdContext({ all, latest: all }).primary;
}
