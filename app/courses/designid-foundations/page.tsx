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
          <p className="source-note">
            The uploaded GHL course code has been translated into app-native
            modules, lesson cards, reflection prompts, and full lesson bodies.
          </p>
          <Link
            className="button primary"
            href="/learn/designid-foundations/welcome-to-designid"
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
          <span>4</span>
          <small>Reflections</small>
        </div>
      </section>

      <section className="module-stack" aria-label="DesignID lessons">
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
