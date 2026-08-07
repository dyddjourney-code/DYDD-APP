import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildDesignIdContext,
  getAssessmentSnapshotsForUser,
} from "@/lib/assessments/student-context";
import {
  designIdLessons,
  getDesignIdLesson,
} from "@/lib/courses/designid-foundations";
import {
  buildWalkthroughPrompt,
  personalizeDesignIdHtml,
} from "@/lib/courses/personalization";
import { normalizeEmail } from "@/lib/identity/email";
import {
  buildHeatherReviewContext,
  getHeatherReviewReport,
  type ReviewSearchParams,
  withReviewQuery,
} from "@/lib/review/heather";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LessonPageProps = {
  params: Promise<{
    lessonSlug: string;
  }>;
  searchParams?: Promise<ReviewSearchParams>;
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return designIdLessons.map((lesson) => ({
    lessonSlug: lesson.slug,
  }));
}

export async function generateMetadata({ params }: LessonPageProps) {
  const { lessonSlug } = await params;
  const lesson = getDesignIdLesson(lessonSlug);

  return {
    title: lesson ? `${lesson.title} | DesignID Foundations` : "Lesson",
  };
}

export default async function DesignIdLessonPage({
  params,
  searchParams,
}: LessonPageProps) {
  const { lessonSlug } = await params;
  const reviewParams = await searchParams;
  const lesson = getDesignIdLesson(lessonSlug);

  if (!lesson) {
    notFound();
  }

  const currentIndex = designIdLessons.findIndex((item) => item.slug === lesson.slug);
  const nextLesson = designIdLessons[currentIndex + 1];
  const previousLesson = designIdLessons[currentIndex - 1];
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const reviewReport = await getHeatherReviewReport(reviewParams);
  const assessmentReport = reviewReport ?? (user
    ? await getAssessmentSnapshotsForUser(user.id, normalizeEmail(user.email))
    : { all: [], latest: [] });
  const studentContext = reviewReport
    ? buildHeatherReviewContext(reviewReport)
    : {
        assessmentReport,
        designId: buildDesignIdContext(assessmentReport),
        displayName: user?.email ?? "Learner",
        isSignedIn: Boolean(user),
      };
  const walkthrough = buildWalkthroughPrompt(lesson.title, studentContext);
  const personalizedBody = personalizeDesignIdHtml(
    lesson.bodyHtml,
    studentContext,
  );

  return (
    <main className="lesson-shell">
      <nav className="course-nav" aria-label="Lesson navigation">
        <Link href={withReviewQuery("/courses/designid-foundations", reviewParams)}>
          Course map
        </Link>
        <Link href={withReviewQuery("/hq", reviewParams)}>HQ</Link>
      </nav>

      <article className="lesson-page polished-lesson">
        <aside className="lesson-index">
          <img src="/brand/dydd-logo.webp" alt="Discover Your Divine Design" />
          <span>
            Lesson {String(currentIndex + 1).padStart(2, "0")} of{" "}
            {designIdLessons.length}
          </span>
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

          <section className="lesson-callout" aria-label="Reflection prompt">
            <p className="section-label">Reflection prompt</p>
            <h2>Where do you see this in real life?</h2>
            <p>
              Notice one place this design language gives you clarity about
              your relationships, work, ministry, or next faithful step.
            </p>
          </section>

          <section
            className="personal-walkthrough"
            aria-label="Personalized DesignID walkthrough"
          >
            <p className="section-label">Personal walkthrough</p>
            <h2>{walkthrough.heading}</h2>
            <ul>
              {walkthrough.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {studentContext.isSignedIn ? (
              <Link
                className="button secondary"
                href={withReviewQuery("/hq", reviewParams)}
              >
                Review my HQ records
              </Link>
            ) : (
              <Link className="button secondary" href="/login">
                Sign in to personalize
              </Link>
            )}
          </section>

          <section className="lesson-source" aria-label="Complete lesson body">
            <p className="section-label">Complete course lesson</p>
            <div
              className="source-lesson-body"
              dangerouslySetInnerHTML={{ __html: personalizedBody }}
            />
          </section>

          <footer className="lesson-pagination" aria-label="Lesson pagination">
            {previousLesson ? (
              <Link
                href={withReviewQuery(
                  `/learn/designid-foundations/${previousLesson.slug}`,
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
                  `/learn/designid-foundations/${nextLesson.slug}`,
                  reviewParams,
                )}
              >
                Next: {nextLesson.title}
              </Link>
            ) : (
              <Link href={withReviewQuery("/courses/designid-foundations", reviewParams)}>
                Back to course map
              </Link>
            )}
          </footer>
        </div>
      </article>
    </main>
  );
}
