import Link from "next/link";
import {
  buildDesignIdContext,
  getAssessmentSnapshotsForUser,
  hasDesignIdData,
} from "@/lib/assessments/student-context";
import {
  designIdCourse,
  designIdLessons,
} from "@/lib/courses/designid-foundations";
import {
  buildWalkthroughPrompt,
  personalizeDesignIdHtml,
} from "@/lib/courses/personalization";
import { normalizeEmail } from "@/lib/identity/email";
import {
  buildHeatherReviewContext,
  getHeatherReviewReport,
  reviewQuery,
  type ReviewSearchParams,
  withReviewQuery,
} from "@/lib/review/heather";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DesignIdCourseNavigator } from "@/components/designid-course-navigator";
import { PageHelp } from "@/components/page-help";

export const dynamic = "force-dynamic";

type DesignIdCoursePageProps = {
  searchParams?: Promise<ReviewSearchParams>;
};

export default async function DesignIdCoursePage({
  searchParams,
}: DesignIdCoursePageProps) {
  const reviewParams = await searchParams;
  const reviewReport = await getHeatherReviewReport(reviewParams);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const assessmentReport = reviewReport ?? (user
    ? await getAssessmentSnapshotsForUser(user.id, normalizeEmail(user.email))
    : { all: [], latest: [] });
  const designId = buildDesignIdContext(assessmentReport);
  const reviewContext = reviewReport ? buildHeatherReviewContext(reviewReport) : null;
  const studentContext = reviewContext ?? {
    assessmentReport,
    designId,
    displayName: user?.email ?? "Learner",
    isSignedIn: Boolean(user),
  };
  const connected = hasDesignIdData(designId);
  const lessonsBySlug = new Map(
    designIdLessons.map((lesson) => [lesson.slug, lesson]),
  );
  const personalizedModules = designIdCourse.modules.map((module) => ({
    slug: module.slug,
    title: module.title,
    lessons: module.lessons.map((lesson) => {
      const lessonBody = lessonsBySlug.get(lesson.slug)?.bodyHtml ?? "";
      const walkthrough = buildWalkthroughPrompt(lesson.title, studentContext);

      return {
        bodyHtml: personalizeDesignIdHtml(lessonBody, studentContext),
        focus: lesson.focus,
        personalizedNotes: walkthrough.items,
        slug: lesson.slug,
        summary: lesson.summary,
        title: lesson.title,
      };
    }),
  }));

  return (
    <main className="journey-shell designid-course-shell">
      <nav className="course-nav" aria-label="Course navigation">
        <Link href={withReviewQuery("/hq", reviewParams)}>Back to HQ</Link>
        <Link href="/">DYDD home</Link>
      </nav>

      <header className="course-hero polished-course-hero">
        <div>
          <img
            className="course-logo"
            src="/brand/dydd-logo.webp"
            alt="Discover Your Divine Design"
          />
          <p className="eyebrow">DYDD class branch</p>
          <h1>{designIdCourse.title}</h1>
          <p className="lede">{designIdCourse.description}</p>
          <Link
            className="button primary"
            href="#designid-course-player"
          >
            Start first lesson
          </Link>
        </div>
        <aside className="course-verse">
          <p>
            “For we are God&apos;s handiwork, created in Christ Jesus to do good
            works, which God prepared in advance for us to do.”
          </p>
          <span>Ephesians 2:10</span>
        </aside>
      </header>

      <PageHelp
        items={[
          "Use the course menu to move through one DesignID lesson at a time.",
          "Open or close modules so the whole course stays easy to scan.",
          "Connect assessment data with the same email so the course can reflect the learner's pattern.",
        ]}
        title="How to use this course"
      />

      <section className="dydd-progress-racetrack journey-top-racetrack designid-top-racetrack" aria-label="DesignID module quick reference">
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

      <section className="course-personalization" aria-label="Personalization status">
        <div>
          <p className="section-label">Individual walkthrough</p>
          <h2>
            {connected
              ? reviewContext
                ? "You are previewing Heather's personalized DesignID pattern."
                : "This course can now read the learner's DesignID pattern."
              : "Sign in with the assessment email to personalize this course."}
          </h2>
        </div>
        {connected ? (
          <dl>
            <div>
              <dt>Primary</dt>
              <dd>{designId.primary}</dd>
            </div>
            <div>
              <dt>Secondary</dt>
              <dd>{designId.secondary}</dd>
            </div>
            <div>
              <dt>Integrative</dt>
              <dd>{designId.integrativeReflection}</dd>
            </div>
          </dl>
        ) : (
          <Link className="button secondary" href="/login">
            Sign in to connect records
          </Link>
        )}
      </section>

      <div id="designid-course-player">
        <DesignIdCourseNavigator
          modules={personalizedModules}
          reviewQuery={reviewQuery(reviewParams)}
        />
      </div>

      <details className="journey-advanced-planning designid-source-accordion">
        <summary>
          <span>Source lesson links</span>
          <strong>Open the original standalone lesson routes if needed</strong>
        </summary>
        <section className="module-stack" aria-label="DesignID standalone lesson links">
          {designIdCourse.modules.map((module, moduleIndex) => (
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
                          `/learn/designid-foundations/${lesson.slug}`,
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
      </details>
    </main>
  );
}
