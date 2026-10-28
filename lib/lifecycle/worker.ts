import 'server-only';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {sendResendEmail} from '@/lib/email/resend';
import {getAssessmentSnapshotsForUser} from '@/lib/assessments/student-context';
import {hasDesignPdCourseAccess} from '@/lib/designpd/access';
import {scheduledDates} from '@/lib/circles/plan';
import {passportCurriculum,courseCompleted,journeySlug} from '@/lib/passport/curriculum';
import {completedFruitSessionsForEmail} from '@/lib/passport/state';
import {completedLegacyFruitSnapshot,savedAssessmentComplete} from '@/lib/passport/evidence';
import {appBase,enqueue,enqueueCampaignMembers,must,tokenHash} from './store';
import {renderLifecycle,lifecycleHtml,localParts,localInstant,type LifecycleTemplate} from './templates';
const iso=(n:number)=>new Date(n).toISOString(),day=86400000;
async function userById(id:string){const r=await createSupabaseAdminClient().auth.admin.getUserById(id);if(r.error)throw Error('Verified account eligibility could not be loaded.');return r.data.user;}
async function profileUser(email:string){const r=await createSupabaseAdminClient().from('school_profiles').select('id,email').eq('email',email).maybeSingle();return must(r) as any;}
async function queueTemplate(id:LifecycleTemplate,key:string,user:any,when:number,expires:number,context:Record<string,unknown>={}){
 if(expires<=Date.now())return;
 const slug=String(context.courseSlug||journeySlug),course=passportCurriculum.find(c=>c.slug===slug),base=appBase();
 const copy=renderLifecycle(id,{base,course_title:course?.title||'your course',course_url:slug===journeySlug?base+'/journey':base+'/courses/'+slug});
 await enqueue({event_key:key,template_id:id,...copy,user_id:user.id,email:user.email,scheduled_at:iso(when),expires_at:iso(expires),context});
}
export async function processLifecycleEvents(limit=50){
 const db=createSupabaseAdminClient(),settings=must(await db.from('dydd_lifecycle_settings').select('*').eq('id',true).single()) as any;
 if(settings.paused)return {processed:0,errors:0,paused:true};
 const events=must(await db.from('dydd_lifecycle_events').select('*').is('processed_at',null).lt('attempts',8).order('occurred_at').limit(limit)) as any[];
 let processed=0,errors=0;
 for(const e of events)try{
  if(e.occurred_at<settings.activated_at){must(await db.from('dydd_lifecycle_events').update({processed_at:iso(Date.now()),error_message:'Historical event ignored; no backfill.'}).eq('id',e.id));continue;}
  const t=Date.parse(e.occurred_at),user=e.user_id?await userById(e.user_id):e.email?await profileUser(e.email):null;
  if(e.kind==='circle_accepted'){
   const cs=must(await db.from('dydd_circle_campaigns').select('id').eq('circle_id',e.payload.circleId).in('status',['finalized','paused'])) as any[];
   for(const c of cs)await enqueueCampaignMembers(c.id,e.source_id);
  } else if(e.kind==='circle_finalized'){
   await enqueueCampaignMembers(e.source_id);
   const campaign=must(await db.from('dydd_circle_campaigns').select('circle_id').eq('id',e.source_id).maybeSingle()) as any;
   const circle=campaign?must(await db.from('journey_circle_plans').select('user_id').eq('id',campaign.circle_id).maybeSingle()) as any:null;
   if(circle?.user_id){const leader=await userById(circle.user_id);if(leader?.email)must(await db.rpc('dydd_queue_circle_leader_messages',{campaign_key:e.source_id,creator_user:leader.id,creator_email:leader.email}));}
  } else if(e.kind==='fruitlife_self_completed'&&e.email){
   const base=appBase(),subject='FruitLife360: your next step',text=`Your self reflection is saved. Some observer reflections are still pending. Your report follows the cycle’s existing completion rules.\n\nReview your private tracker to see whether any action is useful: ${base}/hq\n\nYou can review invitations or send a thoughtful reminder without revealing confidential responses.`;
   const key='fruitlife-status-'+e.source_id;
   await enqueue({event_key:key,template_id:'B04-status',category:'service',email:e.email,subject,body:text,scheduled_at:iso(t+5*day),expires_at:iso(t+8*day),context:{kind:'application',deliveryContext:{type:'fruitlife_status',sessionId:e.source_id},senderInput:{to:e.email,subject,text,html:lifecycleHtml(subject,text),idempotencyKey:key},deliveryKey:key}});
  } else if(user?.id && user?.email){
   if(e.kind==='account_verified'){
    await queueTemplate('A03',`welcome:${user.id}`,user,t,t+2*day);
    await queueTemplate('A04',`start-help:${user.id}`,user,t+3*day,t+5*day,{courseSlug:journeySlug});
   } else if(e.kind==='course_enrolled'){
    await queueTemplate('C01',`course-ready:${user.id}:${e.payload.courseSlug}`,user,t,t+3*day,{courseSlug:e.payload.courseSlug});
   } else if(e.kind==='lesson_completed'){
    const slug=e.payload.courseSlug,progress=must(await db.from('passport_lesson_completions').select('lesson_slug,completed_at').eq('user_id',user.id).eq('course_slug',slug)) as any[];
    // A real new checklist event is required. Imported historical award rows do not trigger mail.
    if(courseCompleted(slug,progress.map(p=>p.lesson_slug))){
     const finished=Math.max(...progress.map(p=>Date.parse(p.completed_at)));
     await queueTemplate(slug===journeySlug?'C03':'C02',`course-completed:${user.id}:${slug}`,user,finished,finished+3*day,{courseSlug:slug,completedAt:iso(finished)});
     await queueTemplate('G05',`feedback:${user.id}`,user,finished+5*day,finished+8*day,{courseSlug:slug});
     if(slug===journeySlug){
      await queueTemplate('C04',`journey-fruitlife:${user.id}`,user,finished+5*day,finished+8*day,{courseSlug:slug});
      await queueTemplate('C05',`journey-designpd:${user.id}`,user,finished+14*day,finished+18*day,{courseSlug:slug});
      await queueTemplate('C06',`journey-practice:${user.id}`,user,finished+30*day,finished+33*day,{courseSlug:slug});
     }
    } else {
     // Exactly one inactivity invitation per course; not a repeating chase on each lesson.
     const earliest=Math.min(...progress.map(p=>Date.parse(p.completed_at)));
     await queueTemplate('A05',`course-inactivity:${user.id}:${slug}`,user,earliest+7*day,earliest+10*day,{courseSlug:slug});
     await queueTemplate('G04',`gentle-return:${user.id}`,user,earliest+35*day,earliest+40*day,{courseSlug:slug});
    }
   } else if(e.kind==='report_ready'){
    const type=e.payload.assessmentType,slug=type==='designid'?'designid-foundations':type==='designpd'?'designpd-alignment':type==='spiritual_gifts'?'spiritual-gifts-service':'fruitlife-360-formation';
    await queueTemplate('B05',`use-results:${e.source_id}`,user,t+3*day,t+6*day,{courseSlug:slug,snapshotId:e.source_id,assessmentType:type,fruitlifeSessionId:e.payload.fruitlifeSessionId||null});
   }
  }
  must(await db.from('dydd_lifecycle_events').update({processed_at:iso(Date.now()),error_message:null}).eq('id',e.id));processed++;
 }catch(err){errors++;must(await db.from('dydd_lifecycle_events').update({attempts:e.attempts+1,error_message:(err as Error).message.slice(0,250)}).eq('id',e.id));}
 return {processed,errors};
}
// Return a permanent stop, a temporary deferral, or permission. Storage errors throw (retry), never send.
export async function lifecycleEligibility(job:any,now=Date.now()):Promise<{stop?:string;deferUntil?:string;reason?:string}>{
 const db=createSupabaseAdminClient(),settings=must(await db.from('dydd_lifecycle_settings').select('*').eq('id',true).single()) as any;
 if(settings.paused)return {deferUntil:iso(now+3600000),reason:'All lifecycle communication is paused.'};
 if(Date.parse(job.expires_at)<=now)return {stop:'Message expired; no stale reminder or backlog send.'};
 const suppress=must(await db.from('dydd_email_suppressions').select('email').eq('email',job.email).maybeSingle());if(suppress)return {stop:'Delivery suppressed by bounce or complaint.'};
 const pref=must(await db.from('dydd_email_preferences').select('*').eq('email',job.email).maybeSingle()) as any;
 if(job.category!=='service'){
  if(settings.optional_paused)return {deferUntil:iso(now+3600000),reason:'Optional communication is paused.'};
  if(pref?.optional_disabled)return {stop:'Global optional-email preference is disabled.'};
  if(job.category==='learning'&&!pref?.learning)return {stop:'Learning email has not been opted into.'};
  if(job.category==='growth'&&!pref?.growth)return {stop:'Resources/feedback email has not been opted into.'};
 }
 if(job.context.kind==='application'){
  const context=job.context.deliveryContext||{},type=context.type;
  if(type==='waypoint_confirmation'){const confirmation=must(await db.from('dydd_waypoint_confirmations').select('email,expires_at,used_at').eq('id',context.confirmationId).maybeSingle()) as any;if(!confirmation||confirmation.email!==job.email||confirmation.used_at||confirmation.expires_at<=iso(now))return {stop:'Waypoint confirmation used, replaced or expired.'};}
  if(type==='account_service'){const account=await userById(context.userId);if(!account?.email_confirmed_at||account.email?.toLowerCase()!==job.email)return {stop:'Verified account or requested export recipient changed.'};}
  if(type==='fruitlife_self'||type==='fruitlife_observer'||type==='fruitlife_report'||type==='fruitlife_status'){
   const session=must(await db.from('fruitlife_360_sessions').select('*').eq('id',context.sessionId).maybeSingle()) as any;
   if(!session||['archived','cancelled'].includes(session.session_status))return {stop:'FruitLife session is no longer active.'};
   if(type==='fruitlife_status'){if(session.participant_email?.toLowerCase()!==job.email||!session.self_completed_at||session.observer_completed_count>=session.observer_goal||['ready','sent'].includes(session.report_status))return {stop:'No pending participant action remains.'};}
   else if(type==='fruitlife_self'){
    if(session.participant_email?.toLowerCase()!==job.email||session.self_completed_at)return {stop:'Self reflection complete or recipient changed.'};
   } else if(type==='fruitlife_observer'){
    if(['ready','sent'].includes(session.report_status))return {stop:'FruitLife cycle is complete.'};
    const invite=must(await db.from('fruitlife_360_observer_invites').select('*').eq('session_id',context.sessionId).eq('observer_email',job.email).maybeSingle()) as any;
    if(!invite||!['invited','draft','opened'].includes(invite.invite_status)||invite.completed_at)return {stop:'Observer already completed, declined or was removed.'};
    if(context.observerLink&&invite.metadata?.observerLink!==context.observerLink)return {stop:'Observer invitation link was replaced.'};
    if(invite.metadata?.expiresAt&&Date.parse(invite.metadata.expiresAt)<=now)return {stop:'Observer invitation expired.'};
   } else {
    if(session.participant_email?.toLowerCase()!==job.email)return {stop:'Report recipient changed.'};
    const artifact=must(await db.from('fruitlife_360_report_artifacts').select('id').eq('session_id',context.sessionId).eq('artifact_type','pdf').in('artifact_status',['ready','sent']).limit(1)) as any[];
    if(!artifact.length)return {stop:'The actual report artifact is not ready.'};
   }
  }
  return {};
 }
 let user:any=null;
 if(job.user_id){user=await userById(job.user_id);if(!user?.email_confirmed_at||user.email?.toLowerCase()!==job.email)return {stop:'Verified account or recipient email changed.'};}
 if(job.circle_id){
  if(job.category==='circle'){const circlePreference=must(await db.from('dydd_circle_email_preferences').select('reminders').eq('circle_id',job.circle_id).eq('email',job.email).maybeSingle()) as any;if(circlePreference?.reminders===false)return {stop:'Circle email preference is disabled.'};}
  const [cr,ca,dr]=await Promise.all([db.from('journey_circle_plans').select('*').eq('id',job.circle_id).single(),db.from('dydd_circle_campaigns').select('*').eq('id',job.campaign_id).single(),job.draft_id?db.from('dydd_circle_message_drafts').select('*').eq('id',job.draft_id).single():Promise.resolve({data:null,error:null})]);
  const circle=must(cr) as any,campaign=must(ca) as any,draft=must(dr) as any;
  const announcement=job.context.announcementId?must(await db.from('dydd_circle_announcements').select('status,approved_at,campaign_id').eq('id',job.context.announcementId).maybeSingle()) as any:null;
  if(draft?.excluded_at)return {stop:'Creator intentionally excluded this message.'};
  if(draft&&job.context.draftRevision!==undefined&&job.context.draftRevision!==draft.revision)return {stop:'Message revision changed; re-finalization required.'};
  const approved=announcement?announcement.status==='published'&&announcement.approved_at&&announcement.campaign_id===campaign.id:draft?.approved_at;
  if(circle.status!=='active'||campaign.status==='superseded'||circle.revision!==campaign.circle_revision)return {stop:'Circle archived or schedule revision replaced.'};
  if(campaign.status==='paused')return {deferUntil:iso(now+3600000),reason:'This Circle communication is paused.'};
  if(campaign.status!=='finalized'||!approved)return {stop:'Full current plan is not approved and finalized.'};
  if(job.context.kind==='leader'){
   if(circle.user_id!==job.user_id)return {stop:'Circle creator changed.'};
   if(job.template_id==='F03'){
    const members=must(await db.from('dydd_circle_memberships').select('email,status').eq('circle_id',job.circle_id)) as any[];
    const errors=must(await db.from('dydd_lifecycle_jobs').select('id').eq('circle_id',job.circle_id).in('status',['failed','review']).limit(1)) as any[];
    if(!errors.length&&circle.plan.participants.every((person:any)=>members.some(m=>m.email===person.email.toLowerCase()&&m.status==='accepted')))return {stop:'Circle setup is complete; no leader action notice needed.'};
   }
  }
  else {
   const m=must(await db.from('dydd_circle_memberships').select('*').eq('id',job.membership_id).single()) as any;
   if(!circle.plan.participants.some((p:any)=>p.email.toLowerCase()===job.email))return {stop:'Recipient removed from current Circle roster.'};
   if(job.context.kind==='invitation'){
    if(m.status!=='invited'||m.expires_at<=iso(now)||m.token_hash!==job.context.tokenHash)return {stop:'Invitation accepted, declined, revoked, replaced or expired.'};
   }else {
    if(m.status!=='accepted'||m.user_id!==job.user_id)return {stop:'Membership is not currently accepted.'};
    if(job.category==='circle'&&!m.reminders)return {stop:'Circle preparation/reminders are disabled.'};
    if(!user)return {stop:'Accepted membership needs a verified account.'};
    // Merge the same-day Journey celebration rather than sending two congratulations.
    if(job.template_id==='E04'){
     const completed=must(await db.from('dydd_lifecycle_jobs').select('id').eq('user_id',job.user_id).eq('template_id','C03').in('status',['queued','processing','retry','accepted','sandbox_ready']).gte('scheduled_at',iso(now-day)).lte('scheduled_at',iso(now+day)).limit(1)) as any[];
     if(completed.length)return {stop:'Combined with Journey-completed celebration.'};
    }
   }
  }
  return {};
 }
 if(!user)return {stop:'A verified recipient account is required for this lifecycle.'};
 const progress=must(await db.from('passport_lesson_completions').select('course_slug,lesson_slug,completed_at').eq('user_id',user.id)) as any[];
 const slug=job.context.courseSlug||journeySlug,courseProgress=progress.filter(p=>p.course_slug===slug),complete=courseCompleted(slug,courseProgress.map(p=>p.lesson_slug));
 const memberships=must(await db.from('dydd_circle_memberships').select('circle_id').eq('user_id',user.id).eq('status','accepted')) as any[];
 let activeCircle=false;
 if(memberships.length){const cs=must(await db.from('dydd_circle_campaigns').select('id,plan_snapshot').in('circle_id',memberships.map(m=>m.circle_id)).in('status',['finalized','paused'])) as any[];activeCircle=cs.some(c=>{const plan=c.plan_snapshot;const last=scheduledDates(plan).at(-1);return last && Date.parse(localInstant(last,plan.time||'12:00',plan.timezone))+day>now;});}
 if(['A04','A05','G04'].includes(job.template_id)){
  const rounds=must(await db.from('reflection_rounds').select('id,course_slug,started_at,updated_at').eq('user_id',user.id).order('updated_at',{ascending:false}).limit(100)) as any[];
  if(job.template_id==='A04'&&rounds.length)return {stop:'Learning already started.'};
  const days=job.template_id==='G04'?30:7,relevant=rounds.filter(r=>job.template_id==='G04'||r.course_slug===slug);
  if(job.template_id!=='A04'&&relevant.some(r=>Date.parse(r.updated_at||r.started_at)>now-days*day))return {stop:'Recent saved workbook activity; no inactivity invitation needed.'};
  if(job.template_id!=='A04'&&relevant.length){const recent=must(await db.from('reflection_entries').select('id').eq('user_id',user.id).in('round_id',relevant.map(r=>r.id)).gte('saved_at',iso(now-days*day)).limit(1)) as any[];if(recent.length)return {stop:'Recent saved reflection activity; no inactivity invitation needed.'};}
 }
 if(job.template_id==='A04'&&progress.length)return {stop:'Learning already started.'};
 if(['C01','B05'].includes(job.template_id)&&slug!==journeySlug){
  const snapshots=await getAssessmentSnapshotsForUser(user.id,user.email),assessmentType=slug==='designid-foundations'?'designid':slug==='spiritual-gifts-service'?'spiritual_gifts':slug==='designpd-alignment'?'designpd':'fruit_360';
  const ready=snapshots.all.some(s=>s.assessment_type===assessmentType&&(savedAssessmentComplete(s,snapshots.all)||completedLegacyFruitSnapshot(s)));
  const fruitReady=assessmentType==='fruit_360'&&(await completedFruitSessionsForEmail(user.email,user.id)).length>0;
  if(!ready&&!fruitReady)return {stop:'The matching assessment result/course access is no longer available.'};
  if(assessmentType==='designpd'&&!hasDesignPdCourseAccess(user.email,snapshots.all))return {stop:'DesignPD course access is no longer available.'};
  if(job.template_id==='B05'&&assessmentType!=='fruit_360'){
   const source=snapshots.all.find(s=>s.id===job.context.snapshotId),pdf=source?.scores.pdfMonkey as Record<string,unknown>|undefined;
   if(!source||!['ready','success'].includes(String(pdf?.status)))return {stop:'The triggering report is no longer ready.'};
  }
 }
 if(job.template_id==='C01'){
  const welcome=must(await db.from('dydd_lifecycle_jobs').select('id').eq('user_id',user.id).eq('template_id','A03').gte('scheduled_at',iso(now-2*day)).limit(1)) as any[];
  if(slug===journeySlug&&welcome.length)return {stop:'Account welcome already provides the same Journey start step.'};
 }
 if(job.template_id==='B05'){
  const welcome=must(await db.from('dydd_lifecycle_jobs').select('id,context').eq('user_id',user.id).eq('template_id','C01').in('status',['accepted','submitting','sandbox_ready']).gte('scheduled_at',iso(now-7*day))) as any[];
  if(welcome.some(w=>w.context.courseSlug===slug))return {stop:'Course welcome already supplied the same report-to-course next step.'};
 }
 if(job.template_id==='G04'){
  if(complete)return {stop:'Course is complete; no return invitation needed.'};
  if(progress.some(p=>Date.parse(p.completed_at)>now-30*day))return {stop:'Recent learning activity; no return invitation needed.'};
 }
 if(job.template_id==='A05'){
  if(complete)return {stop:'Course already complete.'};
  const latest=Math.max(...courseProgress.map(p=>Date.parse(p.completed_at)));
  if(latest>now-7*day)return {stop:'Recent course activity; no inactivity chase.'};
 }
 if(['C02','C03'].includes(job.template_id)&&!complete)return {stop:'Canonical course completion is no longer satisfied.'};
 if(['B05','C01'].includes(job.template_id)&&courseProgress.length)return {stop:'Relevant course already underway.'};
 if(['A04','A05','C01','C02','C06'].includes(job.template_id)&&activeCircle)return {stop:'Active Circle communication already supplies this next step.'};
 if(job.template_id==='C04'){
  if(activeCircle)return {stop:'Optional recommendation suppressed during active Circle.'};
  const snapshots=await getAssessmentSnapshotsForUser(user.id,user.email);
  if(snapshots.all.some(s=>s.assessment_type==='fruit_360'&&completedLegacyFruitSnapshot(s))||(await completedFruitSessionsForEmail(user.email,user.id)).length)return {stop:'FruitLife report already complete.'};
  const sessions=must(await db.from('fruitlife_360_sessions').select('session_status').eq('participant_email',job.email).not('session_status','in','(archived,cancelled)')) as any[];
  if(sessions.length)return {stop:'FruitLife already underway or complete.'};
  const entitlements=must(await db.from('fruitlife_360_entitlements').select('id').eq('user_id',user.id).eq('status','active').is('consumed_at',null).limit(1)) as any[];
  if(!entitlements.length)return {stop:'No currently usable FruitLife access; no purchase recommendation sent.'};
 }
 if(job.template_id==='C05'){
  if(activeCircle)return {stop:'Optional recommendation suppressed during active Circle.'};
  const snapshots=await getAssessmentSnapshotsForUser(user.id,user.email);
  if(!hasDesignPdCourseAccess(user.email,snapshots.all))return {stop:'DesignPD access is not available; no unavailable checkout invitation.'};
  if(progress.some(p=>p.course_slug==='designpd-alignment'))return {stop:'DesignPD learning already underway or complete.'};
  const sessions=must(await db.from('fruitlife_360_sessions').select('id').eq('participant_email',job.email).in('session_status',['waiting_for_self','waiting_for_observers','ready_for_report'])) as any[];
  if(sessions.length)return {stop:'FruitLife still needs attention; do not add another recommendation.'};
  const recent=must(await db.from('dydd_lifecycle_jobs').select('id').eq('user_id',user.id).eq('template_id','C04').in('status',['accepted','sandbox_ready']).gte('scheduled_at',iso(now-7*day)).limit(1)) as any[];
  if(recent.length)return {deferUntil:iso(now+day),reason:'Keep at least seven days between next-step recommendations.'};
 }
 if(job.template_id==='C06'){
  const waypoint=must(await db.from('dydd_waypoint_subscriptions').select('id').eq('email',job.email).eq('status','active').limit(1)) as any[];if(waypoint.length)return {stop:'Waypoints already provides ongoing encouragement.'};
 }
 if(job.category==='growth'&&activeCircle)return {stop:'Optional growth email suppressed during active Circle.'};
 if(job.category==='learning'||job.category==='growth'){
  const recent=must(await db.from('dydd_lifecycle_jobs').select('id,status,accepted_at,scheduled_at').eq('email',job.email).in('category',['learning','growth']).in('status',['accepted','sandbox_ready','processing']).neq('id',job.id).gte('scheduled_at',iso(now-7*day))) as any[];
  const preceding=recent.filter(j=>j.status!=='processing'||j.scheduled_at<job.scheduled_at||j.scheduled_at===job.scheduled_at&&j.id<job.id);
  if(preceding.length>=3||preceding.some(j=>Date.parse(j.accepted_at||j.scheduled_at)>now-day))return {deferUntil:iso(now+day),reason:'Shared cadence: at most one optional learning/growth email per day and three per week.'};
  const timezone=pref?.timezone||'America/New_York',p=localParts(new Date(now),timezone),hour=Number(p.hour);
  if(hour<8||hour>=20){let date=`${p.year}-${p.month}-${p.day}`;if(hour>=20){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);date=d.toISOString().slice(0,10);}return {deferUntil:localInstant(date,'09:00',timezone),reason:'Wait for daytime in recipient timezone (fallback America/New_York).'};}
 }
 return {};
}
export async function runLifecycleWorker({limit=10}:{limit?:number}={}){
 if(process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT!=='sandbox' && process.env.DYDD_LIFECYCLE_AUTOMATION_ENABLED!=='true') return {paused:true,reason:'Automatic lifecycle campaigns are disabled for the public beta.'};
 const events=await processLifecycleEvents(),db=createSupabaseAdminClient();
 const claimed=must(await db.rpc('dydd_claim_lifecycle_jobs',{batch_size:limit})) as any[];
 let accepted=0,sandboxReady=0,skipped=0,retries=0,deferred=0;
 for(const j of claimed){
  async function finish(patch:Record<string,unknown>){const updated=must(await db.from('dydd_lifecycle_jobs').update(patch).eq('id',j.id).in('status',['processing','submitting']).eq('claim_token',j.claim_token).select('id'));
   return Boolean(updated?.length);}
  try{
   const eligibility=await lifecycleEligibility(j);
   if(eligibility.stop){await finish({status:'skipped',error_message:eligibility.stop});skipped++;continue;}
   if(eligibility.deferUntil){await finish({status:'queued',next_attempt_at:eligibility.deferUntil,error_message:eligibility.reason,attempts:j.attempts-1,first_attempt_at:j.attempts===1?null:j.first_attempt_at});deferred++;continue;}
   // Persist issued preference tokens once; all earlier email links remain valid indefinitely.
   const optional=j.category!=='service',unsubscribe=appBase()+'/email-preferences?token='+j.unsubscribe_token,oneClick=appBase()+'/api/email/preferences?token='+j.unsubscribe_token;
   const globalToken=tokenHash(j.unsubscribe_token+':all');
   if(optional)must(await db.from('dydd_email_preference_tokens').upsert([{token_hash:tokenHash(j.unsubscribe_token),email:j.email,category:j.category,circle_id:j.circle_id},{token_hash:tokenHash(globalToken),email:j.email,category:'all'}],{onConflict:'token_hash',ignoreDuplicates:true}));
   const fence=must(await db.rpc('dydd_authorize_lifecycle_send',{job_key:j.id,lease_token:j.claim_token})) as any;
   if(!fence.authorized){
    if(fence.lostClaim)continue;
    if(fence.defer){await finish({status:'queued',next_attempt_at:iso(Date.now()+3600000),error_message:fence.reason,attempts:j.attempts-1,first_attempt_at:j.attempts===1?null:j.first_attempt_at});deferred++;}
    else {await finish({status:'skipped',error_message:fence.stop});skipped++;}
    continue;
   }
   if(process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT==='sandbox'){
    await finish({status:'sandbox_ready',error_message:'Eligibility verified; sandbox delivery guard prevented provider request.'});sandboxReady++;continue;
   }
   const text=j.body+(optional?`\n\nEmail preferences / unsubscribe from this category: ${unsubscribe}\nStop all optional email: ${appBase()}/email-preferences?token=${globalToken}`:''),html=lifecycleHtml(j.subject,text);
   const result=j.context.kind==='application'?await sendResendEmail(j.context.senderInput):await sendResendEmail({to:j.email,subject:j.subject,text,html,idempotencyKey:'dydd-lifecycle-'+j.id,...(optional?{headers:{'List-Unsubscribe':`<${oneClick}>`,'List-Unsubscribe-Post':'List-Unsubscribe=One-Click'}}:{})});
   if(result.sent){if(await finish({status:'accepted',provider_id:result.id,accepted_at:iso(Date.now()),error_message:null}))accepted++;}
   else if(result.skipped){await finish({status:'skipped',error_message:result.message});skipped++;}
   else {const permanent=/Provider HTTP (400|401|403|404|413|422)\b/.test(result.message||'');await finish({status:permanent?'failed':'retry',error_message:result.message,next_attempt_at:iso(Date.now()+Math.min(3600000,60000*2**j.attempts))});retries++;}
  }catch(e){await finish({status:'retry',error_message:(e as Error).message.slice(0,250),next_attempt_at:iso(Date.now()+Math.min(3600000,60000*2**j.attempts))});retries++;}
 }
 return {events,claimed:claimed.length,accepted,sandboxReady,skipped,retries,deferred,sandbox:process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT==='sandbox'};
}
