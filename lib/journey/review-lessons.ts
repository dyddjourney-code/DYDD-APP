import storyDesire from "@/content/journey/story-desire-review-2026-11-19.json";
import giftsNiche from "@/content/journey/gifts-niche-review-2026-11-19.json";
import legacyKeys from "@/content/journey/four-sections-legacy-keys-2026-11-19.json";
import type { JourneyLessonBlock } from "./dydd-course-outline";
import type { CareStep, JourneyPrompt } from "./dydd-journey";

type Draft = {
  title: string; focus: string[]; lessonMainIdea: string;
  lessonBody: JourneyLessonBlock[]; careIntro: string;
  care: {stage: CareStep; explanation: string; prompt: string}[];
  prayer: string; nextStep: string; sources: string[];
};
type Legacy = {type: string; prompts: JourneyPrompt[]; module: string; sourceRow: number};
export type JourneyReviewLesson = Draft & {
  kind: "care" | "pathfinder" | "completion";
  prompts: JourneyPrompt[];
};
const stages: CareStep[] = ["connect", "act", "reflect", "explore"];
const drafts = {...storyDesire, ...giftsNiche} as unknown as Record<string, Draft>;
export const journeyReviewLessons: Record<string, JourneyReviewLesson> = Object.fromEntries(
  Object.entries(drafts).map(([slug, draft]) => {
    const legacy = (legacyKeys as unknown as Record<string, Legacy>)[slug];
    const kind = legacy.type === "pathfinder" ? "pathfinder" : legacy.type === "completion" ? "completion" : "care";
    // Pathfinder keeps its exact canonical declaration fields and distinct established rhythm.
    if (kind !== "care") return [slug, {...draft, kind, prompts: legacy.prompts}];
    const used = new Set<string>();
    const prompts: JourneyPrompt[] = stages.map(stage => {
      const old = legacy.prompts.find(p => !used.has(p.id) && p.careStep === stage)
        ?? (stage === "connect" ? legacy.prompts.find(p => !used.has(p.id) && !p.careStep) : undefined);
      if (old) used.add(old.id);
      return {id: old?.id ?? slug + "-care-" + stage, careStep: stage,
        label: draft.care.find(item => item.stage === stage)!.prompt, responseType: "long_text"};
    });
    // Retain additional legacy fields rather than hiding historical writing or collapsing two questions.
    for (const old of legacy.prompts) if (!used.has(old.id)) prompts.push({...old, careStep: old.careStep ?? "reflect"});
    return [slug, {...draft, kind, prompts}];
  })
);
