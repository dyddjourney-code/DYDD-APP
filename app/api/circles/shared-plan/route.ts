import {NextResponse} from 'next/server';
import {testBillingEnabled,validUuid} from '@/lib/commerce/test-billing-config';
import {operationActor} from '@/lib/circles/operations';
import {sameOrigin} from '@/lib/circles/server';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {validatePlan,updateCircleCalendar} from '@/lib/circles/plan';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function POST(request:Request){
 if(!testBillingEnabled())return reply({error:'Not found'},404);
 if(!sameOrigin(request)||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Open your shared Circle to save changes.'},403);
 try{
 const actor=await operationActor();if(!actor)return reply({error:'Sign in with your verified account.'},401);
 const raw=await request.text();if(raw.length>25000)return reply({error:'Shared plan details are too large.'},413);
 let body;try{body=JSON.parse(raw);}catch{return reply({error:'Check your shared plan details.'},400);}
 if(!validUuid(body.circleId)||!Number.isInteger(body.revision)||!body.patch||Array.isArray(body.patch)||typeof body.patch!=='object')return reply({error:'Choose a saved Couples plan.'},400);
 const allowed=new Set(['startDate','time','timezone','meetingMode','location','breaks','movedDates']);if(Object.keys(body.patch).some(k=>!allowed.has(k)))return reply({error:'Only shared dates, holidays and gathering details may change.'},400);
 const db=createSupabaseAdminClient(),saved=await db.from('journey_circle_plans').select('id,user_id,plan,status').eq('id',body.circleId).maybeSingle();if(saved.error)throw Error();
 if(!saved.data||saved.data.plan?.format!=='Couple')return reply({error:'Couples Circle not found.'},404);
 if(saved.data.user_id!==actor.userId){const m=await db.from('dydd_circle_memberships').select('id').eq('circle_id',body.circleId).eq('user_id',actor.userId).eq('status','accepted').maybeSingle();if(m.error)throw Error();if(!m.data)return reply({error:'Accepted spouse permission required.'},403);}
 const next=updateCircleCalendar(saved.data.plan,body.patch);
 const patch={...body.patch,...(next.finishDate!==saved.data.plan.finishDate?{finishDate:next.finishDate}:{})};
 const invalid=validatePlan(next,true);if(invalid)return reply({error:invalid},400);
 const result=await db.rpc('dydd_circle_save_shared_plan',{p_actor:actor.userId,p_circle:body.circleId,p_revision:body.revision,p_patch:patch});
 if(result.error)return reply({error:result.error.code==='P0001'?result.error.message:'Your shared plan could not be saved.'},409);
 return reply({circle:result.data});
 }catch{return reply({error:'Your shared plan could not be checked. Please retry.'},503);}
}
