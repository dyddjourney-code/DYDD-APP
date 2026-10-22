import { dyddJourney } from "@/lib/journey/dydd-journey";
import type {
  JourneyCarePerspective,
  JourneyPrompt,
  JourneySection,
} from "@/lib/journey/dydd-journey";
import type {
  DyddCourseModule,
  DyddCourseUnit,
} from "@/lib/journey/dydd-course-outline";
type FlatUnit = {
  module: DyddCourseModule;
  moduleIndex: number;
  section: string;
  sectionIndex: number;
  unit: DyddCourseUnit;
  unitIndex: number;
};
type WorkbookExperience = {
  care: JourneyCarePerspective;
  kind: "care" | "designid" | "pathfinder";
  marker?: {
    alt: string;
    image: string;
    label: string;
  };
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

export function isNicheBuilderUnit(active: FlatUnit) {
  return (
    active.module.slug === "niche" &&
    active.section === "Step in to your purpose" &&
    active.unit.type === "pathfinder"
  );
}

function defaultDesignIdExperience(
  unit: DyddCourseUnit,
): WorkbookExperience | null {
  if (unit.type !== "designid-reflection") {
    return null;
  }

  if (unit.slug === "identity-the-designid-lens-what-is-in-the-report-19") {
    return {
      kind: "designid",
      title: "Unpack Your Reflections",
      purpose: "",
      marker: { alt: "DesignID", image: "/brand/tools/badge-icons/designid-icon.png", label: "DesignID reflection" },
      care: {
        connect: "Look at your Snapshot as a mirror, not a box. Notice what feels familiar and what surprises you.",
        act: "Choose one strength reflected in your results and look for an opportunity to use it intentionally this week.",
        reflect: "Think back to a specific situation or relationship that was difficult or misunderstood. Look with curiosity and grace, not regret.",
        explore: "Consider a current relationship or responsibility at home, work, church, or in your community.",
      },
      prompts: [
        { id: `${unit.slug}-designid-connect`, careStep: "connect", label: "Which part of your results best describes how you naturally respond, connect, or contribute? Share one everyday example.", responseType: "long_text" },
        { id: `${unit.slug}-designid-act`, careStep: "act", label: "Where will you practice this strength, whom could it serve, and what will you watch for as you use it?", responseType: "long_text" },
        { id: `${unit.slug}-designid-reflect`, careStep: "reflect", label: "What does your design help you understand about your response then? Knowing this now, what might you have done differently?", responseType: "long_text" },
        { id: `${unit.slug}-designid-explore`, careStep: "explore", label: "How could understanding your design help you communicate, collaborate, or serve better there? What is one adjustment you could try?", responseType: "long_text" },
      ],
    };
  }

  return {
    care: {
      connect:
        "Connect this reflection to your DesignID results, your present capacity, and what God may be revealing about how you love Him and others.",
      act: "Name one concrete place where this reflection needs to become visible in real life.",
      reflect:
        "Notice what feels aligned, stretched, resistant, or in need of grace.",
      explore:
        "Ask how this design language could guide your next faithful step without becoming a label.",
    },
    kind: "designid",
    marker: {
      alt: "DesignID",
      image: "/brand/tools/badge-icons/designid-icon.png",
      label: "DesignID reflection",
    },
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
    sourceRef: unit.workbookPages
      ? `Workbook ${unit.workbookPages}`
      : "DesignID reflection",
    title: unit.workbookSection ?? unit.title,
  };
}

function getAssessmentMarker(
  unit: DyddCourseUnit,
  title?: string,
): WorkbookExperience["marker"] {
  const searchable = normalize(
    [unit.title, unit.workbookSection, unit.notes, title, unit.typeLabel]
      .filter(Boolean)
      .join(" "),
  );

  if (unit.type === "designid-reflection" || searchable.includes("designid")) {
    return {
      alt: "DesignID",
      image: "/brand/tools/badge-icons/designid-icon.png",
      label: "DesignID reflection",
    };
  }

  if (searchable.includes("spiritual gifts") || searchable.includes("gifts")) {
    return {
      alt: "Spiritual Gifts",
      image: "/brand/tools/badge-icons/spiritual-gifts-icon.png",
      label: "Spiritual Gifts reflection",
    };
  }

  return undefined;
}

function defaultPathfinderExperience(unit: DyddCourseUnit): WorkbookExperience {
  return {
    care: {
      connect:
        "Review what this chapter helped you notice before trying to make the line sound polished.",
      act: "Draft the Pathfinder sentence in plain language you can carry forward.",
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
    sourceRef: unit.workbookPages
      ? `Workbook ${unit.workbookPages}`
      : undefined,
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

export function getWorkbookExperience(
  active: FlatUnit,
): WorkbookExperience | null {
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

  const matchedSection = stage?.sections.find((section) =>
    sectionMatchesUnit(section, unit),
  );

  if (matchedSection) {
    return {
      care: matchedSection.care,
      kind: unit.type === "designid-reflection" ? "designid" : "care",
      marker: getAssessmentMarker(unit, matchedSection.title),
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
      act: "Answer the workbook prompt honestly and choose one faithful next step.",
      reflect:
        "Review what you wrote and notice what feels important, repeated, or unresolved.",
      explore:
        "Ask what this response may reveal about your design, growth, or purpose.",
    },
    kind: "care",
    marker: getAssessmentMarker(unit, unit.workbookSection),
    prompts: [
      {
        id: `${unit.slug}-workbook-response`,
        label: unit.workbookSection,
        responseType: "long_text",
      },
    ],
    purpose:
      "Digitize this workbook section into the learner's saved journey record.",
    sourceRef: unit.workbookPages
      ? `Workbook ${unit.workbookPages}`
      : undefined,
    title: unit.workbookSection,
  };
}
