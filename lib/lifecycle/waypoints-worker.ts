import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import {getSavedWaypointPrimary} from '@/lib/waypoints/user-context';
import {appBase,must} from '@/lib/lifecycle/store';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/email/resend';
export async function runWaypointsWorker(){
 const db=createSupabaseAdminClient(),now=new Date().toISOString(),sandbox=process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT==='sandbox';
 const settings=must(await db.from('dydd_lifecycle_settings').select('*').eq('id',true).single()) as any;
 if(settings.paused||settings.optional_paused)return NextResponse.json({paused:true,skipped:true,sandbox});
 const fail=()=>NextResponse.json({error:'Waypoint delivery storage unavailable.'},{status:503});
 const releases=await db.from('dydd_waypoint_releases').select('id,subscriber_channels,dydd_waypoints!inner(status)').eq('status','scheduled').eq('dydd_waypoints.status','published').gte('release_at',settings.activated_at).gte('release_at',new Date(Date.now()-48*3600000).toISOString()).lte('release_at',now);
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
  const s=await db.from('dydd_waypoint_subscriptions').select('id,email,status,user_id,confirmed_at').eq('id',job.subscription_id).single();
  const r=await db.from('dydd_waypoint_releases').select('status,release_at,dydd_waypoints(*)').eq('id',job.release_id).single();
  if(s.error||r.error){if(!await finish('error','Unable to load delivery context.'))return fail();errors++;continue;}
  const preferences=await db.from('dydd_email_preferences').select('optional_disabled').eq('email',s.data.email).maybeSingle();
  if(preferences.error){if(!await finish('error','Unable to check global optional-email preference.'))return fail();errors++;continue;}
  if(preferences.data?.optional_disabled){if(!await finish('skipped','All optional email is disabled.'))return fail();skipped++;continue;}
  if(s.data.confirmed_at&&s.data.confirmed_at>r.data.release_at){if(!await finish('skipped','Subscribed after release; next future release will be sent.'))return fail();skipped++;continue;}
  if(s.data.status!=='active'||!['scheduled','released'].includes(r.data.status)){if(!await finish('skipped','Subscription or release no longer eligible.'))return fail();skipped++;continue;}
  const w=(Array.isArray(r.data.dydd_waypoints)?r.data.dydd_waypoints[0]:r.data.dydd_waypoints) as Record<string,string|null>;
  if(Date.now()-Date.parse(r.data.release_at)>48*3600000){if(!await finish('skipped','Weekly release expired; no historical backfill.'))return fail();skipped++;continue;}
  if(!w||w.status!=='published'){if(!await finish('skipped','Content is no longer published.'))return fail();skipped++;continue;}
  const token=randomBytes(32).toString('hex');
  const tokenSaved=await db.from('dydd_waypoint_unsubscribe_tokens').upsert({job_id:job.id,subscription_id:job.subscription_id,token,token_hash:createHash('sha256').update(token).digest('hex')},{onConflict:'job_id',ignoreDuplicates:true});
  if(tokenSaved.error){if(!await finish('error','Unable to save unsubscribe link.'))return fail();errors++;continue;}
  const saved=await db.from('dydd_waypoint_unsubscribe_tokens').select('token').eq('job_id',job.id).single();
  if(saved.error||!saved.data.token){if(!await finish('error','Unable to load unsubscribe link.'))return fail();errors++;continue;}
  const base=appBase();
  const unsubscribe=`${base}/api/waypoints/unsubscribe?token=${saved.data.token}`;
  // Freeze the complete logical content before first attempt so retries cannot change provider payload.
  let content=job.metadata?.email_content;
  if(!content){
   const metadata=w.metadata as unknown as Record<string,any>|null;
   let primary='';
   if(s.data.user_id){const account=await db.auth.admin.getUserById(s.data.user_id);if(account.error){if(!await finish('error','Unable to verify devotional personalization identity.'))return fail();errors++;continue;}if(account.data.user?.email_confirmed_at&&account.data.user.email?.toLowerCase()===s.data.email)primary=await getSavedWaypointPrimary(s.data.user_id,s.data.email);}
   const reflection=metadata?.reflections?.[primary]||w.base_reflection_prompt||'',read=`${base}/waypoints`;
   const paragraphs=[w.title,w.scripture_reference,metadata?.scripture_text,metadata?.scripture_attribution,w.base_content,reflection,`Read this Waypoint: ${read}`,'You subscribed to DYDD Waypoints.',`Unsubscribe: ${unsubscribe}`].filter(Boolean);
   content={subject:`DYDD Waypoint: ${w.title}`,to:s.data.email,from:process.env.DYDD_WAYPOINTS_EMAIL_FROM??process.env.DYDD_EMAIL_FROM??'reports@mail.discoverdivine.design',text:paragraphs.join('\n\n'),html:`<h1>${escape(w.title??'')}</h1>${paragraphs.slice(1,-1).map(p=>`<p style="white-space:pre-wrap">${escape(String(p))}</p>`).join('')}<p><a href="${read}">Read this Waypoint</a> · <a href="${unsubscribe}">Unsubscribe from Waypoints</a>.</p>`,headers:{'List-Unsubscribe':`<${unsubscribe}>`,'List-Unsubscribe-Post':'List-Unsubscribe=One-Click'}};
   const frozen=await db.from('dydd_waypoint_delivery_jobs').update({metadata:{...job.metadata,email_content:content}}).eq('id',job.id).eq('attempts',job.attempts);if(frozen.error)return fail();
  }
  if(sandbox){if(!await finish('sandbox_ready','Eligibility verified; sandbox prevented provider request.'))return fail();skipped++;continue;}
  const result=await sendResendEmail({...content,idempotencyKey:`dydd-waypoint-${job.id}`});
  if(result.sent){if(!await finish('sent'))return fail();accepted++;}
  else if(result.skipped){if(!await finish('skipped',result.message))return fail();skipped++;}
  else {if(!await finish('error',result.message))return fail();errors++;}
 }
 return NextResponse.json({sandbox,skipped:sandbox,acceptedEmails:accepted,erroredEmails:errors,skippedEmails:skipped,claimedJobs:claimed.data?.length??0});
}
