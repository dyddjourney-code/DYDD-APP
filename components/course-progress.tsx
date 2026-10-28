'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useCourseProgress(courseSlug:string, slugs:string[]) {
 const [state,setState]=useState<{completed:string[];awards:string[];legacyComplete:boolean;complete:boolean;signedIn:boolean}|null>(null);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 const activeCourse=useRef(courseSlug);activeCourse.current=courseSlug;
 const request=useCallback(async(body?:Record<string,unknown>)=>{
  const params=new URLSearchParams(window.location.search);
  const query=new URLSearchParams({courseSlug});
  for(const key of ['review','key'])if(params.has(key))query.set(key,params.get(key)!);
  const response=await fetch('/api/course-progress?'+query,{cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({courseSlug,...body})}:{})});
  const data=await response.json();
  if(!response.ok)throw Error(data.error || 'Sign in to save your lesson checklist.');
  if(activeCourse.current===courseSlug){setState(current=>current?{...data,completed:[...new Set([...current.completed,...data.completed])],awards:[...new Set([...current.awards,...data.awards])]}:data);setError('');}return data;
 },[courseSlug]);
 useEffect(()=>{let current=true;setState(null);request().catch(e=>{if(current)setError(e.message);});return()=>{current=false};},[request]);
 const canVisit=(slug:string)=>Boolean(state && slugs.includes(slug) && (state.legacyComplete || state.completed.includes(slug) || slugs.slice(0,slugs.indexOf(slug)).every(s=>state.completed.includes(s))));
 const complete=async(slug:string)=>{
  if(busy || !state)return null;
  setBusy(true);try{return await request({action:'complete-lesson',lessonSlug:slug});}catch(e){setError((e as Error).message);return null;}finally{setBusy(false);}
 };
 const declareNiche=async()=>{
  if(busy || !state)return;
  setBusy(true);try{await request({action:'declare-niche'});}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 };
 return {state,error,busy,canVisit,complete,declareNiche,reload:()=>request().catch(e=>setError(e.message)),
  done:(slug:string)=>Boolean(state?.completed.includes(slug)),
  percent:state?Math.round(state.completed.filter(s=>slugs.includes(s)).length/slugs.length*100):0};
}
export type CourseProgress = ReturnType<typeof useCourseProgress>;
export function CourseCompletionControls({progress,lessonSlug,nextTitle,onNext,flush,completionHref}:{progress:CourseProgress;lessonSlug:string;nextTitle?:string;onNext?:()=>void;flush?:()=>Promise<boolean>;completionHref?:string}) {
 const done=progress.done(lessonSlug);
 return <div className="course-completion-controls">
  <label><input type="checkbox" checked={done} disabled={done || !progress.state || progress.busy || !progress.canVisit(lessonSlug)} onChange={async()=>{if(flush && !await flush())return;await progress.complete(lessonSlug);}} /> {done?'Lesson completed':'Mark this lesson complete'}</label>
  <button type="button" disabled={!progress.state || progress.busy || !progress.canVisit(lessonSlug)} onClick={async()=>{
   if(flush && !await flush())return;
   const saved=await progress.complete(lessonSlug);if(!saved)return;
   if(onNext)onNext();
  }}>{progress.busy?'Saving…':nextTitle?`Complete & Next: ${nextTitle}`:progress.state?.complete?'Course completed':'Complete Course'}</button>
  {!nextTitle && progress.state?.complete?<p role="status">{progress.state.legacyComplete ? "Your previous course completion is preserved; this checklist is available for review." : "All lessons complete. Your course milestone is saved."} {completionHref?<a href={completionHref}>Continue</a>:<a href="/hq#passport">View Passport</a>}</p>:null}
  {progress.error?<p role="alert">{progress.error} <button type="button" onClick={progress.reload}>Retry loading</button></p>:null}
  {!progress.state && !progress.error?<small>Loading your saved checklist…</small>:null}
 </div>;
}
export function NicheDeclarationCompletion({progress,flush}:{progress:CourseProgress;flush?:()=>Promise<boolean>}) {
 return <section className="niche-declaration-completion" aria-label="Niche Declared completion">
  <h4>Niche Declared</h4><p>Save all required Pathfinder pieces and your working niche declaration, then mark it complete. No grading or timer. You can edit your words later and keep your badge.</p>
  <button type="button" disabled={!progress.state || progress.busy || progress.state.awards.includes('Niche Declared')} onClick={async()=>{if(flush && !await flush())return;await progress.declareNiche();}}>{progress.state?.awards.includes('Niche Declared')?'Niche Declared — earned':'Mark Niche Declared complete'}</button>
  {progress.error?<p role="alert">{progress.error}</p>:null}
 </section>;
}
