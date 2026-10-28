import { getLearningLesson } from "@/lib/courses/course-catalog";
import { courseCardHref, courseOrigin } from "./course-origin";
import { isOwnerCoursePreview } from "./course-preview";
import { redirect } from "next/navigation";
import type { AssessmentSnapshotSummary } from "@/lib/assessments/student-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { courseAssessmentEligibility } from "./course-eligibility";
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
  params?: ReviewSearchParams & { lane?: string; origin?: string; lesson?: string };
}) {
  const trail = trailDefinitions.find((t) => t.courseSlug === slug);
  if (!trail) return;
  if (isOwnerCoursePreview(params)) return;
  const mini = params?.lane === "fruitlife";
  const tracksOrigin = trail.id === "designpd" || trail.id === "fruitlife-360";
  const origin = trail.id === "fruitlife-360" ? "field-kit" : courseOrigin(params?.origin);
  const trailHref = tracksOrigin ? withReviewQuery(courseCardHref(slug, origin), params) :
    withReviewQuery(`/trailheads${mini ? "?lane=fruitlife" : ""}`, params) + `#${trail.id}`;
  const query = new URLSearchParams({ origin });
  if (mini) query.set("lane", "fruitlife");
  if (params?.lesson && getLearningLesson(slug, params.lesson)) query.set("lesson", params.lesson);
  const loginReturn = tracksOrigin ? withReviewQuery(`/courses/${slug}?${query}`, params) : trailHref;
  // Preview data never grants access to the paid expansion.
  if (trail.id === "designpd" && !signedIn)
    redirect(`/login?next=${encodeURIComponent(loginReturn)}`);
  if (!signedIn && !preview)
    redirect(`/login?next=${encodeURIComponent(loginReturn)}`);
  let completed = isTrailAssessmentComplete(trail.assessmentType, snapshots);
  if (trail.id === "fruitlife-360" && signedIn) {
    // Re-authenticate here rather than accepting a caller's email or preview snapshots.
    const db = await createSupabaseServerClient();
    const { data: { user } } = await db.auth.getUser();
    completed = Boolean(user && (await courseAssessmentEligibility(trail.assessmentType, user, snapshots)).ready);
  }

  if (
    !completed ||
    (trail.id === "designpd" && !hasDesignPdCourseAccess(email, snapshots))
  )
    redirect(trailHref);
}
