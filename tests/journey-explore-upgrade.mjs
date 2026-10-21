import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import load from '../scripts/fruitlife-test-load.cjs';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(cfg.ref,'atemrshtshxoqnuevvqu');
const base=process.env.JOURNEY_TEST_BASE||'http://localhost:3124';
assert(base==='https://dydd-online-school-sandbox.vercel.app'||base.startsWith('http://localhost:'));
const admin=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}});
const courseSlug='discover-your-divine-design',catalog=load('lib/reflections/catalog.ts'),questions=catalog.getReflectionExperience(courseSlug).questions;
const legacy=questions.filter(q=>q.id!=='whose-tomorrow');
assert.equal(catalog.withWhoWhoseExplore(courseSlug,questions),questions);
assert.deepEqual(catalog.withWhoWhoseExplore(courseSlug,legacy).filter(q=>q.id!=='whose-tomorrow'),legacy);
let userId;
try{
 const email=`explore-upgrade-${crypto.randomUUID()}@example.invalid`;
 const made=await admin.auth.admin.createUser({email,password:crypto.randomBytes(24).toString('base64url'),email_confirm:true});assert(!made.error,made.error?.message);userId=made.data.user.id;
 const archived=crypto.randomUUID(),active=crypto.randomUUID();
 const seeded=await admin.from('reflection_rounds').insert([{id:archived,user_id:userId,course_slug:courseSlug,questions:legacy,started_at:'2026-10-19T12:00:00Z'},{id:active,user_id:userId,course_slug:courseSlug,questions:legacy,started_at:'2026-10-20T12:00:00Z'}]);assert(!seeded.error,seeded.error?.message);
 const link=await admin.auth.admin.generateLink({type:'magiclink',email});assert(!link.error,link.error?.message);
 const login=await fetch(base+'/auth/confirm',{method:'POST',body:new URLSearchParams({token_hash:link.data.properties.hashed_token,next:'/journey'}),redirect:'manual'});assert.equal(login.status,307);
 const cookie=login.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
 const post=async b=>fetch(base+'/api/course-reflections',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({courseSlug,...b})});
 const oldAnswers=[];
 for(const questionId of ['child-of-god-response','old-label-truth','whose-before-who']){const r=await post({action:'save',roundId:active,questionId,response:'Preserved '+questionId,expectedRevision:0});assert.equal(r.status,200);const {user_id,...entry}=(await r.json()).entry;oldAnswers.push(entry);}
 const opened=await fetch(base+'/api/course-reflections?courseSlug='+courseSlug,{headers:{Cookie:cookie}}).then(r=>r.json());
 assert(opened.rounds,opened.error);
 assert(opened.rounds[0].questions.some(q=>q.id==='whose-tomorrow'));
 assert(!opened.rounds[1].questions.some(q=>q.id==='whose-tomorrow'));
 for(const entry of oldAnswers)assert.deepEqual(opened.entries.find(e=>e.id===entry.id),entry);
 const response='Explore from a pre-existing workbook '+crypto.randomUUID();
 const saved=await post({action:'save',roundId:active,questionId:'whose-tomorrow',response,expectedRevision:0});assert.equal(saved.status,200);
 const exported=await fetch(base+`/api/course-reflections/export?scope=round&courseSlug=${courseSlug}&round=${active}`,{headers:{Cookie:cookie}});assert.equal(exported.status,200);const text=await exported.text();assert(text.includes(response));for(const entry of oldAnswers)assert(text.includes(entry.response));
 const stored=await admin.from('reflection_rounds').select('id,questions').eq('user_id',userId);assert(!stored.error);assert(stored.data.find(r=>r.id===active).questions.some(q=>q.id==='whose-tomorrow'));assert.deepEqual(stored.data.find(r=>r.id===archived).questions,legacy);
 console.log('PASS legacy current round gains Explore; three existing answers/revisions unchanged; archived snapshot unchanged; actual Explore save/export works');
}finally{if(userId){const removed=await admin.auth.admin.deleteUser(userId);assert(!removed.error,removed.error?.message);console.log('Synthetic upgrade account removed');}}
