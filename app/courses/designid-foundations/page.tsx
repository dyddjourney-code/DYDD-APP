import { designIdCourseReviewParams } from "@/lib/trails/course-preview";
import { getReflectionExperience } from "@/lib/reflections/catalog";
import { ReflectionCourseShell } from "@/components/reflection-course-shell";
import { requireTrailCourseAssessment } from "@/lib/trails/course-access";
import Link from "next/link";
import {
  buildDesignIdContext,
  getAssessmentSnapshotsForUser,
} from "@/lib/assessments/student-context";
import {
  designIdCourse,
  designIdLessons,
} from "@/lib/courses/designid-foundations";
import {
  buildWalkthroughPrompt,
  personalizeDesignIdHtml,
  personalizeDesignIdWelcome,
} from "@/lib/courses/personalization";
import { normalizeEmail } from "@/lib/identity/email";
import {
  buildHeatherReviewContext,
  getHeatherReviewReport,
  getNewReviewReport,
  isHeatherReviewRequest,
  newReviewName,
  reviewQuery,
  type ReviewSearchParams,
  withReviewQuery,
} from "@/lib/review/heather";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { designIdLessonPresentation } from "@/lib/courses/designid-lesson-presentation";
import { DesignIdCourseNavigator } from "@/components/designid-course-navigator";

export const dynamic = "force-dynamic";

type DesignIdCoursePageProps = {
  searchParams?: Promise<ReviewSearchParams>;
};

export default async function DesignIdCoursePage({
  searchParams,
}: DesignIdCoursePageProps) {
  const reviewParams = designIdCourseReviewParams(await searchParams);
  const reviewReport =
    (await getHeatherReviewReport(reviewParams)) ??
    (await getNewReviewReport(reviewParams));
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const assessmentReport =
    reviewReport ??
    (user
      ? await getAssessmentSnapshotsForUser(user.id, normalizeEmail(user.email))
      : { all: [], latest: [] });
  await requireTrailCourseAssessment({
    slug: "designid-foundations",
    snapshots: assessmentReport.all,
    email: normalizeEmail(user?.email),
    signedIn: Boolean(user),
    preview: Boolean(reviewReport),
    params: reviewParams,
  });
  const designId = buildDesignIdContext(assessmentReport);
  const reviewContext = reviewReport
    ? {
        ...buildHeatherReviewContext(reviewReport),
        ...(isHeatherReviewRequest(reviewParams)
          ? {}
          : { displayName: newReviewName }),
      }
    : null;
  const studentContext = reviewContext ?? {
    assessmentReport,
    designId,
    displayName: user?.email ?? "Learner",
    isSignedIn: Boolean(user),
  };
  const lessonsBySlug = new Map(
    designIdLessons.map((lesson) => [lesson.slug, lesson]),
  );
  const personalizedModules = designIdCourse.modules.map((module) => ({
    slug: module.slug,
    title: module.title,
    lessons: module.lessons.map((lesson) => {
      const presentation = designIdLessonPresentation[lesson.slug];
      const lessonBody = presentation?.bodyHtml ?? lessonsBySlug.get(lesson.slug)?.bodyHtml ?? "";
      const walkthrough = buildWalkthroughPrompt(lesson.title, studentContext);

      return {
        bodyHtml: (lesson.slug === "welcome-to-designid" ? personalizeDesignIdWelcome : personalizeDesignIdHtml)(lessonBody, studentContext),
        images: presentation?.images ?? [],
        focus: lesson.focus,
        personalizedNotes: walkthrough.items,
        slug: lesson.slug,
        summary: lesson.summary,
        title: lesson.title,
        companionMoment:
          "companionMoment" in lesson ? lesson.companionMoment : undefined,
      };
    }),
  }));

  return (
    <main className="journey-shell designid-course-shell">
      <nav className="course-nav" aria-label="Course navigation">
        <Link href={withReviewQuery("/trailheads", reviewParams) + "#designid"}>
          Back to Trailhead
        </Link>
        <Link href={withReviewQuery("/journey", reviewParams)}>
          Return to My Journey
        </Link>
        <Link href="/">DYDD home</Link>
      </nav>

      <header className="journey-hero designid-course-hero">
        <div>
          <h1>{designIdCourse.title}</h1>
          <p className="lede">Identity</p>
        </div>
      </header>

      <section
        className="dydd-progress-racetrack journey-top-racetrack designid-top-racetrack"
        aria-label="DesignID module quick reference"
      >
        <ol>
          {designIdCourse.modules.map((module, index) => (
            <li key={module.slug}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{module.title.replace(/^Module\s+\d+:\s*/i, "")}</strong>
              <small>{module.lessons.length} lessons</small>
            </li>
          ))}
        </ol>
      </section>

      <div id="designid-course-player">
        <ReflectionCourseShell courseSlug="designid-foundations">
          <DesignIdCourseNavigator
            reflectionQuestions={
              getReflectionExperience("designid-foundations")!.questions
            }
            modules={personalizedModules}
            reviewQuery={reviewQuery(reviewParams)}
          />
        </ReflectionCourseShell>
      </div>

    </main>
  );
}
