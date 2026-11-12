import { appOrigin, isDeliveryAppOrigin } from "@/lib/app-origin";
import 'server-only';
import Stripe from 'stripe';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {sendResendEmail, type SendEmailInput} from '@/lib/email/resend';
import {guestCapabilityHash, guestRecoveryPath, guestSessionId} from './guest-capability';
import {verifyGuestCapability, GuestAccessDeniedError} from './guest';
import {publicPaymentRuntime} from './config';

const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function must<T>(r:{data:T;error:unknown}):T {if(r.error)throw Error('Guest reminder storage unavailable.');return r.data;}
export function guestCheckoutReminderCopy(name:string,product:'designid'|'designpd',url:string) {
 const first=name.trim().split(/\s+/)[0]||'friend',label=product==='designid'?'DesignID':'DesignPD';
 const subject=`${first}, your ${label} checkout is still here`;
 const opening=`Hi ${first},`,body=`You started your ${label} checkout but haven’t finished. If you’d like to continue, your private link is below.`,verse='Designed on purpose, for purpose. You are God’s workmanship, created for good works He prepared for you to walk in. — Inspired by Ephesians 2:10',closing='No pressure—this is your only checkout reminder. If you’ve already continued, you can disregard it.';
 return {subject,text:[opening,body,url,verse,closing].join('\n\n'),html:`<p>${escapeHtml(opening)}</p><p>${escapeHtml(body)}</p><p><a href="${escapeHtml(url)}">Resume your ${label} checkout</a></p><p>${escapeHtml(verse)}</p><p>${escapeHtml(closing)}</p>`};
}
/** Called after payment_reference persistence. Durable registration only; NEVER sends. */
export async function registerGuestCheckoutReminder(orderId:string,token:string) {
 const db=createSupabaseAdminClient(),id=guestSessionId(orderId);
 const order=must(await db.from('dydd_guest_orders').select('*').eq('id',id).single());
 const session=await verifyGuestCapability(order.session_id,token);
 const base=new URL(process.env.DYDD_APP_URL||appOrigin());
 if(base.protocol!=='https:')throw Error('Secure app origin required.');
 const url=base.origin+guestRecoveryPath(session.id,token)+'&product='+order.product;
 const copy=guestCheckoutReminderCopy(session.participant_name,order.product,url);
 const sender:SendEmailInput={...copy,to:session.participant_email.trim().toLowerCase(),idempotencyKey:'dydd-guest-checkout-reminder-'+id};
 return must(await db.rpc('dydd_guest_register_checkout_reminder',{p_order:id,p_hash:guestCapabilityHash(token),p_sender:sender}));
}
/** Invoke only after the parent has verified the guest capability. */
export async function markGuestCheckoutResumed(sessionId:string) {
 must(await createSupabaseAdminClient().rpc('dydd_guest_mark_checkout_resumed',{p_session:guestSessionId(sessionId)}));
}
/** Dedicated narrow worker: never processes old lifecycle events or another mail category. */
export async function runGuestCheckoutReminderWorker(limit=10) {
 if(process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT==='sandbox'||process.env.DYDD_GUEST_EMAIL_ENABLED!=='true')return {paused:true,accepted:0};
 const db=createSupabaseAdminClient(),jobs=must(await db.rpc('dydd_guest_claim_checkout_reminders',{p_limit:limit})) as any[];
 let accepted=0,skipped=0,retries=0;
 for(const j of jobs){
  const finish=async(patch:Record<string,unknown>)=>must(await db.from('dydd_guest_checkout_reminders').update(patch).eq('order_id',j.order_id).eq('claim_token',j.claim_token).in('status',['processing','submitting']));
  try{
   const stop=async()=>{await finish({status:'skipped',error_message:'Checkout completed, resumed, expired, suppressed or unavailable.'});skipped++;};
   const sender=j.sender_input as SendEmailInput,link=sender?.text?.split('\n\n').find(v=>v.startsWith('https://'));
   if(!link){await stop();continue;}
   const url=new URL(link);
   if(!isDeliveryAppOrigin(url)||url.pathname!=='/assessments/recover'||url.searchParams.get('session')!==j.session_id||url.searchParams.getAll('key').length!==1||url.searchParams.getAll('session').length!==1||url.hash||url.username||url.password){await stop();continue;}
   const session=await verifyGuestCapability(j.session_id,url.searchParams.get('key')||'');
   if(session.capability_hash!==j.capability_hash||session.participant_email.trim().toLowerCase()!==sender.to||sender.idempotencyKey!=='dydd-guest-checkout-reminder-'+j.order_id){await stop();continue;}
   const order=must(await db.from('dydd_guest_orders').select('*').eq('id',j.order_id).single());
   if(order.session_id!==j.session_id||order.status!=='pending'||!order.payment_reference||order.access_grant_id){await stop();continue;}
   const config=publicPaymentRuntime('webhook');
   if(config.provider!==order.payment_provider){await stop();continue;}
   const checkout=await new Stripe(config.secret).checkout.sessions.retrieve(order.payment_reference);
   // Verify provider completion independently: delayed webhooks must not cause reminders to paid guests.
   if(checkout.id!==order.payment_reference||checkout.livemode!==(config.provider==='stripe_live')||checkout.mode!=='payment'||checkout.status!=='open'||checkout.payment_status!=='unpaid'||checkout.metadata?.product!==order.product||(checkout.metadata?.source_id||'')!==(order.source_result_id||'')||checkout.metadata?.ownership!=='guest-v1'||checkout.metadata.order_id!==j.order_id||checkout.metadata.guest_session_id!==j.session_id){await stop();continue;}
   const allowed=must(await db.rpc('dydd_guest_authorize_checkout_reminder',{p_order:j.order_id,p_claim:j.claim_token}));
   if(allowed!==true){await stop();continue;}
   const result=await sendResendEmail(sender);
   if(result.sent){await finish({status:'accepted',provider_id:result.id,accepted_at:new Date().toISOString(),error_message:null});accepted++;}
   else if(result.skipped){await finish({status:'skipped',error_message:result.message});skipped++;}
   else {const permanent=/Provider HTTP (400|401|403|404|413|422)\b/.test(result.message||'');await finish({status:permanent?'review':'retry',error_message:result.message,next_attempt_at:new Date(Date.now()+Math.min(3600000,60000*2**j.attempts)).toISOString()});retries++;}
  }catch(error){
   if(error instanceof GuestAccessDeniedError){await finish({status:'skipped',error_message:'Guest capability expired or changed.'});skipped++;}
   else {await finish({status:'retry',error_message:'Reminder verification or submission needs retry with the original key.',next_attempt_at:new Date(Date.now()+120000).toISOString()});retries++;}
  }
 }
 return {claimed:jobs.length,accepted,skipped,retries};
}
