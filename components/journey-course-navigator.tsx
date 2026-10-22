"use client";
import { JourneyCareDirections } from "@/components/journey-care-directions";
import {
  useReflectionPosition,
  ReflectionAnswer,
  ReflectionNicheBuilder,
} from "@/components/reflection-session";

import { useEffect, useMemo, useRef, useState } from "react";
import { ReviewAwareLink } from "@/components/review-aware-link";
import { JourneyWhoWhoseCare } from "@/components/journey-who-whose-care";
import { JourneyCareIntroduction } from "@/components/journey-care-introduction";
import { JourneyLessonBody } from "@/components/journey-lesson-body";
import { CompanionAudioCard } from "@/components/companion-audio-card";
import type { CareStep } from "@/lib/journey/dydd-journey";
import type {
  DyddCourseModule,
  DyddCourseUnit,
  DyddCourseUnitType,
} from "@/lib/journey/dydd-course-outline";

type JourneyCourseNavigatorProps = {
  modules: DyddCourseModule[];
};

type SectionGroup = {
  title: string;
  units: DyddCourseUnit[];
};

type FlatUnit = {
  module: DyddCourseModule;
  moduleIndex: number;
  section: string;
  sectionIndex: number;
  unit: DyddCourseUnit;
  unitIndex: number;
};

const typeClass: Record<DyddCourseUnitType, string> = {
  "assessment-link": "assessment",
  completion: "completion",
  "designid-reflection": "designid",
  normal: "normal",
  orientation: "orientation",
  pathfinder: "pathfinder",
  "workbook-checkpoint": "workbook",
};

const careLabels: Record<CareStep, string> = {
  act: "Act",
  connect: "Connect",
  explore: "Explore",
  reflect: "Reflect",
};

const careOrder: CareStep[] = ["connect", "act", "reflect", "explore"];

import {
  getWorkbookExperience,
  isNicheBuilderUnit,
} from "@/lib/journey/workbook-experience";
function cleanLessonMainIdea(
  unit: DyddCourseUnit,
  hasWorkbookExperience: boolean,
) {
  if (hasWorkbookExperience) {
    return unit.lessonMainIdea.replace(
      "the attached workbook section",
      "the CARE reflection below",
    );
  }

  return unit.lessonMainIdea
    .replace(
      " with enough clarity and warmth that the learner is ready to answer the attached workbook section",
      " with enough clarity and warmth that the learner can take the next step",
    )
    .replace(
      " and make the next part of the journey feel clear, doable, and personal",
      " and make the next part of the journey feel clear, doable, and personal",
    );
}

function cleanTeachingBlock(block: string, hasWorkbookExperience: boolean) {
  if (hasWorkbookExperience) {
    return block.replace(
      "attach the relevant workbook section at the bottom",
      "complete the CARE reflection below",
    );
  }

  return block.replace(
    "invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place",
    "invite a small act of reflection, then move to the next right step when the lesson is complete",
  );
}

function groupSections(module: DyddCourseModule) {
  return module.units.reduce<SectionGroup[]>((groups, unit) => {
    const last = groups[groups.length - 1];

    if (last?.title === unit.section) {
      last.units.push(unit);
      return groups;
    }

    groups.push({
      title: unit.section,
      units: [unit],
    });
    return groups;
  }, []);
}

function flattenModules(modules: DyddCourseModule[]) {
  return modules.flatMap((module, moduleIndex) =>
    groupSections(module).flatMap((section, sectionIndex) =>
      section.units.map((unit, unitIndex) => ({
        module,
        moduleIndex,
        section: section.title,
        sectionIndex,
        unit,
        unitIndex,
      })),
    ),
  );
}

