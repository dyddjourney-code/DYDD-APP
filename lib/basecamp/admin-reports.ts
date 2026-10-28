import "server-only";
import type { User } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/identity/email";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getAssessmentSnapshotsForParticipantMatch,
  type AssessmentSnapshotSummary,
} from "@/lib/assessments/student-context";
import { heatherReviewName } from "@/lib/review/heather";

type AdminSnapshotSummary = AssessmentSnapshotSummary & {
  assessment_participants: {
    display_name: string | null;
    normalized_email: string | null;
  } | null;
};

// Assessment identity alias matching is deliberately NOT an authorization rule.
// A new account at owner+learner@gmail.com must not inherit owner's privileges.
// Every additional admin identity must be explicitly listed, exactly, server-side.
export function isBaseCampReportAdmin(user: User | null | undefined) {
  if (!user?.email || !user.email_confirmed_at || user.is_anonymous) return false;
  const allowed = new Set(
    ["dyddjourney@gmail.com", ...(process.env.DYDD_ADMIN_EMAILS ?? "").split(",")]
      .map(normalizeEmail)
      .filter(Boolean),
  );
  return allowed.has(normalizeEmail(user.email));
}

// Re-check the authenticated session at the data boundary, not a caller-provided
// isAdmin flag, editable profile, user_metadata, review token or preview persona.
export async function getBaseCampAdminReports({ preview = false }: { preview?: boolean } = {}) {
  const denied = { isAdmin: false, adminReport: null, heatherReport: null } as const;
  if (preview) return denied;
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !isBaseCampReportAdmin(user)) return denied;
  const [adminReport, heatherReport] = await Promise.all([
    getAdminAssessmentReport(),
    getHeatherAssessmentReport(),
  ]);
  return { isAdmin: true, adminReport, heatherReport };
}

async function getAdminAssessmentReport() {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data } = await supabaseAdmin
    .from("assessment_snapshots")
    .select(
      "id,assessment_type,created_at,scores,source,source_submitted_at,assessment_participants(display_name,normalized_email)",
    )
    .order("source_submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(120);

  const recent = ((data ?? []) as unknown as Array<
    Omit<AdminSnapshotSummary, "assessment_participants"> & {
      assessment_participants:
        | AdminSnapshotSummary["assessment_participants"]
        | AdminSnapshotSummary["assessment_participants"][];
    }
  >).map((snapshot) => ({
    ...snapshot,
    assessment_participants: Array.isArray(snapshot.assessment_participants)
      ? (snapshot.assessment_participants[0] ?? null)
      : snapshot.assessment_participants,
  }));
  const duplicateGroups = new Map<string, number>();

  for (const snapshot of recent) {
    const email =
      snapshot.assessment_participants?.normalized_email ?? "unknown-participant";
    const key = `${email}:${snapshot.assessment_type}`;
    duplicateGroups.set(key, (duplicateGroups.get(key) ?? 0) + 1);
  }

  return {
    duplicatePairsInRecentWindow: Array.from(duplicateGroups.values()).filter(
      (count) => count > 1,
    ).length,
    recent,
    totalInRecentWindow: recent.length,
  };
}

async function getHeatherAssessmentReport() {
  const report = await getAssessmentSnapshotsForParticipantMatch({
    displayNames: [heatherReviewName],
    emails: ["willoughbyhs@gmail.com"],
  });

  return {
    latest: report.latest,
    participantCount: report.latest.length ? 1 : 0,
    totalSnapshots: report.all.length,
  };
}
