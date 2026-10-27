import 'server-only';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { reportBucket } from '@/lib/assessments/report-storage';
import { previewReflectionData } from '@/lib/reflections/preview';
import type { ReviewSearchParams } from '@/lib/review/heather';
import { passportCurriculum, journeySlug, journeyChapterBadges, nicheRequiredPromptIds, lessonAvailable, courseCompleted } from './curriculum';
// Owner/demo walkthrough data stays separate from all authenticated learner records.
type PreviewState={completed:Record<string,string[]>;awards:string[]};
const path=(p:ReviewSearchParams)=>`preview-passport/${p.review}/checklist.json`;
async function load(p:ReviewSearchParams):Promise<PreviewState>{
 const r=await createSupabaseAdminClient().storage.from(reportBucket).download(path(p),{cacheNonce:randomUUID()},{cache:'no-store'});
 if(r.error){if(['404','400'].includes(String(r.error.statusCode)) && /not found/i.test(r.error.message))return {completed:{},awards:[]};throw Error('Could not load the preview checklist.');}
 return JSON.parse(await r.data.text());
}
export const previewPassportState=load;
export async function previewProgressRequest(request:Request,p:ReviewSearchParams){
 const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
 let leased=false;const bucket=createSupabaseAdminClient().storage.from(reportBucket),lock=path(p)+'.lock';
 try{
  if(request.method==='POST'){
   const lease=await bucket.upload(lock,Buffer.from('{}'),{contentType:'application/json',upsert:false});
   if(lease.error)return reply({error:'Another save is in progress. Try again.'},409);leased=true;
  }
  const state=await load(p),b=request.method==='POST'?await request.json():null;
  const slug=b?.courseSlug??new URL(request.url).searchParams.get('courseSlug')??'';
  const course=passportCurriculum.find(c=>c.slug===slug);if(!course)return reply({error:'Unknown course.'},400);
  const completed=state.completed[slug]??[];
  if(b){
   if(b.action==='complete-lesson'){
    if(!lessonAvailable(slug,b.lessonSlug,completed))return reply({error:'Complete the earlier lessons before moving forward.'},409);
    if(!completed.includes(b.lessonSlug))completed.push(b.lessonSlug);state.completed[slug]=completed;
    if(slug===journeySlug){for(const [module,key] of Object.entries(journeyChapterBadges))if(course.lessons.filter(l=>l.module===module).every(l=>completed.includes(l.slug)))state.awards.push(key);}
    else if(courseCompleted(slug,completed))state.awards.push(slug);
   }else if(b.action==='declare-niche' && slug===journeySlug){
    const reflections=await previewReflectionData(p,journeySlug),round=reflections.rounds[0];
    const latest=new Map<string,string>();for(const e of reflections.entries.filter(e=>e.round_id===round?.id).sort((a,b)=>b.revision-a.revision))if(!latest.has(e.question_id))latest.set(e.question_id,e.response);
    const missing=nicheRequiredPromptIds.filter(id=>!latest.get(id)?.trim());
    if(missing.length)return reply({error:'Save all required Pathfinder pieces and your working niche declaration before marking Niche Declared.',missing},409);
    state.awards.push('Niche Declared');
   }else return reply({error:'Unknown action.'},400);
   state.awards=[...new Set(state.awards)];
   const saved=await bucket.upload(path(p),Buffer.from(JSON.stringify(state)),{upsert:true,contentType:'application/json',cacheControl:'0'});
   if(saved.error)throw Error('Could not save your preview checklist. Try again.');
  }
  return reply({signedIn:true,preview:true,completed,awards:state.awards,legacyComplete:false,complete:courseCompleted(slug,completed)});
 }catch(e){return reply({error:(e as Error).message},503);}finally{if(leased)await bucket.remove([lock]);}
}
