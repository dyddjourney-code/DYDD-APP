import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { overviewRows, type OverviewSnapshot } from './owner-overview';

type GuestMembership = {id:string;group_id:string;session_id:string;membership_status:string;
 contact:{id:string;participant_name:string;participant_email:string}|null};
/** Caller must enforce private owner + admin. Never include guests for Circle owners. */
export async function guestCoupleMemberships(groupIds:string[]) {
 if(!groupIds.length)return [];
 const rows=await overviewRows<GuestMembership>('assessment_group_guest_members',
  'id,group_id,session_id,membership_status,contact:dydd_guest_sessions!session_id(id,participant_name,participant_email)');
 return rows.filter(r=>groupIds.includes(r.group_id)&&r.membership_status==='active').map(r=>({
  id:'guest-member:'+r.id,group_id:r.group_id,membership_status:r.membership_status,participant_id:'guest:'+r.session_id,
  assessment_participants:{id:'guest:'+r.session_id,display_name:r.contact?.participant_name||null,normalized_email:r.contact?.participant_email||null}
 }));
}
/** Exact retained evidence, scoped to explicit session references, not email matches. */
export async function guestCoupleSnapshots(ids:string[]):Promise<OverviewSnapshot[]> {
 if(!ids.length)return [];
 const db=createSupabaseAdminClient();
 const {data,error}=await db.from('dydd_guest_results').select('id,session_id,order_id,product,scores,created_at,source_result_id,purchase:dydd_guest_orders!order_id(status)')
  .in('session_id',ids.map(id=>id.slice(6)));
 if(error)throw Error('Guest couple results could not be read.');
 return (data||[]).filter(r=>{const purchase=Array.isArray(r.purchase)?r.purchase[0]:r.purchase;return purchase?.status==='paid';}).map(r=>({
  id:r.id,participant_id:'guest:'+r.session_id,assessment_type:r.product,created_at:r.created_at,source_submitted_at:r.created_at,
  scores:r.scores,source:'public_guest',assessment_participants:null,
  provenance:{pipeline:'public_guest',session_id:r.session_id,order_id:r.order_id,source_result_id:r.source_result_id}
 }));
}
