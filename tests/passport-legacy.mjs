// Retained historical rows must remain usable without inventing new completion.
import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {createClient} from '@supabase/supabase-js';import {createServerClient} from '@supabase/ssr';import load from '../scripts/fruitlife-test-load.cjs';
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));assert.equal(c.ref,'atemrshtshxoqnuevvqu');
const base=process.env.PASSPORT_TEST_BASE||'http://127.0.0.1:3137';assert(['http://127.0.0.1:3137','https://dydd-online-school-sandbox.vercel.app'].includes(base));
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),check=r=>{assert(!r.error,r.error?.message);return r.data;};
let userId,courseId;const snaps=[];const course=load('lib/passport/curriculum.ts').passportCurriculum.find(c=>c.slug==='designid-foundations');
try{
 const email='passport-legacy-'+crypto.randomUUID()+'@example.invalid',password=crypto.randomBytes(20).toString('hex');userId=check(await db.auth.admin.createUser({email,password,email_confirm:true})).user.id;
 let cookies=[];const client=createServerClient(c.project_url,c.anon_key,{cookies:{getAll:()=>cookies,setAll:c=>cookies=c}});check(await client.auth.signInWithPassword({email,password}));const cookie=cookies.map(c=>c.name+'='+c.value).join('; ');
 const state=async()=>{const r=await fetch(base+'/api/course-progress?courseSlug='+course.slug,{headers:{cookie}});const b=await r.json();assert.equal(r.status,200,JSON.stringify(b));return b;};
 // Never modify an existing canonical course record: this test owns only rows
 // inserted here, and skips its course fixture if a real course already exists.
 const existing=check(await db.from('courses').select('id').eq('slug',course.slug).maybeSingle());
 if(!existing){
  courseId=check(await db.from('courses').insert({slug:course.slug,title:'Isolated legacy Passport fixture'}).select('id').single()).id;
  const lessons=check(await db.from('lessons').insert(course.lessons.slice(0,2).map((l,i)=>({course_id:courseId,slug:l.slug,title:l.title,position:i+1}))).select('id,slug'));
  const first=lessons.find(l=>l.slug===course.lessons[0].slug),second=lessons.find(l=>l.slug===course.lessons[1].slug);
  check(await db.from('lesson_progress').insert([{user_id:userId,lesson_id:first.id,completed_at:'2026-01-01T00:00:00Z',last_seen_at:'2026-01-01T00:00:00Z'},{user_id:userId,lesson_id:second.id,completed_at:null,last_seen_at:'2026-01-02T00:00:00Z'}]));
  let s=await state();assert.deepEqual(s.completed,[]);
  // Simulate the trusted one-time migration baseline; live legacy rows alone
  // can no longer self-assert completion after that baseline.
  check(await db.from('passport_lesson_completions').insert({user_id:userId,course_slug:course.slug,lesson_slug:course.lessons[0].slug,completed_at:'2026-01-01T00:00:00Z'}));
  s=await state();assert.deepEqual(s.completed,[course.lessons[0].slug]);assert(!s.awards.includes(course.slug));assert.equal(s.complete,false);
  check(await db.from('enrollments').insert({user_id:userId,course_id:courseId,status:'completed',source:'passport_isolated_legacy_qa'}));
  s=await state();assert(!s.complete && !s.legacyComplete && !s.awards.includes(course.slug));
  check(await db.from('passport_awards').insert({user_id:userId,badge_key:course.slug,evidence:{source:'legacy_completed_enrollment',course:course.slug}}));
  s=await state();assert(s.complete && s.legacyComplete && s.awards.includes(course.slug));assert.equal(s.completed.length,1);assert(!s.awards.includes('designid'));
  console.log('PASS trusted original completion baseline preserved; new learner-writable legacy rows cannot forge progress/awards; completed legacy enrollment keeps course badge without fabricated checklist/results');
 }
 check(await db.from('journey_enrollments').insert({user_id:userId,journey_slug:'discover-your-divine-design',status:'completed',completed_at:'2026-01-01T00:00:00Z'}));
 assert(!(await state()).awards.includes('Identity'));
 check(await db.from('passport_awards').insert(['DYD Journey Started','What is DYDD?','Identity','Expertise','Story','Desire','Gifts','Niche'].map(badge_key=>({user_id:userId,badge_key,evidence:{source:'legacy_completed_enrollment',course:'discover-your-divine-design'}}))));
 const legacy=await state();for(const name of ['Identity','Expertise','Story','Desire','Gifts','Niche'])assert(legacy.awards.includes(name));assert(!legacy.awards.includes('Niche Declared'));
 const add=async(type,scores,source)=>{const s=check(await db.from('assessment_snapshots').insert({user_id:userId,assessment_type:type,source,scores,source_submitted_at:new Date().toISOString()}).select('id').single());snaps.push(s.id);};
 const full={summary:{Report_Mode:'FULL_360',Report_Date:'2025-01-01'},scores:{Observer_Count:3,Response_Count:4}};
 await add('fruit_360',full,'fruitlife_360_native_app');assert(!(await state()).awards.includes('fruit_360'));
 await add('fruit_360',{...full,scores:{...full.scores,Observer_Goal:5}},'passport_isolated_legacy_qa');assert(!(await state()).awards.includes('fruit_360'));
 await add('fruit_360',full,'passport_isolated_legacy_qa');assert((await state()).awards.includes('fruit_360'));
 for(const name of ['Artisan','Steward'])await add('designid',{summary:{Primary:name,Secondary:'Architect'},scores:{Artisan_Pts:40,Steward_Pts:40,Architect_Pts:10,Shepherd_Pts:10,Total_Pts:100}},'passport_isolated_legacy_qa');
 const earned=await state();assert(earned.awards.includes('Artisan') && earned.awards.includes('Steward'));
 console.log('PASS existing completed Journey retains chapters without Niche Declared; legacy full360 retained but native/no-session and missing-required-observer negatives; primary retake award history retained');
}finally{
 if(snaps.length)check(await db.from('assessment_snapshots').delete().in('id',snaps));if(userId)check(await db.auth.admin.deleteUser(userId));if(courseId)check(await db.from('courses').delete().eq('id',courseId));
 console.log('Isolated legacy fixture records cleaned up.');
}
