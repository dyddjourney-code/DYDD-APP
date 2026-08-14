import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildAssessmentCourseInsights,
  getAssessmentSnapshotsForUser,
} from "@/lib/assessments/student-context";
import {
  getLearningCourse,
  getLearningLessons,
  learningCourses,
} from "@/lib/courses/course-catalog";
import { normalizeEmail } from "@/lib/identity/email";
import {
  getHeatherReviewReport,
  type ReviewSearchParams,
  withReviewQuery,
} from "@/lib/review/heather";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LearningCoursePageProps = {
  params: Promise<{
    courseSlug: string;
  }>;
  searchParams?: Promise<ReviewSearchParams>;
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

  if (!course) {
    notFound();
  }

  const lessons = getLearningLessons(course);
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

  return (
    <main className={`course-shell course-shell-${course.accent}`}>
      <nav className="course-nav" aria-label="Course navigation">
        <Link href={withReviewQuery("/hq", reviewParams)}>Back to HQ</Link>
        <Link href={withReviewQuery("/journey", reviewParams)}>Journey map</Link>
      </nav>

      <header className="course-hero polished-course-hero multi-course-hero">
        <div>
          <div className="course-logo-row">
            <img className="course-logo" src={course.logo} alt={`${course.title} logo`} />
            <img
              className="course-logo small"
              src="/brand/dydd-logo.webp"
              alt="Discover Your Divine Design"
            />
          </div>
          <p className="eyebrow">{course.tagline}</p>
          <h1>{course.title}</h1>
          <p className="lede">{course.description}</p>
          <p className="source-note">{course.sourceNote}</p>
          <Link
            className="button primary"
            href={withReviewQuery(
              `/learn/${course.slug}/${lessons[0]?.slug ?? ""}`,
              reviewParams,
            )}
          >
            Start first lesson
          </Link>
        </div>
        <aside className="course-verse assessment-snapshot-card">
          <p className="section-label">Sample wiring</p>
          <h2>{insights.connected ? "Heather data is connected." : "Awaiting data."}</h2>
          <p>
            {insights.connected
              ? "This course can read the learner's mirrored assessment snapshot and place it beside the lesson."
              : "When a matching assessment is attached, this panel fills with learner-specific insight."}
          </p>
        </aside>
      </header>

      <section className="course-map" aria-label="Course facts">
        <div className="course-stat">
          <span>{course.modules.length}</span>
          <small>Modules mapped</small>
        </div>
        <div className="course-stat">
          <span>{lessons.length}</span>
          <small>Lessons staged</small>
        </div>
        <div className="course-stat">
          <span>{insights.rows.length}</span>
          <small>Personal fields available</small>
        </div>
      </section>

      <section className="course-personalization" aria-label="Course personalization">
        <div>
          <p className="section-label">Heather preview lane</p>
          <h2>
            {insights.connected
              ? "The lesson can now carry real assessment language beside the teaching."
              : "The structure is ready for the learner's own assessment data."}
          </h2>
          <p className="panel-copy">{course.companionNote}</p>
        </div>
        {insights.rows.length ? (
          <dl>
            {insights.rows.slice(0, 5).map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <Link className="button secondary" href="/login">
            Sign in to connect records
          </Link>
        )}
      </section>

      <section className="module-stack" aria-label={`${course.title} lessons`}>
        {course.modules.map((module, moduleIndex) => (
          <article key={module.slug} className="module-panel">
            <div>
              <p className="section-label">
                Module {String(moduleIndex + 1).padStart(2, "0")}
              </p>
              <h2>{module.title}</h2>
            </div>
            <ol>
              {module.lessons.map((lesson, index) => (
                <li key={lesson.slug}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <Link
                      href={withReviewQuery(
                        `/learn/${course.slug}/${lesson.slug}`,
                        reviewParams,
                      )}
                    >
                      {lesson.title}
                    </Link>
                    <p>{lesson.summary}</p>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>
    </main>
  );
}
