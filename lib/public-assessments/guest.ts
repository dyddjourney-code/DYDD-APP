import 'server-only';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { publicAssessmentLedgerEnabled } from './config';
import { guestCookie, guestSessionId, guestCapabilityHash, guestCapabilityLifetime } from './guest-capability';
import type { AssessmentSnapshotSummary } from '@/lib/assessments/student-context';
export class GuestReadUnavailableError extends Error {}
export class GuestAccessDeniedError extends Error {}
export type GuestSession = {id:string;participant_name:string;participant_email:string;expires_at:string;capability_hash:string};
export type GuestOrder = {id:string;session_id:string;product:'designid'|'designpd';source_result_id:string|null;status:string;payment_provider:string;payment_reference:string;expected_product_id:string;expected_price_id:string;expected_amount:number;currency:string;access_grant_id?:string|null;access_name?:string|null;coupon_code?:string|null};
export type GuestResult = {id:string;order_id:string;session_id:string;product:'designid'|'designpd';source_result_id:string|null;scores:Record<string,unknown>;created_at:string;report_state:string;pdf:Record<string,unknown>;email:Record<string,unknown>;report_lease:string|null};
export async function verifyGuestCapability(id:string,token:string) {
 if (!publicAssessmentLedgerEnabled()) throw new GuestReadUnavailableError('Assessment service is unavailable. Your saved results are preserved.');
 const db=createSupabaseAdminClient();
 const found=await db.from('dydd_guest_sessions').select('*').eq('id',guestSessionId(id)).eq('capability_hash',guestCapabilityHash(token)).gt('expires_at',new Date().toISOString()).maybeSingle();
 if(found.error)throw new GuestReadUnavailableError('Guest recovery storage is unavailable.');
 if(!found.data) throw new GuestAccessDeniedError('This recovery link is invalid or expired. Contact support with your purchase receipt; do not repurchase.');
 return found.data as GuestSession;
}
export async function rememberGuest(id:string,token:string) {
 const jar=await cookies();
 jar.set(guestCookie(id),token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/assessments',maxAge:guestCapabilityLifetime});
}
export async function requireGuest(id:string) {
 const token=(await cookies()).get(guestCookie(id))?.value || '';
 return {session:await verifyGuestCapability(id,token),token};
}
export async function guestRecords(sessionId:string) {
 const db=createSupabaseAdminClient();
 const [orders,results]=await Promise.all([
  db.from('dydd_guest_orders').select('*').eq('session_id',sessionId).order('created_at'),
  db.from('dydd_guest_results').select('*').eq('session_id',sessionId).order('created_at')]);
 if(orders.error || results.error) throw new GuestReadUnavailableError('Your saved purchase could not be read. Please retry.');
 return {orders:(orders.data||[]) as GuestOrder[],results:(results.data||[]) as GuestResult[]};
}
export function guestSourceSnapshot(result:GuestResult):AssessmentSnapshotSummary {
 if(result.product!=='designid')throw Error('A completed DesignID source is required.');
 return {id:result.id,assessment_type:'designid',scores:result.scores,created_at:result.created_at,source_submitted_at:result.created_at,source:'public_guest'};
}
export async function paidGuestOrder(sessionId:string,orderId:string) {
 const db=createSupabaseAdminClient();
 const found=await db.from('dydd_guest_orders').select('*').eq('id',guestSessionId(orderId)).eq('session_id',sessionId).eq('status','paid').maybeSingle();
 if(found.error)throw new GuestReadUnavailableError('Guest purchase storage is unavailable.');
 if(!found.data)throw new GuestAccessDeniedError('This purchase is not paid or is no longer available.');
 const mode=await db.rpc('dydd_guest_order_entitled',{p_order_id:found.data.id});
 if(mode.error)throw new GuestReadUnavailableError('Guest purchase configuration could not be read.');
 if(mode.data!==true)throw new GuestAccessDeniedError('Purchase environment mismatch.');
 if(found.data.source_result_id){
  const source=await db.from('dydd_guest_results').select('order_id').eq('id',found.data.source_result_id).eq('session_id',sessionId).eq('product','designid').maybeSingle();
  if(source.error)throw new GuestReadUnavailableError('Guest source storage is unavailable.');
  if(!source.data)throw new GuestAccessDeniedError('The purchased DesignID source is unavailable.');
  const paid=await db.from('dydd_guest_orders').select('id').eq('id',source.data.order_id).eq('session_id',sessionId).eq('status','paid').maybeSingle();
  if(paid.error)throw new GuestReadUnavailableError('Guest source purchase could not be read.');
  if(!paid.data)throw new GuestAccessDeniedError('The source purchase is no longer available.');
  const sourceRight=await db.rpc('dydd_guest_order_entitled',{p_order_id:paid.data.id});
  if(sourceRight.error)throw new GuestReadUnavailableError('The source access could not be checked.');
  if(sourceRight.data!==true)throw new GuestAccessDeniedError('The source purchase is no longer available.');
 }
 return found.data as GuestOrder;
}
export async function ownedGuestResult(sessionId:string,resultId:string) {
 const result=await createSupabaseAdminClient().from('dydd_guest_results').select('*').eq('id',guestSessionId(resultId)).eq('session_id',sessionId).maybeSingle();
 if(result.error)throw new GuestReadUnavailableError('Guest report storage is unavailable.');
 if(!result.data)throw new GuestAccessDeniedError('This report is not available for this recovery link.');
 await paidGuestOrder(sessionId,result.data.order_id);
 return result.data as GuestResult;
}
