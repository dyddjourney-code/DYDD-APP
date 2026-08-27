"use client";

import { useMemo, useState } from "react";
import type { CourseModule } from "@/lib/courses/course-catalog";

type AssessmentInsightRow = {
  label: string;
  value: string;
};

type AssessmentCourseNavigatorProps = {
  accent: string;
  assessmentLabel: string;
  connected: boolean;
  courseSlug: string;
  insights: readonly AssessmentInsightRow[];
  modules: readonly CourseModule[];
  reviewQuery: string;
};

type FlatLesson = {
  lesson: CourseModule["lessons"][number];
  lessonIndex: number;
  module: CourseModule;
  moduleIndex: number;
};

function flattenModules(modules: readonly CourseModule[]) {
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

export function AssessmentCourseNavigator({
  accent,
  assessmentLabel,
  connected,
  courseSlug,
  insights,
  modules,
  reviewQuery,
}: AssessmentCourseNavigatorProps) {
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

  const setLesson = (item: FlatLesson) => {
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
      className={`journey-course-walkthrough assessment-course-walkthrough assessment-course-${accent}`}
      aria-label={`${assessmentLabel} course walkthrough`}
    >
      <aside className="journey-course-index assessment-course-index">
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
                  <div className="journey-section-accordion assessment-lesson-accordion">
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
                              <span>{`Lesson ${lessonIndex + 1}`}</span>
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

      <article className={`journey-active-lesson assessment assessment-active-lesson assessment-active-${accent}`}>
        <header>
          <div>
            <p className="section-label">
              Module {active.moduleIndex + 1} / Lesson {active.lessonIndex + 1}
            </p>
            <h2>{active.lesson.title}</h2>
            <p>{active.lesson.summary}</p>
          </div>
          <div className="journey-active-meta">
            <span>{assessmentLabel}</span>
            <span>{active.module.title}</span>
          </div>
        </header>

        <section className="journey-active-section-marker" aria-label="Current module">
          <span>{active.module.title}</span>
          <strong>
            This rough course framework is staged for review. The next content
            pass can replace the lesson copy while preserving the module,
            progress, and course-player structure.
          </strong>
        </section>

        <div className="journey-active-body has-care">
          <section className="journey-teaching-card assessment-teaching-card">
            <p className="section-label">Lesson focus</p>
            <div className="journey-active-focus" aria-label="Lesson focus">
              {active.lesson.focus.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <section className="personal-walkthrough assessment-personal-walkthrough">
              <p className="section-label">Assessment connection</p>
              <h3>{connected ? "Connected data can speak into this lesson." : "Ready for connected data."}</h3>
              {insights.length ? (
                <dl className="lesson-insight-list">
                  {insights.slice(0, 6).map((row) => (
                    <div key={`${row.label}-${row.value}`}>
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

            <section className="lesson-source readable-lesson-body" aria-label="Lesson body">
              <p className="section-label">Rough lesson body</p>
              {active.lesson.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>

            <section className="lesson-callout assessment-reflection-direction" aria-label="Reflection direction">
              <p className="section-label">Future reflection direction</p>
              <h3>{active.lesson.reflectionPrompt}</h3>
              <p>
                No journal field is active here yet. This is the placeholder for
                the later decision about whether this course needs a saved
                response, a simple note, or no input at all.
              </p>
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
            <a href={withReview("/hq", reviewQuery)}>Return to HQ</a>
          )}
          <a href={withReview(`/learn/${courseSlug}/${active.lesson.slug}`, reviewQuery)}>
            Open lesson route
          </a>
        </footer>
      </article>
    </section>
  );
}
