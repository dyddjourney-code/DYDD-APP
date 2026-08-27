"use client";

import { useMemo, useState } from "react";
import { dyddJourney } from "@/lib/journey/dydd-journey";
import type {
  CareStep,
  JourneyCarePerspective,
  JourneyPrompt,
  JourneySection,
} from "@/lib/journey/dydd-journey";
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

const responsePlaceholders: Record<JourneyPrompt["responseType"], string> = {
  declaration: "Draft this sentence for your journey record...",
  list: "Add one item per line...",
  long_text: "Write your reflection here...",
  short_text: "Type here...",
};

type WorkbookExperience = {
  care: JourneyCarePerspective;
  kind: "care" | "designid" | "pathfinder";
  prompts: JourneyPrompt[];
  purpose: string;
  sourceRef?: string;
  title: string;
};

function normalize(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\bd\.?e\.?s\.?i\.?g\.?n\.?\b/g, "design")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function moduleToStageSlug(module: DyddCourseModule) {
  const stageAliases: Record<string, string> = {
    gifts: "gifts",
    identity: "identity",
    niche: "niche",
    desire: "desire",
    expertise: "expertise",
    story: "story",
    "welcome-and-orientation": "welcome",
  };

  return stageAliases[module.slug];
}

function isNicheBuilderUnit(active: FlatUnit) {
  return (
    active.module.slug === "niche" &&
    active.section === "Step in to your purpose" &&
    active.unit.type === "pathfinder"
  );
}

function defaultDesignIdExperience(unit: DyddCourseUnit): WorkbookExperience | null {
  if (unit.type !== "designid-reflection") {
    return null;
  }

  return {
    care: {
      connect:
        "Connect this reflection to your DesignID results, your present capacity, and what God may be revealing about how you love Him and others.",
      act:
        "Name one concrete place where this reflection needs to become visible in real life.",
      reflect:
        "Notice what feels aligned, stretched, resistant, or in need of grace.",
      explore:
        "Ask how this design language could guide your next faithful step without becoming a label.",
    },
    kind: "designid",
    prompts: [
      {
        id: `${unit.slug}-designid-connect`,
        careStep: "connect",
        label: "What does this DesignID reflection help you notice?",
        responseType: "long_text",
      },
      {
        id: `${unit.slug}-designid-reflect`,
        careStep: "reflect",
        label: "Where does this feel aligned, stretched, or in need of grace?",
        responseType: "long_text",
      },
    ],
    purpose:
      "Capture this DesignID reflection as part of the learner's personal journey record.",
    sourceRef: unit.workbookPages ? `Workbook ${unit.workbookPages}` : "DesignID reflection",
    title: unit.workbookSection ?? unit.title,
  };
}

function defaultPathfinderExperience(unit: DyddCourseUnit): WorkbookExperience {
  return {
    care: {
      connect:
        "Review what this chapter helped you notice before trying to make the line sound polished.",
      act:
        "Draft the Pathfinder sentence in plain language you can carry forward.",
      reflect:
        "Ask whether the draft feels honest, humble, and faithful to what God is showing you.",
      explore:
        "Consider what this line may contribute to the final niche declaration.",
    },
    kind: "pathfinder",
    prompts: [
      {
        id: `${unit.slug}-pathfinder-line`,
        label: unit.workbookSection ?? unit.title,
        responseType: "declaration",
      },
      {
        id: `${unit.slug}-pathfinder-notes`,
        careStep: "reflect",
        label: "What words from this chapter feel important to preserve?",
        responseType: "long_text",
      },
    ],
    purpose:
      "Preserve this Pathfinder line so it can be pulled into the final niche builder.",
    sourceRef: unit.workbookPages ? `Workbook ${unit.workbookPages}` : undefined,
    title: unit.workbookSection ?? unit.title,
  };
}

function sectionMatchesUnit(section: JourneySection, unit: DyddCourseUnit) {
  const sectionTitle = normalize(section.title);
  const unitWorkbook = normalize(unit.workbookSection);
  const unitTitle = normalize(unit.title);
  const sourceRef = normalize(section.sourceRef);
  const workbookPages = normalize(unit.workbookPages);

  if (!unitWorkbook && !workbookPages) {
    return false;
  }

  return (
    sectionTitle === unitWorkbook ||
    sectionTitle.includes(unitWorkbook) ||
    unitWorkbook.includes(sectionTitle) ||
    sectionTitle === unitTitle ||
    (Boolean(workbookPages) && sourceRef.includes(workbookPages))
  );
}

