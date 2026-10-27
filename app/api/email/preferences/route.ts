import {NextResponse} from 'next/server';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {sameOrigin} from '@/lib/circles/server';
import {must,tokenHash} from '@/lib/lifecycle/store';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
export async function GET(){try{
 const user=(await (await createSupabaseServerClient()).auth.getUser()).data.user;if(!user?.email)return reply({error:'Sign in to manage email preferences.'},401);
 const db=createSupabaseAdminClient(),preferences=must(await db.from('dydd_email_preferences').select('learning,growth,optional_disabled,timezone').eq('email',user.email.toLowerCase()).maybeSingle())??{learning:false,growth:false,optional_disabled:false,timezone:'America/New_York'};
 const memberships=must(await db.from('dydd_circle_memberships').select('id,circle_id,display_name,reminders,status').eq('user_id',user.id).eq('status','accepted')) as any[];
 const owned=must(await db.from('journey_circle_plans').select('id,plan').eq('user_id',user.id).eq('status','active')) as any[];
 const ids=[...new Set([...memberships.map(m=>m.circle_id),...owned.map(c=>c.id)])];
 const circlePreferences=ids.length?must(await db.from('dydd_circle_email_preferences').select('circle_id,reminders').eq('email',user.email.toLowerCase()).in('circle_id',ids)) as any[]:[];
 const circles=ids.length?must(await db.from('journey_circle_plans').select('id,plan').in('id',ids)) as any[]:[];
 return reply({preferences,memberships:ids.map(id=>({id,circle_id:id,display_name:circles.find(c=>c.id===id)?.plan.name||'Your Circle',reminders:circlePreferences.find(c=>c.circle_id===id)?.reminders??memberships.find(m=>m.circle_id===id)?.reminders??true,creator:owned.some(c=>c.id===id)}))});
 }catch{return reply({error:'Preferences are temporarily unavailable.'},503);}}
export async function POST(request:Request){try{
 const token=new URL(request.url).searchParams.get('token'),db=createSupabaseAdminClient();
 if(token){
  if(!/^[a-f0-9]{64}$/.test(token))return reply({error:'This preference link is not valid.'},404);
  const found=must(await db.rpc('dydd_unsubscribe_category',{token_key:tokenHash(token)}));if(!found)return reply({error:'This preference link was not found.'},404);
  return reply({saved:true,message:'Your email preference has been saved. This link stays valid for future use.'});
 }
 if(!sameOrigin(request)||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Open preferences on this site.'},403);
 const user=(await (await createSupabaseServerClient()).auth.getUser()).data.user;if(!user?.email||!user.email_confirmed_at)return reply({error:'Sign in to manage preferences.'},401);
 const b=await request.json();
 if(b.action==='circle'){
  const owned=must(await db.from('journey_circle_plans').select('id').eq('id',b.circleId).eq('user_id',user.id).maybeSingle());
  const accepted=must(await db.from('dydd_circle_memberships').select('id').eq('circle_id',b.circleId).eq('user_id',user.id).eq('status','accepted').maybeSingle());
  if(!owned&&!accepted)return reply({error:'This Circle is not in your account.'},403);
  must(await db.from('dydd_circle_email_preferences').upsert({circle_id:b.circleId,email:user.email.toLowerCase(),reminders:b.reminders===true,updated_at:new Date().toISOString()},{onConflict:'circle_id,email'}));
  if(accepted)must(await db.from('dydd_circle_memberships').update({reminders:b.reminders===true}).eq('id',(accepted as any).id).eq('user_id',user.id));
  return reply({saved:true});
 }
 if(typeof b.timezone!=='string'||b.timezone.length>100)throw Error('Choose a valid timezone.');new Intl.DateTimeFormat('en-US',{timeZone:b.timezone});
 must(await db.from('dydd_email_preferences').upsert({email:user.email.toLowerCase(),user_id:user.id,learning:b.learning===true,growth:b.growth===true,optional_disabled:b.optional_disabled===true,timezone:b.timezone,updated_at:new Date().toISOString()},{onConflict:'email'}));
 if(b.optional_disabled===true)must(await db.from('dydd_waypoint_subscriptions').update({status:'unsubscribed'}).eq('email',user.email.toLowerCase()));
 return reply({saved:true});
 }catch{return reply({error:'Your preferences could not be saved. Please try again.'},503);}}
