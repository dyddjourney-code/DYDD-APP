import { designIdReflections, type DesignIdReflection } from './intake';
import type { DesignIdResult } from './engine';
import { mapsConfirmationBuckets, mapsConfirmationItems, type MapsConfirmationResult } from './maps-confirmation';

export const designIdAlignmentVersion = 'designid-spearman-average-ranks-v1';
type Values = Record<DesignIdReflection, number>;
export function averageRanks(values: Values): Values {
  return Object.fromEntries(designIdReflections.map(key => [key,
    1 + designIdReflections.filter(other => values[other] > values[key]).length +
    (designIdReflections.filter(other => values[other] === values[key]).length - 1) / 2,
  ])) as Values;
}
export function rankAlignment(main: Values, sort: Values) {
  const a = averageRanks(main), b = averageRanks(sort);
  let covariance = 0, varianceA = 0, varianceB = 0;
  for (const key of designIdReflections) {
    const x = a[key] - 2.5, y = b[key] - 2.5;
    covariance += x * y; varianceA += x * x; varianceB += y * y;
  }
  return { coefficient: varianceA && varianceB ? covariance / Math.sqrt(varianceA * varianceB) : null, mainRanks: a, sortRanks: b };
}
export function designIdResearch(main: DesignIdResult, sort: MapsConfirmationResult) {
  const alignment = rankAlignment(main.scores, sort.reflectionMeanWeights);
  const presentationOrder = [...main.rankOrder].sort((a, b) => main.scores[b] - main.scores[a] || sort.reflectionMeanWeights[b] - sort.reflectionMeanWeights[a]);
  const presentationChanged = presentationOrder.some((key, index) => key !== main.rankOrder[index]);
  const exactTieGroups = [...new Set(Object.values(main.scores))].filter(value => designIdReflections.filter(key => main.scores[key] === value).length > 1).map(value => {
    const reflections = main.rankOrder.filter(key => main.scores[key] === value);
    return { score: value, originalOrder: reflections, presentationOrder: presentationOrder.filter(key => reflections.includes(key)), sortAlsoTies: new Set(reflections.map(key => sort.reflectionMeanWeights[key])).size !== reflections.length };
  });
  const top = Math.max(...Object.values(main.scores));
  return {
    version: designIdAlignmentVersion, method: 'Spearman correlation of average ranks; original numeric scores before presentation ordering',
    ...alignment, originalRankOrder: main.rankOrder, originalScores: main.scores,
    presentationOrder, presentationChanged, exactTieGroups,
    mainLeadingReflections: designIdReflections.filter(key => main.scores[key] === top),
    sortLeadingReflections: sort.leadingReflections,
    leadingReflectionAgreement: sort.leadingReflections.some(key => main.scores[key] === top),
    sortOrder: [...designIdReflections].sort((a, b) => alignment.sortRanks[a] - alignment.sortRanks[b]),
    wordsByGroup: mapsConfirmationBuckets.map(bucket => ({ id: bucket.id, label: bucket.label, weight: bucket.weight,
      words: mapsConfirmationItems.filter(item => sort.assignments[item.id] === bucket.id).map(item => ({ id: item.id, word: item.word, reflection: item.reflection })),
    })),
    // Cards within a category are not ranked: do not imply that alphabetical display is a preference.
    withinGroupOrdering: 'not captured',
  };
}
export function applyDesignIdPresentation(main: DesignIdResult, research: ReturnType<typeof designIdResearch>): DesignIdResult {
  const [primary, secondary] = research.presentationOrder;
  return { ...main, primary, secondary, pairKey: `${primary}|${secondary}`, rankOrder: research.presentationOrder };
}
