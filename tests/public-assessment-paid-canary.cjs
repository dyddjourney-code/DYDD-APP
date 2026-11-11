// Synthetic verified Auth identities only; no provider, DB, auth or env writes outside this process.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
const {publicPaymentRuntime,isProductionAssessmentCanary}=load('lib/public-assessments/config.ts');
const owner={id:'12345678-1234-4234-8234-123456789abc',email:'fresh@example.invalid',email_confirmed_at:'2026-11-11T00:00:00Z'};
const other={...owner,id:'12345678-1234-4234-8234-123456789abd'};
function configure(mode='live'){
 for(const k of Object.keys(process.env))if(k.startsWith('DYDD_PUBLIC_'))delete process.env[k];
 Object.assign(process.env,{NEXT_PUBLIC_DYDD_ENVIRONMENT:mode==='live'?'production':'sandbox',NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF:'atemrshtshxoqnuevvqu',NEXT_PUBLIC_SUPABASE_URL:mode==='live'?'https://fixtureprod.supabase.co':'https://atemrshtshxoqnuevvqu.supabase.co',DYDD_PUBLIC_ASSESSMENT_PRODUCTION_SUPABASE_URL:'https://fixtureprod.supabase.co',DYDD_PUBLIC_ASSESSMENT_PRODUCTION_LEDGER_ENABLED:'true',DYDD_PUBLIC_ASSESSMENT_PRODUCTION_ACCESS_POLICY:'grandfathered-v1',DYDD_PUBLIC_ASSESSMENT_GRANDFATHER_INVENTORY_READY:'true',DYDD_PUBLIC_ASSESSMENT_PRODUCTION_PAYMENTS_ENABLED:'true',DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED:'false',DYDD_PUBLIC_ASSESSMENT_WEBHOOKS_ENABLED:'true',DYDD_PUBLIC_ASSESSMENT_STRIPE_MODE:mode,STRIPE_SECRET_KEY:'sk_'+'live_fixture',STRIPE_DYDD_TEST_KEY:'sk_'+'test_fixture',DYDD_PUBLIC_ASSESSMENT_LIVE_ORIGIN:'https://production.invalid',DYDD_PUBLIC_ASSESSMENT_TEST_ORIGIN:'https://sandbox.invalid',DYDD_PUBLIC_DESIGNID_LIVE_STRIPE_PRICE_ID:'price_fixture',DYDD_PUBLIC_DESIGNID_LIVE_STRIPE_PRODUCT_ID:'prod_fixture',DYDD_PUBLIC_DESIGNID_LIVE_AMOUNT_CENTS:'1999'});
}
test('paused production admits only exact verified server UUID; absent/malformed list fails closed',()=>{
 configure();assert.throws(()=>publicPaymentRuntime('checkout',owner),/disabled/);
 process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_CANARY_USER_IDS=owner.id;
 assert.equal(publicPaymentRuntime('checkout',owner).mode,'live');
 for(const user of [undefined,other,{...owner,email_confirmed_at:undefined},{...owner,email_confirmed_at:'invalid'},{...owner,id:owner.id.toUpperCase()},{...owner,id:owner.id+'x'}])assert.throws(()=>publicPaymentRuntime('checkout',user),/disabled/);
 for(const list of ['',owner.email,'*',owner.id+',',owner.id+',bad',JSON.stringify([owner.id])]){process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_CANARY_USER_IDS=list;assert.throws(()=>publicPaymentRuntime('checkout',owner),/disabled/);}
 process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_CANARY_USER_IDS=other.id+', '+owner.id;assert.equal(isProductionAssessmentCanary(owner),true);
});
test('no sandbox/unknown environment exception; production safety switches and webhook remain independent',()=>{
 configure('test');process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_CANARY_USER_IDS=owner.id;assert.throws(()=>publicPaymentRuntime('checkout',owner),/disabled/);
 process.env.DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED='true';assert.equal(publicPaymentRuntime().mode,'test');
 for(const name of ['DYDD_PUBLIC_ASSESSMENT_PRODUCTION_PAYMENTS_ENABLED','DYDD_PUBLIC_ASSESSMENT_PRODUCTION_LEDGER_ENABLED','DYDD_PUBLIC_ASSESSMENT_GRANDFATHER_INVENTORY_READY']){configure();process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_CANARY_USER_IDS=owner.id;delete process.env[name];assert.throws(()=>publicPaymentRuntime('checkout',owner));}
 configure();process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_CANARY_USER_IDS=owner.id;delete process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT;assert.throws(()=>publicPaymentRuntime('checkout',owner),/disabled/);
 configure();process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_CANARY_USER_IDS=owner.id;process.env.DYDD_PUBLIC_ASSESSMENT_WEBHOOKS_ENABLED='false';assert.throws(()=>publicPaymentRuntime('webhook',owner),/disabled/);
 process.env.DYDD_PUBLIC_ASSESSMENT_WEBHOOKS_ENABLED='true';assert.equal(publicPaymentRuntime('webhook',other).mode,'live');
 process.env.DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED='true';assert.equal(publicPaymentRuntime().mode,'live');assert.equal(publicPaymentRuntime('checkout',other).mode,'live');
});
let sessionUser=owner,included=false,eligible=true,providerCalls=0;
const actions=load('app/assessments/actions.ts',{
 'next/navigation':{redirect:url=>{throw Error('REDIRECT '+url)}},
 '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user:sessionUser}})}})},
 '@/lib/public-assessments/payments':{createPublicAssessmentCheckout:async(user,product)=>{publicPaymentRuntime('checkout',user);providerCalls++;return 'https://checkout.invalid/session'}},
 '@/lib/public-assessments/identity':{getOwnedAssessmentSnapshots:async()=>[]},
 '@/lib/admin-access':{isDyddAdminEmail:()=>false},
 '@/lib/public-assessments/included-access':{hasIncludedAssessmentAccess:async()=>included},
 '@/lib/public-assessments/access':{standaloneDesignIdAccess:async()=>({allowed:included})},
 '@/lib/designid/retake':{getDesignIdEligibility:async()=>({allowed:eligible})},
 '@/lib/designpd/engine':{scoreDesignPd:()=>{}},
 '@/lib/public-assessments/ledger':{},'@/app/designpd/actions':{}
});
test('real server action ignores spoofed form ownership; included and retake checks precede gate',async()=>{
 configure();process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_CANARY_USER_IDS=owner.id;providerCalls=0;
 const form=new FormData();form.set('product','designid');form.set('userId',owner.id);form.set('email_confirmed_at',owner.email_confirmed_at);form.set('email',owner.email);
 sessionUser=other;await assert.rejects(()=>actions.beginAssessmentCheckout(form),/Checkout%20is%20currently%20unavailable/);assert.equal(providerCalls,0);
 sessionUser=null;await assert.rejects(()=>actions.beginAssessmentCheckout(form),/REDIRECT \/login/);assert.equal(providerCalls,0);
 sessionUser={...owner,email_confirmed_at:undefined};await assert.rejects(()=>actions.beginAssessmentCheckout(form),/Verify%20your%20account/);assert.equal(providerCalls,0);
 sessionUser=owner;included=true;await assert.rejects(()=>actions.beginAssessmentCheckout(form),/REDIRECT \/designid$/);assert.equal(providerCalls,0);
 included=false;eligible=false;await assert.rejects(()=>actions.beginAssessmentCheckout(form),/six-month/);assert.equal(providerCalls,0);
 eligible=true;form.set('userId',other.id);await assert.rejects(()=>actions.beginAssessmentCheckout(form),/REDIRECT https:\/\/checkout.invalid/);assert.equal(providerCalls,1);
});
let catalogCalls=0;
const payments=load('lib/public-assessments/payments.ts',{
 stripe:class{constructor(){this.prices={retrieve:async()=>{catalogCalls++;throw Error('synthetic provider boundary')}}}},
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>({})},
 '@/lib/assessments/artifact-access':{getOwnedArtifactSnapshot:async()=>null},
 '@/lib/identity/email':{normalizeEmail:x=>x},'@/lib/designpd/engine':{scoreDesignPd:()=>{}}
});
test('actual checkout propagates verified identity; nonallowlisted denied before provider; source rules unchanged',async()=>{
 configure();process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_CANARY_USER_IDS=owner.id;catalogCalls=0;
 await assert.rejects(()=>payments.createPublicAssessmentCheckout(other,'designid'),/disabled/);assert.equal(catalogCalls,0);
 await assert.rejects(()=>payments.createPublicAssessmentCheckout(owner,'designid'),/synthetic provider boundary/);assert.equal(catalogCalls,1);
 await assert.rejects(()=>payments.createPublicAssessmentCheckout(owner,'designpd','foreign'),/Complete a valid DesignID/);
 await assert.rejects(()=>payments.createPublicAssessmentCheckout(owner,'designid','foreign'),/cannot have a source/);assert.equal(catalogCalls,1);
});