function getWorkbookExperience(active: FlatUnit): WorkbookExperience | null {
  const { module, unit } = active;
  const stageSlug = moduleToStageSlug(module);
  const stage = dyddJourney.stages.find((item) => item.slug === stageSlug);

  if (unit.type === "pathfinder") {
    if (stage?.pathfinder && module.slug !== "niche") {
      return {
        care: {
          connect:
            "Review the chapter before drafting the line you will carry forward.",
          act: "Write the Pathfinder line in simple, honest language.",
          reflect:
            "Notice what feels clear and what still needs prayer or conversation.",
          explore:
            "Ask how this line might connect to the final niche declaration.",
        },
        kind: "pathfinder",
        prompts: stage.pathfinder.prompts,
        purpose: stage.pathfinder.body,
        sourceRef: stage.sourcePages,
        title: unit.workbookSection ?? stage.pathfinder.title,
      };
    }

    return defaultPathfinderExperience(unit);
  }

  if (!unit.workbookSection && unit.type !== "designid-reflection") {
    return null;
  }

  const matchedSection = stage?.sections.find((section) => sectionMatchesUnit(section, unit));

  if (matchedSection) {
    return {
      care: matchedSection.care,
      kind: unit.type === "designid-reflection" ? "designid" : "care",
      prompts: matchedSection.prompts,
      purpose: matchedSection.purpose,
      sourceRef: matchedSection.sourceRef,
      title: matchedSection.title,
    };
  }

  if (unit.type === "designid-reflection") {
    return defaultDesignIdExperience(unit);
  }

  if (!unit.workbookSection) {
    return null;
  }

  return {
    care: {
      connect:
        "Connect this workbook section to what the lesson just taught and what God may be bringing to the surface.",
      act:
        "Answer the workbook prompt honestly and choose one faithful next step.",
      reflect:
        "Review what you wrote and notice what feels important, repeated, or unresolved.",
      explore:
        "Ask what this response may reveal about your design, growth, or purpose.",
    },
    kind: "care",
    prompts: [
      {
        id: `${unit.slug}-workbook-response`,
        label: unit.workbookSection,
        responseType: "long_text",
      },
    ],
    purpose: "Digitize this workbook section into the learner's saved journey record.",
    sourceRef: unit.workbookPages ? `Workbook ${unit.workbookPages}` : undefined,
    title: unit.workbookSection,
  };
}

function cleanLessonMainIdea(unit: DyddCourseUnit, hasWorkbookExperience: boolean) {
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

const nicheBuilderInputs = [
  {
    label: "I believe God created me...",
    source: "Identity Pathfinder",
    value: "Use the saved Identity line from chapter one.",
  },
  {
    label: "Coming from...",
    source: "Story Pathfinder",
    value: "Use the saved story, testimony, pain, and redemption language.",
  },
  {
    label: "Which will enable me to use my...",
    source: "Expertise Pathfinder",
    value: "Use the saved talents, competencies, skills, and expertise language.",
  },
  {
    label: "Impassioned by...",
    source: "Desire Pathfinder",
    value: "Use the saved burden, desire, and motivation language.",
  },
  {
    label: "Supported by...",
    source: "Gifts Pathfinder",
    value: "Use the saved spiritual gifts and confirmation language.",
  },
  {
    label: "Resulting in my...",
    source: "Niche builder",
    value: "Choose the service, dedication, development, or ministry direction.",
  },
  {
    label: "Encouraged by...",
    source: "Support and prayer",
    value: "Name the people, prayer needs, and accountability support.",
  },
];

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
  const workbookExperience = active ? getWorkbookExperience(active) : null;
  const lessonMainIdea = cleanLessonMainIdea(active.unit, Boolean(workbookExperience));
  const showNicheBuilder = active ? isNicheBuilderUnit(active) : false;

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
            <p>{lessonMainIdea}</p>
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

        <div className={workbookExperience ? "journey-active-body has-care" : "journey-active-body"}>
          <section>
            <p className="section-label">Teaching block</p>
            {active.unit.teachingBlocks.map((block) => (
              <p key={block}>{cleanTeachingBlock(block, Boolean(workbookExperience))}</p>
            ))}
          </section>

          {workbookExperience ? (
            <section className={`journey-active-workbook ${workbookExperience.kind}`}>
              <div className="journey-care-divider" aria-label="CARE workbook section">
                <span>C</span>
                <span>A</span>
                <span>R</span>
                <span>E</span>
              </div>
              <div className="journey-care-heading">
                <p className="section-label">
                  {workbookExperience.kind === "pathfinder"
                    ? "Pathfinder CARE"
                    : workbookExperience.kind === "designid"
                      ? "DesignID CARE reflection"
                      : "Workbook CARE reflection"}
                </p>
                <h3>{workbookExperience.title}</h3>
                <p>{workbookExperience.purpose}</p>
                {workbookExperience.sourceRef ? <span>{workbookExperience.sourceRef}</span> : null}
              </div>

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
                  <label key={prompt.id}>
                    <span>
                      {prompt.careStep ? `${careLabels[prompt.careStep]}: ` : ""}
                      {prompt.label}
                    </span>
                    {prompt.helper ? <small>{prompt.helper}</small> : null}
                    {prompt.responseType === "short_text" ? (
                      <input placeholder={responsePlaceholders[prompt.responseType]} />
                    ) : (
                      <textarea
                        aria-label={prompt.label}
                        placeholder={responsePlaceholders[prompt.responseType]}
                        rows={prompt.responseType === "declaration" ? 3 : 5}
                      />
                    )}
                  </label>
                ))}
              </div>

              {showNicheBuilder ? (
                <section className="journey-niche-builder" aria-label="Interactive niche builder">
                  <div>
                    <p className="section-label">Interactive niche build</p>
                    <h4>Pull the seven Pathfinder lines into one declaration.</h4>
                    <p>
                      This is the future workspace where saved chapter responses can be selected,
                      revised, and shaped into the final niche declaration.
                    </p>
                  </div>
                  <div className="journey-niche-source-list">
                    {nicheBuilderInputs.map((item) => (
                      <button key={item.label} type="button">
                        <span>{item.source}</span>
                        <strong>{item.label}</strong>
                        <small>{item.value}</small>
                      </button>
                    ))}
                  </div>
                  <label className="journey-niche-document">
                    <span>My working niche declaration</span>
                    <textarea
                      placeholder="As the learner selects saved Pathfinder lines, the declaration can assemble here for editing, printing, or emailing."
                      rows={8}
                    />
                  </label>
                  <div className="journey-niche-actions" aria-label="Niche declaration actions">
                    <button type="button">Print declaration</button>
                    <button type="button">Email to myself</button>
                  </div>
                </section>
              ) : null}
            </section>
          ) : null}
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
