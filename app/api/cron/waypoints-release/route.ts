import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/email/resend';
export const runtime='nodejs';
export const maxDuration=300;
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function GET(request:NextRequest) {
 if(!process.env.CRON_SECRET || request.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({error:'Unauthorized'},{status:401});
 // Never claim/release jobs or advance tokens in the sandbox's disabled delivery environment.
 if(process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT==='sandbox') return NextResponse.json({skipped:true,message:'Sandbox outbound delivery is disabled.'});
 const db=createSupabaseAdminClient(),now=new Date().toISOString();
 const fail=()=>NextResponse.json({error:'Waypoint delivery storage unavailable.'},{status:503});
 const releases=await db.from('dydd_waypoint_releases').select('id,subscriber_channels,dydd_waypoints!inner(status)').eq('status','scheduled').eq('dydd_waypoints.status','published').lte('release_at',now);
 if(releases.error)return fail();
 const subs=await db.from('dydd_waypoint_subscriptions').select('id').eq('status','active');
 if(subs.error)return fail();
 const jobs=(releases.data??[]).flatMap(r=>(subs.data??[]).flatMap(s=>(r.subscriber_channels?.length?r.subscriber_channels:['email','app']).map((channel:string)=>({release_id:r.id,subscription_id:s.id,delivery_channel:channel}))));
 if(jobs.length){const q=await db.from('dydd_waypoint_delivery_jobs').upsert(jobs,{onConflict:'release_id,subscription_id,delivery_channel',ignoreDuplicates:true});if(q.error)return fail();}
 // Website release is independent of email acceptance; retries query durable jobs, including released content.
 if(releases.data?.length){const q=await db.from('dydd_waypoint_releases').update({status:'released',released_at:now}).in('id',releases.data.map(r=>r.id));if(q.error)return fail();}
 const claimed=await db.rpc('dydd_claim_waypoint_jobs',{batch_size:10});if(claimed.error)return fail();
 let accepted=0,errors=0,skipped=0;
 for(const job of claimed.data??[]) {
  const finish=async(status:string,message?:string)=>{
   const q=await db.from('dydd_waypoint_delivery_jobs').update({status,error_message:message??null,...(status==='sent'?{sent_at:new Date().toISOString()}:{}),next_attempt_at:new Date(Date.now()+Math.min(3600000,60000*2**job.attempts)).toISOString()}).eq('id',job.id).eq('status','processing').eq('attempts',job.attempts);
   return !q.error;
  };
  const s=await db.from('dydd_waypoint_subscriptions').select('id,email,status').eq('id',job.subscription_id).single();
  const r=await db.from('dydd_waypoint_releases').select('status,dydd_waypoints(*)').eq('id',job.release_id).single();
  if(s.error||r.error){if(!await finish('error','Unable to load delivery context.'))return fail();errors++;continue;}
  if(s.data.status!=='active'||!['scheduled','released'].includes(r.data.status)){if(!await finish('skipped','Subscription or release no longer eligible.'))return fail();skipped++;continue;}
  const w=(Array.isArray(r.data.dydd_waypoints)?r.data.dydd_waypoints[0]:r.data.dydd_waypoints) as Record<string,string|null>;
  if(!w||w.status!=='published'){if(!await finish('skipped','Content is no longer published.'))return fail();skipped++;continue;}
  const token=randomBytes(32).toString('hex');
  const tokenSaved=await db.from('dydd_waypoint_unsubscribe_tokens').upsert({job_id:job.id,subscription_id:job.subscription_id,token,token_hash:createHash('sha256').update(token).digest('hex')},{onConflict:'job_id',ignoreDuplicates:true});
  if(tokenSaved.error){if(!await finish('error','Unable to save unsubscribe link.'))return fail();errors++;continue;}
  const saved=await db.from('dydd_waypoint_unsubscribe_tokens').select('token').eq('job_id',job.id).single();
  if(saved.error||!saved.data.token){if(!await finish('error','Unable to load unsubscribe link.'))return fail();errors++;continue;}
  const base=(process.env.DYDD_APP_URL??'https://dydd-online-school.vercel.app').replace(/\/$/,'');
  const unsubscribe=`${base}/api/waypoints/unsubscribe?token=${saved.data.token}`;
  // Freeze the complete logical content before first attempt so retries cannot change provider payload.
  let content=job.metadata?.email_content;
  if(!content){
   content={subject:`DYDD Waypoint: ${w.title}`,to:s.data.email,from:process.env.DYDD_WAYPOINTS_EMAIL_FROM??process.env.DYDD_EMAIL_FROM??'reports@mail.discoverdivine.design',text:[w.title,w.scripture_reference,w.base_content,w.base_reflection_prompt,'You subscribed to DYDD Waypoints.',`Unsubscribe: ${unsubscribe}`].filter(Boolean).join('\n\n'),html:`<h1>${escape(w.title??'')}</h1><p>${escape(w.scripture_reference??'')}</p>${(w.base_content??'').split(/\n{2,}/).map(p=>`<p>${escape(p)}</p>`).join('')}<p>${escape(w.base_reflection_prompt??'')}</p><p>You subscribed to DYDD Waypoints. <a href="${unsubscribe}">Unsubscribe from Waypoints</a>.</p>`,headers:{'List-Unsubscribe':`<${unsubscribe}>`,'List-Unsubscribe-Post':'List-Unsubscribe=One-Click'}};
   const frozen=await db.from('dydd_waypoint_delivery_jobs').update({metadata:{...job.metadata,email_content:content}}).eq('id',job.id).eq('attempts',job.attempts);if(frozen.error)return fail();
  }
  const result=await sendResendEmail({...content,idempotencyKey:`dydd-waypoint-${job.id}`});
  if(result.sent){if(!await finish('sent'))return fail();accepted++;}
  else if(result.skipped){if(!await finish('skipped',result.message))return fail();skipped++;}
  else {if(!await finish('error',result.message))return fail();errors++;}
 }
 return NextResponse.json({acceptedEmails:accepted,erroredEmails:errors,skippedEmails:skipped,claimedJobs:claimed.data?.length??0});
}
