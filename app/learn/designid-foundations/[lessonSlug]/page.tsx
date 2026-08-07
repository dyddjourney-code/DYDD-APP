import Link from "next/link";
import { notFound } from "next/navigation";
import {
  designIdLessons,
  getDesignIdLesson,
} from "@/lib/courses/designid-foundations";

type LessonPageProps = {
  params: Promise<{
    lessonSlug: string;
  }>;
};

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

export default async function DesignIdLessonPage({ params }: LessonPageProps) {
  const { lessonSlug } = await params;
  const lesson = getDesignIdLesson(lessonSlug);

  if (!lesson) {
    notFound();
  }

  const currentIndex = designIdLessons.findIndex((item) => item.slug === lesson.slug);
  const nextLesson = designIdLessons[currentIndex + 1];
  const previousLesson = designIdLessons[currentIndex - 1];

  return (
    <main className="lesson-shell">
      <nav className="course-nav" aria-label="Lesson navigation">
        <Link href="/courses/designid-foundations">Course map</Link>
        <Link href="/hq">HQ</Link>
      </nav>

      <article className="lesson-page polished-lesson">
        <aside className="lesson-index">
          <img src="/brand/designid-logo.webp" alt="DesignID" />
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

          <section className="lesson-brief muted-brief" aria-label="Migration note">
            <p className="section-label">Source note</p>
            <p>
              Original GHL block title: <strong>{lesson.sourceTitle}</strong>.
              This first app pass preserves the lesson path and review logic;
              the full body content can be moved into durable lesson records in
              the next content migration.
            </p>
          </section>

          <footer className="lesson-pagination" aria-label="Lesson pagination">
            {previousLesson ? (
              <Link href={`/learn/designid-foundations/${previousLesson.slug}`}>
                Previous: {previousLesson.title}
              </Link>
            ) : (
              <span>First lesson</span>
            )}
            {nextLesson ? (
              <Link href={`/learn/designid-foundations/${nextLesson.slug}`}>
                Next: {nextLesson.title}
              </Link>
            ) : (
              <Link href="/courses/designid-foundations">Back to course map</Link>
            )}
          </footer>
        </div>
      </article>
    </main>
  );
}
