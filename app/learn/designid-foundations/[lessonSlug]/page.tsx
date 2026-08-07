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

  return (
    <main className="lesson-shell">
      <nav className="course-nav" aria-label="Lesson navigation">
        <Link href="/courses/designid-foundations">Course map</Link>
        <Link href="/hq">HQ</Link>
      </nav>

      <article className="lesson-page">
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

        <section className="lesson-brief muted-brief" aria-label="Migration note">
          <p className="section-label">Migration note</p>
          <p>
            Original GHL block title: <strong>{lesson.sourceTitle}</strong>.
            This page is the clean app-native scaffold; the next pass can move
            full lesson body content into MDX or Supabase lesson records.
          </p>
        </section>
      </article>
    </main>
  );
}
