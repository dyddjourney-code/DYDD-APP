import { buildDesignIdContext } from "@/lib/assessments/student-context";
import { getOwnedAssessmentSnapshots } from "@/lib/public-assessments/identity";

/** Read-only saved report lookup: viewing a devotional must never attach participants. */
export async function getSavedWaypointPrimary(userId: string, email: string) {
  const all = await getOwnedAssessmentSnapshots({ id: userId, email });
  return buildDesignIdContext({ all, latest: all }).primary;
}
