const assert=require('node:assert/strict');const load=require('../scripts/fruitlife-test-load.cjs');
let actor={userId:'10000000-0000-4000-8000-000000000001',email:'person@example.invalid',owner:false},fail=false,calls=[];
class CircleOperationError extends Error{constructor(message,status=400){super(message);this.status=status}}
const route=load('app/api/circles/operations/route.ts',{
 '@/lib/commerce/test-billing-config':{testBillingEnabled:()=>true},
 'next/server':{NextResponse:{json:(body,opts)=>Response.json(body,opts)}},
 '@/lib/circles/server':{sameOrigin:r=>!r.headers.get('origin')||r.headers.get('origin')===new URL(r.url).origin},
 '@/lib/circles/operations':{CircleOperationError,operationActor:async()=>actor,listCircleOperations:async a=>({circles:[{id:'accepted-circle',role:'participant'}],owner:a.owner}),loadCircleOperationDetail:async(a,id)=>{if(fail)throw new CircleOperationError('This Circle is not available to your account.',403);return {circle:{id,plan:{name:'Participant safe'}},role:'participant'}},operateCircle:async(a,b)=>{calls.push({a,b});if(fail)throw Error('SECRET DB CUSTOMER DATA');return {saved:true}}}
});
async function post(body,headers={}){const r=await route.POST(new Request('https://school.invalid/api/circles/operations',{method:'POST',headers:{origin:'https://school.invalid',...headers},body}));return {r,body:await r.json()}}
(async()=>{
let r=await route.GET(new Request('https://school.invalid/api/circles/operations'));assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(r.headers.get('vary'),'Cookie');assert.equal((await r.json()).circles[0].role,'participant');
fail=true;r=await route.GET(new Request('https://school.invalid/api/circles/operations?circleId=notmine'));assert.equal(r.status,403);fail=false;
let p=await post('{}',{origin:'https://evil.invalid'});assert.equal(p.r.status,403);p=await post('{}',{'sec-fetch-site':'cross-site'});assert.equal(p.r.status,403);assert.equal(calls.length,0);
p=await post('invalid json');assert.equal(p.r.status,400);p=await post('x'.repeat(250001));assert.equal(p.r.status,413);
actor=null;r=await route.GET(new Request('https://school.invalid/api/circles/operations'));assert.equal(r.status,401);p=await post('{}');assert.equal(p.r.status,401);
actor={userId:'account',email:'verified@example.invalid',owner:false};p=await post('{"action":"leave","circleId":"mine"}');assert.equal(p.r.status,200);assert.equal(calls[0].a.email,'verified@example.invalid');assert.equal(calls[0].b.action,'leave');
fail=true;p=await post('{}');assert.equal(p.r.status,503);assert(!JSON.stringify(p.body).includes('SECRET'));
console.log('PASS operations HTTP: participant list, per-circle forbidden, private/no-store, same-origin/cross-site, malformed/large JSON, verified signin, sanitized errors');
})().catch(e=>{console.error(e);process.exit(1)});
