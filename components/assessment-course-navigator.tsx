"use client";

import { useMemo, useRef, useState } from "react";
import type { CourseModule } from "@/lib/courses/course-catalog";
import { CompanionAudioCard } from "@/components/companion-audio-card";

type AssessmentInsightRow = {
  label: string;
  value: string;
};

type AssessmentCourseNavigatorProps = {
  accent: string;
  assessmentLabel: string;
  connected: boolean;
  completionHref?: string;
  courseSlug: string;
  insights: readonly AssessmentInsightRow[];
  modules: readonly CourseModule[];
  reviewQuery: string;
  savedReflections?: Record<string, string>;
  savedReflectionsEnabled?: boolean;
  showPersonalization?: boolean;
  showStandaloneLessonLink?: boolean;
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
  completionHref,
  courseSlug,
  insights,
  modules,
  reviewQuery,
  savedReflections = {},
  savedReflectionsEnabled = false,
  showPersonalization = true,
  showStandaloneLessonLink = true,
}: AssessmentCourseNavigatorProps) {
  const flatLessons = useMemo(() => flattenModules(modules), [modules]);
  const [activeSlug, setActiveSlug] = useState(flatLessons[0]?.lesson.slug ?? "");
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [reflectionDrafts, setReflectionDrafts] =
    useState<Record<string, string>>(savedReflections);
  const [reflectionStatus, setReflectionStatus] =
    useState<Record<string, "idle" | "saving" | "saved" | "error">>({});
  const activeLessonRef = useRef<HTMLElement | null>(null);
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
    window.setTimeout(() => {
      activeLessonRef.current?.scrollIntoView({ block: "start" });
    }, 0);
  };

  const toggleModule = (moduleSlug: string) => {
    setOpenModules((current) =>
      current.includes(moduleSlug)
        ? current.filter((slug) => slug !== moduleSlug)
        : [...current, moduleSlug],
    );
  };

  const saveReflection = async () => {
    if (!savedReflectionsEnabled) {
      return;
    }

    setReflectionStatus((current) => ({
      ...current,
      [active.lesson.slug]: "saving",
    }));

    const response = await fetch("/api/course-reflections", {
      body: JSON.stringify({
        courseSlug,
        lessonSlug: active.lesson.slug,
        lessonTitle: active.lesson.title,
        prompt: active.lesson.reflectionPrompt,
        response: reflectionDrafts[active.lesson.slug] ?? "",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    setReflectionStatus((current) => ({
      ...current,
      [active.lesson.slug]: response.ok ? "saved" : "error",
    }));
  };

  const activeReflectionStatus = reflectionStatus[active.lesson.slug] ?? "idle";

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
                              onClick={() => flatLesson ? setLesson(flatLesson) : undefined}
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

      <article
        className={`journey-active-lesson assessment assessment-active-lesson assessment-active-${accent}`}
        ref={activeLessonRef}
      >
        <header>
          <div>
            <p className="section-label">
              Module {active.moduleIndex + 1} / Lesson {active.lessonIndex + 1}
            </p>
            <h2>{active.lesson.title}</h2>
          </div>
        </header>

        <section className="journey-active-section-marker" aria-label="Current module">
          <span>
            Module {active.moduleIndex + 1}: {active.module.title.replace(/^Module\s+\d+:\s*/i, "")}
          </span>
        </section>

        <div className="journey-active-body has-care">
          <section className="journey-teaching-card assessment-teaching-card">
            <p className="section-label">Lesson focus</p>
            <div className="journey-active-focus" aria-label="Lesson focus">
              {active.lesson.focus.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <CompanionAudioCard moment={active.lesson.companionMoment} />

            {showPersonalization ? (
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
            ) : null}

            <div className={active.lesson.image ? "assessment-lesson-content with-image" : "assessment-lesson-content"}>
              <section className="lesson-source readable-lesson-body" aria-label="Lesson body">
                <p className="section-label">{active.lesson.title}</p>
                {active.lesson.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
              {active.lesson.image ? (
                <figure className="assessment-lesson-image">
                  <img
                    src={active.lesson.image.src}
                    alt={active.lesson.image.alt}
                    loading="lazy"
                  />
                  {active.lesson.image.caption?.length ? (
                    <figcaption>
                      {active.lesson.image.caption.map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </figcaption>
                  ) : null}
                </figure>
              ) : null}
            </div>

            <section className="lesson-callout assessment-reflection-direction" aria-label="Reflection direction">
              <div className="assessment-reflection-heading">
                <p className="section-label">Reflection</p>
                {savedReflectionsEnabled ? (
                  <details>
                    <summary>Why save this?</summary>
                    <p>
                      Class reflections are stored privately in your account so
                      they can support future summaries, ministry declarations,
                      and the larger Discover Your Divine Design journey if you
                      choose to use them. Only you can access these reflections
                      while signed in.
                    </p>
                  </details>
                ) : null}
              </div>
              <h3>{active.lesson.reflectionPrompt}</h3>
              {savedReflectionsEnabled ? (
                <div className="assessment-reflection-entry">
                  <label htmlFor={`reflection-${active.lesson.slug}`}>
                    <span>Your private reflection</span>
                    <textarea
                      id={`reflection-${active.lesson.slug}`}
                      onChange={(event) =>
                        setReflectionDrafts((current) => ({
                          ...current,
                          [active.lesson.slug]: event.target.value,
                        }))
                      }
                      placeholder="Write what you want to remember from this lesson."
                      value={reflectionDrafts[active.lesson.slug] ?? ""}
                    />
                  </label>
                  <div className="assessment-reflection-actions">
                    <button
                      disabled={activeReflectionStatus === "saving"}
                      onClick={saveReflection}
                      type="button"
                    >
                      {activeReflectionStatus === "saving" ? "Saving..." : "Save reflection"}
                    </button>
                    {activeReflectionStatus === "saved" ? <span>Saved</span> : null}
                    {activeReflectionStatus === "error" ? (
                      <span className="error">Could not save. Try again.</span>
                    ) : null}
                  </div>
                </div>
              ) : null}
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
            <a href={completionHref ?? withReview("/field-kit", reviewQuery)}>Complete Course</a>
          )}
          {showStandaloneLessonLink ? (
            <a href={withReview(`/learn/${courseSlug}/${active.lesson.slug}`, reviewQuery)}>
              Open lesson route
            </a>
          ) : null}
        </footer>
      </article>
    </section>
  );
}
