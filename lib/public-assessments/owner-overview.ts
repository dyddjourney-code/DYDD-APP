import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type Contact={id:string;display_name:string|null;normalized_email:string|null};
export type OverviewSnapshot={id:string;assessment_type:string;created_at:string;participant_id:string|null;
 scores:Record<string,unknown>|null;source:string|null;source_submitted_at:string|null;
 assessment_participants:Contact|Contact[]|null;provenance?:Record<string,unknown>};
type GiftSession={id:string;result_snapshot_id:string|null;participant_id:string;participant_name:string|null;participant_email:string|null;
 metadata:Record<string,unknown>;signup_source:string|null;source_system:string;submitted_at:string|null;created_by_user_id:string|null};
type GiftResponse={id:string;session_id:string;participant_name:string|null;participant_email:string|null;derived_scores:Record<string,unknown>;
 source_response_id:string|null;source_system:string;submitted_at:string;created_at:string};
type GuestRow={id:string;session_id:string;order_id:string;product:string;source_result_id:string|null;scores:Record<string,unknown>;created_at:string;
 contact:{id:string;participant_name:string;participant_email:string};purchase:{status:string;payment_provider:string;payment_reference:string|null;paid_at:string|null;access_grant_id?:string|null;access_name?:string|null;coupon_code?:string|null;expected_amount?:number}};
/** No arbitrary 10,000-row ceiling: stable ID ordering visits every page, including historical results. */
export async function overviewRows<T>(table:string,select:string):Promise<T[]> {
 const db=createSupabaseAdminClient(),rows:T[]=[];
 for(let start=0;;start+=1000) {
  const {data,error}=await db.from(table).select(select).order('id').range(start,start+999);
  if(error)throw Error('Kingdom overview source could not be read: '+table);
  const page=(data||[]) as unknown as T[];rows.push(...page);
  if(page.length<1000)return rows;
 }
}
/** Read-only overlay: exact saved scores and provenance, never regenerated reports,
 * email-based claims or writes into native assessment/participant tables.
 * Must only be called AFTER the owner/admin boundary; never for Circle owners. */
export async function appendPublicOverviewResults(native:OverviewSnapshot[]) {
 const [guests,sessions,responses]=await Promise.all([
  overviewRows<GuestRow>('dydd_guest_results','id,session_id,order_id,product,source_result_id,scores,created_at,contact:dydd_guest_sessions!session_id(id,participant_name,participant_email),purchase:dydd_guest_orders!order_id(status,payment_provider,payment_reference,paid_at,access_grant_id,access_name,coupon_code,expected_amount)'),
  overviewRows<GiftSession>('spiritual_gifts_sessions','id,result_snapshot_id,participant_id,participant_name,participant_email,metadata,signup_source,source_system,submitted_at,created_by_user_id'),
  overviewRows<GiftResponse>('spiritual_gifts_responses','id,session_id,participant_name,participant_email,derived_scores,source_response_id,source_system,submitted_at,created_at'),
 ]);
 const sessionBySnapshot=new Map(sessions.filter(s=>s.result_snapshot_id).map(s=>[s.result_snapshot_id,s]));
 const sessionById=new Map(sessions.map(s=>[s.id,s]));
 const ids=new Set(native.map(s=>s.id));
 const representedResponses=new Set(native.filter(s=>s.assessment_type==='spiritual_gifts').map(s=>String(s.scores?.sourceResponseId||s.scores?.source_response_id||'')).filter(Boolean));
 function giftProvenance(s:GiftSession) {return {pipeline:'spiritual_gifts',channel:s.metadata?.channel||'unknown',session_id:s.id,
  signup_source:s.signup_source,source_system:s.source_system,original_contact_name:s.participant_name,
  original_contact_email:s.participant_email,created_by_user_id:s.created_by_user_id};}
 const sessionByResponse=new Map(responses.filter(r=>r.source_response_id).map(r=>[r.source_response_id,sessionById.get(r.session_id)]));
 const enriched=native.map(snapshot=>{
  const session=sessionBySnapshot.get(snapshot.id) || (snapshot.assessment_type==='spiritual_gifts'
   ? sessionByResponse.get(String(snapshot.scores?.sourceResponseId||snapshot.scores?.source_response_id||'')) : undefined);
  return session ? {...snapshot,provenance:giftProvenance(session)} : snapshot;
 });
 // The public Gifts pipeline already saves native snapshots. Enrich those exact
 // rows instead of creating duplicates. A saved response missing its snapshot is
 // represented read-only from retained derived_scores (no recalculation).
 for(const response of responses) {
  const session=sessionById.get(response.session_id);
  if(!session || (session.result_snapshot_id && ids.has(session.result_snapshot_id)) ||
   (response.source_response_id && representedResponses.has(response.source_response_id)))continue;
  enriched.push({id:response.id,assessment_type:'spiritual_gifts',created_at:response.created_at,participant_id:session.participant_id,
   assessment_participants:{id:session.participant_id,display_name:response.participant_name||session.participant_name,
    normalized_email:response.participant_email||session.participant_email},
   scores:response.derived_scores,source:'spiritual_gifts_saved_response',source_submitted_at:response.submitted_at,
   provenance:{...giftProvenance(session),response_id:response.id,source_response_id:response.source_response_id,snapshot_missing:true}});
 }
 for(const result of guests) {
  if(ids.has(result.id))continue;
  // Include the historical result even after reversal, with current purchase
  // state plainly attached. Overview visibility is not customer download access.
  if(!result.contact || !result.purchase)throw Error('Guest overview provenance is incomplete.');
  const participantId='guest:'+result.session_id;
  enriched.push({id:result.id,assessment_type:result.product,created_at:result.created_at,participant_id:participantId,
   assessment_participants:{id:participantId,display_name:result.contact.participant_name,normalized_email:result.contact.participant_email},
   scores:result.scores,source:'public_guest',source_submitted_at:result.created_at,
   provenance:{pipeline:'public_guest',session_id:result.session_id,order_id:result.order_id,source_result_id:result.source_result_id,
    payment_provider:result.purchase.payment_provider,payment_reference:result.purchase.payment_reference,
    access_grant_id:result.purchase.access_grant_id,access_name:result.purchase.access_name,coupon_code:result.purchase.coupon_code,expected_amount:result.purchase.expected_amount,
    purchase_status:result.purchase.status,paid_at:result.purchase.paid_at,
    original_contact_name:result.contact.participant_name,original_contact_email:result.contact.participant_email}});
 }
 return enriched;
}
