import 'server-only';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {appBase,enqueue,must,tokenHash} from './store';
/** Bridge the paid-Circle transactional invitation outbox to the approved email campaign.
 * A held row is immutable history, NOT permission to send. The standard SQL fence still
 * rechecks current plan, message approval/exclusion, token, roster and membership.
 */
export async function queueApprovedHeldCircleInvitations(circleId:string,holdId?:string){
 const db=createSupabaseAdminClient();
 const circle=must(await db.from('journey_circle_plans').select('id,revision,status,plan').eq('id',circleId).maybeSingle()) as any;
 if(!circle||circle.status!=='active')return {queued:0};
 const campaign=must(await db.from('dydd_circle_campaigns').select('*').eq('circle_id',circleId).eq('circle_revision',circle.revision).in('status',['finalized','paused']).maybeSingle()) as any;
 if(!campaign)return {queued:0};
 const drafts=must(await db.from('dydd_circle_message_drafts').select('*').eq('campaign_id',campaign.id).in('message_key',['invitation','invitation-reminder'])) as any[];
 const initial=drafts.find(d=>d.message_key==='invitation'&&d.approved_at&&!d.excluded_at),reminder=drafts.find(d=>d.message_key==='invitation-reminder'&&d.approved_at&&!d.excluded_at);
 if(!initial)return {queued:0};
 let query=db.from('dydd_circle_held_outbox').select('*').eq('circle_id',circleId).eq('kind','invitation');if(holdId)query=query.eq('id',holdId);
 const holds=must(await query) as any[];let queued=0;
 for(const hold of holds){
  const token=hold.payload?.token;if(!/^[a-f0-9]{64}$/.test(token||''))continue;
  const membership=must(await db.from('dydd_circle_memberships').select('*').eq('id',hold.payload.membershipId).eq('circle_id',circleId).maybeSingle()) as any;
  if(!membership||membership.status!=='invited'||membership.email!==hold.recipient||membership.token_hash!==tokenHash(token)||Date.parse(membership.expires_at)<=Date.now())continue;
  if(!circle.plan.participants.some((p:any)=>p.email.toLowerCase()===membership.email))continue;
  const url=appBase()+'/camp-circle/invitation?token='+token;
  const add=async(d:any,key:string,when:string,expires:string)=>{
   if(Date.parse(expires)<=Date.now()||Date.parse(when)>=Date.parse(expires))return;
   await enqueue({event_key:key,template_id:d.template_id,category:'service',email:membership.email,circle_id:circleId,campaign_id:campaign.id,draft_id:d.id,membership_id:membership.id,subject:d.subject,body:d.body.replaceAll('{{invitation_url}}',url),scheduled_at:when,expires_at:expires,context:{kind:'invitation',tokenHash:membership.token_hash,draftRevision:d.revision,heldOutboxId:hold.id,sourceCreatedAt:hold.created_at}});queued++;
  };
  await add(initial,'circle-invite:'+membership.id+':'+membership.token_hash,new Date().toISOString(),new Date(Math.min(Date.parse(membership.expires_at),Date.parse(initial.expires_at))).toISOString());
  // One reminder per membership, matching the original invitation contract. Never catch up an old reminder.
  const remindAt=new Date(Date.parse(membership.invited_at)+4*86400000).toISOString();
  if(reminder&&Date.parse(remindAt)>Date.now())await add(reminder,'circle-invite-reminder:'+membership.id,remindAt,new Date(Math.min(Date.parse(membership.expires_at),Date.parse(reminder.expires_at))).toISOString());
 }
 return {queued};
}
