import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {createClient} from '@supabase/supabase-js';
const require=createRequire(import.meta.url),load=require('../scripts/fruitlife-test-load.cjs'),c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));assert.equal(c.ref,'atemrshtshxoqnuevvqu');
process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';delete process.env.DYDD_SANDBOX_EMAIL_ENABLED;
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),ok=r=>{assert(!r.error,r.error?.message);return r.data;};
const {processLifecycleEvents,lifecycleEligibility}=load('lib/lifecycle/worker.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},'@/lib/email/resend':{sendResendEmail:()=>{throw Error('No provider call permitted');}}});
const email='workbook-start-'+crypto.randomUUID()+'@example.test';let user;
try{
 user=ok(await db.auth.admin.createUser({email,password:crypto.randomBytes(24).toString('hex'),email_confirm:true})).user;
 const slug='discover-your-divine-design';
 ok(await db.from('reflection_rounds').insert({user_id:user.id,course_slug:slug,questions:[],source:'journey-assessments-v1:[]'}));
 await processLifecycleEvents();await processLifecycleEvents();
 const jobs=ok(await db.from('dydd_lifecycle_jobs').select('*').eq('user_id',user.id));
 const help=jobs.filter(j=>j.template_id==='A05'),returns=jobs.filter(j=>j.template_id==='G04');assert.equal(help.length,1);assert.equal(returns.length,1);
 assert.equal(ok(await db.from('passport_lesson_completions').select('lesson_slug').eq('user_id',user.id)).length,0);
 assert(Date.parse(help[0].scheduled_at)-Date.parse(help[0].created_at)>6.9*86400000);assert(Date.parse(returns[0].scheduled_at)-Date.parse(returns[0].created_at)>34.9*86400000);
 assert.match((await lifecycleEligibility(help[0],Date.parse(help[0].scheduled_at))).stop,/opted into/);
 ok(await db.from('dydd_email_preferences').insert({email,user_id:user.id,learning:true,growth:true,timezone:'America/New_York'}));
 // Saved workbook start alone becomes eligible once genuinely inactive; no fabricated completion.
 const at=Date.parse(help[0].scheduled_at)+3600000;const result=await lifecycleEligibility(help[0],at);assert(!result.stop,JSON.stringify(result));
 ok(await db.from('reflection_rounds').update({updated_at:new Date(at-3600000).toISOString()}).eq('user_id',user.id));assert.match((await lifecycleEligibility(help[0],at)).stop,/Recent saved workbook/);
 console.log('PASS actual first saved workbook round with zero lessons → once-only day7/day35 intents, default no-consent stop, opted-in inactivity eligibility and fresh workbook activity stop; no backfill/provider calls');
}finally{
 if(user){for(const table of ['dydd_email_preferences','dydd_lifecycle_jobs','dydd_lifecycle_events','reflection_rounds'])ok(await db.from(table).delete().eq(table==='dydd_email_preferences'?'email':'user_id',table==='dydd_email_preferences'?email:user.id));ok(await db.auth.admin.deleteUser(user.id));assert((await db.auth.admin.getUserById(user.id)).error);}
 console.log('PASS synthetic workbook-start fixture cleanup asserted');
}
