import { redirect } from "next/navigation";
import type { AssessmentSnapshotSummary } from "@/lib/assessments/student-context";
import {
  getFruitLifeDashboardSessions,
  fruitLifeReportArtifact,
} from "@/lib/fruitlife360/dashboard";
import { hasDesignPdCourseAccess } from "@/lib/designpd/access";
import { trailDefinitions, isTrailAssessmentComplete } from "./catalog";
import { withReviewQuery, type ReviewSearchParams } from "@/lib/review/heather";
export async function requireTrailCourseAssessment({
  slug,
  snapshots,
  email,
  signedIn,
  preview,
  params,
}: {
  slug: string;
  snapshots: AssessmentSnapshotSummary[];
  email: string;
  signedIn: boolean;
  preview: boolean;
  params?: ReviewSearchParams & { lane?: string };
}) {
  const trail = trailDefinitions.find((t) => t.courseSlug === slug);
  if (!trail) return;
  const mini = params?.lane === "fruitlife";
  const trailHref =
    withReviewQuery(`/trailheads${mini ? "?lane=fruitlife" : ""}`, params) +
    `#${trail.id}`;
  // Preview data never grants access to the paid expansion.
  if (trail.id === "designpd" && !signedIn)
    redirect(`/login?next=${encodeURIComponent(trailHref)}`);
  if (!signedIn && !preview)
    redirect(`/login?next=${encodeURIComponent(trailHref)}`);
  let completed = isTrailAssessmentComplete(trail.assessmentType, snapshots);
  if (!completed && trail.id === "fruitlife-360" && email) {
    const sessions = await getFruitLifeDashboardSessions({
      email,
      enabled: true,
    });
    completed = sessions.some((session) =>
      Boolean(fruitLifeReportArtifact(session)),
    );
  }
  if (
    !completed ||
    (trail.id === "designpd" && !hasDesignPdCourseAccess(email, snapshots))
  )
    redirect(trailHref);
}
