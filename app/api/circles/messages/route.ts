import {randomBytes} from 'node:crypto';
import {NextResponse} from 'next/server';
import {circleActor,circleQuery,sameOrigin} from '@/lib/circles/server';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {validatePlan} from '@/lib/circles/plan';
import {circleMessageDrafts} from '@/lib/lifecycle/templates';
import {appBase,enqueue,enqueueCampaignMembers,must,tokenHash} from '@/lib/lifecycle/store';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function owned(request:Request,id:string){const actor=await circleActor(request);if(!actor)throw Error('Sign in to manage Circle messages.');const circle=must(await circleQuery(actor).eq('id',id).maybeSingle()) as any;if(!circle)throw Error('This Circle is not available in your account.');return {actor,circle};}
export async function GET(request:Request){try{
 const id=new URL(request.url).searchParams.get('circleId')||'',{circle,actor}=await owned(request,id),db=createSupabaseAdminClient();
 const campaign=must(await db.from('dydd_circle_campaigns').select('*').eq('circle_id',id).eq('circle_revision',circle.revision).maybeSingle()) as any;
 const messages=campaign?must(await db.from('dydd_circle_message_drafts').select('*').eq('campaign_id',campaign.id).order('scheduled_at')):[];
 const members=must(await db.from('dydd_circle_memberships').select('id,email,display_name,status,accepted_at,reminders,expires_at').eq('circle_id',id));
 const history=must(await db.from('dydd_lifecycle_jobs').select('id,template_id,subject,body,email,status,scheduled_at,expires_at,provider_id,accepted_at,error_message,campaign_id').eq('circle_id',id).order('created_at',{ascending:false}).limit(300));
 const announcements=must(await db.from('dydd_circle_announcements').select('*').eq('circle_id',id).order('created_at',{ascending:false}).limit(50));
 const providerIds=(history as any[]).filter(j=>j.provider_id).map(j=>j.provider_id);
 const delivery=providerIds.length?must(await db.from('dydd_email_messages').select('provider_id,status,last_event_at').in('provider_id',providerIds)) as any[]:[];
 return reply({campaign,messages,members,announcements,history:(history as any[]).map(j=>({...j,delivery:delivery.find(d=>d.provider_id===j.provider_id)||null})),preview:!actor.userId,sandbox:process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT==='sandbox'});
 }catch(e){return reply({error:(e as Error).message},403);}}
