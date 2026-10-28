import {NextResponse} from 'next/server';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {sameOrigin} from '@/lib/circles/server';
import {must,tokenHash,enqueueCampaignMembers} from '@/lib/lifecycle/store';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
export async function GET(request:Request){try{
 const token=new URL(request.url).searchParams.get('token')||'';if(!/^[a-f0-9]{64}$/.test(token))return reply({error:'This invitation link is not valid.'},404);
 const db=createSupabaseAdminClient(),m=must(await db.from('dydd_circle_memberships').select('id,circle_id,status,expires_at').eq('token_hash',tokenHash(token)).maybeSingle()) as any;
 if(!m || m.expires_at<=new Date().toISOString() || !['invited','accepted'].includes(m.status))return reply({error:'This invitation is no longer available. Ask your Circle leader for help.'},410);
 const c=must(await db.from('journey_circle_plans').select('plan,status').eq('id',m.circle_id).single()) as any;
 if(c.status!=='active')return reply({error:'This Circle is no longer accepting members.'},410);
 return reply({name:c.plan.name,startDate:c.plan.startDate,time:c.plan.time,timezone:c.plan.timezone,location:c.plan.location,status:m.status});
 }catch{return reply({error:'Your invitation could not be loaded.'},503);}}
export async function POST(request:Request){
 if(!sameOrigin(request)||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Open your invitation on this site.'},403);
 try{
 const b=await request.json(),s=await createSupabaseServerClient(),user=(await s.auth.getUser()).data.user;
 if(!user?.email || !user.email_confirmed_at)return reply({error:'Sign in with your verified invited email address to respond.'},401);
 if(!['accept','decline','leave','reminders'].includes(b.action))return reply({error:'Choose a valid membership action.'},400);
 const db=createSupabaseAdminClient();let q=db.from('dydd_circle_memberships').select('*').eq('email',user.email.toLowerCase());
 q=b.action==='leave'||b.action==='reminders'?q.eq('id',b.membershipId):q.eq('token_hash',tokenHash(String(b.token||'')));
 const m=must(await q.maybeSingle()) as any;if(!m)return reply({error:'This invitation belongs to a different email address or has expired.'},403);
 if(b.action==='leave'||b.action==='reminders'){
  if(m.status!=='accepted'||m.user_id!==user.id)return reply({error:'Membership not active.'},409);
  must(await db.from('dydd_circle_memberships').update(b.action==='leave'?{status:'left'}:{reminders:b.reminders===true}).eq('id',m.id).eq('user_id',user.id));return reply({saved:true});
 }
 if(m.status==='accepted'&&b.action==='accept')return reply({accepted:true});
 if(m.status!=='invited'||m.expires_at<=new Date().toISOString())return reply({error:'This invitation is no longer pending.'},410);
 const c=must(await db.from('journey_circle_plans').select('status').eq('id',m.circle_id).single()) as any;if(c.status!=='active')return reply({error:'This Circle has been archived.'},410);
 const updated=must(await db.from('dydd_circle_memberships').update({status:b.action==='accept'?'accepted':'declined',user_id:user.id,accepted_at:b.action==='accept'?new Date().toISOString():null,reminders:b.reminders!==false}).eq('id',m.id).eq('status','invited').eq('token_hash',m.token_hash).select('id').maybeSingle());
 if(!updated)return reply({error:'This invitation changed. Reload before responding.'},409);
 // The DB event is the durable retry source if this immediate materialization fails.
 if(b.action==='accept'){
  const campaigns=must(await db.from('dydd_circle_campaigns').select('id').eq('circle_id',m.circle_id).in('status',['finalized','paused'])) as any[];
  for(const campaign of campaigns)await enqueueCampaignMembers(campaign.id,m.id);
 }
 return reply({accepted:b.action==='accept',declined:b.action==='decline'});
 }catch(e){return reply({error:(e as Error).message},503);}
}
