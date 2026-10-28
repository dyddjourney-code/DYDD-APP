"use client";
import { useCourseProgress, CourseCompletionControls } from "@/components/course-progress";
import {
  useReflectionPosition,
  ReflectionAnswer,
} from "@/components/reflection-session";

import { useEffect, useMemo, useRef, useState } from "react";
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

function renderLessonBodyBlock(
  block: CourseModule["lessons"][number]["body"][number],
) {
  if (typeof block === "string") {
    return <p key={block}>{block}</p>;
  }

  if (block.kind === "scripture") {
    const lines = Array.isArray(block.text) ? block.text : [block.text];
    return (
      <blockquote className="lesson-scripture-callout" key={lines.join("|")}>
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </blockquote>
    );
  }

  if (block.kind === "image") {
    return (
      <figure
        className={`lesson-body-image${block.fit === "contain" ? " contain" : ""}`}
        key={block.src}
      >
        <img src={block.src} alt={block.alt} loading="lazy" />
      </figure>
    );
  }

  if (block.kind === "list") {
    return (
      <ul className="lesson-body-list" key={block.items.join("|")}>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <h3 className="lesson-body-subheading" key={block.text}>
      {block.text}
    </h3>
  );
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
  showPersonalization = true,
  showStandaloneLessonLink = true,
}: AssessmentCourseNavigatorProps) {
  const flatLessons = useMemo(() => flattenModules(modules), [modules]);
  const savedPosition = useReflectionPosition();
  const checklistSlugs = useMemo(() => flatLessons.map(item => item.lesson.slug), [flatLessons]);
  const checklist = useCourseProgress(courseSlug, checklistSlugs);
  useEffect(() => {
    if (!savedPosition.roundId) return;
    const requested =
      new URLSearchParams(window.location.search).get("lesson") ??
      savedPosition.lessonSlug;
    const match =
      flatLessons.find((item) => item.lesson.slug === requested) ??
      flatLessons[0];
    if (match) {
      setActiveSlug(match.lesson.slug);
      setOpenModules([match.module.slug]);
    }
  }, [savedPosition.roundId]);
  const [activeSlug, setActiveSlug] = useState(
    flatLessons[0]?.lesson.slug ?? "",
  );
  useEffect(() => {
    try {
      const saved =
        new URLSearchParams(window.location.search).get("lesson") ??
        localStorage.getItem(`dydd-course-${courseSlug}`);
      const match = flatLessons.find((item) => item.lesson.slug === saved);
      if (match) {
        setActiveSlug(match.lesson.slug);
        setOpenModules([match.module.slug]);
      }
      if (!match && flatLessons[0])
        localStorage.setItem(
          `dydd-course-${courseSlug}`,
          flatLessons[0].lesson.slug,
        );
    } catch {
      /* Storage is optional; learning stays available. */
    }
  }, [flatLessons, courseSlug]);
  const [openModules, setOpenModules] = useState<string[]>([]);
  const activeLessonRef = useRef<HTMLElement | null>(null);
  const activeIndex = Math.max(
    0,
    flatLessons.findIndex((item) => item.lesson.slug === (checklist.canVisit(activeSlug) ? activeSlug : checklistSlugs.find(slug => !checklist.done(slug)) ?? checklistSlugs[0])),
  );
  const active = flatLessons[activeIndex] ?? flatLessons[0];
  const previous = activeIndex > 0 ? flatLessons[activeIndex - 1] : null;
  const next =
    activeIndex < flatLessons.length - 1 ? flatLessons[activeIndex + 1] : null;
  const progress = checklist.percent;

  if (!active) {
    return null;
  }

  const setLesson = async (item: FlatLesson, completedAdvance = false) => {
    if (!completedAdvance && !checklist.canVisit(item.lesson.slug)) return;
    if (savedPosition.flush && !await savedPosition.flush()) return;
    setActiveSlug(item.lesson.slug);
    savedPosition.recordPosition?.(item.lesson.slug);
    try {
      localStorage.setItem(`dydd-course-${courseSlug}`, item.lesson.slug);
    } catch {}
    setOpenModules((current) =>
      current.includes(item.module.slug)
        ? current
        : [...current, item.module.slug],
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
        <div
          className="journey-course-progress"
          aria-label="Current lesson progress"
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="journey-course-progress-label">
          Lesson {activeIndex + 1} of {flatLessons.length} · {checklist.state?.completed.length ?? 0} completed
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
                  <strong>
                    {module.title.replace(/^Module\s+\d+:\s*/i, "")}
                  </strong>
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
                              className={
                                lesson.slug === active.lesson.slug
                                  ? "active"
                                  : ""
                              }
                              disabled={!checklist.canVisit(lesson.slug) || checklist.busy}
                              onClick={() =>
                                flatLesson ? setLesson(flatLesson) : undefined
                              }
                              type="button"
                            >
                              <span>{`Lesson ${lessonIndex + 1}`}</span>
                              <strong>{lesson.title}</strong><small className="lesson-checklist-status">{checklist.done(lesson.slug) ? "✓ Completed" : checklist.canVisit(lesson.slug) ? "○ Not completed" : "🔒 Complete earlier lessons"}</small>
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

        <section
          className="journey-active-section-marker"
          aria-label="Current module"
        >
          <span>
            Module {active.moduleIndex + 1}:{" "}
            {active.module.title.replace(/^Module\s+\d+:\s*/i, "")}
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
            {courseSlug === "designpd-alignment" &&
              (["unpacking-your-report", "planning", "deciding", "doing"].includes(active.module.slug)) ? (
              <section className="personal-walkthrough assessment-personal-walkthrough designpd-lesson-tendencies" aria-label="Your saved DesignPD tendencies">
                <p className="section-label">Your DesignPD result</p>
                <h3>{active.module.slug === "unpacking-your-report" ? "How you Plan, Decide, and Do" : `Your ${active.module.slug} tendency`}</h3>
                <dl className="lesson-insight-list">
                  {(active.module.slug === "unpacking-your-report" ? ["Plan", "Decide", "Do"] : [active.module.slug === "planning" ? "Plan" : active.module.slug === "deciding" ? "Decide" : "Do"]).map(label => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{insights.find(row => row.label === label)?.value ?? "Not available in your saved report"}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}


            {showPersonalization ? (
              <section className="personal-walkthrough assessment-personal-walkthrough">
                <p className="section-label">Assessment connection</p>
                <h3>
                  {connected
                    ? "Connected data can speak into this lesson."
                    : "Ready for connected data."}
                </h3>
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

            <div
              className={
                active.lesson.image
                  ? "assessment-lesson-content with-image"
                  : "assessment-lesson-content"
              }
            >
              <section
                className="lesson-source readable-lesson-body"
                aria-label="Lesson body"
              >
                <p className="section-label">{active.lesson.title}</p>
                {active.lesson.body.map((block) =>
                  renderLessonBodyBlock(block),
                )}
              </section>
              {active.lesson.image ? (
                <figure
                  className={`assessment-lesson-image${active.lesson.image.fit === "contain" ? " contain" : ""}`}
                >
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

            {active.lesson.reflectionPrompt ? (
              <ReflectionAnswer questionId={active.lesson.slug} entryPoint />
            ) : null}
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
          <CourseCompletionControls progress={checklist} lessonSlug={active.lesson.slug} nextTitle={next?.lesson.title} onNext={next ? () => { void setLesson(next, true); } : undefined} flush={savedPosition.flush} completionHref={completionHref ?? withReview("/field-kit", reviewQuery)} />
          {showStandaloneLessonLink ? (
            <a
              href={withReview(
                `/learn/${courseSlug}/${active.lesson.slug}`,
                reviewQuery,
              )}
            >
              Open lesson route
            </a>
          ) : null}
        </footer>
      </article>
    </section>
  );
}
