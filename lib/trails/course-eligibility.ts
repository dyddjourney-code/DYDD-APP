import 'server-only';
import type { AssessmentSnapshotSummary } from '@/lib/assessments/student-context';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { normalizeEmail } from '@/lib/identity/email';
import { savedAssessmentComplete, completedFruitSession, completedLegacyFruitSnapshot } from '@/lib/passport/evidence';

type FruitSession = Parameters<typeof completedFruitSession>[0] & { id: string };
const reportStatuses = ['ready', 'success', 'sent', 'report_ready', 'report_sent', 'completed', 'email_sent', 'email_failed', 'email_skipped'];
/** A completed self-only report opens teaching, but must NEVER earn the full-360 award.
 * An observer session still needs every configured response; a queued PDF is not a report. */
export function fruitCourseSessionComplete(s: FruitSession): boolean {
  if (completedFruitSession(s)) return true;
  return Boolean(s.self_completed_at && s.report_mode?.toUpperCase() === 'SELF_ONLY' &&
    s.observer_goal === 0 && s.observer_completed_count === 0 && reportStatuses.includes(s.report_status) &&
    (s.report_snapshot_id || s.report_url || s.artifacts?.some(a => a.artifact_type === 'pdf' && a.artifact_status === 'ready')));
}
function legacySelfReport(s: AssessmentSnapshotSummary): boolean {
  if (s.source === 'fruitlife_360_native_app') return false;
  const summary = s.scores.summary as Record<string, unknown> | undefined;
  const scores = s.scores.scores as Record<string, unknown> | undefined;
  return Boolean(summary?.Report_Mode === 'SELF_ONLY' && Number(scores?.Observer_Count) === 0 &&
    Number(scores?.Response_Count) === 1 && (summary.Report_Date || summary.Most_Visible_Fruit || summary.Most_Visible_Fruit_List));
}
export function reportCompletedAt(s: AssessmentSnapshotSummary): string {
  return s.source_submitted_at && Number.isFinite(Date.parse(s.source_submitted_at)) ? s.source_submitted_at : s.created_at;
}
export function newestCourseReports(snapshots: AssessmentSnapshotSummary[]): AssessmentSnapshotSummary[] {
  const time = (s: AssessmentSnapshotSummary) => Date.parse(reportCompletedAt(s)) || 0;
  return [...snapshots].sort((a,b) => time(b) - time(a) || (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0) || b.id.localeCompare(a.id));
}
/** No alias claims or email-only session lookup at this privileged boundary.
 * Only this user's rows or an unclaimed exact-email participant are eligible. */
export async function courseAssessmentEligibility(type: string, user: {id: string; email?: string}, snapshots: AssessmentSnapshotSummary[]) {
  if (type !== 'fruit_360') {
    const reports = newestCourseReports(snapshots.filter(s => s.assessment_type === type && savedAssessmentComplete(s, snapshots)));
    return { ready: reports.length > 0, reports };
  }
  const db = createSupabaseAdminClient();
  const identity = db.from('assessment_participants').select('id,user_id,normalized_email');
  const email = normalizeEmail(user.email);
  const participants = await (email
    ? identity.or(`user_id.eq.${user.id},and(normalized_email.eq.${JSON.stringify(email)},user_id.is.null)`)
    : identity.eq('user_id', user.id));
  if (participants.error) throw Error('Your FruitLife report identity could not be checked. Please try again.');
  const ids = (participants.data ?? []).map(p => p.id);
  const sessionOwnership = [`created_by_user_id.eq.${user.id}`, ...ids.map(id => `and(participant_id.eq.${id},created_by_user_id.is.null)`)];
  const snapshotOwnership = [`user_id.eq.${user.id}`, ...ids.map(id => `and(participant_id.eq.${id},user_id.is.null)`)];
  const [sessions, owned] = await Promise.all([
    db.from('fruitlife_360_sessions').select('id,self_completed_at,observer_goal,observer_completed_count,report_status,report_mode,report_snapshot_id,report_url,artifacts:fruitlife_360_report_artifacts(artifact_type,artifact_status)').or(sessionOwnership.join(',')),
    db.from('assessment_snapshots').select('id,assessment_type,created_at,scores,source,source_submitted_at').eq('assessment_type', type).or(snapshotOwnership.join(',')),
  ]);
  if (sessions.error || owned.error) throw Error('Your completed FruitLife reports could not be checked. Please try again.');
  // Earlier native workers saved the payload mode in the owned snapshot, but
  // left the session column null. Recover only from that exact owned linked report.
  const ownedById = new Map((owned.data ?? []).map(s => [s.id, s]));
  const completed = (sessions.data ?? []).filter(session => {
    if (session.report_mode || !session.report_snapshot_id) return fruitCourseSessionComplete(session);
    const snapshot = ownedById.get(session.report_snapshot_id);
    const summary = snapshot?.scores.summary as Record<string, unknown> | undefined;
    const mode = typeof summary?.Report_Mode === 'string' ? summary.Report_Mode.toUpperCase() : '';
    return ['SELF_ONLY', '360', 'FULL_360'].includes(mode) && fruitCourseSessionComplete({ ...session, report_mode: mode });
  });
  const linked = new Set(completed.map(s => s.report_snapshot_id));
  const reports = newestCourseReports((owned.data ?? []).filter(s =>
    !['draft', 'pending', 'in_progress', 'failed', 'error'].includes(String(s.scores.status)) &&
    (linked.has(s.id) || completedLegacyFruitSnapshot(s) || legacySelfReport(s))));
  return { ready: completed.length > 0 || reports.length > 0, reports };
}
