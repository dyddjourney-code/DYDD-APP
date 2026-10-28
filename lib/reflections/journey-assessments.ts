import type { ReflectionRound, ReflectionReport } from './types';
export const journeySlug = 'discover-your-divine-design';
export const journeyAssessmentTypes = ['designid', 'spiritual_gifts'] as const;
export type JourneyAssessmentType = typeof journeyAssessmentTypes[number];
export type JourneyAssessmentSource = ReflectionReport & { assessmentType: JourneyAssessmentType; completedAt: string };
const prefix = 'journey-assessments-v1:';
/** The existing round source text stores immutable references, not scores or a new public data surface. */
export function encodeJourneySources(sources: JourneyAssessmentSource[]) { return prefix + JSON.stringify(sources); }
export function savedJourneySources(round: Pick<ReflectionRound, 'source'>): JourneyAssessmentSource[] | null {
  if (!round.source.startsWith(prefix)) return null;
  try {
    const value: unknown = JSON.parse(round.source.slice(prefix.length));
    if (!Array.isArray(value) || !value.every(s => s && typeof s.id === 'string' && typeof s.label === 'string' && typeof s.completedAt === 'string' && journeyAssessmentTypes.includes(s.assessmentType))) return null;
    return value;
  } catch { return null; }
}
/** Legacy rounds resolve only results already completed when that round began. Never borrow newer results. */
export function sourcesForJourneyRound(round: ReflectionRound, reports: JourneyAssessmentSource[]) {
  return savedJourneySources(round) ?? journeyAssessmentTypes.flatMap(type => {
    return latestJourneySources(reports.filter(r => r.assessmentType === type && Date.parse(r.completedAt) <= Date.parse(round.started_at)));
  });
}
export function latestJourneySources(reports: JourneyAssessmentSource[]) {
  return journeyAssessmentTypes.flatMap(type => {
    const candidates = reports.filter(r => r.assessmentType === type).sort((a,b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
    // A tied latest completion is ambiguous: let the learner choose, not an arbitrary ID.
    return candidates[0] && (!candidates[1] || Date.parse(candidates[0].completedAt) !== Date.parse(candidates[1].completedAt)) ? [candidates[0]] : [];
  });
}
