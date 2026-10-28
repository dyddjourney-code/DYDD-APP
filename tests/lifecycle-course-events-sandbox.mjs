import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {createClient} from '@supabase/supabase-js';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),load=require('../scripts/fruitlife-test-load.cjs'),c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));assert.equal(c.ref,'atemrshtshxoqnuevvqu');process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),ok=r=>{assert(!r.error,r.error?.message);return r.data;},suffix=crypto.randomUUID(),email=`course-events-${suffix}@example.test`;let user;
const mocks={'server-only':{},'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},'@/lib/email/resend':{sendResendEmail:async()=>{throw Error('No provider calls allowed');}}};
const {passportCurriculum,journeySlug}=load('lib/passport/curriculum.ts',mocks),{processLifecycleEvents,lifecycleEligibility}=load('lib/lifecycle/worker.ts',mocks);
try{
 user=ok(await db.auth.admin.createUser({email,password:crypto.randomBytes(24).toString('hex'),email_confirm:true})).user;
 ok(await db.from('dydd_email_preferences').insert({email,user_id:user.id,learning:true,growth:true,timezone:'America/New_York'}));
 const lessons=passportCurriculum.find(c=>c.slug===journeySlug).lessons;
 // A partial course has no completion mail.
 ok(await db.from('passport_lesson_completions').insert({user_id:user.id,course_slug:journeySlug,lesson_slug:lessons[0].slug}));await processLifecycleEvents(500);
 assert.equal(ok(await db.from('dydd_lifecycle_jobs').select('id').eq('user_id',user.id).eq('template_id','C03')).length,0);
 ok(await db.from('passport_lesson_completions').insert(lessons.slice(1).map(l=>({user_id:user.id,course_slug:journeySlug,lesson_slug:l.slug}))));await processLifecycleEvents(500);await processLifecycleEvents(500);
 const jobs=ok(await db.from('dydd_lifecycle_jobs').select('*').eq('user_id',user.id));
 for(const template of ['C03','C04','C05','C06','G05'])assert.equal(jobs.filter(j=>j.template_id===template).length,1,template+' once');
 assert.equal(jobs.filter(j=>j.template_id==='C02').length,0,'Journey celebration replaces ordinary course celebration');
 const completion=jobs.find(j=>j.template_id==='C03'),fruit=jobs.find(j=>j.template_id==='C04'),design=jobs.find(j=>j.template_id==='C05'),practice=jobs.find(j=>j.template_id==='C06');
 assert.equal(Math.round((Date.parse(fruit.scheduled_at)-Date.parse(completion.scheduled_at))/86400000),5);
 assert.equal(Math.round((Date.parse(design.scheduled_at)-Date.parse(completion.scheduled_at))/86400000),14);
 assert.equal(Math.round((Date.parse(practice.scheduled_at)-Date.parse(completion.scheduled_at))/86400000),30);
 assert.match((await lifecycleEligibility(fruit)).stop,/No currently usable FruitLife access/);assert.match((await lifecycleEligibility(design)).stop,/DesignPD access is not available/);
 const inactive=jobs.find(j=>j.template_id==='A05');assert.match((await lifecycleEligibility(inactive)).stop,/already complete/);
 assert.match((await lifecycleEligibility(jobs.find(j=>j.template_id==='A04'))).stop,/already started/);
 console.log('PASS real lesson-completion DB triggers require full canonical course, Journey single celebration, durable once-only 5/14/30-day drip, missing paid-access suppression, completion stops inactivity help');
}finally{
 if(user)await db.auth.admin.deleteUser(user.id);await db.from('dydd_email_preferences').delete().eq('email',email);await db.from('dydd_email_preference_tokens').delete().eq('email',email);console.log('Synthetic sandbox course/checklist/event fixtures removed; no provider calls');
}
