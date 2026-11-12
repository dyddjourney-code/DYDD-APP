'use server';
import { isPrivateOwnerConsole } from '@/lib/private-owner';
import { getDyddAdminEmails } from '@/lib/admin-access';
import { randomUUID } from 'node:crypto';
import { sendApplicationEmail } from '@/lib/lifecycle/application-mail';
import { guestInvitationKey, renderGuestInvitation } from '@/lib/public-assessments/guest-invitation';
import { guestGrantLink, individualGuestToken } from '@/lib/public-assessments/individual-guest-access';
import type { GuestAccessGrant } from '@/lib/public-assessments/guest-group-access';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isDyddAdminEmail } from '@/lib/admin-access';
import { newGuestCapability, guestCapabilityHash, guestSessionId } from '@/lib/public-assessments/guest-capability';
import { requireGuestAccessStorage, validateGuestGrant } from '@/lib/public-assessments/guest-group-access';
export async function requireGuestAccessOwner() {
 // The platform ALL-deployment Vercel gate protects this pinned owner project.
 // Resolve the real confirmed owner for audit FK; never invent a user/group.
 if(isPrivateOwnerConsole()) {
  requireGuestAccessStorage();
  const admins=getDyddAdminEmails();
  for(let page=1;;page++) {
   const {data,error}=await createSupabaseAdminClient().auth.admin.listUsers({page,perPage:1000});
   if(error)throw Error('Owner identity could not be verified.');
   const owner=data.users.find(u=>u.email_confirmed_at&&!u.is_anonymous&&admins.has((u.email||'').trim().toLowerCase()));
   if(owner)return owner;
   if(data.users.length<1000)throw Error('Confirmed DYDD owner account was not found.');
  }
 }

 const {data:{user},error}=await (await createSupabaseServerClient()).auth.getUser();
 if(error||!user)redirect('/login?next='+encodeURIComponent('/owner/guest-access'));
 if(!user.email_confirmed_at||!isDyddAdminEmail(user.email))throw Error('Only the DYDD owner can manage guest access.');
 requireGuestAccessStorage();
 return user;
}
export type GrantCreationState={message:string;link?:string};
export async function createGuestAccessGrant(_state:GrantCreationState,form:FormData):Promise<GrantCreationState> {
 const owner=await requireGuestAccessOwner();
 try {
  const input=validateGuestGrant({name:String(form.get('name')||''),kind:String(form.get('kind')||''),couponCode:String(form.get('coupon_code')||''),products:form.getAll('products').map(String),expiresAt:String(form.get('expires_at')||''),maxUses:String(form.get('max_uses')||''),recipientEmail:String(form.get('recipient_email')||''),recipientName:String(form.get('recipient_name')||'')});
  const id=randomUUID(),token=input.kind==='individual'?individualGuestToken(id):newGuestCapability();
  const link=guestGrantLink(token);
  const saved=await createSupabaseAdminClient().from('dydd_guest_access_grants').insert({...input,id,token_hash:guestCapabilityHash(token),created_by:owner.id}).select('id').single();
  if(saved.error||!saved.data)throw Error('The access link could not be created.');
  revalidatePath('/owner/guest-access');
  return {message:input.kind==='individual'?'Individual pass created. No email has been sent. Copy the link or use Send Email below.':'Group link created. Copy it now; group links cannot be retrieved later.',link};
 } catch(error){return {message:error instanceof Error?error.message:'Access link could not be created.'};}
}
export async function revokeGuestAccessGrant(form:FormData) {
 await requireGuestAccessOwner();
 const id=guestSessionId(String(form.get('grant_id')||''));
 const result=await createSupabaseAdminClient().from('dydd_guest_access_grants').update({revoked_at:new Date().toISOString()}).eq('id',id).is('revoked_at',null);
 if(result.error)throw Error('Revocation could not be saved. Please retry.');
 revalidatePath('/owner/guest-access');
}

export type InvitationState={message:string};
export async function sendGuestAccessInvitation(_state:InvitationState,form:FormData):Promise<InvitationState> {
 await requireGuestAccessOwner();
 try {
  const id=guestSessionId(String(form.get('grant_id')||'')),submitted=guestSessionId(String(form.get('request_id')||'')),db=createSupabaseAdminClient();
  const found=await db.from('dydd_guest_access_grants').select('*').eq('id',id).single();
  if(found.error||!found.data)throw Error('Individual pass could not be loaded.');
  const grant=found.data as GuestAccessGrant;
  if(grant.kind!=='individual'||!grant.recipient_email||grant.revoked_at||Date.parse(grant.expires_at)<=Date.now())throw Error('Only an active individual pass can be emailed.');
  const token=individualGuestToken(id);
  if(guestCapabilityHash(token)!==found.data.token_hash)throw Error('This pass link needs owner recovery before sending.');
  // Recover ambiguous/pending delivery with its original key. Accepted deliveries
  // can be explicitly resent; a repeated POST with the same request remains idempotent.
  let requestId=submitted;
  if(grant.invitation_job_id) {
   const prior=await db.from('dydd_lifecycle_jobs').select('status').eq('event_key','application:'+guestInvitationKey(id,grant.invitation_job_id)).maybeSingle();
   if(prior.error)throw Error('Previous invitation delivery could not be checked.');
   if(!prior.data||['queued','retry','processing','submitting'].includes(prior.data.status))requestId=grant.invitation_job_id;
  }
  if(requestId!==grant.invitation_job_id) {
   let claim=db.from('dydd_guest_access_grants').update({invitation_job_id:requestId,invitation_status:'queued'}).eq('id',id).is('revoked_at',null).gt('expires_at',new Date().toISOString());
   claim=grant.invitation_job_id?claim.eq('invitation_job_id',grant.invitation_job_id):claim.is('invitation_job_id',null);
   const claimed=await claim.select('id').maybeSingle();
   if(claimed.error)throw Error('Invitation request could not be saved.');
   if(!claimed.data)return {message:'Another invitation request is already in progress. Refresh to see its status.'};
  }
  const result=await sendApplicationEmail({...renderGuestInvitation(grant,guestGrantLink(token)),to:grant.recipient_email,idempotencyKey:guestInvitationKey(id,requestId),templateId:'guest-individual-invitation',deliveryContext:{type:'guest_invitation',guestGrantId:id,invitationRequestId:requestId}});
  const patch=result.sent?{invitation_status:'accepted',invitation_sent_at:new Date().toISOString()}:{invitation_status:result.skipped?'skipped':'queued'};
  const updated=await db.from('dydd_guest_access_grants').update(patch).eq('id',id).eq('invitation_job_id',requestId);
  revalidatePath('/owner/guest-access');
  if(updated.error)return {message:'Delivery state requires reconciliation. Refresh to see the durable email status before trying again.'};
  return {message:result.sent?'Email accepted by the delivery provider. The original completion deadline is unchanged.':result.message||'Invitation queued; provider acceptance is not yet confirmed.'};
 }catch(error){return {message:error instanceof Error?error.message:'Invitation could not be requested.'};}
}
