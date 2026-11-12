import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { publicAssessmentLedgerEnabled } from './config';
import { guestCapabilityHash, guestSessionId } from './guest-capability';
import { individualGuestDeadline, validateIndividualRecipient } from './individual-guest-access';
export type GuestAccessGrant = {id:string;name:string;kind:'individual'|'group'|'coupon';recipient_email:string|null;recipient_name:string|null;invitation_status:string;invitation_sent_at:string|null;invitation_job_id:string|null;coupon_code:string|null;products:('designid'|'designpd')[];expires_at:string;max_uses:number;uses:number;revoked_at:string|null;created_at:string};
export function requireGuestAccessStorage() {
 if(!publicAssessmentLedgerEnabled())throw Error('Assessment access is temporarily unavailable. Your saved results are preserved.');
}
export function guestGrantCookie(sessionId:string) {return 'dydd_guest_grant_'+guestSessionId(sessionId);}
export function validateGuestGrant(input:{name:string;kind:string;couponCode:string;products:string[];expiresAt:string;maxUses:string;recipientEmail?:string;recipientName?:string},now=Date.now()) {
 if(input.kind==='individual') {
  const recipient=validateIndividualRecipient(input.recipientEmail||'',input.recipientName||'');
  const products=[...new Set(input.products)];
  if(!products.length||products.some(p=>!['designid','designpd'].includes(p)))throw Error('Select DesignID, DesignPD, or both.');
  return {name:recipient.recipient_name&&recipient.recipient_name.length>=2?recipient.recipient_name:'Individual guest pass',kind:'individual' as const,coupon_code:null,products:products as ('designid'|'designpd')[],expires_at:individualGuestDeadline(input.expiresAt,now),max_uses:1,...recipient};
 }
 const name=input.name.trim(),couponCode=input.couponCode.trim()||null;
 const products=[...new Set(input.products)];const expiry=new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input.expiresAt)?input.expiresAt+'Z':input.expiresAt),maxUses=Number(input.maxUses);
 if(name.length<2||name.length>120)throw Error('Enter an access name between 2 and 120 characters.');
 if(!['group','coupon'].includes(input.kind)||(input.kind==='coupon'&&!couponCode)||(couponCode&&couponCode.length>120))throw Error('Coupon access needs a provenance code (up to 120 characters).');
 if(!products.length||products.some(p=>!['designid','designpd'].includes(p)))throw Error('Select DesignID, DesignPD, or both.');
 if(!Number.isFinite(expiry.getTime())||expiry.getTime()<=now)throw Error('Choose a future expiry date and time.');
 if(!Number.isSafeInteger(maxUses)||maxUses<1||maxUses>2147483647)throw Error('Enter a positive whole-number enrollment limit.');
 return {name,kind:input.kind as 'group'|'coupon',coupon_code:couponCode,products:products as ('designid'|'designpd')[],expires_at:expiry.toISOString(),max_uses:maxUses};
}
export async function readGuestGrant(token:string) {
 requireGuestAccessStorage();
 const found=await createSupabaseAdminClient().from('dydd_guest_access_grants').select('id,name,kind,recipient_email,recipient_name,invitation_status,invitation_sent_at,invitation_job_id,coupon_code,products,expires_at,max_uses,uses,revoked_at,created_at').eq('token_hash',guestCapabilityHash(token)).maybeSingle();
 if(found.error)throw Error('Access link could not be checked. Please retry later.');
 if(!found.data||found.data.revoked_at)throw Error('Access link is unavailable.');
 if(found.data.kind==='individual'&&Date.parse(found.data.expires_at)<=Date.now())throw Error('This individual guest pass has expired. Saved completed reports remain available from your private recovery link.');
 return found.data as GuestAccessGrant;
}
export async function redeemGuestGrant(sessionId:string,token:string,sourceId?:string) {
 requireGuestAccessStorage();
 const result=await createSupabaseAdminClient().rpc('dydd_guest_redeem_access',{p_session_id:guestSessionId(sessionId),p_token_hash:guestCapabilityHash(token),p_source:sourceId?guestSessionId(sourceId):null});
 if(result.error||!result.data) {
  const reason=result.error?.message||'';
  if(/timing needs recovery|Existing purchase needs recovery/.test(reason))throw Error('Your existing assessment or purchase needs recovery. Use your private link or contact support; do not repeat DesignID within six months.');
  if(/recipient email|different recipient/.test(reason))throw Error('Use the exact recipient email assigned to this individual guest pass.');
  if(/deadline/.test(reason))throw Error('This individual guest pass has expired. Completed reports remain saved.');
  if(/completed DesignID|existing DesignID/.test(reason))throw Error('DesignPD requires your completed DesignID in this private session. Open your original recovery link first.');
  throw Error('This access link is unavailable, expired, or fully used. Contact the person who supplied it.');
 }
 return result.data as string[];
}

/** Individual enrollment proof survives a fresh browser; never return a reusable grant token. */
export async function includedGuestDesignPd(sessionId:string) {
 requireGuestAccessStorage();
 const db=createSupabaseAdminClient();
 const orders=await db.from('dydd_guest_orders').select('access_grant_id').eq('session_id',guestSessionId(sessionId)).eq('product','designid').eq('status','paid');
 if(orders.error)throw Error('Included access could not be checked.');
 for(const order of orders.data||[]) {
  if(!order.access_grant_id)continue;
  const grant=await db.from('dydd_guest_access_grants').select('id,name,kind,products,expires_at,revoked_at').eq('id',order.access_grant_id).is('revoked_at',null).maybeSingle();
  if(grant.error)throw Error('Included access could not be checked.');
  if(grant.data?.kind==='individual'&&Date.parse(grant.data.expires_at)<=Date.now())continue;
  if(grant.data?.products.includes('designpd'))return {name:String(grant.data.name)};
 }
 return null;
}
