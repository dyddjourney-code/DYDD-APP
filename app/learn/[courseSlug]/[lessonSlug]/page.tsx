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
import { FruitLifeMiniNav } from "@/components/fruitlife-mini-nav";
import { CompanionAudioCard } from "@/components/companion-audio-card";

type LearningLessonPageProps = {
  params: Promise<{
    courseSlug: string;
    lessonSlug: string;
  }>;
  searchParams?: Promise<ReviewSearchParams & {
    lane?: string;
  }>;
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
  const fruitLifeLane = reviewParams?.lane === "fruitlife";

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
  const courseMapHref = fruitLifeLane
    ? `/courses/${course.slug}?lane=fruitlife`
    : withReviewQuery(`/courses/${course.slug}`, reviewParams);

  return (
    <main className={`lesson-shell lesson-shell-${course.accent}${fruitLifeLane ? " fruitlife-release-shell" : ""}`}>
      {fruitLifeLane ? <FruitLifeMiniNav /> : null}
      {!fruitLifeLane ? (
        <nav className="course-nav" aria-label="Lesson navigation">
          <Link href={courseMapHref}>Course map</Link>
          <Link href={withReviewQuery("/hq", reviewParams)}>
            Base Camp
          </Link>
        </nav>
      ) : null}

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

          <section className="lesson-brief" aria-label="Lesson focus">
            <p className="section-label">Lesson focus</p>
            <div className="journey-active-focus" aria-label="Lesson focus">
              {lesson.focus.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </section>

          <CompanionAudioCard moment={lesson.companionMoment} />

          {!fruitLifeLane ? (
            <section className="personal-walkthrough" aria-label="Learner data panel">
              <p className="section-label">Assessment connection</p>
              <h2>
                {insights.connected
                  ? "Connected data can speak into this lesson."
                  : "Ready for connected data."}
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
                  Once this assessment is connected, this space can carry the
                  learner's report language beside the teaching.
                </p>
              )}
            </section>
          ) : null}

          <div className={lesson.image ? "assessment-lesson-content with-image" : "assessment-lesson-content"}>
            <section className="lesson-source readable-lesson-body" aria-label="Lesson body">
              <p className="section-label">{lesson.title}</p>
              {lesson.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
            {lesson.image ? (
              <figure className="assessment-lesson-image">
                <img
                  src={lesson.image.src}
                  alt={lesson.image.alt}
                  loading="lazy"
                />
              </figure>
            ) : null}
          </div>

          <section className="lesson-callout assessment-reflection-direction" aria-label="Reflection prompt">
            <p className="section-label">Reflection</p>
            <h2>{lesson.reflectionPrompt}</h2>
          </section>

          <footer className="lesson-pagination" aria-label="Lesson pagination">
            {previousLesson ? (
              <Link
                href={
                  fruitLifeLane
                    ? `/learn/${course.slug}/${previousLesson.slug}?lane=fruitlife`
                    : withReviewQuery(`/learn/${course.slug}/${previousLesson.slug}`, reviewParams)
                }
              >
                Previous: {previousLesson.title}
              </Link>
            ) : (
              <span>First lesson</span>
            )}
            {nextLesson ? (
              <Link
                href={
                  fruitLifeLane
                    ? `/learn/${course.slug}/${nextLesson.slug}?lane=fruitlife`
                    : withReviewQuery(`/learn/${course.slug}/${nextLesson.slug}`, reviewParams)
                }
              >
                Next: {nextLesson.title}
              </Link>
            ) : (
              <Link href={courseMapHref}>
                Back to course map
              </Link>
            )}
          </footer>
        </div>
      </article>
    </main>
  );
}
