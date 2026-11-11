import 'server-only';
import {createHash} from 'node:crypto';
import type {AssessmentSnapshotSummary} from '@/lib/assessments/student-context';
import {sendAssessmentReportEmail} from '@/lib/assessment-reporting';
import {sendApplicationEmail} from '@/lib/lifecycle/application-mail';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
/** The caller has verified Auth + exact artifact ownership + private archive readiness.
 * Retry the original immutable outbox payload; changed profile names must not drift its event.
 */
export async function retryOwnedAssessmentEmail(user:{email:string},snapshot:AssessmentSnapshotSummary,reportUrl:string) {
 const key='assessment-report-'+createHash('sha256').update(user.email.toLowerCase()+'|'+reportUrl).digest('hex');
 const existing=await createSupabaseAdminClient().from('dydd_lifecycle_jobs').select('template_id,context').eq('event_key','application:'+key).maybeSingle();
 if(existing.error)throw Error('Original delivery state could not be read.');
 const context=existing.data?.context as Record<string,unknown>|undefined;
 const original=context?.senderInput as Parameters<typeof sendApplicationEmail>[0]|undefined;
 if(original){
  if(original.idempotencyKey!==key || String(original.to).toLowerCase()!==user.email.toLowerCase())throw Error('Original delivery needs reconciliation.');
  return sendApplicationEmail({...original,templateId:existing.data?.template_id,deliveryContext:context?.deliveryContext as Record<string,unknown>|undefined});
 }
 const payload=snapshot.scores.reportPayload as Record<string,unknown>|undefined;
 return sendAssessmentReportEmail({assessmentName:snapshot.assessment_type==='designid'?'DesignID':'DesignPD',participantEmail:user.email,participantName:String(payload?.Name||payload?.name||'there'),reportUrl});
}
