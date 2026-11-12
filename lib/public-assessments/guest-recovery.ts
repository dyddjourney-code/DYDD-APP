import 'server-only';
import {createHmac, randomUUID} from 'node:crypto';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {enqueue,must} from '@/lib/lifecycle/store';
import {sendApplicationEmail} from '@/lib/lifecycle/application-mail';
import {publicAssessmentLedgerEnabled} from './config';
import {guestCapabilityHash, guestSessionId} from './guest-capability';

export type RecoveryProduct = 'designid' | 'designpd';
export const recoveryResponse = 'If an eligible guest purchase matches that email, a private recovery link will be sent. Check your inbox and spam folder. For an account purchase, sign in with the account you used. Please wait before requesting another link; do not repurchase.';
function digest(scope:string,value:string) {
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!secret)throw Error('Recovery is unavailable.');
 return createHmac('sha256',secret).update('dydd-guest-recovery-v1:'+scope+':'+value).digest('hex');
}
function recoveryToken(id:string) {
 return Buffer.from(digest('token',guestSessionId(id)),'hex').toString('base64url');
}
function recoveryOrigin() {
 const value=process.env.DYDD_APP_URL||'',url=new URL(value);
 if(url.protocol!=='https:'||url.origin!==value||url.username||url.password)throw Error('Recovery origin unavailable.');
 return value;
}
/** Server-only: caller always returns the same public result. No identity is returned. */
export async function requestGuestRecovery(emailValue:string,productValue:string,requester:string) {
 const email=emailValue.trim().toLowerCase();
 if(!publicAssessmentLedgerEnabled()||process.env.DYDD_GUEST_EMAIL_ENABLED!=='true'||
  !['designid','designpd'].includes(productValue)||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email))return;
 const origin=recoveryOrigin(),db=createSupabaseAdminClient(),id=randomUUID();
 const reserved=await db.rpc('dydd_guest_reserve_recovery',{
  p_id:id,p_email:email,p_email_hash:digest('email',email),p_requester_hash:digest('requester',requester.slice(0,200)),
  p_product:productValue,p_token_hash:guestCapabilityHash(recoveryToken(id)),
 });
 if(reserved.error)throw Error('Recovery storage is unavailable.');
 const intent=reserved.data as {id:string;session_id:string|null;product:RecoveryProduct;created_at:string;expires_at:string;used_at:string|null}|null;
 if(!intent?.session_id||intent.used_at||Date.parse(intent.expires_at)<=Date.now())return;
 // Reconstruct the SAME token and immutable payload for durable retries; no token in public responses.
 const link=origin+'/assessments/recover/email?'+new URLSearchParams({request:intent.id,key:recoveryToken(intent.id)});
 const text='A private guest assessment recovery link was requested for this email.\n\nOpen your saved purchase: '+link+'\n\nThis link expires 30 minutes after the first request. Confirm on the page to restore private access. Your original answers, reports and purchase are preserved; no repurchase is needed. Confirming replaces older private links for this guest session. If you did not request this, ignore this email.';
 const senderInput={to:email,subject:'Your private assessment recovery link',text,
  html:'<p>A private guest assessment recovery link was requested for this email.</p><p><a href="'+link.replace(/&/g,'&amp;')+'">Open your saved purchase</a></p><p>This link expires 30 minutes after the first request. Confirm on the page to restore private access. Your original answers, reports and purchase are preserved; no repurchase is needed. Confirming replaces older private links for this guest session. If you did not request this, ignore this email.</p>',
  idempotencyKey:'guest-recovery-'+intent.id};
 // Persist the original 30-minute deadline before the immediate, user-requested send.
 // The dedicated cron retries only this template; broad lifecycle campaigns stay disabled.
 await enqueue({event_key:'application:'+senderInput.idempotencyKey,template_id:'guest-assessment-recovery',category:'service',email,
  subject:senderInput.subject,body:text,scheduled_at:intent.created_at,expires_at:intent.expires_at,
  context:{kind:'application',deliveryContext:{type:'guest_recovery',recoveryRequestId:intent.id},senderInput,deliveryKey:senderInput.idempotencyKey}});
 await sendApplicationEmail({...senderInput,templateId:'guest-assessment-recovery',deliveryContext:{type:'guest_recovery',recoveryRequestId:intent.id}});
}

/** Narrow outbox retry path. Never processes lifecycle events or unrelated campaigns. */
export async function runGuestRecoveryWorker(limit=10) {
 if(!publicAssessmentLedgerEnabled()||process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT==='sandbox'||process.env.DYDD_GUEST_EMAIL_ENABLED!=='true')return {paused:true,accepted:0};
 const db=createSupabaseAdminClient(),now=Date.now(),stale=new Date(now-10*60000).toISOString();
 const jobs=must(await db.from('dydd_lifecycle_jobs').select('*').eq('template_id','guest-assessment-recovery')
  .eq('context->>kind','application').eq('context->deliveryContext->>type','guest_recovery')
  .in('status',['queued','retry','processing','submitting']).lte('scheduled_at',new Date(now).toISOString())
  .lte('next_attempt_at',new Date(now).toISOString()).order('scheduled_at').limit(Math.max(1,Math.min(50,limit)))) as any[];
 let accepted=0,skipped=0,retries=0;
 for(const j of jobs){
  if(['processing','submitting'].includes(j.status)){
   if(!j.claimed_at||j.claimed_at>=stale)continue;
   // Compare the old lease so overlapping cron runs cannot reset a fresh claim.
   const reset=must(await db.from('dydd_lifecycle_jobs').update({status:'retry',claim_token:null,claimed_at:null})
    .eq('id',j.id).eq('status',j.status).eq('claim_token',j.claim_token).lt('claimed_at',stale).select('id')) as any[];
   if(!reset.length)continue;
   j.status='retry';j.claim_token=null;
  }
  if(j.attempts>=8||(j.first_attempt_at&&Date.parse(j.first_attempt_at)<now-23*3600000)){
   must(await db.from('dydd_lifecycle_jobs').update({status:'review',error_message:'Recovery retry limit reached; reconcile provider acceptance.'})
    .eq('id',j.id).eq('status',j.status).eq('attempts',j.attempts));skipped++;continue;
  }
  const result=await sendApplicationEmail({...j.context.senderInput,templateId:'guest-assessment-recovery',deliveryContext:j.context.deliveryContext});
  if(result.sent)accepted++;else if(result.skipped)skipped++;else retries++;
 }
 return {examined:jobs.length,accepted,skipped,retries};
}
