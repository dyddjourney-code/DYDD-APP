import { isDyddAdminEmail } from "@/lib/admin-access";
import type { AssessmentSnapshotSummary } from "@/lib/assessments/student-context";

/** Existing DesignPD reports retain course access; DesignID alone is not an unlock.
 * Native failed/pending PDF records are not completed reports. Stripe fulfillment
 * will attach the paid expansion entitlement here when checkout is implemented.
 */
export function hasDesignPdCourseAccess(
  email: string | null | undefined,
  snapshots: AssessmentSnapshotSummary[],
) {
  return isDyddAdminEmail(email) || snapshots.some((snapshot) => {
    if (snapshot.assessment_type !== "designpd") return false;
    const pdf = snapshot.scores?.pdfMonkey as Record<string, unknown> | undefined;
    return snapshot.source !== "designpd_app" ||
      ["ready", "success"].includes(String(pdf?.status));
  });
}
