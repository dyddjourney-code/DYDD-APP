const assert=require('node:assert/strict'),load=require('../scripts/fruitlife-test-load.cjs');
Object.assign(process.env,{NEXT_PUBLIC_DYDD_ENVIRONMENT:'sandbox',NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF:'atemrshtshxoqnuevvqu',NEXT_PUBLIC_SUPABASE_URL:'https://atemrshtshxoqnuevvqu.supabase.co',DYDD_SANDBOX_EMAIL_ENABLED:'true',DYDD_SANDBOX_EMAIL_ALLOWLIST:'dyddjourney@gmail.com'});
let sent=[],updates=[],transportFailure=true;
const payload={to:'dyddjourney@gmail.com',subject:'Frozen original',text:'Frozen original',html:'<p>Frozen original</p>',idempotencyKey:'retake-owner-fixture'};
const rows=[{id:'row',request_id:'fixture',kind:'owner',payload,status:'pending',attempts:0}];
const db={from(){let updating=false,data;const q={select(){return q},eq(){return q},neq(){return q},update(v){updating=true;data=v;return q},then(resolve,reject){if(updating){updates.push(data);Object.assign(rows[0],data);return Promise.resolve({error:null}).then(resolve,reject);}return Promise.resolve({data:rows.filter(r=>r.status!=='accepted'),error:null}).then(resolve,reject)}};return q;}};
const workflow=load('lib/assessment-timing/requests.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},'@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user:null},error:null})}})},'@/lib/email/resend':{sendResendEmail:async input=>{sent.push(structuredClone(input));return transportFailure?{sent:false,skipped:false,message:'Synthetic timeout'}:{sent:true,skipped:false,id:'provider-fixture'};}},'./policy':{getAssessmentEligibility:async()=>{throw Error('not used')}}});
(async()=>{
 const base='https://dydd-online-school-sandbox.vercel.app';
 assert.doesNotThrow(()=>workflow.assertRequestOrigin(new Request(base+'/assessment-timing/api/request',{method:'POST',headers:{origin:base,'sec-fetch-site':'same-origin'}})));
 for(const headers of [{},{origin:'https://evil.example'},{origin:base,'sec-fetch-site':'cross-site'},{origin:base,'sec-fetch-site':'same-site'}])assert.throws(()=>workflow.assertRequestOrigin(new Request(base+'/assessment-timing/api/request',{method:'POST',headers})));
 await assert.rejects(()=>workflow.requestIdentity(true));
 await workflow.flushRetakeMail('fixture');assert.equal(rows[0].status,'failed');assert.equal(updates[0].error_message,'Synthetic timeout');
 transportFailure=false;await workflow.flushRetakeMail('fixture');assert.equal(rows[0].status,'accepted');assert.equal(rows[0].provider_id,'provider-fixture');assert.deepEqual(sent[0],sent[1]);
 await workflow.flushRetakeMail('fixture');assert.equal(sent.length,2);
 rows[0].status='pending';rows[0].payload={...payload,to:'learner@example.invalid'};await workflow.flushRetakeMail('fixture');assert.equal(rows[0].status,'blocked');assert.equal(sent.length,2);
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://production.supabase.co';assert.throws(workflow.assertRequestSandbox);
 console.log('PASS exact sandbox gate, Origin+Fetch-Metadata CSRF, missing/preview-only auth denied, persisted failures, byte-identical stable retry, accepted replay no send, outsider mail blocked before transport.');
})().catch(error=>{console.error(error);process.exitCode=1});
