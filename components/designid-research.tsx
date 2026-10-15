import { designIdResearch } from '@/lib/designid/research';
import { scoreDesignId } from '@/lib/designid/engine';
import { scoreMapsConfirmation, type MapsAssignments } from '@/lib/designid/maps-confirmation';
import { grantDesignIdRetake } from '@/app/command-center/designid-actions';

export function DesignIdResearchPanel({scores, participantId}: {scores: Record<string, unknown> | null; participantId: string | null}) {
  let research: ReturnType<typeof designIdResearch> | null = null;
  try {
    const answers = scores?.answers as Record<string, number> | undefined;
    const sort = scores?.mapsConfirmation as {assignments?: MapsAssignments} | undefined;
    if (answers && sort?.assignments) {
      const original = scoreDesignId(answers);
      research = designIdResearch(original, scoreMapsConfirmation(sort.assignments, original));
    }
  } catch { /* Older/incompatible records are not reinterpreted. */ }
  return <details className="designid-owner-research"><summary>Private DesignID research &amp; retake access</summary>
    {research ? <>
      <p><strong>Rank alignment: {research.coefficient === null ? 'Not defined (flat ranking)' : `${research.coefficient >= 0 ? '+' : ''}${research.coefficient.toFixed(2)}`}</strong><br/><small>Spearman · original scores · average ranks for ties · not an accuracy percentage.</small></p>
      <p>Original score order: {research.originalRankOrder.map(key => `${key} (${research.originalScores[key]})`).join(' → ')}</p>
      <p>Sort reflection ranks: {research.sortOrder.map(key => `${key} (${research.sortRanks[key]})`).join(' · ')}. Equal ranks are tied.</p>
      <p>{scores?.research ? 'Report order' : 'Suggested order (historical report unchanged)'}: {research.presentationOrder.join(' → ')}. {research.presentationChanged ? 'Exact-score tie presentation refined by the sort.' : 'No presentation change.'} Numeric scores unchanged.</p>
      {research.wordsByGroup.map(group => <p key={group.id}><strong>{group.label}:</strong> {group.words.map(word => word.word).join(' · ')}</p>)}
      <small>Words within each category are not ranked. Formula: {research.version}. Original responses and instrument versions are retained with each new attempt.</small>
    </> : <p>No compatible saved word sort for this attempt.</p>}
    {participantId ? <form action={grantDesignIdRetake}>
      <input type="hidden" name="participant_id" value={participantId}/>
      <label>One-time retake exception reason <input name="reason" required minLength={5} maxLength={500} placeholder="Invalid attempt, research, or coaching"/></label>
      <button className="button secondary" type="submit">Allow one retake (valid 30 days)</button>
    </form> : null}
  </details>;
}
