import type { JourneyPrompt } from './dydd-journey';
import type { ReflectionEntry } from '../reflections/types';

// Each waypoint uses the original early-workbook ID at both ends of the Journey.
export const identityPathfinderPrompts: JourneyPrompt[] = [
  { id: 'identity-declaration', label: 'I believe God created me…', helper: 'Use this space to write a sentence or paragraph that captures your true identity in Christ.', responseType: 'declaration' },
  { id: 'identity-service-reflections', label: 'Which will enable me to use my…', helper: 'Reflections: What have you learned about your divine reflections that you might be able to use for serving God?', responseType: 'long_text' },
  { id: 'identity-love-for-others', label: 'Which will enable me to use my…', helper: 'Love for Others: How you naturally connect and care', responseType: 'long_text' },
];
export const laterPathfinderIds: Record<string, string[]> = {
  'niche-pathfinder-preparing-your-niche-declaration-68': ['identity-declaration'],
  'niche-coming-from-69': ['story-declaration'],
  'niche-which-will-enable-me-to-use-my-70': ['identity-service-reflections', 'identity-love-for-others', 'expertise-talents-skills', 'expertise-declaration'],
  'niche-impassioned-by-71': ['desire-declaration'],
  'niche-supported-by-72': ['gifts-declaration'],
};
export const pathfinderAliases = Object.entries(laterPathfinderIds).map(([slug, ids]) => ({ legacy: `${slug}-pathfinder-line`, canonical: ids[0] }));
export function retiredPathfinderCanonical(id: string) {
  return pathfinderAliases.find(alias => alias.legacy === id)?.canonical;
}


/** Additive current-round recovery only. Never rewrite a legacy entry or an archive,
 * never overwrite any canonical revision (including an intentional blank answer). */
export function missingPathfinderEntries(roundId: string, entries: ReflectionEntry[]) {
  return pathfinderAliases.flatMap(({ legacy, canonical }) => {
    if (entries.some(e => e.round_id === roundId && e.question_id === canonical)) return [];
    const source = entries.filter(e => e.round_id === roundId && e.question_id === legacy).sort((a,b) => b.revision-a.revision)[0];
    return source?.response.trim() ? [{ ...source, question_id: canonical, revision: 1 }] : [];
  });
}
