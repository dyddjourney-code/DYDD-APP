"use client";

import { useMemo, useState } from "react";

type DesignIdLessonView = {
  bodyHtml: string;
  focus: readonly string[];
  personalizedNotes: readonly string[];
  slug: string;
  summary: string;
  title: string;
};

type DesignIdModuleView = {
  lessons: readonly DesignIdLessonView[];
  slug: string;
  title: string;
};

type DesignIdCourseNavigatorProps = {
  modules: readonly DesignIdModuleView[];
  reviewQuery: string;
};

type FlatDesignIdLesson = {
  lesson: DesignIdLessonView;
  lessonIndex: number;
  module: DesignIdModuleView;
  moduleIndex: number;
};

function flattenModules(modules: readonly DesignIdModuleView[]) {
  return modules.flatMap((module, moduleIndex) =>
    module.lessons.map((lesson, lessonIndex) => ({
      lesson,
      lessonIndex,
      module,
      moduleIndex,
    })),
  );
}

function withReview(path: string, reviewQuery: string) {
  return `${path}${reviewQuery}`;
}

export function DesignIdCourseNavigator({
  modules,
  reviewQuery,
}: DesignIdCourseNavigatorProps) {
  const flatLessons = useMemo(() => flattenModules(modules), [modules]);
  const [activeSlug, setActiveSlug] = useState(flatLessons[0]?.lesson.slug ?? "");
  const [openModules, setOpenModules] = useState<string[]>([]);
  const activeIndex = Math.max(
    0,
    flatLessons.findIndex((item) => item.lesson.slug === activeSlug),
  );
  const active = flatLessons[activeIndex] ?? flatLessons[0];
  const previous = activeIndex > 0 ? flatLessons[activeIndex - 1] : null;
  const next = activeIndex < flatLessons.length - 1 ? flatLessons[activeIndex + 1] : null;
  const progress = flatLessons.length
    ? Math.round(((activeIndex + 1) / flatLessons.length) * 100)
    : 0;

  if (!active) {
    return null;
  }

  const setLesson = (item: FlatDesignIdLesson) => {
    setActiveSlug(item.lesson.slug);
    setOpenModules((current) =>
      current.includes(item.module.slug) ? current : [...current, item.module.slug],
    );
  };

  const toggleModule = (moduleSlug: string) => {
    setOpenModules((current) =>
      current.includes(moduleSlug)
        ? current.filter((slug) => slug !== moduleSlug)
        : [...current, moduleSlug],
    );
  };

  return (
    <section
      className="journey-course-walkthrough designid-course-walkthrough"
      aria-label="DesignID course walkthrough"
    >
      <aside className="journey-course-index designid-course-index">
        <div className="journey-course-index-heading">
          <p className="section-label">Course menu</p>
          <h2>Choose a module and lesson.</h2>
        </div>
        <div className="journey-course-progress" aria-label="Current lesson progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="journey-course-progress-label">
          Lesson {activeIndex + 1} of {flatLessons.length}
        </p>

        <div className="journey-module-accordion">
          {modules.map((module, moduleIndex) => {
            const moduleActive = module.slug === active.module.slug;
            const moduleOpen = openModules.includes(module.slug);

            return (
              <section
                className={`${moduleOpen ? "open" : ""} ${moduleActive ? "current" : ""}`}
                key={module.slug}
              >
                <button
                  className="journey-module-toggle"
                  aria-expanded={moduleOpen}
                  onClick={() => toggleModule(module.slug)}
                  type="button"
                >
                  <span>{String(moduleIndex + 1).padStart(2, "0")}</span>
                  <strong>{module.title.replace(/^Module\s+\d+:\s*/i, "")}</strong>
                  <small>{module.lessons.length} lessons</small>
                </button>
                {moduleOpen ? (
                  <div className="journey-section-accordion designid-lesson-accordion">
                    <ol>
                      {module.lessons.map((lesson, lessonIndex) => {
                        const flatLesson = flatLessons.find(
                          (item) => item.lesson.slug === lesson.slug,
                        );

                        return (
                          <li key={lesson.slug}>
                            <button
                              className={lesson.slug === active.lesson.slug ? "active" : ""}
                              onClick={() =>
                                flatLesson ? setLesson(flatLesson) : setActiveSlug(lesson.slug)
                              }
                              type="button"
                            >
                              <span className="designid">Lesson {lessonIndex + 1}</span>
                              <strong>{lesson.title}</strong>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </aside>

      <article className="journey-active-lesson designid designid-active-lesson">
        <header>
          <div>
            <p className="section-label">
              Module {active.moduleIndex + 1} / Lesson {active.lessonIndex + 1}
            </p>
            <h2>{active.lesson.title}</h2>
            <p>{active.lesson.summary}</p>
          </div>
          <div className="journey-active-meta">
            <span>DesignID</span>
            <span>{active.module.title}</span>
          </div>
        </header>

        <section className="journey-active-section-marker" aria-label="Current module">
          <span>{active.module.title}</span>
          <strong>
            DesignID gives the learner language for how God has shaped them to
            reflect His image, love others, and walk with purpose.
          </strong>
        </section>

        <div className="journey-active-body has-care">
          <section className="journey-teaching-card designid-teaching-card">
            <p className="section-label">Lesson focus</p>
            <div className="journey-active-focus" aria-label="Lesson focus">
              {active.lesson.focus.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <section className="personal-walkthrough designid-personal-walkthrough">
              <p className="section-label">Personal walkthrough</p>
              <h3>Connect this lesson to your report.</h3>
              <ul>
                {active.lesson.personalizedNotes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="lesson-source designid-lesson-source" aria-label="Complete lesson body">
              <p className="section-label">Complete lesson</p>
              <div
                className="source-lesson-body designid-source-lesson-body"
                dangerouslySetInnerHTML={{ __html: active.lesson.bodyHtml }}
              />
            </section>
          </section>
        </div>

        <footer className="journey-active-pagination">
          {previous ? (
            <button onClick={() => setLesson(previous)} type="button">
              Previous: {previous.lesson.title}
            </button>
          ) : (
            <span>First lesson</span>
          )}
          {next ? (
            <button onClick={() => setLesson(next)} type="button">
              Next: {next.lesson.title}
            </button>
          ) : (
            <a href={withReview("/journey", reviewQuery)}>Continue to DYDD Journey</a>
          )}
        </footer>
      </article>
    </section>
  );
}
