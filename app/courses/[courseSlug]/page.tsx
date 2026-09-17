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
  reviewQuery,
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
  searchParams?: Promise<ReviewSearchParams & {
    lane?: string;
  }>;
};

export function generateStaticParams() {
  return learningCourses.map((course) => ({
    courseSlug: course.slug,
  }));
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
  const reviewParams = await searchParams;
  const course = getLearningCourse(courseSlug);
  const fruitLifeLane = reviewParams?.lane === "fruitlife";
  const courseQuery = fruitLifeLane ? "?lane=fruitlife" : reviewQuery(reviewParams);

  if (!course) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const reviewReport = await getHeatherReviewReport(reviewParams);
  const assessmentReport = reviewReport ?? (user
    ? await getAssessmentSnapshotsForUser(user.id, normalizeEmail(user.email))
    : { all: [], latest: [] });
  const insights = buildAssessmentCourseInsights(
    assessmentReport,
    course.assessmentType,
  );
  const savedReflectionsEnabled = [
    "fruitlife-360-formation",
    "spiritual-gifts-service",
  ].includes(course.slug);
  const savedReflections = user && savedReflectionsEnabled
    ? await supabase
        .from("course_lesson_reflections")
        .select("lesson_slug,response")
        .eq("user_id", user.id)
        .eq("course_slug", course.slug)
        .then(({ data }) =>
          Object.fromEntries(
            (data ?? []).map((row) => [
              row.lesson_slug as string,
              (row.response as string | null) ?? "",
            ]),
          ),
        )
    : {};

  return (
    <main className={`course-shell course-shell-${course.accent}${fruitLifeLane ? " fruitlife-release-shell" : ""}`}>
      {fruitLifeLane ? <FruitLifeMiniNav /> : null}
      <header className="mini-course-logo-intro">
        <img src={course.logo} alt={`${course.title} logo`} />
      </header>

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
        <AssessmentCourseNavigator
          accent={course.accent}
          assessmentLabel={course.title}
          connected={insights.connected}
          courseSlug={course.slug}
          insights={insights.rows}
          modules={course.modules}
          reviewQuery={courseQuery}
          savedReflections={savedReflections}
          savedReflectionsEnabled={savedReflectionsEnabled}
          showPersonalization={false}
          showStandaloneLessonLink={false}
        />
      </div>
    </main>
  );
}
