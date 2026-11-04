/* Deterministic server tests. No network, Stripe, email or real learner records. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const load = require('../scripts/fruitlife-test-load.cjs');
global.fetch = () => { throw Error('Network forbidden'); };
let enabled = true, lifetime = false, fail = false, actor = { id: 'saved-user', email: 'learner@example.invalid' };
let rows = [], orders = [], writes = [], standalone = [], sessionOwner = actor.id;
const now = Date.now();
const date = delta => new Date(now + delta).toISOString();
const row = (extra = {}) => ({order_id:'old-order',user_id:actor.id,capability:'personal',scope_id:'account',active:true,paid:true,expires_at:date(100000),paid_through:date(100000),...extra});
function from(table) {
 const filters=[]; let payload;
 const q={select(){return q},eq(k,v){filters.push([k,v]);return q},in(k,v){filters.push([k,v]);return q},limit(){return q},maybeSingle(){q.one=true;return q},upsert(p){payload=p;return q},then(resolve,reject){
  return Promise.resolve().then(()=>{
   if(payload){writes.push({table,payload});return {data:payload,error:null};}
   if(fail) return {data:null,error:{message:'storage unavailable'}};
   let data=table==='dydd_test_billing_entitlements'?rows:table==='dydd_test_billing_orders'?orders:table==='fruitlife_360_entitlements'?standalone:table==='fruitlife_360_sessions'?[{id:'self-session',created_by_user_id:sessionOwner}]:[];
   data=data.filter(r=>filters.every(([k,v])=>Array.isArray(v)?v.includes(r[k]):r[k]===v));
   return {data:q.one?data[0]||null:data,error:null};
  }).then(resolve,reject);
 }};return q;
}
const db={from,auth:{getUser:async()=>({data:{user:actor}}),signInWithPassword:async()=>({data:{user:actor},error:null}),verifyOtp:async()=>({data:{user:actor},error:null}),exchangeCodeForSession:async()=>({data:{user:actor},error:null}),admin:{getUserById:async()=>({data:{user:actor},error:null})}}};
const redirect = path => { throw Error('redirect:'+path); };
const mocks={
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},
 '@/lib/supabase/server':{createSupabaseServerClient:async()=>db},
 '@/lib/commerce/personal-access':{hasLifetimePersonalAccess:async()=>lifetime},
 './personal-access':{hasLifetimePersonalAccess:async()=>lifetime},
 './test-billing-config':{testBillingEnabled:()=>enabled,assertTestBilling:()=>{assert(enabled)}},
 '@/lib/commerce/test-billing-config':{testBillingEnabled:()=>enabled,assertTestBilling:()=>{assert(enabled)}},
 'next/navigation':{redirect,notFound:()=>{throw Error('not-found')}},
 '@/lib/assessments/student-context':{getAssessmentSnapshotsForUser:async()=>{throw Error('Content loaded before membership gate')}},
};
const access=load('lib/commerce/account-access.ts',mocks);
const course=load('lib/trails/course-access.ts',mocks);
const login=load('app/login/actions.ts',mocks);
const progress=load('app/api/course-progress/route.ts',mocks);
const reflections=load('app/api/course-reflections/route.ts',mocks);
const callback=load('app/auth/callback/route.ts',mocks);
const confirm=load('app/auth/confirm/route.ts',mocks);
const renew=load('app/renew/page.tsx',mocks).default;
const renewPath='/renew?next=%2Fjourney';
(async()=>{
 assert.equal(access.personalMembershipState([row()],new Set(),now).phase,'active');
 for(const delta of [0,-1,-100000])assert.equal(access.personalMembershipState([row({expires_at:date(delta),paid_through:date(delta)})],new Set(),now).phase,'expired','exclusive paid boundary');
 assert.equal(access.personalMembershipState([row({active:false,paid:false,expires_at:date(100000),paid_through:date(-1)})],new Set(),now).phase,'expired','failed renewal never borrows future invoice boundary');
 assert.equal(access.personalMembershipState([row()],new Set(['old-order']),now).phase,'expired','revoked purchase denied');
 assert.equal(access.personalMembershipState([row({paid:false})],new Set(),now).phase,'expired','unpaid trial cannot unlock');
 assert.equal(access.personalMembershipState([row({paid_through:null})],new Set(),now).phase,'expired','missing paid evidence fails closed');
 assert.equal(access.personalMembershipState([row({expires_at:date(-1)}),row({order_id:'new-order'})],new Set(),now).phase,'active','new paid subscription restores same account');
 rows=[row({expires_at:date(-1),paid_through:date(-1)})];orders=[{id:'old-order',user_id:actor.id,status:'paid'}];
 assert.equal((await access.getPersonalMembershipState(actor.id)).phase,'expired');
 await assert.rejects(()=>access.requirePersonalMembershipContent(actor,'/journey'),new RegExp('redirect:'+renewPath.replace(/[?]/g,'\\?')));
 for(const slug of ['designid-foundations','fruitlife-360-formation'])await assert.rejects(()=>course.requireTrailCourseAssessment({slug,snapshots:[],signedIn:true,email:actor.email,preview:false}),/redirect:\/renew\?/,'direct course URL denied before report eligibility');
 process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';process.env.DYDD_REVIEW_TOKEN='synthetic-preview-only';
 await course.requireTrailCourseAssessment({slug:'designid-foundations',snapshots:[],signedIn:false,email:'',preview:true,params:{review:'owner',key:'synthetic-preview-only'}});
 await course.requireTrailCourseAssessment({slug:'designid-foundations',snapshots:[],signedIn:false,email:'',preview:true,params:{review:'new',key:'synthetic-preview-only'}});
 await assert.rejects(()=>access.requirePersonalMembershipContent(null,'/journey'),/redirect:\/login\?/,'signed-out route cannot bypass membership-backed content');
 assert(!access.membershipBackedCourse('designpd-alignment'));
 assert(!access.membershipBackedCourse('spiritual-gifts-service'));
 const post = (handler,body)=>handler.POST(new Request('https://school.test/api/test',{method:'POST',headers:{origin:'https://school.test','Content-Type':'application/json'},body:JSON.stringify(body)}));
 let r=await post(progress,{action:'complete-lesson',courseSlug:'discover-your-divine-design'});assert.equal(r.status,402);assert.match((await r.json()).renewalUrl,/^\/renew\?/);
 r=await post(reflections,{action:'ensure-round',courseSlug:'discover-your-divine-design'});assert.equal(r.status,402);assert.equal(writes.length,0,'direct writes denied before reading or changing workbook');
 for(const next of ['/hq','/journey','/courses/designid-foundations','/waypoints','/fruitlife360'])assert.match(await access.signedInAccountDestination(actor,next),/^\/renew\?/);
 for(const next of ['/designpd?snapshot=saved','/camp-circle/my-circles?circle=saved','/spiritual-gifts','/courses/spiritual-gifts-service','/courses/designpd-alignment','/designid/report?snapshot=saved','/fruitlife360/report?snapshot=saved','/field-kit','/reset-password?next=%2Fhq'])assert.equal(await access.signedInAccountDestination(actor,next),next,'separate purchase/free/history/recovery destination retained');
 assert.equal(await access.signedInAccountDestination(actor,'/renew?next=%2Fjourney'),renewPath,'same original renewal target after login');
 for(const next of ['https://outside.invalid','//outside.invalid','/\\outside.invalid','/\n/outside.invalid','/login','/auth/callback'])assert.equal(access.safeAccountReturn(next),'/hq');
 let form=new FormData();form.set('email',actor.email);form.set('password','fixture-only');form.set('next','/journey');
 await assert.rejects(()=>login.signInWithPassword(form),/redirect:\/renew\?/);
 assert.equal(writes[0].payload.id,actor.id,'sign-in reuses authenticated profile identity');
 assert(!writes.some(w=>['assessment_snapshots','reflection_rounds','passport_lesson_completions'].includes(w.table)),'renewal routing never resets history');
 form.set('token','123456');await assert.rejects(()=>login.verifyEmailCode(form),/redirect:\/renew\?/);
 let response=await callback.GET(new Request('https://school.test/auth/callback?code=fixture&next=%2Fjourney'));
 assert.equal(new URL(response.headers.get('location')).pathname,'/renew','PKCE callback uses server membership boundary');
 response=await confirm.POST(new Request('https://school.test/auth/confirm',{method:'POST',body:new URLSearchParams({token_hash:'fixture-only',next:'/journey'})}));
 assert.equal(new URL(response.headers.get('location')).pathname,'/renew','one-time confirmation uses same membership routing');
 assert.match(response.headers.get('cache-control'),/no-store/);
 const renewalPage=await renew({searchParams:Promise.resolve({next:'/journey'})});
 const serialized=JSON.stringify(renewalPage);assert(serialized.includes(actor.email),'renewal shows existing signed-in identity');
 assert(serialized.includes('No new account is needed'),'renewal explains saved identity/history');
 const savedActor=actor;actor=null;
 await assert.rejects(()=>renew({searchParams:Promise.resolve({next:'/journey'})}),/redirect:\/login\?/,'renewal requires own signed-in identity');actor=savedActor;

 await assert.rejects(()=>access.requireFruitLifeSelfMembership('self-session'),/redirect:\/renew\?/,'old valid self token cannot bypass expired membership');
 standalone=[{id:'paid-session',user_id:actor.id,fruitlife_session_id:'self-session',status:'consumed'}];await access.requireFruitLifeSelfMembership('self-session');standalone=[];
 lifetime=true;assert.equal((await access.getPersonalMembershipState(actor.id)).phase,'lifetime');await access.requirePersonalMembershipContent(actor,'/journey');lifetime=false;
 const learner=actor;actor={id:learner.id,email:'dyddjourney@gmail.com'};await access.requirePersonalMembershipContent(actor,'/journey');actor=learner;
 rows.push(row({order_id:'new-order'}));orders.push({id:'new-order',user_id:actor.id,status:'paid'});
 assert.equal(await access.signedInAccountDestination(actor,'/renew?next=%2Fjourney'),'/journey','renewed identity returns to saved target');
 fail=true;await assert.rejects(()=>access.getPersonalMembershipState(actor.id),/could not be checked/);fail=false;
 enabled=false;await access.requirePersonalMembershipContent(actor,'/journey');assert.equal(await access.signedInAccountDestination(actor,'/journey'),'/journey','production unaffected');
 // Verify the direct self page/action both invoke the token-aware guard and owner preview remains first.
 assert.match(fs.readFileSync('app/fruitlife360/self/page.tsx','utf8'),/requireFruitLifeSelfMembership\(session.id\)/);
 assert.match(fs.readFileSync('app/fruitlife360/actions.ts','utf8'),/responseType === "self"\) await requireFruitLifeSelfMembership\(session.id\)/);
 assert.match(fs.readFileSync('app/journey/page.tsx','utf8'),/!isOwnerCoursePreview\(reviewParams\)/);
 assert.match(fs.readFileSync('app/waypoints/page.tsx','utf8'),/!isOwnerCoursePreview\(params\)/);
 console.log('PASS personal paid boundary, failed invoices/refunds/revoked/missing evidence, server direct course and write denial, self-token bypass, standalone purchases/free/history/recovery retention, password+OTP renewal routing, original target and identity retention, lifetime/admin/preview, production no-op; no network or data mutation.');
})().catch(e=>{console.error(e);process.exitCode=1});
