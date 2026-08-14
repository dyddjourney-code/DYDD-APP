import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildAssessmentCourseInsights,
  getAssessmentSnapshotsForUser,
} from "@/lib/assessments/student-context";
import {
  getLearningLesson,
  learningCourses,
} from "@/lib/courses/course-catalog";
import { normalizeEmail } from "@/lib/identity/email";
import {
  getHeatherReviewReport,
  type ReviewSearchParams,
  withReviewQuery,
} from "@/lib/review/heather";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LearningLessonPageProps = {
  params: Promise<{
    courseSlug: string;
    lessonSlug: string;
  }>;
  searchParams?: Promise<ReviewSearchParams>;
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return learningCourses.flatMap((course) =>
    course.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({
        courseSlug: course.slug,
        lessonSlug: lesson.slug,
      })),
    ),
  );
}

export async function generateMetadata({ params }: LearningLessonPageProps) {
  const { courseSlug, lessonSlug } = await params;
  const match = getLearningLesson(courseSlug, lessonSlug);

  return {
    title: match ? `${match.lesson.title} | ${match.course.title}` : "Lesson",
  };
}

export default async function LearningLessonPage({
  params,
  searchParams,
}: LearningLessonPageProps) {
  const { courseSlug, lessonSlug } = await params;
  const reviewParams = await searchParams;
  const match = getLearningLesson(courseSlug, lessonSlug);

  if (!match) {
    notFound();
  }

  const { course, lesson, lessons } = match;
  const currentIndex = lessons.findIndex((item) => item.slug === lesson.slug);
  const nextLesson = lessons[currentIndex + 1];
  const previousLesson = lessons[currentIndex - 1];
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
    <main className={`lesson-shell lesson-shell-${course.accent}`}>
      <nav className="course-nav" aria-label="Lesson navigation">
        <Link href={withReviewQuery(`/courses/${course.slug}`, reviewParams)}>
          Course map
        </Link>
        <Link href={withReviewQuery("/hq", reviewParams)}>HQ</Link>
      </nav>

      <article className="lesson-page polished-lesson multi-lesson-page">
        <aside className="lesson-index">
          <img src={course.logo} alt={`${course.title} logo`} />
          <span>
            Lesson {String(currentIndex + 1).padStart(2, "0")} of{" "}
            {lessons.length}
          </span>
          <small>{course.tagline}</small>
        </aside>

        <div className="lesson-main">
          <p className="eyebrow">{lesson.moduleTitle}</p>
          <h1>{lesson.title}</h1>
          <p className="lede">{lesson.summary}</p>

          <section className="lesson-brief" aria-label="Lesson focus">
            <p className="section-label">Lesson focus</p>
            <ul>
              {lesson.focus.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="personal-walkthrough" aria-label="Learner data panel">
            <p className="section-label">Heather sample data</p>
            <h2>
              {insights.connected
                ? "This lesson is reading a real mirrored record."
                : "This lesson is ready for a learner record."}
            </h2>
            {insights.rows.length ? (
              <dl className="lesson-insight-list">
                {insights.rows.slice(0, 6).map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p>
                Sign in with the assessment email, or open Heather review mode,
                to see assessment-backed lesson language here.
              </p>
            )}
          </section>

          <section className="lesson-source readable-lesson-body" aria-label="Lesson body">
            <p className="section-label">Lesson body</p>
            {lesson.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>

          <section className="lesson-callout" aria-label="Reflection prompt">
            <p className="section-label">Reflection prompt</p>
            <h2>{lesson.reflectionPrompt}</h2>
            <p>
              This is staged as the workbook prompt for the class review pass.
              The next layer can save the response into the learner journey
              record.
            </p>
          </section>

          <footer className="lesson-pagination" aria-label="Lesson pagination">
            {previousLesson ? (
              <Link
                href={withReviewQuery(
                  `/learn/${course.slug}/${previousLesson.slug}`,
                  reviewParams,
                )}
              >
                Previous: {previousLesson.title}
              </Link>
            ) : (
              <span>First lesson</span>
            )}
            {nextLesson ? (
              <Link
                href={withReviewQuery(
                  `/learn/${course.slug}/${nextLesson.slug}`,
                  reviewParams,
                )}
              >
                Next: {nextLesson.title}
              </Link>
            ) : (
              <Link href={withReviewQuery(`/courses/${course.slug}`, reviewParams)}>
                Back to course map
              </Link>
            )}
          </footer>
        </div>
      </article>
    </main>
  );
}
