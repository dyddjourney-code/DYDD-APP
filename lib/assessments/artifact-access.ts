import { normalizeEmail } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AssessmentSnapshotSummary } from "./student-context";

/** Resolve a durable report ID, not a potentially truncated assessment listing.
 * Explicit snapshot ownership always takes precedence over legacy email matching.
 * Reading an artifact must not claim/reassign a participant or mutate a result.
 */
export async function getOwnedArtifactSnapshot(
  snapshotId: string,
  userId: string,
  email: string,
): Promise<AssessmentSnapshotSummary | null> {
  const db = createSupabaseAdminClient();
  const { data: snapshot, error } = await db.from("assessment_snapshots")
    .select("id,user_id,participant_id,assessment_type,created_at,scores,source,source_submitted_at")
    .eq("id", snapshotId).maybeSingle();
  if (error || !snapshot) return null;
  if (snapshot.user_id) return snapshot.user_id === userId ? snapshot : null;
  if (!snapshot.participant_id) return null;
  const { data: participant, error: participantError } = await db.from("assessment_participants")
    .select("id,user_id,normalized_email").eq("id", snapshot.participant_id).maybeSingle();
  if (participantError || !participant) return null;
  if (participant.user_id) return participant.user_id === userId ? snapshot : null;
  // Only the exact authenticated address may access an unclaimed legacy result.
  // Gmail delivery aliases and display names are not proof of ownership.
  const address = normalizeEmail(email);
  return address && normalizeEmail(participant.normalized_email) === address ? snapshot : null;
}
