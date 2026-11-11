import 'server-only';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {getPdfMonkeyDocument} from '@/lib/pdfmonkey/client';
import type {AssessmentSnapshotSummary} from '@/lib/assessments/student-context';
/** A transport-uncertain job may become retryable only after its known original
 * provider document explicitly fails. Pending/unreachable/no-ID jobs stay fenced.
 * Caller verified account, source ownership and included/unconsumed exact-source access.
 */
export async function reconcileKnownDesignPdFailure(userId:string,snapshot:AssessmentSnapshotSummary) {
 const documentId=String((snapshot.scores.pdfMonkey as Record<string,unknown>|undefined)?.documentId||'');
 if(!documentId)return;
 const db=createSupabaseAdminClient();
 const reservation=await db.from('designpd_generation_reservations').select('token,state').eq('user_id',userId).eq('snapshot_id',snapshot.id)
  .eq('source_snapshot_id',String(snapshot.scores.designIdSnapshotId||'')).eq('content_version',String(snapshot.scores.contentVersion||'')).maybeSingle();
 if(reservation.error)throw Error('The saved report reservation needs recovery.');
 if(reservation.data?.state!=='uncertain')return;
 let document;
 try{document=await getPdfMonkeyDocument(documentId);}catch{return;}
 if(document.id!==documentId || !['failure','failed'].includes(String(document.status)))return;
 const updated=await db.from('designpd_generation_reservations').update({state:'failed',updated_at:new Date().toISOString()})
  .eq('user_id',userId).eq('snapshot_id',snapshot.id).eq('token',reservation.data.token).eq('state','uncertain');
 if(updated.error)throw Error('The confirmed failed report needs retry reconciliation.');
}
