import type { AssessmentSnapshotSummary } from '@/lib/assessments/student-context';

/** Reading a saved artifact is never generation or an entitlement grant. */
export function matchingReadyDesignPd(snapshots: AssessmentSnapshotSummary[], sourceId: string, version: string) {
  return snapshots.find(s => s.assessment_type === 'designpd' &&
    s.scores.designIdSnapshotId === sourceId && s.scores.contentVersion === version &&
    (['ready', 'success'].includes(String((s.scores.pdfMonkey as Record<string, unknown> | undefined)?.status)) ||
      (s.scores.reportArtifact as Record<string, unknown> | undefined)?.path === `designpd/${s.id}/report.pdf`));
}
export type DesignPdReservation = {
  status: 'reserved' | 'ready' | 'running' | 'failed' | 'uncertain' | 'exhausted' | 'retry_later';
  snapshotId: string;
  token?: string;
};
export const designPdPendingUnlockMessage = 'Unlock a DesignPD report for this eligible DesignID at /assessments/designpd, or use an authorized waiver. Existing included access is unchanged.';

/** Native derived reports must not bypass reservations via generic PDF recovery. */
export function usesDesignPdGenerationReservation(snapshot: AssessmentSnapshotSummary) {
  return snapshot.assessment_type === 'designpd' && snapshot.source === 'designpd_app' &&
    typeof snapshot.scores.designIdSnapshotId === 'string' && typeof snapshot.scores.contentVersion === 'string';
}
