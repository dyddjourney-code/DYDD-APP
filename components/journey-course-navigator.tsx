"use client";

import { useMemo, useState } from "react";
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

export function JourneyCourseNavigator({ modules }: JourneyCourseNavigatorProps) {
  const moduleSections = useMemo(
    () => modules.map((module) => ({ module, sections: groupSections(module) })),
    [modules],
  );
  const flatUnits = useMemo(() => flattenModules(modules), [modules]);
  const [activeSlug, setActiveSlug] = useState(flatUnits[0]?.unit.slug ?? "");
  const activeIndex = Math.max(
    0,
    flatUnits.findIndex((item) => item.unit.slug === activeSlug),
  );
  const active = flatUnits[activeIndex] ?? flatUnits[0];
  const previous = activeIndex > 0 ? flatUnits[activeIndex - 1] : null;
  const next = activeIndex < flatUnits.length - 1 ? flatUnits[activeIndex + 1] : null;
  const progress = flatUnits.length
    ? Math.round(((activeIndex + 1) / flatUnits.length) * 100)
    : 0;

  if (!active) {
    return null;
  }

  return (
    <section className="journey-course-walkthrough" aria-label="Guided course walkthrough">
      <aside className="journey-course-index">
        <div className="journey-course-index-heading">
          <p className="section-label">Course hierarchy</p>
          <h2>Choose a module, section, and lesson.</h2>
        </div>
        <div className="journey-course-progress" aria-label="Current lesson progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="journey-course-progress-label">
          Lesson {activeIndex + 1} of {flatUnits.length}
        </p>

        <div className="journey-module-accordion">
          {moduleSections.map(({ module, sections }, moduleIndex) => {
            const moduleActive = module.slug === active.module.slug;
            return (
              <section className={moduleActive ? "open" : ""} key={module.slug}>
                <button
                  className="journey-module-toggle"
                  onClick={() => setActiveSlug(module.units[0]?.slug ?? active.unit.slug)}
                  type="button"
                >
                <span>{String(moduleIndex + 1).padStart(2, "0")}</span>
                <strong>{module.title}</strong>
                <small>{module.units.length} units</small>
                </button>
                {moduleActive ? (
                  <div className="journey-section-accordion">
                    {sections.map((section, sectionIndex) => {
                      const sectionActive = section.title === active.section;
                      return (
                        <section className={sectionActive ? "open" : ""} key={`${module.slug}-${section.title}`}>
                          <button
                            className="journey-section-toggle"
                            onClick={() => setActiveSlug(section.units[0]?.slug ?? active.unit.slug)}
                            type="button"
                          >
                      <span>
                        {moduleIndex + 1}.{sectionIndex + 1}
                      </span>
                      <strong>{section.title}</strong>
                      <small>{section.units.length} lessons</small>
                          </button>
                          {sectionActive ? (
                            <ol>
                              {section.units.map((unit) => (
                                <li key={unit.slug}>
                                  <button
                                    className={unit.slug === active.unit.slug ? "active" : ""}
                                    onClick={() => setActiveSlug(unit.slug)}
                                    type="button"
                                  >
                                    <span className={typeClass[unit.type]}>{unit.typeLabel}</span>
                                    <strong>{unit.title}</strong>
                                  </button>
                                </li>
                              ))}
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

      <article className={`journey-active-lesson ${typeClass[active.unit.type]}`}>
        <header>
          <div>
            <p className="section-label">
              Module {active.moduleIndex + 1} / Section {active.moduleIndex + 1}.
              {active.sectionIndex + 1} / Lesson {active.unitIndex + 1}
            </p>
            <h2>{active.unit.title}</h2>
            <p>{active.unit.lessonMainIdea}</p>
          </div>
          <div className="journey-active-meta">
            <span>{active.unit.typeLabel}</span>
            <span>{active.unit.duration}</span>
            {active.unit.bookPages ? <span>Book {active.unit.bookPages}</span> : null}
            {active.unit.workbookPages ? (
              <span>Workbook {active.unit.workbookPages}</span>
            ) : null}
          </div>
        </header>

        <section className="journey-active-section-marker" aria-label="Current section">
          <span>{active.section}</span>
          <strong>{active.module.summary}</strong>
        </section>

        <div className="journey-active-body">
          <section>
            <p className="section-label">Teaching block</p>
            {active.unit.teachingBlocks.map((block) => (
              <p key={block}>{block}</p>
            ))}
          </section>

          <section className="journey-active-workbook">
            <p className="section-label">
              {active.unit.type === "pathfinder"
                ? "Pathfinder builder"
                : "Workbook attached to this lesson"}
            </p>
            <h3>{active.unit.reflectionPrompt}</h3>
            {active.unit.workbookPages ? <span>{active.unit.workbookPages}</span> : null}
            <textarea
              aria-label={`${active.unit.title} workbook response`}
              placeholder="This will save into the learner's journey record."
              rows={active.unit.type === "pathfinder" ? 7 : 5}
            />
          </section>
        </div>

        {active.unit.notes ? (
          <p className="journey-active-note">{active.unit.notes}</p>
        ) : null}

        <footer className="journey-active-pagination">
          {previous ? (
            <button onClick={() => setActiveSlug(previous.unit.slug)} type="button">
              Previous: {previous.unit.title}
            </button>
          ) : (
            <span>First lesson</span>
          )}
          {next ? (
            <button onClick={() => setActiveSlug(next.unit.slug)} type="button">
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
