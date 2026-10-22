import { DesignIdAuthoredBody } from "@/components/designid-authored-body";
import { designIdAuthoredLessons } from "@/lib/courses/designid-authored-lessons";
import { personalizeDesignIdAuthored } from "@/lib/courses/designid-authored-personalization";
import { designIdCourseReviewParams } from "@/lib/trails/course-preview";
import { DesignIdWelcomeBody } from "@/components/designid-welcome-body";
import { requireTrailCourseAssessment } from "@/lib/trails/course-access";
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
  personalizeDesignIdWelcome,
} from "@/lib/courses/personalization";
import { normalizeEmail } from "@/lib/identity/email";
import {
  buildHeatherReviewContext,
  getHeatherReviewReport,
  getNewReviewReport,
  isHeatherReviewRequest,
  newReviewName,
  type ReviewSearchParams,
  withReviewQuery,
} from "@/lib/review/heather";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { designIdLessonPresentation } from "@/lib/courses/designid-lesson-presentation";
import { getDesignIdReflectionPrompts } from "@/lib/courses/designid-reflection-prompts";
import { CompanionAudioCard } from "@/components/companion-audio-card";

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
    title: lesson ? `${lesson.title} | DesignID Course` : "Lesson",
  };
}

export default async function DesignIdLessonPage({
  params,
  searchParams,
}: LessonPageProps) {
  const { lessonSlug } = await params;
  const reviewParams = designIdCourseReviewParams(await searchParams);
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
  const reviewReport = await getHeatherReviewReport(reviewParams) ?? await getNewReviewReport(reviewParams);
  const assessmentReport = reviewReport ?? (user
    ? await getAssessmentSnapshotsForUser(user.id, normalizeEmail(user.email))
    : { all: [], latest: [] });
  await requireTrailCourseAssessment({ slug: "designid-foundations", snapshots: assessmentReport.all, email: normalizeEmail(user?.email), signedIn: Boolean(user), preview: Boolean(reviewReport), params: reviewParams });
  const studentContext = reviewReport
    ? { ...buildHeatherReviewContext(reviewReport), ...(isHeatherReviewRequest(reviewParams) ? {} : { displayName: newReviewName }) }
    : {
        assessmentReport,
        designId: buildDesignIdContext(assessmentReport),
        displayName: user?.email ?? "Learner",
        isSignedIn: Boolean(user),
      };
  const walkthrough = buildWalkthroughPrompt(lesson.title, studentContext);
  const personalizedBody = (designIdAuthoredLessons[lesson.slug] ? personalizeDesignIdAuthored : lesson.slug === "welcome-to-designid" ? personalizeDesignIdWelcome : personalizeDesignIdHtml)(
    designIdLessonPresentation[lesson.slug]?.bodyHtml ?? lesson.bodyHtml,
    studentContext,
  );

  return (
    <main className="lesson-shell lesson-shell-purple designid-lesson-shell">
      <nav className="course-nav" aria-label="Lesson navigation">
        <Link href={withReviewQuery("/courses/designid-foundations", reviewParams)}>
          Course map
        </Link>
        <Link href={withReviewQuery("/trailheads", reviewParams) + "#designid"}>Back to Trailhead</Link>
        <Link href={withReviewQuery("/journey", reviewParams)}>Return to My Journey</Link>
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

          <CompanionAudioCard
            moment={"companionMoment" in lesson ? lesson.companionMoment : undefined}
          />

          {lesson.slug === "welcome-to-designid" ? <DesignIdWelcomeBody bodyHtml={personalizedBody} image={designIdLessonPresentation[lesson.slug].images[0]} /> : designIdAuthoredLessons[lesson.slug] ? <DesignIdAuthoredBody bodyHtml={personalizedBody} images={designIdLessonPresentation[lesson.slug].images} compactIntro={lesson.slug === "your-design-profile"} capacityIntro={lesson.slug === "reflection-capacity"} /> : <div className="assessment-lesson-content designid-lesson-content with-image">
            <section className="lesson-source readable-lesson-body" aria-label="Complete lesson body">
              <h2 className="lesson-body-subheading">{lesson.title}</h2>
              <div className="designid-semantic-body" dangerouslySetInnerHTML={{ __html: personalizedBody }} />
            </section>
            <aside className="designid-lesson-artwork" aria-label="Lesson artwork">
              {designIdLessonPresentation[lesson.slug]?.images.map(image => (
                <figure className="assessment-lesson-image contain" key={image.src}>
                  <a href={image.src} target="_blank" rel="noopener noreferrer" aria-label={`Open ${image.alt} full size`}>
                      <img src={image.src} alt={image.alt} loading="lazy" />
                    </a>
                    <figcaption><span>Open image full size</span></figcaption>
                </figure>
              ))}
            </aside>
          </div>}
          {lesson.slug !== "welcome-to-designid" && !designIdAuthoredLessons[lesson.slug] ? <details className="designid-report-connection">
            <summary>Connect this lesson to your report</summary>
            <ul>{walkthrough.items.map(item => <li key={item}>{item}</li>)}</ul>
          </details> : null}
          {getDesignIdReflectionPrompts(lesson.slug).length ? <section className="designid-lesson-reflections" aria-label="Lesson reflections">
            <p className="section-label">Reflect and apply</p>
            {getDesignIdReflectionPrompts(lesson.slug).map(question => <p key={question.id}>{question.prompt}</p>)}
            <Link className="button secondary" href={withReviewQuery(`/courses/designid-foundations`, reviewParams) + (withReviewQuery("", reviewParams).includes("?") ? "&" : "?") + `lesson=${lesson.slug}#designid-course-player`}>Open this lesson to save your reflections</Link>
          </section> : null}

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
