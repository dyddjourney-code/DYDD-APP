import Link from "next/link";
import { designIdCourse } from "@/lib/courses/designid-foundations";

export default function DesignIdCoursePage() {
  const lessonCount = designIdCourse.modules.reduce(
    (count, module) => count + module.lessons.length,
    0,
  );

  return (
    <main className="course-shell">
      <nav className="course-nav" aria-label="Course navigation">
        <Link href="/hq">Back to HQ</Link>
      </nav>

      <header className="course-hero">
        <p className="eyebrow">DYDD class branch</p>
        <h1>{designIdCourse.title}</h1>
        <p className="lede">{designIdCourse.description}</p>
        <p className="source-note">
          Source staged from `{designIdCourse.source}`. GHL styling and contact
          placeholders have been replaced with app-native lesson structure.
        </p>
      </header>

      <section className="course-map" aria-label="Course modules">
        <div className="course-stat">
          <span>{designIdCourse.modules.length}</span>
          <small>Modules</small>
        </div>
        <div className="course-stat">
          <span>{lessonCount}</span>
          <small>Lessons</small>
        </div>
        <div className="course-stat">
          <span>1</span>
          <small>Working branch</small>
        </div>
      </section>

      <section className="module-stack" aria-label="DesignID lessons">
        {designIdCourse.modules.map((module) => (
          <article key={module.slug} className="module-panel">
            <div>
              <p className="section-label">{module.slug.replaceAll("-", " ")}</p>
              <h2>{module.title}</h2>
            </div>
            <ol>
              {module.lessons.map((lesson, index) => (
                <li key={lesson.slug}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <Link href={`/learn/designid-foundations/${lesson.slug}`}>
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
