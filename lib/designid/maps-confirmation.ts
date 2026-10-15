import { designIdReflections, type DesignIdReflection } from "./intake";
import type { DesignIdResult } from "./engine";

// Source: DesignID Journey Mapping.xlsx, Drive version 288 (2026-10-14),
// MAPS + DesignID MAPS tabs. Primary reflection links match maps-report/content.ts.
export const mapsConfirmationVersion = "maps-confirmation-2026-10-15-v1";
export const mapsConfirmationItems = [
  { id: "purpose", word: "Purpose", phase: "Mission", reflection: "Architect", terms: ["Calling", "Direction", "Kingdom Impact"], phrase: "I need clear purpose, direction, and meaningful Kingdom impact before I can move forward." },
  { id: "culture", word: "Culture", phase: "Mission", reflection: "Shepherd", terms: ["Belonging", "Trust", "Unity"], phrase: "I come alive when there is belonging, trust, and unity around the work." },
  { id: "motivation", word: "Motivation", phase: "Mission", reflection: "Shepherd", terms: ["Care", "Growth", "Life-giving"], phrase: "I am energized by care, growth, and work that gives life to others." },
  { id: "assessment", word: "Assessment", phase: "Approach", reflection: "Artisan", terms: ["Discern", "Understand", "Clarify"], phrase: "I first look for what is true, what matters, and what needs to be clarified." },
  { id: "insight", word: "Insight", phase: "Approach", reflection: "Artisan", terms: ["Shape", "Refine", "Adjust"], phrase: "I naturally want to shape, refine, and adjust the path so it can mature well." },
  { id: "development", word: "Development", phase: "Approach", reflection: "Architect", terms: ["Improve", "Strengthen", "Elevate"], phrase: "I focus on change that improves, strengthens, and elevates people or systems." },
  { id: "proof", word: "Proof", phase: "Process", reflection: "Steward", terms: ["Observable", "Measurable", "Verified"], phrase: "I need progress to be observable, measurable, and verified." },
  { id: "organization", word: "Organization", phase: "Process", reflection: "Steward", terms: ["Clear Roles", "Ownership", "Responsibility"], phrase: "I look for clear roles, ownership, and responsibility." },
  { id: "reliability", word: "Reliability", phase: "Process", reflection: "Steward", terms: ["Consistent", "Dependable", "Sustainable"], phrase: "I value consistency, dependability, and sustainable follow-through." },
  { id: "energy", word: "Energy", phase: "Send", reflection: "Architect", terms: ["Initiative", "Activate", "Move Forward"], phrase: "I am ready to initiate, activate, and move the work forward." },
  { id: "momentum", word: "Momentum", phase: "Send", reflection: "Architect", terms: ["Build", "Advance", "Multiply"], phrase: "I help build, advance, and multiply what is ready to grow." },
  { id: "outcomes", word: "Outcomes", phase: "Send", reflection: "Steward", terms: ["Complete", "Deliver", "Closure"], phrase: "I want the work completed, delivered, and brought to faithful closure." },
] as const;
export const mapsConfirmationBuckets = [
  { id: "most", label: "Most like me", weight: 3 },
  { id: "often", label: "Often like me", weight: 2 },
  { id: "sometimes", label: "Sometimes like me", weight: 1 },
  { id: "least", label: "Least like me", weight: 0 },
] as const;
export type MapsBucket = (typeof mapsConfirmationBuckets)[number]["id"];
export type MapsAssignments = Record<string, MapsBucket>;
export const mapsConfirmationField = (id: string) => `designid_maps_${id}`;

export function parseMapsConfirmation(form: FormData): MapsAssignments {
  const assignments: MapsAssignments = {};
  for (const item of mapsConfirmationItems) {
    const values = form.getAll(mapsConfirmationField(item.id));
    if (values.length !== 1 || !mapsConfirmationBuckets.some((bucket) => bucket.id === values[0])) {
      throw new Error("Place all 12 MAPS words before submitting.");
    }
    assignments[item.id] = values[0] as MapsBucket;
  }
  for (const bucket of mapsConfirmationBuckets) {
    if (Object.values(assignments).filter((value) => value === bucket.id).length !== 3) {
      throw new Error("Place exactly three MAPS words in each group.");
    }
  }
  return assignments;
}

export type MapsConfirmationResult = ReturnType<typeof scoreMapsConfirmation>;

export function scoreMapsConfirmation(assignments: MapsAssignments, main: DesignIdResult) {
  const totals = Object.fromEntries(designIdReflections.map((reflection) => [reflection, 0])) as Record<DesignIdReflection, number>;
  const counts = { ...totals };
  const phaseScores: Record<string, number> = {};
  for (const item of mapsConfirmationItems) {
    const bucket = mapsConfirmationBuckets.find((entry) => entry.id === assignments[item.id]);
    if (!bucket) throw new Error("A MAPS word has not been placed.");
    totals[item.reflection] += bucket.weight;
    counts[item.reflection] += 1;
    phaseScores[item.phase] = (phaseScores[item.phase] ?? 0) + bucket.weight;
  }
  // Subcategory links are intentionally uneven. Compare mean weights, not raw sums.
  const means = Object.fromEntries(designIdReflections.map((reflection) => [reflection, totals[reflection] / counts[reflection]])) as Record<DesignIdReflection, number>;
  const highest = Math.max(...Object.values(means));
  const leadingReflections = designIdReflections.filter((reflection) => Math.abs(means[reflection] - highest) < 1e-9);
  const closeReflections = main.rankOrder.filter((reflection) => main.scores[main.primary] - main.scores[reflection] <= 3);
  const closeHighest = Math.max(...closeReflections.map((reflection) => means[reflection]));
  const closeLeaders = closeReflections.filter((reflection) => Math.abs(means[reflection] - closeHighest) < 1e-9);
  const suggestedTieReflection = closeReflections.length > 1 && closeLeaders.length === 1 ? closeLeaders[0] : null;
  const agreement = leadingReflections.includes(main.primary) ? "aligned" : leadingReflections.includes(main.secondary) ? "complementary" : "explore";
  const note = `${agreement === "aligned" ? "Your MAPS choices support your main DesignID reflection." : agreement === "complementary" ? "Your MAPS choices emphasize your secondary DesignID reflection." : "Your MAPS choices highlight a different emphasis to explore alongside your DesignID pattern."} ${suggestedTieReflection ? `Your close main scores may be explored with ${suggestedTieReflection} as an additional clue.` : closeReflections.length > 1 ? "The confirmation sort does not resolve your close main scores." : "Your main reflection order remains unchanged."} Use this as a reflection prompt, not a fixed label.`;
  return { version: mapsConfirmationVersion, assignments, phaseScores, reflectionMeanWeights: means, leadingReflections, agreement, closeReflections, suggestedTieReflection, note };
}
