'use server';
import {randomUUID} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {requireGuestAccessOwner} from './actions';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {isPrivateOwnerConsole} from '@/lib/private-owner';
import {validateIndividualRecipient} from '@/lib/public-assessments/individual-guest-access';
import {guestSessionId} from '@/lib/public-assessments/guest-capability';
import {sendApplicationEmail} from '@/lib/lifecycle/application-mail';
import {volunteerBatch,volunteerCode,volunteerCodeHash,volunteerSignupLink,volunteerWelcomeKey,renderVolunteerWelcome,validateBetaChecklist,type VolunteerInvitation,type BetaChecklist} from '@/lib/commerce/volunteer-beta';
export type VolunteerState={message:string;code?:string;link?:string};
async function owner(){if(!isPrivateOwnerConsole())throw Error('Volunteer beta invitations are managed only in the private owner console.');return requireGuestAccessOwner();}
export async function createVolunteerInvitation(_state:VolunteerState,form:FormData):Promise<VolunteerState>{
 const actor=await owner();
 try {
  const recipient=validateIndividualRecipient(String(form.get('recipient_email')||''),String(form.get('recipient_name')||''));
  if(!recipient.recipient_name)throw Error('Enter the volunteer’s name.');
  const db=createSupabaseAdminClient();
  // Safe repeated form submission: recover the original pending invitation rather than minting another code.
  const prior=await db.from('dydd_beta_access_codes').select('id,code_hash').eq('recipient_email',recipient.recipient_email).is('redeemed_at',null).is('revoked_at',null).maybeSingle();
  if(prior.error)throw Error('Existing invitation could not be checked.');
  const id=prior.data?.id||randomUUID(),code=volunteerCode(id),hash=volunteerCodeHash(code);
  if(prior.data&&prior.data.code_hash!==hash)throw Error('The existing invitation needs owner code recovery.');
  if(!prior.data){const saved=await db.from('dydd_beta_access_codes').insert({id,code_hash:hash,batch:volunteerBatch,...recipient,created_by:actor.id});if(saved.error)throw Error('Invitation could not be created. Refresh to check whether another request already created it.');}
  revalidatePath('/owner/guest-access');
  return {message:prior.data?'Existing pending volunteer invitation recovered. No email was sent.':'Volunteer invitation created. No email was sent. Share the signup link together with this unique code, or send the welcome after the checklist is attached.',code,link:volunteerSignupLink()};
 }catch(e){return {message:e instanceof Error?e.message:'Volunteer invitation could not be created.'};}
}
export async function uploadBetaChecklist(_state:VolunteerState,form:FormData):Promise<VolunteerState>{
 const actor=await owner();
 try{const file=form.get('checklist');if(!(file instanceof File))throw Error('Choose John’s beta tester checklist.');const attachment=await validateBetaChecklist(file);
 const saved=await createSupabaseAdminClient().from('dydd_beta_checklist').upsert({id:true,...attachment,updated_by:actor.id,updated_at:new Date().toISOString()});if(saved.error)throw Error('Checklist could not be saved.');revalidatePath('/owner/guest-access');return {message:'Checklist saved privately. Future welcome emails will include this attachment. No email was sent.'};
 }catch(e){return {message:e instanceof Error?e.message:'Checklist upload failed.'};}
}
export async function revokeVolunteerInvitation(_state:VolunteerState,form:FormData):Promise<VolunteerState>{
 await owner();try{const id=guestSessionId(String(form.get('code_id')||''));
 const db=createSupabaseAdminClient(),saved=await db.from('dydd_beta_access_codes').update({revoked_at:new Date().toISOString()}).eq('id',id).eq('batch',volunteerBatch).is('redeemed_at',null).is('revoked_at',null).select('id').maybeSingle();
 if(saved.error)throw Error('Revocation could not be saved.');if(!saved.data)return {message:'This code is already revoked or redeemed. Earned lifetime access has not been removed.'};
 const cancelled=await db.from('dydd_lifecycle_jobs').update({status:'cancelled',error_message:'Volunteer invitation revoked by owner.'}).eq('context->deliveryContext->>betaCodeId',id).in('status',['queued','retry','processing']);
 revalidatePath('/owner/guest-access');return {message:cancelled.error?'Signup code revoked. Queued welcome eligibility will reject this invitation.':'Unused signup code revoked. Existing lifetime access and saved work are unchanged.'};
 }catch(e){return {message:e instanceof Error?e.message:'Invitation could not be revoked.'};}
}
export async function sendVolunteerWelcome(_state:VolunteerState,form:FormData):Promise<VolunteerState>{
 await owner();try{
  const id=guestSessionId(String(form.get('code_id')||'')),submitted=guestSessionId(String(form.get('request_id')||'')),db=createSupabaseAdminClient();
  const loaded=await db.from('dydd_beta_access_codes').select('*').eq('id',id).eq('batch',volunteerBatch).single();
  if(loaded.error||!loaded.data)throw Error('Volunteer invitation could not be loaded.');const invite=loaded.data as VolunteerInvitation;
  if(invite.revoked_at||invite.redeemed_at)throw Error('Only an unused, active volunteer invitation can be emailed.');
  const code=volunteerCode(id);if(volunteerCodeHash(code)!==invite.code_hash)throw Error('Signup code recovery is unavailable.');
  const checklist=await db.from('dydd_beta_checklist').select('*').eq('id',true).maybeSingle();
  if(checklist.error)throw Error('Beta checklist could not be checked.');if(!checklist.data)throw Error('Attach John’s beta tester checklist before sending a welcome email.');
  let requestId=submitted;
  if(invite.invitation_job_id){
   const priorKey='application:'+volunteerWelcomeKey(id,invite.invitation_job_id);
   const job=await db.from('dydd_lifecycle_jobs').select('status,context').eq('event_key',priorKey).maybeSingle();
   if(job.error)throw Error('Previous welcome delivery could not be checked.');
   const attachmentChanged=job.data&&job.data.context?.deliveryContext?.checklistSha256!==checklist.data.sha256;
   if(attachmentChanged&&['processing','submitting'].includes(job.data!.status))return {message:'The previous welcome is processing with an older checklist. Wait for its delivery state to reconcile before requesting another.'};
   if(attachmentChanged&&['queued','retry'].includes(job.data!.status)){
    const stopped=await db.from('dydd_lifecycle_jobs').update({status:'cancelled',error_message:'Owner requested a welcome using the replaced checklist.'}).eq('event_key',priorKey).in('status',['queued','retry']).select('id').maybeSingle();
    if(stopped.error||!stopped.data)return {message:'The previous welcome changed while replacing its checklist. Refresh and review its delivery state.'};
   }else if(!job.data||['queued','retry','processing','submitting'].includes(job.data.status))requestId=invite.invitation_job_id;
  }
  if(requestId!==invite.invitation_job_id){let claim=db.from('dydd_beta_access_codes').update({invitation_job_id:requestId}).eq('id',id).is('revoked_at',null).is('redeemed_at',null);claim=invite.invitation_job_id?claim.eq('invitation_job_id',invite.invitation_job_id):claim.is('invitation_job_id',null);const saved=await claim.select('id').maybeSingle();if(saved.error)throw Error('Welcome request could not be saved.');if(!saved.data)return {message:'Another welcome request is in progress. Refresh to see its status.'};}
  const attachment=checklist.data as BetaChecklist;
  const result=await sendApplicationEmail({...renderVolunteerWelcome(invite,code,attachment),to:invite.recipient_email,idempotencyKey:volunteerWelcomeKey(id,requestId),templateId:'volunteer-beta-welcome',deliveryContext:{type:'volunteer_beta_welcome',betaCodeId:id,invitationRequestId:requestId,checklistSha256:attachment.sha256}});
  revalidatePath('/owner/guest-access');return {message:result.sent?'Welcome email and checklist accepted by the delivery provider. Inbox delivery is not yet confirmed.':result.message||'Welcome queued; provider acceptance is not yet confirmed.'};
 }catch(e){return {message:e instanceof Error?e.message:'Welcome email could not be requested.'};}
}
