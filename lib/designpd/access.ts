import { isDyddAdminEmail } from "@/lib/admin-access";
import type { AssessmentSnapshotSummary } from "@/lib/assessments/student-context";

/** Completed-report prerequisite used by existing cards and lifecycle messages.
 * This is NOT a course capability: standalone reports satisfy this prerequisite
 * but course pages and APIs must also check hasAssessmentCourseCapability.
 * Native failed/pending PDF records are not completed reports.
 */
export function hasDesignPdCourseAccess(
  email: string | null | undefined,
  snapshots: AssessmentSnapshotSummary[],
) {
  return isDyddAdminEmail(email) || snapshots.some((snapshot) => {
    if (snapshot.assessment_type !== "designpd") return false;
    if(snapshot.source==='public_guest')return snapshot.owned_report_ready===true;
    const pdf = snapshot.scores?.pdfMonkey as Record<string, unknown> | undefined;
    return snapshot.source !== "designpd_app" ||
      ["ready", "success"].includes(String(pdf?.status));
  });
}
