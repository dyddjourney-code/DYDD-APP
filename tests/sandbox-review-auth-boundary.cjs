const assert=require('node:assert/strict'),load=require('../scripts/fruitlife-test-load.cjs');
process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';process.env.DYDD_REVIEW_TOKEN='isolated-fixture-review-key';
let user={id:'real-learner'};
const cookies=()=>{const rows=new Map();return {getAll:()=>[...rows].map(([name,value])=>({name,value})),get:name=>rows.has(name)?{value:rows.get(name)}:undefined,set:(name,value)=>typeof name==='object'?rows.set(name.name,name.value):rows.set(name,value)};};
const response=(kind,url)=>({kind,url:url?.toString(),cookies:cookies(),headers:new Headers()});
const mocks={'next/server':{NextResponse:{next:()=>response('next'),redirect:url=>response('redirect',url)}},'@supabase/ssr':{createServerClient:()=>({auth:{getUser:async()=>({data:{user}})}})},'@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user}})}})},'./lib/supabase/config':{getSupabaseConfig:()=>({url:'https://atemrshtshxoqnuevvqu.supabase.co',anonKey:'isolated-public-fixture'})}};
const {middleware}=load('middleware.ts',mocks),camp=load('app/base-camp/route.ts',mocks),launch=load('app/first-launch/route.ts',mocks);
function request(path){const url=new URL('https://sandbox.invalid'+path);url.clone=()=>new URL(url);const jar=cookies();jar.set('dydd_sandbox_review',process.env.DYDD_REVIEW_TOKEN);return {method:'GET',url:url.toString(),nextUrl:url,cookies:jar};}
(async()=>{
 let r=await middleware(request('/camp-circle/my-circles?circle=fixture'));assert.equal(r.kind,'next','review cookie must not hijack signed-in Circle reload');
 r=await camp.GET(request('/base-camp'));assert.equal(new URL(r.url).pathname,'/hq');assert.equal(new URL(r.url).search,'');
 r=await launch.GET(request('/first-launch'));assert.equal(new URL(r.url).search,'?lane=fruitlife');
 user=null;r=await middleware(request('/camp-circle/my-circles?circle=fixture'));assert.equal(r.kind,'redirect');assert.equal(new URL(r.url).searchParams.get('review'),'new');assert.equal(new URL(r.url).searchParams.get('circle'),'fixture');
 r=await camp.GET(request('/base-camp'));assert.equal(new URL(r.url).searchParams.get('review'),'new');
 user={id:'real-learner'};r=await camp.GET(request('/base-camp?review=new&key=isolated-fixture-review-key'));assert.equal(new URL(r.url).searchParams.get('review'),'new','explicit owner navigation must survive mixed auth session');r=await launch.GET(request('/first-launch?review=owner&key=isolated-fixture-review-key'));assert.equal(new URL(r.url).searchParams.get('review'),'new');r=await middleware(request('/camp-circle/my-circles?review=owner&key=isolated-fixture-review-key'));assert.equal(r.kind,'next');assert(r.cookies.get('dydd_sandbox_review'),'explicit authorized preview still supported');
 console.log('PASS signed-in learner precedence over sandbox review cookie/prefetch, plain Circle reload retains real identity, Base Camp/first-launch keep auth, anonymous and explicit owner preview preserved');
})().catch(e=>{console.error(e);process.exitCode=1;});
