"use client";
import { useCourseProgress, CourseCompletionControls } from "@/components/course-progress";
import { DesignIdAuthoredBody } from "@/components/designid-authored-body";
import { DesignIdWelcomeBody } from "@/components/designid-welcome-body";
import type { ReflectionQuestion } from "@/lib/reflections/catalog";
import {
  useReflectionPosition,
  ReflectionAnswer,
} from "@/components/reflection-session";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CompanionMoment } from "@/lib/courses/companion-moments";
import { CompanionAudioCard } from "@/components/companion-audio-card";

type DesignIdLessonView = {
  authored?: boolean;
  bodyHtml: string;
  images: readonly { src: string; alt: string }[];
  companionMoment?: CompanionMoment;
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
  reflectionQuestions: ReflectionQuestion[];
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
  reflectionQuestions,
  reviewQuery,
}: DesignIdCourseNavigatorProps) {
  const flatLessons = useMemo(() => flattenModules(modules), [modules]);
  const savedPosition = useReflectionPosition();
  const checklistSlugs = useMemo(() => flatLessons.map(item => item.lesson.slug), [flatLessons]);
  const checklist = useCourseProgress("designid-foundations", checklistSlugs);
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
        localStorage.getItem("dydd-course-designid-foundations");
      const match = flatLessons.find((item) => item.lesson.slug === saved);
      if (match) {
        setActiveSlug(match.lesson.slug);
        setOpenModules([match.module.slug]);
      }
      if (!match && flatLessons[0])
        localStorage.setItem(
          "dydd-course-designid-foundations",
          flatLessons[0].lesson.slug,
        );
    } catch {}
  }, [flatLessons]);
  const [savingReflection, setSavingReflection] = useState(false);
  const saveReflection = async () => {
    if (!savedPosition.flush || savingReflection) return;
    setSavingReflection(true);
    try { await savedPosition.flush(); } finally { setSavingReflection(false); }
  };
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

  const setLesson = async (item: FlatDesignIdLesson, completedAdvance = false) => {
    if (!completedAdvance && !checklist.canVisit(item.lesson.slug)) return;
    if (savedPosition.flush && !await savedPosition.flush()) return;
    setActiveSlug(item.lesson.slug);
    savedPosition.recordPosition?.(item.lesson.slug);
    try {
      localStorage.setItem(
        "dydd-course-designid-foundations",
        item.lesson.slug,
      );
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
      className={`journey-course-walkthrough designid-course-walkthrough ${active.lesson.slug === "welcome-to-designid" || active.lesson.authored ? "designid-welcome-walkthrough" : ""}`}
      aria-label="DesignID course walkthrough"
    >
      <aside className="journey-course-index designid-course-index">
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
                  <div className="journey-section-accordion designid-lesson-accordion">
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
                              <span className="designid">
                                Lesson {lessonIndex + 1}
                              </span>
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
        className={`journey-active-lesson designid designid-active-lesson ${active.lesson.slug === "welcome-to-designid" ? "designid-welcome-lesson" : ""}`}
        ref={activeLessonRef}
      >
        <header>
          <div>
            <p className="section-label">
              Module {active.moduleIndex + 1} / Lesson {active.lessonIndex + 1}
            </p>
            <h2>{active.lesson.title}</h2>

          </div>
          <div className="journey-active-meta">
            <span>DesignID</span>
            <span>{active.lesson.slug === "welcome-to-designid" ? `Module ${active.moduleIndex + 1}` : active.module.title}</span>
            {active.lesson.slug === "welcome-to-designid" ? <><span>Welcome</span><span>3–5 minutes</span></> : null}
          </div>
        </header>

        {active.lesson.slug !== "welcome-to-designid" ? <section
          className="journey-active-section-marker"
          aria-label="Current module"
        >
          <span>{active.module.title}</span>

        </section> : null}

        <div className="journey-active-body has-care">
          <section className="journey-teaching-card designid-teaching-card">
            <p className="section-label">Lesson focus</p>
            <div className="journey-active-focus" aria-label="Lesson focus">
              {active.lesson.focus.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <CompanionAudioCard moment={active.lesson.companionMoment} />

            {active.lesson.slug === "welcome-to-designid" ? <DesignIdWelcomeBody bodyHtml={active.lesson.bodyHtml} image={active.lesson.images[0]} /> : active.lesson.authored ? <DesignIdAuthoredBody bodyHtml={active.lesson.bodyHtml} images={active.lesson.images} compactIntro={active.lesson.slug === "your-design-profile"} capacityIntro={active.lesson.slug === "reflection-capacity"} /> : <div className="assessment-lesson-content designid-lesson-content with-image">
              <section className="lesson-source readable-lesson-body designid-clean-lesson" aria-label="Lesson body">
                <h3 className="lesson-body-subheading">{active.lesson.title}</h3>
                <div className="designid-semantic-body" dangerouslySetInnerHTML={{ __html: active.lesson.bodyHtml }} />
              </section>
              <aside className="designid-lesson-artwork" aria-label="Lesson artwork">
                {active.lesson.images.map((image) => (
                  <figure className="assessment-lesson-image contain" key={image.src}>
                    <a href={image.src} target="_blank" rel="noopener noreferrer" aria-label={`Open ${image.alt} full size`}>
                      <img src={image.src} alt={image.alt} loading="lazy" />
                    </a>
                    <figcaption><span>Open image full size</span></figcaption>
                  </figure>
                ))}
              </aside>
            </div>}
            {active.lesson.slug !== "welcome-to-designid" && !active.lesson.authored ? <details className="designid-report-connection">
              <summary>Connect this lesson to your report</summary>
              <ul>{active.lesson.personalizedNotes.map((item) => <li key={item}>{item}</li>)}</ul>
            </details> : null}
            {reflectionQuestions.some(q => q.lessonSlug === active.lesson.slug) ? <section className="designid-lesson-reflections" aria-label="Lesson reflections">
              <p className="section-label">Reflect and apply</p>
              <p>Use Save reflection to save without leaving. Complete &amp; Next also saves your reflections before opening the next lesson. If saving fails, you stay here and can retry. Save before closing or reloading.</p>

            {reflectionQuestions
              .filter((q) => q.lessonSlug === active.lesson.slug)
              .map((q, index) => (
                <ReflectionAnswer key={q.id} questionId={q.id} entryPoint={index === 0} />
              ))}
              {savedPosition.roundId && savedPosition.flush ? <button className="button secondary designid-save-reflection" type="button" disabled={savingReflection} onClick={() => void saveReflection()}>{savingReflection ? "Saving…" : "Save reflection"}</button> : null}
            </section> : null}
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
          <CourseCompletionControls progress={checklist} lessonSlug={active.lesson.slug} nextTitle={next?.lesson.title} onNext={next ? () => { void setLesson(next, true); } : undefined} flush={savedPosition.flush} completionHref={withReview("/journey", reviewQuery)} />

        </footer>
      </article>
    </section>
  );
}
