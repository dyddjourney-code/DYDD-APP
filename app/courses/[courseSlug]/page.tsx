import { designIdCourseReviewParams } from "@/lib/trails/course-preview";
import { ReflectionCourseShell } from "@/components/reflection-course-shell";
import { redirect } from "next/navigation";
import { requireTrailCourseAssessment } from "@/lib/trails/course-access";
import { notFound } from "next/navigation";
import {
  buildAssessmentCourseInsights,
  getAssessmentSnapshotsForUser,
} from "@/lib/assessments/student-context";
import {
  getLearningCourse,
  learningCourses,
} from "@/lib/courses/course-catalog";
import { normalizeEmail } from "@/lib/identity/email";
import {
  getHeatherReviewReport,
  getNewReviewReport,
  reviewQuery,
  withReviewQuery,
  type ReviewSearchParams,
} from "@/lib/review/heather";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AssessmentCourseNavigator } from "@/components/assessment-course-navigator";
import { FruitLifeMiniNav } from "@/components/fruitlife-mini-nav";

export const dynamic = "force-dynamic";

type LearningCoursePageProps = {
  params: Promise<{
    courseSlug: string;
  }>;
  searchParams?: Promise<
    ReviewSearchParams & {
      lane?: string;
      lesson?: string;
    }
  >;
};

export function generateStaticParams() {
  return learningCourses.map((course) => ({
    courseSlug: course.slug,
  }));
}

function getCourseCompletionHref(courseSlug: string, fruitLifeLane: boolean) {
  if (fruitLifeLane) {
    if (courseSlug === "spiritual-gifts-service") {
      return "/spiritual-gifts?lane=fruitlife";
    }

    if (courseSlug === "fruitlife-360-formation") {
      return "/field-kit?lane=fruitlife";
    }

    return "/trailheads?lane=fruitlife";
  }

  if (
    courseSlug === "spiritual-gifts-service" ||
    courseSlug === "fruitlife-360-formation"
  ) {
    return "/field-kit";
  }

  return "/trailheads";
}

export async function generateMetadata({ params }: LearningCoursePageProps) {
  const { courseSlug } = await params;
  const course = getLearningCourse(courseSlug);

  return {
    title: course ? `${course.title} | DYDD School` : "Course",
  };
}

export default async function LearningCoursePage({
  params,
  searchParams,
}: LearningCoursePageProps) {
  const { courseSlug } = await params;
  const reviewParams = designIdCourseReviewParams(await searchParams);
  // The catalog's retired two-lesson Journey is not the canonical 71-lesson trail.
  if (courseSlug === "discover-your-divine-design") {
    redirect(withReviewQuery(`/journey${reviewParams?.lesson ? `?lesson=${encodeURIComponent(reviewParams.lesson)}` : ""}`, reviewParams));
  }
  const course = getLearningCourse(courseSlug);
  const fruitLifeLane = reviewParams?.lane === "fruitlife";
  const isSpiritualGifts = course?.slug === "spiritual-gifts-service";
  const isFruitLife = course?.slug === "fruitlife-360-formation";
  const isDesignPd = course?.slug === "designpd-alignment";
  const hasIllustratedHeader = isSpiritualGifts || isFruitLife || isDesignPd;
  const headerClass = isDesignPd ? "designpd-course" : isFruitLife ? "fruitlife-course" : "spiritual-gifts-course";
  const trackClass = isDesignPd ? "designpd-top-racetrack" : isFruitLife ? "fruitlife-top-racetrack" : "spiritual-gifts-top-racetrack";
  const fruitLifeReviewQuery = reviewQuery(reviewParams);
  const courseQuery = fruitLifeLane
    ? `?lane=fruitlife${fruitLifeReviewQuery ? `&${fruitLifeReviewQuery.slice(1)}` : ""}`
    : fruitLifeReviewQuery;

  if (!course) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const reviewReport =
    (await getHeatherReviewReport(reviewParams)) ??
    (await getNewReviewReport(reviewParams));
  const assessmentReport =
    reviewReport ??
    (user
      ? await getAssessmentSnapshotsForUser(user.id, normalizeEmail(user.email))
      : { all: [], latest: [] });
  const accessReport =
    course.slug === "designpd-alignment" && reviewReport && user
      ? await getAssessmentSnapshotsForUser(user.id, normalizeEmail(user.email))
      : assessmentReport;
  await requireTrailCourseAssessment({
    slug: course.slug,
    snapshots: accessReport.all,
    email: normalizeEmail(user?.email),
    signedIn: Boolean(user),
    preview: Boolean(reviewReport),
    params: reviewParams,
  });
  const insights = buildAssessmentCourseInsights(
    assessmentReport,
    course.assessmentType,
  );

  return (
    <main
      className={`course-shell course-shell-${course.accent}${hasIllustratedHeader ? ` journey-shell ${headerClass}-shell` : ""}${fruitLifeLane ? " fruitlife-release-shell" : ""}`}
    >
      {fruitLifeLane ? (
        <FruitLifeMiniNav reviewQuery={fruitLifeReviewQuery} />
      ) : null}
      <nav className="course-nav" aria-label="Trail navigation">
        <a
          href={`/trailheads${courseQuery}#${course.assessmentType === "spiritual_gifts" ? "spiritual-gifts" : course.assessmentType === "fruit_360" ? "fruitlife-360" : course.assessmentType}`}
        >
          Back to Trailhead
        </a>
        <a href={withReviewQuery("/journey", reviewParams)}>
          Return to My Journey
        </a>
      </nav>
      {hasIllustratedHeader ? (
        <>
          <header className={`journey-hero ${headerClass}-hero`}>
            <div>
              <h1>{course.title}</h1>
              <p className="lede">{course.tagline}</p>
            </div>
          </header>
          <nav
            className={`dydd-progress-racetrack journey-top-racetrack ${trackClass}`}
            aria-label={`${course.title} module navigation`}
          >
            <ol>
              {course.modules.map((module, index) => (
                <li key={module.slug}>
                  <a href={`/courses/${course.slug}${courseQuery}${courseQuery ? "&" : "?"}lesson=${encodeURIComponent(module.lessons[0].slug)}#${course.slug}-course-player`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{module.title.replace(/^Module\s+\d+:\s*/i, "")}</strong>
                    <small>{module.lessons.length} {module.lessons.length === 1 ? "lesson" : "lessons"}</small>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </>
      ) : (
        <header className="mini-course-logo-intro">
          <img src={course.logo} alt={`${course.title} logo`} />
        </header>
      )}

      {insights.rows.length ? (
        <section
          className={`mini-course-personalization mini-course-personalization-${course.accent}`}
          aria-label={`${course.title} personalization`}
        >
          <div className="course-personalization-label-row">
            <p className="section-label">Personalization</p>
            {insights.note ? (
              <p className="course-personalization-note">{insights.note}</p>
            ) : null}
          </div>
          <dl className="lesson-insight-list mini-course-insight-list">
            {insights.rows.slice(0, 5).map((row) => (
              <div key={`${row.label}-${row.value}`}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <div id={`${course.slug}-course-player`}>
        <ReflectionCourseShell courseSlug={course.slug} inlineEntry>
          <AssessmentCourseNavigator
            accent={course.accent}
            assessmentLabel={course.title}
            connected={insights.connected}
            completionHref={getCourseCompletionHref(course.slug, fruitLifeLane)}
            courseSlug={course.slug}
            insights={insights.rows}
            modules={course.modules}
            reviewQuery={courseQuery}
            showPersonalization={false}
            showStandaloneLessonLink={false}
          />
        </ReflectionCourseShell>
      </div>
    </main>
  );
}
