import { buildDesignIdContext, type AssessmentSnapshotSummary } from '@/lib/assessments/student-context';

const object = (v: unknown): Record<string,unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string,unknown> : {};
const populated = (v: unknown) => Object.keys(object(v)).length > 0;
const primaryNames = ['Architect','Artisan','Shepherd','Steward'];
/** Reflection badges describe the current saved primary, not historical retakes.
 * Retain the award ledger as history; never surface other primaries as earned. */
export function currentPrimaryAwards<T extends {badge_key:string}>(awards:T[], primary?:string):T[] {
 return awards.filter(award => !primaryNames.includes(award.badge_key) || award.badge_key === primary);
}
export function savedPrimary(snapshot: AssessmentSnapshotSummary) {
 const value = buildDesignIdContext({all:[snapshot],latest:[snapshot]}).primary;
 return primaryNames.find(n => n.toLowerCase() === value.trim().toLowerCase());
}
/** A persisted result/report, never a course position, purchase, draft or PDF queue.
 * Native DesignID/Gifts save their scored result before external PDF delivery;
 * that saved completed result is sufficient. DesignPD is a derived saved report. */
export function savedAssessmentComplete(snapshot: AssessmentSnapshotSummary, all: AssessmentSnapshotSummary[]): boolean {
 const scores=object(snapshot.scores), payload=object(scores.reportPayload);
 if (['draft','pending','in_progress','failed','error'].includes(String(scores.status))) return false;
 if (snapshot.assessment_type === 'designid')
  return Boolean(savedPrimary(snapshot) && (populated(payload) || populated(scores.scores) || populated(scores.summary) || populated(scores.profileLanguage)));
 if (snapshot.assessment_type === 'spiritual_gifts')
  return Boolean(populated(payload) || populated(scores.summary) || (Array.isArray(scores.topGifts) && scores.topGifts.length));
 if (snapshot.assessment_type === 'designpd') {
  if (snapshot.source === 'designpd_app' || scores.channel === 'native_app') {
   const source=all.find(s => s.id === scores.designIdSnapshotId && s.assessment_type === 'designid');
   return Boolean(source && savedAssessmentComplete(source,all) && populated(payload) && ['ready','success'].includes(String(object(scores.pdfMonkey).status)));
  }
  // Retained imported historical completed reports are compatible; no new
  // fictitious independent DesignPD assessment is introduced.
  return populated(payload) || populated(scores.summary) || populated(scores.scores);
 }
 return false; // FruitLife requires verified session/observer evidence, below.
}
export const completedFruitReportStatuses = ['ready','success','sent','report_ready','report_sent','completed','email_sent','email_failed','email_skipped'];
export function completedFruitSession(s: {self_completed_at:string|null;observer_goal:number;observer_completed_count:number;report_status:string;report_mode?:string|null;report_snapshot_id?:string|null;report_url?:string|null;artifacts?:Array<{artifact_type:string;artifact_status:string}>}) {
 return Boolean(s.self_completed_at && (!s.report_mode || ['360','FULL_360'].includes(s.report_mode.toUpperCase())) &&
  Number.isInteger(s.observer_goal) && s.observer_goal > 0 &&
  Number.isInteger(s.observer_completed_count) && s.observer_completed_count >= s.observer_goal &&
  completedFruitReportStatuses.includes(s.report_status) &&
  (s.report_snapshot_id || s.report_url || s.artifacts?.some(a=>a.artifact_type==='pdf' && a.artifact_status==='ready')));
}

/** Older imported completed FruitLife reports predate session self timestamps.
 * Their retained full-360 report explicitly records response and observer counts.
 * Native reports must instead pass the live session's configured observer goal. */
export function completedLegacyFruitSnapshot(snapshot: AssessmentSnapshotSummary) {
 if(snapshot.assessment_type!=='fruit_360' || snapshot.source==='fruitlife_360_native_app')return false;
 const root=object(snapshot.scores),summary=object(root.summary),scores=object(root.scores);
 const observers=Number(scores.Observer_Count),responses=Number(scores.Response_Count);
 const goal=Number(scores.Observer_Goal ?? root.observerGoal ?? observers);
 return String(summary.Report_Mode).toUpperCase()==='FULL_360' && Number.isInteger(observers) && observers>0 &&
  Number.isInteger(responses) && responses>=observers+1 && Number.isFinite(goal) && observers>=goal &&
  Boolean(summary.Report_Date || summary.Most_Visible_Fruit || summary.Most_Visible_Fruit_List);
}

/** The assessment milestone is completion of an owned FruitLife report, not a
 * claim that observers took part. A valid self-only report also completes the
 * assessment. Keep full-360 observer validation separate and unchanged. Null
 * modes on older native sessions are resolved only from their owned linked
 * snapshot by the server reader; zero counts alone never imply SELF_ONLY. */
export function completedFruitAssessmentSession(s: Parameters<typeof completedFruitSession>[0]) {
 if (completedFruitSession(s)) return true;
 return Boolean(s.self_completed_at && s.report_mode?.toUpperCase() === 'SELF_ONLY' &&
  s.observer_goal === 0 && s.observer_completed_count === 0 &&
  completedFruitReportStatuses.includes(s.report_status) &&
  (s.report_snapshot_id || s.report_url || s.artifacts?.some(a=>a.artifact_type==='pdf' && a.artifact_status==='ready')));
}

/** Retained imported self-only reports are completed assessments too. Native
 * snapshots still require their owned completed session, never a report alone. */
export function completedLegacyFruitAssessmentSnapshot(snapshot: AssessmentSnapshotSummary) {
 if (snapshot.assessment_type !== 'fruit_360' || snapshot.source === 'fruitlife_360_native_app') return false;
 const root=object(snapshot.scores),summary=object(root.summary),scores=object(root.scores);
 if (['draft','pending','in_progress','failed','error'].includes(String(root.status))) return false;
 return completedLegacyFruitSnapshot(String(summary.Report_Mode).toUpperCase() === '360'
  ? {...snapshot,scores:{...root,summary:{...summary,Report_Mode:'FULL_360'}}} : snapshot) || Boolean(
  String(summary.Report_Mode).toUpperCase() === 'SELF_ONLY' &&
  scores.Observer_Count != null && Number(scores.Observer_Count) === 0 &&
  Number(scores.Observer_Goal ?? root.observerGoal ?? 0) === 0 &&
  Number(scores.Response_Count) === 1 &&
  (summary.Report_Date || summary.Most_Visible_Fruit || summary.Most_Visible_Fruit_List));
}
