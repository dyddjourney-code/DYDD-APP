// Synthetic keys/catalog only. No network, charges, PDF generation or mail.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
const {publicPaymentRuntime}=load('lib/public-assessments/config.ts');
const live='sk_'+'live_fixture',override='rk_'+'live_override',testKey='sk_'+'test_fixture';
function configure(mode='live'){
 for(const k of Object.keys(process.env))if(k.startsWith('DYDD_PUBLIC_')||['STRIPE_SECRET_KEY','STRIPE_DYDD_TEST_KEY','CRON_SECRET'].includes(k))delete process.env[k];
 Object.assign(process.env,{NEXT_PUBLIC_DYDD_ENVIRONMENT:mode==='test'?'sandbox':'production',NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF:'atemrshtshxoqnuevvqu',NEXT_PUBLIC_SUPABASE_URL:mode==='test'?'https://atemrshtshxoqnuevvqu.supabase.co':'https://syntheticproduction.supabase.co',DYDD_PUBLIC_ASSESSMENT_PRODUCTION_SUPABASE_URL:'https://syntheticproduction.supabase.co',DYDD_PUBLIC_ASSESSMENT_PRODUCTION_LEDGER_ENABLED:'true',DYDD_PUBLIC_ASSESSMENT_PRODUCTION_ACCESS_POLICY:'grandfathered-v1',DYDD_PUBLIC_ASSESSMENT_GRANDFATHER_INVENTORY_READY:'true',DYDD_PUBLIC_ASSESSMENT_PRODUCTION_PAYMENTS_ENABLED:'true',DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED:'true',DYDD_PUBLIC_ASSESSMENT_WEBHOOKS_ENABLED:'true',DYDD_PUBLIC_ASSESSMENT_STRIPE_MODE:mode,STRIPE_DYDD_TEST_KEY:testKey,STRIPE_SECRET_KEY:live,DYDD_PUBLIC_ASSESSMENT_TEST_ORIGIN:'https://sandbox.invalid',DYDD_PUBLIC_ASSESSMENT_LIVE_ORIGIN:'https://production.invalid'});
}
test('LIVE fallback and override precedence; TEST remains dedicated and wrong mode fails closed',()=>{
 configure();assert.equal(publicPaymentRuntime().secret,live);
 process.env.DYDD_PUBLIC_ASSESSMENT_STRIPE_LIVE_KEY=override;assert.equal(publicPaymentRuntime().secret,override);
 process.env.DYDD_PUBLIC_ASSESSMENT_STRIPE_LIVE_KEY=testKey;assert.throws(()=>publicPaymentRuntime(),/key mode mismatch/);
 configure();process.env.STRIPE_SECRET_KEY=testKey;assert.throws(()=>publicPaymentRuntime(),/key mode mismatch/);
 configure();delete process.env.STRIPE_SECRET_KEY;assert.throws(()=>publicPaymentRuntime(),/key mode mismatch/);
 configure('test');assert.equal(publicPaymentRuntime().secret,testKey);delete process.env.STRIPE_DYDD_TEST_KEY;assert.throws(()=>publicPaymentRuntime(),/key mode mismatch/);
 configure('test');process.env.STRIPE_DYDD_TEST_KEY=live;assert.throws(()=>publicPaymentRuntime(),/key mode mismatch/);
 configure();process.env.DYDD_PUBLIC_ASSESSMENT_STRIPE_MODE='test';assert.throws(()=>publicPaymentRuntime(),/environment mismatch/);
 configure();process.env.DYDD_PUBLIC_ASSESSMENT_STRIPE_MODE='other';assert.throws(()=>publicPaymentRuntime(),/Explicit/);
 configure();process.env.DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED='false';assert.throws(()=>publicPaymentRuntime(),/disabled/);
});
const expected=[['price_1SpvNlABW64O7Vgm7A21M9dA','prod_TnWQY5tMSZpbYo'],['price_1UajaWABW64O7VgmkpiD7KL7','prod_UODe7BcedrK2cg']];
let mutate=()=>{},calls=[],keys=[];
class StripeDouble{
 constructor(key){keys.push(key);this.prices={retrieve:async id=>{
  calls.push(id);const tuple=expected.find(x=>x[0]===id);assert.ok(tuple);
  const price={id,product:tuple[1],livemode:true,active:true,type:'one_time',currency:'usd',unit_amount:1999};
  mutate(price);return price;
 }};}
}
const verifier=load('lib/public-assessments/runtime-catalog.ts',{'stripe':StripeDouble});
const route=load('app/api/ops/public-assessment-catalog/route.ts',{'@/lib/public-assessments/runtime-catalog':verifier});
test('operator authentication rejects missing/forged credentials before any Stripe GET',async()=>{
 configure();calls=[];
 for(const header of [null,'Bearer forged']){
  const request=new Request('https://production.invalid/api/ops/public-assessment-catalog',{headers:header?{authorization:header}:{}});
  assert.equal((await route.GET(request)).status,401);
  process.env.CRON_SECRET='fixture-operator';assert.equal((await route.GET(request)).status,401);
 }
 assert.deepEqual(calls,[]);
});
test('paused authenticated verifier reads exactly two approved live prices, all output values boolean',async()=>{
 configure();calls=[];keys=[];mutate=()=>{};process.env.CRON_SECRET='fixture-operator';
 process.env.DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED='false';delete process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_ACCESS_POLICY;
 const response=await route.GET(new Request('https://production.invalid/api/ops/public-assessment-catalog',{headers:{authorization:'Bearer fixture-operator'}}));
 assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);
 assert.deepEqual(await response.json(),{ok:true,liveKey:true,designid:true,designpd:true,salesPaused:true,accessPolicyInactive:true});
 assert.deepEqual(calls,expected.map(x=>x[0]));assert.deepEqual(keys,[live]);
 process.env.DYDD_PUBLIC_ASSESSMENT_STRIPE_LIVE_KEY=override;await verifier.verifyAssessmentLiveStripeCatalog();assert.equal(keys.at(-1),override);
 process.env.DYDD_PUBLIC_ASSESSMENT_STRIPE_LIVE_KEY=testKey;calls=[];
 assert.equal((await verifier.verifyAssessmentLiveStripeCatalog()).ok,false);assert.deepEqual(calls,[]);
});
test('every exact catalog tuple field and provider failure rejects without error/provider disclosure',async()=>{
 configure();
 for(const [field,value] of [['id','price_foreign'],['product','prod_foreign'],['livemode',false],['active',false],['type','recurring'],['currency','eur'],['unit_amount',2000]]){
  mutate=p=>{p[field]=value};const result=await verifier.verifyAssessmentLiveStripeCatalog();assert.equal(result.ok,false,field);
  assert.ok(Object.values(result).every(x=>typeof x==='boolean'));
 }
 mutate=()=>{throw Error('provider-secret-must-not-appear')};
 const result=await verifier.verifyAssessmentLiveStripeCatalog();assert.equal(result.ok,false);assert.ok(!JSON.stringify(result).includes('provider-secret'));
 mutate=p=>{p.product={id:p.product}};assert.equal((await verifier.verifyAssessmentLiveStripeCatalog()).ok,true);
});