export async function POST(request:Request){
 if(!sameOrigin(request)||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Open your Circle page before making changes.'},403);
 const raw=await request.text();if(raw.length>50000)return reply({error:'Message is too large.'},413);
 let b:any;try{b=JSON.parse(raw);}catch{return reply({error:'Check your message details.'},400);}
 try{
 const {actor,circle}=await owned(request,b.circleId),db=createSupabaseAdminClient();
 if(b.action==='generate'){
  if(circle.status!=='active')throw Error('Create your Circle workspace before reviewing its communication schedule.');
  const invalid=validatePlan(circle.plan,true);if(invalid)throw Error(invalid);
  if(!circle.plan.time)throw Error('Choose a meeting time before writing your messages.');
  const old=must(await db.from('dydd_circle_campaigns').select('id').eq('circle_id',circle.id).not('finalized_at','is',null).limit(1)) as any[];
  const drafts=circleMessageDrafts(circle.plan,appBase(),old.length>0);
  if(!drafts.some(d=>d.template_id==='E02'&&d.expires_at>new Date().toISOString()))throw Error('Choose at least one future meeting before finalizing communication.');
  must(await db.from('dydd_circle_campaigns').upsert({circle_id:circle.id,circle_revision:circle.revision,plan_snapshot:circle.plan},{onConflict:'circle_id,circle_revision',ignoreDuplicates:true}));
  const campaign=must(await db.from('dydd_circle_campaigns').select('*').eq('circle_id',circle.id).eq('circle_revision',circle.revision).single()) as any;
  if(campaign.status==='superseded')throw Error('Save a new Circle revision before generating a replacement.');
  must(await db.from('dydd_circle_message_drafts').upsert(drafts.map(d=>({...d,campaign_id:campaign.id})),{onConflict:'campaign_id,message_key',ignoreDuplicates:true}));
  return reply({generated:true,count:drafts.length});
 }
 const campaign=must(await db.from('dydd_circle_campaigns').select('*').eq('circle_id',circle.id).eq('circle_revision',circle.revision).single()) as any;
 if(String(b.action).startsWith('announcement-')){
  if(b.action==='announcement-save'||b.action==='announcement-approve'){
   if(typeof b.subject!=='string'||!b.subject.trim()||b.subject.length>200||typeof b.body!=='string'||!b.body.trim()||b.body.length>30000)throw Error('Write a subject and complete leader message.');
   const scheduled=new Date(b.scheduledAt||Date.now()).getTime();if(!Number.isFinite(scheduled)||scheduled<Date.now()-60000||scheduled>Date.now()+365*86400000)throw Error('Choose a current or future send time within one year.');
   const payload={campaign_id:campaign.id,subject:b.subject.trim(),body:b.body.trim(),scheduled_at:new Date(Math.max(Date.now(),scheduled)).toISOString(),expires_at:new Date(Math.max(Date.now(),scheduled)+48*3600000).toISOString(),status:b.action==='announcement-approve'?'approved':'draft',approved_at:b.action==='announcement-approve'?new Date().toISOString():null};
   if(b.announcementId){
    const updated=must(await db.from('dydd_circle_announcements').update({...payload,revision:b.revision+1}).eq('id',b.announcementId).eq('circle_id',circle.id).eq('revision',b.revision).in('status',['draft','approved']).select('id').maybeSingle());if(!updated)throw Error('Message changed or is already published. Reload before editing.');
   } else {if(b.action==='announcement-approve')throw Error('Save the written message before approving it.');must(await db.from('dydd_circle_announcements').insert({...payload,circle_id:circle.id}));}
   return reply({saved:true});
  }
  const announcement=must(await db.from('dydd_circle_announcements').select('*').eq('id',b.announcementId).eq('circle_id',circle.id).single()) as any;
  if(b.action==='announcement-publish'){const queued=must(await db.rpc('dydd_publish_circle_announcement',{announcement_key:announcement.id,actor_user:actor.userId,actor_scope:actor.previewScope,expected_revision:b.revision}));return reply({queued,sandbox:process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT==='sandbox'});}
  if(b.action==='announcement-cancel'){
   must(await db.from('dydd_circle_announcements').update({status:'cancelled'}).eq('id',announcement.id).eq('circle_id',circle.id));
   must(await db.from('dydd_lifecycle_jobs').update({status:'cancelled',error_message:'Creator cancelled before provider submission.'}).eq('circle_id',circle.id).contains('context',{announcementId:announcement.id}).in('status',['queued','retry','processing','sandbox_ready']));return reply({cancelled:true});
  }
  throw Error('Choose a valid leader message action.');
 }
 if(b.action==='edit'||b.action==='approve'){
  if(typeof b.subject!=='string'||typeof b.body!=='string'||!Number.isInteger(b.revision))throw Error('Enter a subject and complete message.');
  const draft=must(await db.from('dydd_circle_message_drafts').select('id').eq('id',b.messageId).eq('campaign_id',campaign.id).single());if(!draft)throw Error('Message is not in this Circle.');
  const message=must(await db.rpc('dydd_update_circle_message',{message_id:b.messageId,actor_user:actor.userId,actor_scope:actor.previewScope,expected_revision:b.revision,new_subject:b.subject,new_body:b.body,approve:b.action==='approve'}));
  return reply({message});
 }
 if(b.action==='finalize'){
  const result=must(await db.rpc('dydd_finalize_circle_campaign',{campaign_key:campaign.id,actor_user:actor.userId,actor_scope:actor.previewScope}));
  if(actor.userId){const u=must(await db.auth.admin.getUserById(actor.userId)) as any;const email=u.user?.email;
   if(email){const ds=must(await db.from('dydd_circle_message_drafts').select('*').eq('campaign_id',campaign.id).eq('kind','leader')) as any[];for(const d of ds)if(d.expires_at>new Date().toISOString()&&(d.scheduled_at>=new Date().toISOString()||d.message_key==='leader-launch'))await enqueue({event_key:`circle-leader:${campaign.id}:${d.id}`,template_id:d.template_id,category:d.category,user_id:actor.userId,email,circle_id:circle.id,campaign_id:campaign.id,draft_id:d.id,subject:d.subject,body:d.body,scheduled_at:new Date(Math.max(Date.now(),Date.parse(d.scheduled_at))).toISOString(),expires_at:d.expires_at,context:{kind:'leader'}});}
  }
  return reply(result);
 }
 if(b.action==='pause'||b.action==='resume'){
  if(!['finalized','paused'].includes(campaign.status))throw Error('Finalize all reviewed messages before scheduling.');
  must(await db.from('dydd_circle_campaigns').update({status:b.action==='pause'?'paused':'finalized'}).eq('id',campaign.id));if(b.action==='resume')await enqueueCampaignMembers(campaign.id);return reply({paused:b.action==='pause'});
 }
 if(b.action==='invite'){
  if(!actor.userId)throw Error('Review mode cannot invite real recipients. Sign in as the Circle creator.');
  if(campaign.status!=='finalized')throw Error('Review every message and finalize the full schedule before sending invitations.');
  const d=must(await db.from('dydd_circle_message_drafts').select('*').eq('campaign_id',campaign.id).eq('message_key','invitation').single()) as any;if(!d.approved_at)throw Error('Approve the invitation first.');
  let queued=0;
  for(const person of circle.plan.participants){
   const token=randomBytes(32).toString('hex'),expires=d.expires_at;
   if(expires<=new Date().toISOString())throw Error('The invitation has expired; choose a future meeting.');
   const membership=must(await db.rpc('dydd_issue_circle_invitation',{campaign_key:campaign.id,actor_user:actor.userId,recipient:person.email.toLowerCase(),person_name:person.name,new_token_hash:tokenHash(token),expires:expires,invitation_url:appBase()+'/camp-circle/invitation?token='+token})) as any;
   if(!membership)continue;
   queued++;
  }
  return reply({queued,sandbox:process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT==='sandbox'});
 }
 if(b.action==='revoke'){
  const changed=must(await db.from('dydd_circle_memberships').update({status:'revoked'}).eq('id',b.membershipId).eq('circle_id',circle.id).select('id').maybeSingle());
  if(!changed)throw Error('This membership is not in your Circle.');
  must(await db.from('dydd_lifecycle_jobs').update({status:'cancelled',error_message:'Membership revoked before provider submission.'}).eq('circle_id',circle.id).eq('membership_id',b.membershipId).in('status',['queued','retry','sandbox_ready','processing']));return reply({revoked:true});
 }
 return reply({error:'Unknown Circle message action.'},400);
 }catch(e){return reply({error:(e as Error).message},409);}
}