export function JourneyCourseNavigator({
  modules,
}: JourneyCourseNavigatorProps) {
  const moduleSections = useMemo(
    () =>
      modules.map((module) => ({ module, sections: groupSections(module) })),
    [modules],
  );
  const flatUnits = useMemo(() => flattenModules(modules), [modules]);
  const savedPosition = useReflectionPosition();
  useEffect(() => {
    if (!savedPosition.roundId) return;
    const requested =
      new URLSearchParams(window.location.search).get("lesson") ??
      savedPosition.lessonSlug;
    const match =
      flatUnits.find((item) => item.unit.slug === requested) ?? flatUnits[0];
    if (match) {
      setActiveSlug(match.unit.slug);
      setOpenModules([match.module.slug]);
      setOpenSections([`${match.module.slug}-${match.section}`]);
    }
  }, [savedPosition.roundId]);
  const [activeSlug, setActiveSlug] = useState(flatUnits[0]?.unit.slug ?? "");
  useEffect(() => {
    try {
      const saved =
        new URLSearchParams(window.location.search).get("lesson") ??
        localStorage.getItem("dydd-journey-position");
      const match = flatUnits.find((item) => item.unit.slug === saved);
      if (match) {
        setActiveSlug(match.unit.slug);
        setOpenModules([match.module.slug]);
      }
      if (!match && flatUnits[0])
        localStorage.setItem("dydd-journey-position", flatUnits[0].unit.slug);
    } catch {
      /* Storage is optional; learning stays available. */
    }
  }, [flatUnits]);
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const activeLessonRef = useRef<HTMLElement | null>(null);
  const activeIndex = Math.max(
    0,
    flatUnits.findIndex((item) => item.unit.slug === activeSlug),
  );
  const active = flatUnits[activeIndex] ?? flatUnits[0];
  const previous = activeIndex > 0 ? flatUnits[activeIndex - 1] : null;
  const next =
    activeIndex < flatUnits.length - 1 ? flatUnits[activeIndex + 1] : null;
  const progress = flatUnits.length
    ? Math.round(((activeIndex + 1) / flatUnits.length) * 100)
    : 0;
  const isWhoWhose = active.unit.slug === "identity-who-vs-whose-16";
  const usesApprovedLessonFormat = isWhoWhose || ["identity-good-works-17", "identity-niche-18"].includes(active.unit.slug);
  const isCareIntroduction = active.unit.slug === "what-is-dydd-how-to-c-a-r-e-10";
  const workbookExperience = active ? getWorkbookExperience(active) : null;
  const lessonMainIdea = cleanLessonMainIdea(
    active.unit,
    Boolean(workbookExperience),
  );
  const showNicheBuilder = active ? isNicheBuilderUnit(active) : false;
  const chapterArtwork = [
    "identity", "expertise", "story", "desire", "gifts", "niche",
  ].includes(active.module.slug)
    ? `/brand/badges/${active.module.slug}-badge.png`
    : "/brand/dydd-journey-road-waymarkers.png";
  const lessonImage = active.unit.media?.image ?? chapterArtwork;
  const lessonImageLabel =
    active.unit.media?.label ?? `${active.module.title} Journey illustration`;
  // Approved forward format, opt-in only; older lesson cleanup remains deferred.
  const wrapLessonImage = active.unit.slug === "what-is-dydd-d-e-s-i-g-n-9" || usesApprovedLessonFormat;
  const lessonArtwork = (
    <div className="journey-lesson-images">
      {[{ image: lessonImage, label: lessonImageLabel }, ...(active.unit.media?.additionalImages ?? [])].map((image) => (
        <figure
          key={image.image}
          className={`assessment-lesson-image${active.unit.media?.type === "video" || active.unit.media?.additionalImages?.length || active.unit.slug === "identity-assessment-time-designid" ? " contain" : ""}`}
        >
          <img src={image.image} alt={image.label} loading="lazy" />
        </figure>
      ))}
    </div>
  );
  const lessonFocus = active.unit.focus?.length
    ? active.unit.focus.flatMap((item) =>
        item.split(/[,;\n]+|(?<=\?)\s+(?=[A-Z])/).map((focus) => focus.trim()).filter(Boolean),
      )
    : [lessonMainIdea];

  if (!active) {
    return null;
  }

  const setLesson = async (item: FlatUnit) => {
    if (savedPosition.flush && !await savedPosition.flush()) return;
    const sectionKey = `${item.module.slug}-${item.section}`;
    setActiveSlug(item.unit.slug);
    savedPosition.recordPosition?.(item.unit.slug);
    try {
      localStorage.setItem("dydd-journey-position", item.unit.slug);
    } catch {}
    setOpenModules((current) =>
      current.includes(item.module.slug)
        ? current
        : [...current, item.module.slug],
    );
    setOpenSections((current) =>
      current.includes(sectionKey) ? current : [...current, sectionKey],
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

  const toggleSection = (sectionKey: string) => {
    setOpenSections((current) =>
      current.includes(sectionKey)
        ? current.filter((key) => key !== sectionKey)
        : [...current, sectionKey],
    );
  };

  return (
    <section
      className={`journey-course-walkthrough dydd-journey-walkthrough${usesApprovedLessonFormat ? " journey-who-whose-walkthrough" : ""}${active.unit.slug === "identity-the-designid-lens-what-is-in-the-report-19" ? " journey-designid-lens-walkthrough" : ""}`}
      aria-label="Guided course walkthrough"
    >
      <aside className="journey-course-index">
        <div className="journey-course-index-heading">
          <p className="section-label">Course hierarchy</p>
          <h2>Choose a module, section, and lesson.</h2>
        </div>
        <div
          className="journey-course-progress"
          aria-label="Current lesson progress"
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="journey-course-progress-label">
          Lesson {activeIndex + 1} of {flatUnits.length}
        </p>

        <div className="journey-module-accordion">
          {moduleSections.map(({ module, sections }, moduleIndex) => {
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
                  <strong>{module.title}</strong>
                  <small>{module.units.length} units</small>
                </button>
                {moduleOpen ? (
                  <div className="journey-section-accordion">
                    {sections.map((section, sectionIndex) => {
                      const sectionActive = section.title === active.section;
                      const sectionKey = `${module.slug}-${section.title}`;
                      const sectionOpen = openSections.includes(sectionKey);
                      return (
                        <section
                          className={`${sectionOpen ? "open" : ""} ${sectionActive ? "current" : ""}`}
                          key={sectionKey}
                        >
                          <button
                            className="journey-section-toggle"
                            aria-expanded={sectionOpen}
                            onClick={() => toggleSection(sectionKey)}
                            type="button"
                          >
                            <span>
                              {moduleIndex + 1}.{sectionIndex + 1}
                            </span>
                            <strong>{section.title}</strong>
                            <small>{section.units.length} lessons</small>
                          </button>
                          {sectionOpen ? (
                            <ol>
                              {section.units.map((unit) => {
                                const flatUnit = flatUnits.find(
                                  (item) => item.unit.slug === unit.slug,
                                );
                                return (
                                  <li key={unit.slug}>
                                    <button
                                      className={
                                        unit.slug === active.unit.slug
                                          ? "active"
                                          : ""
                                      }
                                      onClick={() =>
                                        flatUnit
                                          ? setLesson(flatUnit)
                                          : undefined
                                      }
                                      type="button"
                                    >
                                      {!["identity-who-vs-whose-16", "identity-good-works-17", "identity-niche-18"].includes(unit.slug) ? <span className={typeClass[unit.type]}>
                                        {unit.typeLabel}
                                      </span> : null}
                                      <strong>{unit.title}</strong>
                                    </button>
                                  </li>
                                );
                              })}
                            </ol>
                          ) : null}
                        </section>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </aside>

      <article
        className={`journey-active-lesson ${typeClass[active.unit.type]}${usesApprovedLessonFormat ? " journey-who-whose-lesson" : ""}`}
        ref={activeLessonRef}
      >
        <header>
          <div>
            <p className="section-label">
              Module {active.moduleIndex + 1} / Section {active.moduleIndex + 1}
              .{active.sectionIndex + 1} / Lesson {active.unitIndex + 1}
            </p>
            <h2>{active.unit.title}</h2>
            <p>{lessonMainIdea}</p>
          </div>
          <div className="journey-active-meta">
            {!usesApprovedLessonFormat ? <span>{active.unit.typeLabel}</span> : null}
            <span>{usesApprovedLessonFormat ? "3–5 minutes" : active.unit.duration}</span>
            {active.unit.bookPages ? (
              <span>Book {active.unit.bookPages}</span>
            ) : null}
            {active.unit.workbookPages ? (
              <span>Workbook {active.unit.workbookPages}</span>
            ) : null}
          </div>
        </header>

        <div className="journey-active-body has-care">
          <section className="journey-teaching-card assessment-teaching-card">
            <p className="section-label">Lesson focus</p>
            <div className="journey-active-focus" aria-label="Lesson focus">
              {lessonFocus.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            {active.unit.companionMomentPosition !== "after-teaching" ? (
              <CompanionAudioCard key={active.unit.slug} moment={active.unit.companionMoment} showDuration={!isCareIntroduction && !usesApprovedLessonFormat} />
            ) : null}

            <div className={`assessment-lesson-content${isCareIntroduction ? " journey-care-introduction-layout" : " with-image"}${wrapLessonImage ? " journey-wrap-pilot" : ""}`}>
              <section
                className="lesson-source readable-lesson-body"
                aria-label="Lesson body"
              >
                {!isCareIntroduction && wrapLessonImage ? lessonArtwork : null}
                {!["identity-good-works-17", "identity-niche-18"].includes(active.unit.slug) ? <h3 className="lesson-body-subheading">{active.unit.title}</h3> : null}
                {active.unit.contentStatus === "draft" ? (
                  <p role="status">Lesson content is being prepared.</p>
                ) : isCareIntroduction && active.unit.lessonBody ? (
                  <JourneyCareIntroduction blocks={active.unit.lessonBody} />
                ) : active.unit.lessonBody ? (
                  <JourneyLessonBody blocks={active.unit.lessonBody} closingCallout={active.unit.slug === "identity-niche-18"} />
                ) : active.unit.teachingBlocks.map((block) => (
                  <p key={block}>
                    {cleanTeachingBlock(block, Boolean(workbookExperience))}
                  </p>
                ))}
              </section>
              {!isCareIntroduction && !wrapLessonImage ? lessonArtwork : null}
            </div>

            {active.unit.companionMomentPosition === "after-teaching" ? (
              <CompanionAudioCard key={active.unit.slug} moment={active.unit.companionMoment} showDuration={!isCareIntroduction && !usesApprovedLessonFormat} />
            ) : null}
            {active.unit.closingScripture ? (
              <blockquote className="journey-closing-scripture">
                <p>“{active.unit.closingScripture.text}”</p>
                <cite>{active.unit.closingScripture.reference}</cite>
              </blockquote>
            ) : null}
          </section>

          {/* Keep the overview in class; connected trails remain available at the assessment introductions. */}
          {active.unit.slug !== "what-is-dydd-dydd-assessments-11" && active.unit.contentStatus !== "draft" && (active.unit.type === "assessment-link" ||
          active.unit.type === "designid-reflection" ||
          active.unit.slug.includes("spiritual-gifts-assessment")) ? (
            <aside className="trail-fieldkit-note">
              <div>
                <p className="section-label">A connected trail</p>
                <h2>
                  {active.unit.slug.includes("spiritual-gifts")
                    ? "Explore your Spiritual Gifts"
                    : (active.unit.type === "designid-reflection" || active.unit.assessmentTarget === "designid")
                      ? "Bring your DesignID into the Journey"
                      : "Discover your connected assessments"}
                </h2>
                <p>
                  Take the assessment, explore your results, and walk its
                  course. Your place in this Journey will be here when you
                  return.
                </p>
              </div>
              <ReviewAwareLink
                className="button primary"
                href={`/trailheads?from=journey${active.unit.slug.includes("spiritual-gifts") ? "#spiritual-gifts" : (active.unit.type === "designid-reflection" || active.unit.assessmentTarget === "designid") ? "#designid" : ""}`}
                onClick={() => {
                  try {
                    localStorage.setItem(
                      "dydd-journey-position",
                      active.unit.slug,
                    );
                  } catch {}
                }}
              >
                Open Connected Trail
              </ReviewAwareLink>
            </aside>
          ) : null}

          {isWhoWhose ? <JourneyWhoWhoseCare /> : workbookExperience ? (
            <section
              className={`journey-active-workbook ${workbookExperience.kind}${active.unit.slug === "identity-the-designid-lens-what-is-in-the-report-19" ? " journey-who-whose-care journey-designid-lens-care" : ""}`}
            >
              {active.unit.slug !== "identity-the-designid-lens-what-is-in-the-report-19" ? <div
                className="journey-care-divider"
                aria-label="CARE workbook section"
              >
                <span>C</span>
                <span>A</span>
                <span>R</span>
                <span>E</span>
              </div> : null}
              <div className="journey-care-heading">
                <div>
                  <p className="section-label">
                    {workbookExperience.kind === "pathfinder"
                      ? "Pathfinder CARE"
                      : workbookExperience.kind === "designid"
                        ? "DesignID CARE reflection"
                        : "Workbook CARE reflection"}
                  </p>
                  <h3>{workbookExperience.title}</h3>
                  <p>{workbookExperience.purpose}</p>
                  {workbookExperience.sourceRef ? (
                    <span>{workbookExperience.sourceRef}</span>
                  ) : null}
                </div>
                {workbookExperience.marker ? (
                  <figure className="journey-care-marker">
                    <img
                      src={workbookExperience.marker.image}
                      alt={workbookExperience.marker.alt}
                    />
                    <figcaption>{workbookExperience.marker.label}</figcaption>
                  </figure>
                ) : null}
              </div>

              {workbookExperience.kind !== "pathfinder" ? <JourneyCareDirections /> : null}
              {active.unit.slug === "identity-the-designid-lens-what-is-in-the-report-19" ? (
                <div className="journey-care-response-grid">
                  {careOrder.map(stage => <section className={`journey-care-response-cell ${stage}`} key={stage} data-care-stage={stage}>
                    <h4>{careLabels[stage]}</h4>
                    <div className="journey-care-response-content"><p>{workbookExperience.care[stage]}</p>
                      {workbookExperience.prompts.filter(p => p.careStep === stage).map(p => <ReflectionAnswer key={p.id} questionId={p.id} />)}
                    </div>
                  </section>)}
                </div>
              ) : <>
              <div className="journey-care-process">
                {careOrder
                  .filter((careStep) => workbookExperience.care[careStep])
                  .map((careStep) => (
                    <section key={careStep}>
                      <span>{careLabels[careStep]}</span>
                      <p>{workbookExperience.care[careStep]}</p>
                    </section>
                  ))}
              </div>

              <div className="journey-care-entry-grid">
                {workbookExperience.prompts.map((prompt) => (
                  <div key={prompt.id}>
                    {prompt.helper ? <small>{prompt.helper}</small> : null}
                    <ReflectionAnswer questionId={prompt.id} />
                  </div>
                ))}
              </div>

              </>}

              {showNicheBuilder ? <ReflectionNicheBuilder /> : null}
            </section>
          ) : null}
        </div>

        {active.unit.notes ? (
          <p className="journey-active-note">{active.unit.notes}</p>
        ) : null}

        <footer className="journey-active-pagination">
          {previous ? (
            <button onClick={() => setLesson(previous)} type="button">
              Previous: {previous.unit.title}
            </button>
          ) : (
            <span>First lesson</span>
          )}
          {next ? (
            <button onClick={() => setLesson(next)} type="button">
              Next: {next.unit.title}
            </button>
          ) : (
            <span>Course complete</span>
          )}
        </footer>
      </article>
    </section>
  );
}
