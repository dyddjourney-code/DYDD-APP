const {test}=require('node:test');
const assert=require('node:assert/strict');
const {NextRequest}=require('next/server');
function harness(){
 delete require.cache[require.resolve('../scripts/fruitlife-test-load.cjs')];
 const load=require('../scripts/fruitlife-test-load.cjs');let calls=0;
 const route=load('app/assessments/group/open/route.ts',{'../enrollment':{guestAccessTarget:async form=>{calls++;assert.equal(form.get('key'),'fixture-capability');return '/assessments/session/00000000-0000-4000-8000-000000000001';}}});
 return {route,calls:()=>calls};
}
test('guest document POST uses a303 GET handoff and no-store/no-referrer, not a pending React transition',async()=>{
 const h=harness(),form=new FormData();form.set('key','fixture-capability');
 const result=await h.route.POST(new NextRequest('https://app.discoverdivine.design/assessments/group/open',{method:'POST',headers:{origin:'https://app.discoverdivine.design'},body:form}));
 assert.equal(h.calls(),1);assert.equal(result.status,303);assert.equal(result.headers.get('location'),'https://app.discoverdivine.design/assessments/session/00000000-0000-4000-8000-000000000001');assert.equal(result.headers.get('cache-control'),'private, no-store');assert.equal(result.headers.get('referrer-policy'),'no-referrer');
});
test('cross-origin guest form cannot allocate a session or overwrite private session cookies',async()=>{
 const h=harness();const result=await h.route.POST(new NextRequest('https://app.discoverdivine.design/assessments/group/open',{method:'POST',headers:{origin:'https://unrelated.example'},body:new FormData()}));
 assert.equal(result.status,403);assert.equal(h.calls(),0);
});
