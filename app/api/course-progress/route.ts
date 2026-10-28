import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAssessmentSnapshotsForUser } from '@/lib/assessments/student-context';
import { hasDesignPdCourseAccess } from '@/lib/designpd/access';
import { isDyddAdminEmail } from '@/lib/admin-access';
import { trailDefinitions } from '@/lib/trails/catalog';
import { passportCurriculum, journeySlug, nicheRequiredPromptIds, lessonAvailable, courseCompleted } from '@/lib/passport/curriculum';
import { readPassportState, syncPassportAwards, awardBadges, completedFruitSessionsForEmail } from '@/lib/passport/state';
import { savedAssessmentComplete, completedLegacyFruitSnapshot } from '@/lib/passport/evidence';
import { previewParams } from '@/lib/reflections/preview';
import { isSandbox } from '@/lib/environment';
import { previewProgressRequest } from '@/lib/passport/preview';

export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function actor(){const db=await createSupabaseServerClient();return (await db.auth.getUser()).data.user;}
function courseView(state:Awaited<ReturnType<typeof readPassportState>>,slug:string) {
 const canonical=new Set(passportCurriculum.find(c=>c.slug===slug)?.lessons.map(l=>l.slug)??[]);
 const completed=state.progress.filter(p=>p.course_slug===slug && canonical.has(p.lesson_slug)).map(p=>p.lesson_slug);
 const legacyComplete=state.legacyCourses.includes(slug) || slug===journeySlug && state.legacyJourney;
 return {completed,legacyComplete,complete:legacyComplete || courseCompleted(slug,completed),awards:state.awards.map(a=>a.badge_key)};
}
export async function GET(request:Request){
 const preview=previewParams(new URL(request.url));
 if(preview && isSandbox())return previewProgressRequest(request,preview);
 const user=await actor();if(!user)return reply({signedIn:false,completed:[],awards:[]},401);
 const slug=new URL(request.url).searchParams.get('courseSlug')??'';
 if(!passportCurriculum.some(c=>c.slug===slug))return reply({error:'Unknown course.'},400);
 try{return reply({signedIn:true,...courseView(await syncPassportAwards(user),slug)});}catch(e){return reply({error:(e as Error).message},503);}
}
export async function POST(request:Request){
 const origin=request.headers.get('origin');
 if(origin && origin!==new URL(request.url).origin)return reply({error:'Open your course on this site before saving.'},403);
 if(request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Cross-site request refused.'},403);
 const preview=previewParams(new URL(request.url));
 if(preview && isSandbox())return previewProgressRequest(request,preview);
 const user=await actor();if(!user)return reply({error:'Sign in to save your lesson checklist.'},401);
 const b=await request.json().catch(()=>null);
 if(!b || !passportCurriculum.some(c=>c.slug===b.courseSlug))return reply({error:'Unknown course.'},400);
 try {
  const state=await readPassportState(user),db=createSupabaseAdminClient();
  if(b.action==='declare-niche'){
   if(b.courseSlug!==journeySlug)return reply({error:'Open the Journey to complete your declaration.'},400);
   const round=await db.from('reflection_rounds').select('id').eq('user_id',user.id).eq('course_slug',journeySlug).order('started_at',{ascending:false}).order('id',{ascending:false}).limit(1).maybeSingle();
   if(round.error)throw Error('Your saved Pathfinder pieces could not be checked. Please try again.');
   const entries=round.data ? await db.from('reflection_entries').select('question_id,response,revision').eq('user_id',user.id).eq('round_id',round.data.id).in('question_id',nicheRequiredPromptIds).order('revision',{ascending:false}) : {data:[],error:null};
   if(entries.error)throw Error('Your saved Pathfinder pieces could not be checked. Please try again.');
   const latest=new Map<string,string>();for(const e of entries.data??[])if(!latest.has(e.question_id))latest.set(e.question_id,e.response);
   const missing=nicheRequiredPromptIds.filter(id=>!latest.get(id)?.trim());
   if(missing.length)return reply({error:'Save all required Pathfinder pieces and your working niche declaration before marking Niche Declared.',missing},409);
   await awardBadges(user.id,[{key:'Niche Declared',evidence:{roundId:round.data!.id,promptIds:nicheRequiredPromptIds,source:'explicit_declaration_completion'}}]);
  } else if(b.action==='complete-lesson'){
   const view=courseView(state,b.courseSlug);
   const exists=passportCurriculum.find(c=>c.slug===b.courseSlug)!.lessons.some(l=>l.slug===b.lessonSlug);
   if(!exists)return reply({error:'Unknown lesson.'},400);
   if(!view.legacyComplete && !lessonAvailable(b.courseSlug,b.lessonSlug,view.completed))return reply({error:'Complete the earlier lessons before moving forward.'},409);
   const trail=trailDefinitions.find(t=>t.courseSlug===b.courseSlug);
   if(trail){
    const snapshots=await getAssessmentSnapshotsForUser(user.id,user.email??'');
    let ready=snapshots.all.some(s=>s.assessment_type===trail.assessmentType && (savedAssessmentComplete(s,snapshots.all) || completedLegacyFruitSnapshot(s)));
    if(!ready && trail.id==='fruitlife-360' && user.email)ready=(await completedFruitSessionsForEmail(user.email,user.id)).length>0;
    // Keep the sandbox owner's already-approved universal teaching preview;
    // preview/access is never assessment evidence and cannot award a result.
    if(!(isSandbox() && isDyddAdminEmail(user.email)) && (!ready || trail.id==='designpd' && !hasDesignPdCourseAccess(user.email,snapshots.all)))return reply({error:'Complete this trail’s report before saving course progress.'},403);
   }
   const saved=await db.from('passport_lesson_completions').upsert({user_id:user.id,course_slug:b.courseSlug,lesson_slug:b.lessonSlug},{onConflict:'user_id,course_slug,lesson_slug',ignoreDuplicates:true});
   if(saved.error)throw Error('Your lesson could not be saved. Please try again.');
  } else return reply({error:'Unknown progress action.'},400);
  return reply({signedIn:true,...courseView(await syncPassportAwards(user),b.courseSlug)});
 }catch(e){return reply({error:(e as Error).message},503);}
}
