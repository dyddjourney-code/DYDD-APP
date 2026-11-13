const assert=require('node:assert/strict');
let user={id:'authenticated-owner',email_confirmed_at:'2026-11-13',is_anonymous:false},calls=0,seen;
const load=require('../scripts/fruitlife-test-load.cjs');
const {POST}=load('app/api/commerce/personal-subscription/cancel/route.ts',{'@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user}})}})},'@/lib/commerce/personal-subscription':{cancelPersonalSubscription:async(id,date)=>{calls++;seen=id;return {cancelAtPeriodEnd:true,paidThrough:date}}}});
const {GET}=load('app/api/commerce/personal-subscription/route.ts',{'@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user}})}})},'@/lib/commerce/personal-subscription':{getPersonalSubscription:async(id)=>{assert.equal(id,'authenticated-owner');return {state:'unavailable'}}}});
const body={confirm:'cancel_at_period_end',paidThrough:'2026-12-01T00:00:00.000Z'};
function request(origin='https://app.discoverdivine.design',value=body){return new Request('https://app.discoverdivine.design/api/commerce/personal-subscription/cancel',{method:'POST',headers:{...(origin?{origin}:{}),'Content-Type':'application/json'},body:JSON.stringify(value)})}
(async()=>{
 assert.equal((await POST(request('https://evil.invalid'))).status,403);assert.equal((await POST(request(''))).status,403);assert.equal(calls,0);
 assert.equal((await POST(request(undefined,{...body,userId:'foreign'}))).status,400);
 assert.equal((await GET()).status,503);assert.match((await GET()).headers.get('cache-control'),/no-store/);
 user={id:'authenticated-owner',email_confirmed_at:null,is_anonymous:false};assert.equal((await GET()).status,401);assert.equal((await POST(request())).status,401);
 user={id:'authenticated-owner',email_confirmed_at:'2026-11-13',is_anonymous:true};assert.equal((await POST(request())).status,401);
 user=null;assert.equal((await GET()).status,401);assert.equal((await POST(request())).status,401);user={id:'authenticated-owner',email_confirmed_at:'2026-11-13',is_anonymous:false};
 assert.equal((await POST(request())).status,200);assert.equal(seen,'authenticated-owner');assert.equal(calls,1);
 console.log('PASS cancellation route strict same-origin, authentication, confirmation, no client-selected identity');
})().catch(e=>{console.error(e);process.exitCode=1});
