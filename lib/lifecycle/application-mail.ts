import 'server-only';
import {randomUUID} from 'node:crypto';
import {sendResendEmail,type SendEmailInput,type SendEmailResult} from '@/lib/email/resend';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {isDeepStrictEqual} from 'node:util';
import {enqueue,must} from './store';
import {lifecycleEligibility} from './worker';
type ApplicationEmail=SendEmailInput&{templateId?:string;deliveryContext?:Record<string,unknown>};
export async function sendApplicationEmail(input:ApplicationEmail):Promise<SendEmailResult>{
 const key=input.idempotencyKey||`dydd-application-${randomUUID()}`,db=createSupabaseAdminClient(),now=Date.now(),eventKey='application:'+key;
 const {templateId,deliveryContext,...payload}=input;
 const senderInput={...payload,idempotencyKey:key};
 try{
  await enqueue({event_key:eventKey,template_id:templateId||'requested-service-email',category:'service',email:input.to,subject:input.subject,body:input.text,scheduled_at:new Date(now).toISOString(),expires_at:new Date(now+23*3600000).toISOString(),context:{kind:'application',deliveryContext:deliveryContext||{},senderInput,deliveryKey:key}});
  if(['B02','B04-self'].includes(templateId||'')){
   const reminderInput={...senderInput,subject:'Reminder: '+senderInput.subject,text:'A gentle reminder:\n\n'+senderInput.text,html:'<p>A gentle reminder:</p>'+senderInput.html,idempotencyKey:key+'-reminder-1'};
   await enqueue({event_key:eventKey+':reminder-1',template_id:templateId==='B02'?'B03':'B04-self-reminder',category:'service',email:input.to,subject:reminderInput.subject,body:reminderInput.text,scheduled_at:new Date(now+5*86400000).toISOString(),expires_at:new Date(now+8*86400000).toISOString(),context:{kind:'application',deliveryContext:deliveryContext||{},senderInput:reminderInput,deliveryKey:reminderInput.idempotencyKey}});
  }
  const row=must(await db.from('dydd_lifecycle_jobs').select('*').eq('event_key',eventKey).single()) as any;
  // Content snapshots never drift on a retry or a repeated business event.
  if(!isDeepStrictEqual(row.context.senderInput,JSON.parse(JSON.stringify(senderInput))))return {sent:false,skipped:false,message:'A different email payload already exists for this event. Review before sending.'};
  if(row.status==='accepted')return {sent:true,skipped:false,id:row.provider_id};
  if(['cancelled','skipped','failed','review'].includes(row.status))return {sent:false,skipped:true,message:'This delivery is stopped or needs manual review.'};
  if(process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT==='sandbox')return {sent:false,skipped:true,message:'Email queued for sandbox eligibility review; no provider request made.'};
  const eligibility=await lifecycleEligibility(row);
  if(eligibility.stop){must(await db.from('dydd_lifecycle_jobs').update({status:'skipped',error_message:eligibility.stop}).eq('id',row.id).eq('status','queued'));return {sent:false,skipped:true,message:eligibility.stop};}
  if(eligibility.deferUntil)return {sent:false,skipped:false,message:'Message durably queued while communication is paused.'};
  if(['processing','submitting'].includes(row.status))return {sent:false,skipped:false,message:'Message is already processing; the durable worker will reconcile its result.'};
  const claim=randomUUID(),saved=must(await db.from('dydd_lifecycle_jobs').update({status:'processing',claim_token:claim,claimed_at:new Date().toISOString(),attempts:row.attempts+1,first_attempt_at:row.first_attempt_at||new Date().toISOString()}).eq('id',row.id).eq('status',row.status).eq('attempts',row.attempts).select('id').maybeSingle());
  if(!saved)return {sent:false,skipped:false,message:'Message is already queued or processing.'};
  const fence=must(await db.rpc('dydd_authorize_lifecycle_send',{job_key:row.id,lease_token:claim})) as any;
  if(!fence.authorized){
   if(!fence.lostClaim)must(await db.from('dydd_lifecycle_jobs').update({status:fence.defer?'queued':'skipped',error_message:fence.reason||fence.stop,next_attempt_at:new Date(Date.now()+3600000).toISOString(),attempts:row.attempts,first_attempt_at:row.first_attempt_at}).eq('id',row.id).eq('claim_token',claim).eq('status','processing'));
   return {sent:false,skipped:!fence.defer,message:fence.reason||fence.stop||'Delivery lease changed before submission.'};
  }
  const result=await sendResendEmail(senderInput);
  const permanent=!result.sent&&/Provider HTTP (400|401|403|404|413|422)\b/.test(result.message||'');
  must(await db.from('dydd_lifecycle_jobs').update(result.sent?{status:'accepted',provider_id:result.id,accepted_at:new Date().toISOString(),error_message:null}:{status:result.skipped?'skipped':permanent?'failed':'retry',error_message:result.message,next_attempt_at:new Date(Date.now()+120000).toISOString()}).eq('id',row.id).eq('claim_token',claim));
  return result;
 }catch{return {sent:false,skipped:false,message:'Delivery state needs retry or reconciliation using its original event key. Provider acceptance is not confirmed.'};}
}
