import 'server-only';
import {createHmac} from 'node:crypto';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {must} from '@/lib/lifecycle/store';
import {guestCapabilityHash,guestSessionId} from './guest-capability';
import {publicAssessmentLedgerEnabled} from './config';
/** Recheck at submission, not just reservation: a queued token may already be redeemed. */
export async function guestRecoveryDeliveryEligibility(job:any,now=Date.now()):Promise<{stop?:string;deferUntil?:string;reason?:string}> {
 if(!publicAssessmentLedgerEnabled()||process.env.DYDD_GUEST_EMAIL_ENABLED!=='true')return {deferUntil:new Date(now+120000).toISOString(),reason:'Guest recovery email is paused.'};
 const stop={stop:'Recovery request, recipient, session or purchase is no longer available.'};
 const context=job.context?.deliveryContext||{},sender=job.context?.senderInput;
 let id:string,url:URL;
 try{
  id=guestSessionId(String(context.recoveryRequestId||''));
  url=new URL(sender?.text?.match(/https:\/\/\S+/)?.[0]||'');
  const origin=new URL(process.env.DYDD_APP_URL||'');
  if(origin.protocol!=='https:'||url.origin!==origin.origin||url.pathname!=='/assessments/recover/email'||url.username||url.password||url.hash||url.searchParams.size!==2||url.searchParams.getAll('request').length!==1||url.searchParams.get('request')!==id||url.searchParams.getAll('key').length!==1||sender.to!==job.email||sender.idempotencyKey!=='guest-recovery-'+id||job.event_key!=='application:guest-recovery-'+id)return stop;
  guestCapabilityHash(url.searchParams.get('key')||'');
 }catch{return stop;}
 const db=createSupabaseAdminClient(),intent=must(await db.from('dydd_guest_recovery_requests').select('*').eq('id',id).maybeSingle()) as any;
 if(!intent?.session_id||intent.used_at||!Number.isFinite(Date.parse(intent.expires_at))||Date.parse(intent.expires_at)<=now||intent.token_hash!==guestCapabilityHash(url.searchParams.get('key')||''))return stop;
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!secret)throw Error('Recovery eligibility unavailable.');
 const emailHash=createHmac('sha256',secret).update('dydd-guest-recovery-v1:email:'+job.email).digest('hex');
 if(intent.email_hash!==emailHash)return stop;
 const session=must(await db.from('dydd_guest_sessions').select('id,participant_email,expires_at').eq('id',intent.session_id).maybeSingle()) as any;
 if(!session||session.participant_email.trim().toLowerCase()!==job.email||!Number.isFinite(Date.parse(session.expires_at))||Date.parse(session.expires_at)<=now)return stop;
 const orders=must(await db.from('dydd_guest_orders').select('id,status,payment_provider').eq('session_id',session.id).eq('product','designid')) as any[];
 // Match recovery redemption eligibility, including an unfinished original checkout.
 for(const order of orders){
  if(must(await db.rpc('dydd_guest_order_entitled',{p_order_id:order.id}))===true)return {};
  if(order.status==='pending'&&['stripe_test','stripe_live'].includes(order.payment_provider)&&must(await db.rpc('dydd_public_assessment_provider_allowed',{p_provider:order.payment_provider}))===true)return {};
 }
 return stop;
}
