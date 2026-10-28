import {NextResponse} from 'next/server';
import {supportAdmin} from '@/lib/support/auth';
import {sameOrigin} from '@/lib/circles/server';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {must} from '@/lib/lifecycle/store';
export const dynamic='force-dynamic';
const reply=(b:unknown,status=200)=>NextResponse.json(b,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(){if(!await supportAdmin())return reply({error:'Administrator sign-in required.'},403);try{
 const db=createSupabaseAdminClient(),[sr,jr,er]=await Promise.all([db.from('dydd_lifecycle_settings').select('*').eq('id',true).single(),db.from('dydd_lifecycle_jobs').select('id,event_key,template_id,category,email,subject,status,scheduled_at,expires_at,attempts,provider_id,accepted_at,error_message').order('created_at',{ascending:false}).limit(200),db.from('dydd_lifecycle_events').select('id,kind,occurred_at,processed_at,attempts,error_message').is('processed_at',null).order('occurred_at').limit(50)]);
 const settings=must(sr),jobs=must(jr) as any[],events=must(er);
 const providerIds=jobs.filter(j=>j.provider_id).map(j=>j.provider_id),delivery=providerIds.length?must(await db.from('dydd_email_messages').select('provider_id,status,last_event_at,error_message').in('provider_id',providerIds)) as any[]:[];
 return reply({settings,jobs:jobs.map(j=>({...j,delivery:delivery.find(d=>d.provider_id===j.provider_id)||null})),events,sandbox:process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT==='sandbox'});
 }catch{return reply({error:'Email activity could not be loaded.'},503);}}
export async function POST(request:Request){if(!sameOrigin(request)||!await supportAdmin())return reply({error:'Administrator sign-in required.'},403);try{
 const b=await request.json();if(typeof b.paused!=='boolean'||typeof b.optional_paused!=='boolean')return reply({error:'Choose a valid pause setting.'},400);
 must(await createSupabaseAdminClient().from('dydd_lifecycle_settings').update({paused:b.paused,optional_paused:b.optional_paused}).eq('id',true));return reply({saved:true});
 }catch{return reply({error:'Pause settings could not be saved.'},503);}}
