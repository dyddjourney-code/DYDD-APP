import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { guestCapabilityHash, guestSessionId } from './guest-capability';
import { formatGuestDeadline, guestGrantLink, individualGuestToken } from './individual-guest-access';
import { publicAssessmentLedgerEnabled } from './config';
import type { GuestAccessGrant } from './guest-group-access';

const escapeHtml=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function guestInvitationKey(grantId:string,requestId:string) {
 return 'guest-invitation-'+guestSessionId(grantId)+'-'+guestSessionId(requestId);
}
export function renderGuestInvitation(grant:GuestAccessGrant, link:string) {
 const products=grant.products.map(p=>p==='designid'?'DesignID':'DesignPD').join(' and '),deadline=formatGuestDeadline(grant.expires_at);
 const greeting=grant.recipient_name?'Hello '+grant.recipient_name+',':'Hello,';
 const prerequisite=grant.products.includes('designpd')?'DesignPD requires your completed DesignID in the same private guest session. If you already completed DesignID, open your original private recovery link in this browser before using this invitation.':'';
 const text=`${greeting}\n\nYou have an individual guest pass for ${products} at no charge.\n\nStart your assessment: ${link}\n\nComplete and submit ${products} by ${deadline}. This deadline applies even if you start earlier.\n\nUse this invitation with ${grant.recipient_email}. It is for one person only; no app signup or password is needed. ${prerequisite}\n\nYour completed reports remain available through your private recovery link after the deadline. Keep that link for your records.\n\nDiscover Your Divine Design`;
 const html=`<h1>Your ${escapeHtml(products)} guest pass</h1><p>${escapeHtml(greeting)}</p><p>You have an individual guest pass for <strong>${escapeHtml(products)}</strong> at no charge.</p><p><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 18px;background:#293e33;color:white;text-decoration:none;border-radius:6px">Start your assessment</a></p><p>Complete and submit ${escapeHtml(products)} by <strong>${escapeHtml(deadline)}</strong>. This deadline applies even if you start earlier.</p><p>Use this invitation with ${escapeHtml(grant.recipient_email||'')}. It is for one person only; no app signup or password is needed.</p>${prerequisite?'<p>'+escapeHtml(prerequisite)+'</p>':''}<p>Your completed reports remain available through your private recovery link after the deadline. Keep that link for your records.</p>`;
 return {subject:`Your ${products} guest pass — complete by ${deadline}`,text,html};
}
/** Rechecked by immediate delivery and durable retry just before the provider request. */
export async function guestInvitationDeliveryEligibility(job:any,now=Date.now()):Promise<{stop?:string;deferUntil?:string;reason?:string}> {
 if(!publicAssessmentLedgerEnabled()||process.env.DYDD_GUEST_EMAIL_ENABLED!=='true')return {deferUntil:new Date(now+120000).toISOString(),reason:'Guest invitation email is paused.'};
 const stop={stop:'Individual guest invitation was revoked, replaced, expired, or its recipient/content changed.'};
 const context=job.context?.deliveryContext||{},sender=job.context?.senderInput;
 let grantId:string,requestId:string,key:string;
 try{grantId=guestSessionId(String(context.guestGrantId||''));requestId=guestSessionId(String(context.invitationRequestId||''));key=guestInvitationKey(grantId,requestId);}catch{return stop;}
 const found=await createSupabaseAdminClient().from('dydd_guest_access_grants').select('*').eq('id',grantId).maybeSingle();
 if(found.error)throw Error('Guest invitation eligibility storage is unavailable.');
 const grant=found.data as GuestAccessGrant|null;
 if(!grant||grant.kind!=='individual'||grant.revoked_at||Date.parse(grant.expires_at)<=now||!Number.isFinite(Date.parse(grant.expires_at))||grant.invitation_job_id!==requestId||grant.recipient_email!==job.email||sender?.to!==job.email||sender?.idempotencyKey!==key||job.event_key!=='application:'+key)return stop;
 const token=individualGuestToken(grant.id);
 if(guestCapabilityHash(token)!==found.data.token_hash)return stop;
 const rendered=renderGuestInvitation(grant,guestGrantLink(token));
 if(sender.text!==rendered.text||sender.html!==rendered.html||sender.subject!==rendered.subject)return stop;
 return {};
}
