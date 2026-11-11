// All prices/identities are synthetic fixtures. No provider/database network transport.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Stripe=require('stripe');
const load=require('../scripts/fruitlife-test-load.cjs');
const {publicPaymentRuntime,publicAssessmentLedgerEnabled}=load('lib/public-assessments/config.ts');
function configure(mode='test'){
 for(const k of Object.keys(process.env))if(k.startsWith('DYDD_PUBLIC_')||k==='STRIPE_DYDD_TEST_KEY')delete process.env[k];
 Object.assign(process.env,{NEXT_PUBLIC_DYDD_ENVIRONMENT:mode==='test'?'sandbox':'production',NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF:'atemrshtshxoqnuevvqu',NEXT_PUBLIC_SUPABASE_URL:mode==='test'?'https://atemrshtshxoqnuevvqu.supabase.co':'https://syntheticproduction.supabase.co',DYDD_PUBLIC_ASSESSMENT_PRODUCTION_SUPABASE_URL:'https://syntheticproduction.supabase.co',DYDD_PUBLIC_ASSESSMENT_PRODUCTION_LEDGER_ENABLED:'true',DYDD_PUBLIC_ASSESSMENT_PRODUCTION_ACCESS_POLICY:'grandfathered-v1',DYDD_PUBLIC_ASSESSMENT_GRANDFATHER_INVENTORY_READY:'true',DYDD_PUBLIC_ASSESSMENT_PRODUCTION_PAYMENTS_ENABLED:'true',DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED:'true',DYDD_PUBLIC_ASSESSMENT_WEBHOOKS_ENABLED:'true',DYDD_PUBLIC_ASSESSMENT_STRIPE_MODE:mode,STRIPE_DYDD_TEST_KEY:'sk_test_synthetic',DYDD_PUBLIC_ASSESSMENT_STRIPE_LIVE_KEY:'sk_live_synthetic',DYDD_PUBLIC_ASSESSMENT_TEST_ORIGIN:'https://sandbox.invalid',DYDD_PUBLIC_ASSESSMENT_LIVE_ORIGIN:'https://production.invalid',DYDD_PUBLIC_ASSESSMENT_STRIPE_TEST_WEBHOOK_SECRET:'whsec_synthetic'});
}
let order,session,intent,charge,rpcCalls=0,entitlement=null,reversed=false;
const db={from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:order,error:null})}),rpc:async(name,args)=>{
 rpcCalls++;
 if(name==='dydd_apply_verified_public_assessment_payment'){
  assert.equal(args.p_provider,order.payment_provider);
  if(reversed)return {data:null,error:Error('revoked')};
  entitlement??={id:'entitlement',order_id:order.id,user_id:order.user_id,product:'designid'};
  return {data:entitlement,error:null};
 }
 throw Error('Unexpected RPC');
}};
class StripeDouble{constructor(){this.checkout={sessions:{retrieve:async()=>session}};this.paymentIntents={retrieve:async()=>intent};this.charges={retrieve:async()=>charge}}}
const payments=load('lib/public-assessments/payments.ts',{'stripe':StripeDouble,'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db}});
function evidence(mode='test'){
 configure(mode);rpcCalls=0;entitlement=null;reversed=false;
 order={id:'owned-order',user_id:'owner',product:'designid',source_snapshot_id:null,expected_amount:4321,expected_price_id:'price_fixture',expected_product_id:'prod_fixture',payment_provider:'stripe_'+mode,payment_reference:'cs_fixture',currency:'usd'};
 session={id:'cs_fixture',livemode:mode==='live',mode:'payment',payment_status:'paid',status:'complete',amount_total:4321,currency:'usd',client_reference_id:'owner',payment_intent:'pi_fixture',metadata:{app:mode==='test'?'dydd_public_assessments_sandbox_v1':'dydd_public_assessments_live_v1',order_id:order.id,user_id:'owner',product:'designid',source_id:''},line_items:{has_more:false,data:[{quantity:1,price:{id:'price_fixture',product:'prod_fixture'}}]}};
 charge={livemode:mode==='live',amount_refunded:0,disputed:false,paid:true,currency:'usd',amount:4321,payment_intent:'pi_fixture'};
 intent={livemode:mode==='live',status:'succeeded',amount:4321,amount_received:4321,currency:'usd',latest_charge:charge};
}
test('explicit modes, independent production switches, pinned DB and key mismatch fail closed',()=>{
 configure();assert.equal(publicPaymentRuntime().provider,'stripe_test');
 delete process.env.DYDD_PUBLIC_ASSESSMENT_STRIPE_MODE;assert.throws(()=>publicPaymentRuntime());
 configure();process.env.DYDD_PUBLIC_ASSESSMENT_STRIPE_MODE='live';assert.throws(()=>publicPaymentRuntime());
 configure('live');assert.equal(publicPaymentRuntime().provider,'stripe_live');
 process.env.DYDD_PUBLIC_ASSESSMENT_STRIPE_LIVE_KEY='sk_test_wrong';assert.throws(()=>publicPaymentRuntime());
 configure('live');delete process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_PAYMENTS_ENABLED;assert.throws(()=>publicPaymentRuntime());
 configure('live');process.env.NEXT_PUBLIC_SUPABASE_URL='https://atemrshtshxoqnuevvqu.supabase.co';assert.equal(publicAssessmentLedgerEnabled(),false);assert.throws(()=>publicPaymentRuntime());
 configure('live');delete process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_LEDGER_ENABLED;assert.equal(publicAssessmentLedgerEnabled(),false);
});
test('no implicit price/catalog fallback and sales pause does not disable webhook/reconciliation',()=>{
 configure('live');assert.throws(()=>payments.publicPaymentConfiguration('designpd'));
 process.env.DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED='false';assert.throws(()=>publicPaymentRuntime());assert.equal(publicPaymentRuntime('webhook').mode,'live');assert.equal(publicAssessmentLedgerEnabled(),true);
});
test('strict owned order/session/product/amount/source binding in both modes',()=>{
 for(const mode of ['test','live']){
  evidence(mode);assert.equal(payments.validatePublicAssessmentSession(order,session),true);
  for(const mutate of [s=>s.livemode=!s.livemode,s=>s.id='cs_other',s=>s.client_reference_id='foreign',s=>s.amount_total++,s=>s.metadata.order_id='foreign',s=>s.metadata.product='designpd',s=>s.metadata.source_id='foreign',s=>s.metadata.app='foreign',s=>s.currency='eur',s=>s.payment_status='unpaid',s=>s.status='open',s=>s.mode='subscription',s=>s.line_items.data[0].price.product='prod_other',s=>s.line_items.data[0].price.id='price_other',s=>s.line_items.data[0].quantity=2,s=>s.line_items.has_more=true,s=>s.line_items.data=[]]){
   const forged=structuredClone(session);mutate(forged);assert.throws(()=>payments.validatePublicAssessmentSession(order,forged));
  }
 }
});
test('fulfillment re-reads charge; exact amount, refunded/disputed/mode checks reject before ledger',async()=>{
 for(const mutate of [()=>charge.amount_refunded=1,()=>charge.disputed=true,()=>charge.amount++,()=>intent.amount_received--,()=>intent.currency='eur',()=>intent.livemode=true,()=>charge.payment_intent='pi_foreign']){
  evidence();mutate();await assert.rejects(()=>payments.fulfillPublicAssessmentSession('cs_fixture'));assert.equal(rpcCalls,0);
 }
});
test('same-order replay returns same ledger ID; reversal/tombstone RPC failure cannot regrant',async()=>{
 evidence('live');const a=await payments.fulfillPublicAssessmentSession('cs_fixture');const b=await payments.fulfillPublicAssessmentSession('cs_fixture');assert.equal(a.id,b.id);assert.equal(rpcCalls,2);
 reversed=true;await assert.rejects(()=>payments.fulfillPublicAssessmentSession('cs_fixture'));
 // Refund-before-completion: the ledger tombstone remains authoritative even with stale provider reads.
 evidence();reversed=true;await assert.rejects(()=>payments.fulfillPublicAssessmentSession('cs_fixture'));assert.equal(entitlement,null);
});
let fulfilled=0,revokeCalls=0,revokeError=false;
const route=load('app/api/public-assessments/stripe/webhook/route.ts',{
 '@/lib/public-assessments/payments':{fulfillPublicAssessmentSession:async()=>{fulfilled++;return {product:'designid'}}},
 '@/lib/designpd/service':{generateDesignPdForUser:async()=>{throw Error('No reporting in this test')}},
 'stripe':class extends Stripe {constructor(...args){super(...args);this.checkout.sessions.list=async()=>({data:[{id:'cs_fixture',livemode:false,metadata:{app:'dydd_public_assessments_sandbox_v1',order_id:'owned-order',user_id:'owner',product:'designid',source_id:''}}]});}},
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>({from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{id:'owned-order',user_id:'owner',product:'designid',source_snapshot_id:null},error:null})}),rpc:async(name,args)=>{assert.equal(name,'dydd_revoke_public_assessment_payment');assert.equal(args.p_provider,'stripe_test');revokeCalls++;return {data:!revokeError,error:revokeError?Error('transient'):null}}})}
});
const signingSecret='whsec_synthetic';
async function notify(body,{timestamp,signature,query=''}={}){
 const payload=JSON.stringify(body);const header=signature??Stripe.webhooks.generateTestHeaderString({payload,secret:signingSecret,timestamp});
 return route.POST(new Request('https://sandbox.invalid/api/public-assessments/stripe/webhook'+query,{method:'POST',body:payload,headers:{'stripe-signature':header}}));
}
test('actual Stripe signatures: missing/forged/stale reject; test/live mismatch rejects; signed unpaid return grants nothing',async()=>{
 configure();fulfilled=0;const event={id:'evt_fixture',type:'checkout.session.completed',livemode:false,data:{object:{id:'cs_fixture',payment_status:'paid',metadata:{app:'dydd_public_assessments_sandbox_v1'}}}};
 assert.equal((await notify(event,{signature:'forged',query:'?checkout=returned&paid=true'})).status,400);
 assert.equal((await notify(event,{timestamp:Math.floor(Date.now()/1000)-600})).status,400);
 assert.equal((await notify({...event,livemode:true})).status,400);
 const signed=Stripe.webhooks.generateTestHeaderString({payload:JSON.stringify(event),secret:signingSecret});
 assert.equal((await notify({...event,id:'tampered'},{signature:signed})).status,400);
 assert.equal(fulfilled,0);
 assert.equal((await notify({...event,data:{object:{payment_status:'unpaid'}}},{query:'?paid=true'})).status,200);assert.equal(fulfilled,0);
 assert.equal((await notify(event)).status,200);assert.equal(fulfilled,1);
});
test('signed reversal persists through sales pause; RPC failure yields retryable HTTP 500',async()=>{
 configure();process.env.DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED='false';revokeCalls=0;
 const event={id:'evt_refund',type:'charge.refunded',livemode:false,data:{object:{payment_intent:'pi_fixture'}}};
 assert.equal((await notify(event)).status,200);assert.equal(revokeCalls,1);
 revokeError=true;assert.equal((await notify(event)).status,500);revokeError=false;
});
let included=false,admin=false,phase='untracked',entitled=false;
const access=load('lib/public-assessments/access.ts',{
 '@/lib/admin-access':{isDyddAdminEmail:()=>admin},
 './included-access':{hasIncludedAssessmentAccess:async()=>included},
 '@/lib/commerce/account-access':{getPersonalMembershipState:async()=>({phase})},
 './ledger':{hasPublicAssessmentEntitlement:async()=>entitled}
});
test('production denies unpurchased entry/save gate; preserves explicit included/admin and paid standalone routing',async()=>{
 configure('live');const user={id:'fixture',email:'fixture@example.invalid'};
 assert.deepEqual(await access.standaloneDesignIdAccess(user),{allowed:false,standalone:false});
 entitled=true;assert.deepEqual(await access.standaloneDesignIdAccess(user),{allowed:true,standalone:true});entitled=false;
 included=true;assert.deepEqual(await access.standaloneDesignIdAccess(user),{allowed:true,standalone:false});included=false;
 admin=true;assert.equal((await access.standaloneDesignIdAccess(user)).allowed,true);admin=false;
 assert.equal((await access.standaloneDesignIdAccess(user)).allowed,false,'untracked production recurring memberships are never invented');
});
let ledgerResult=null;
const ledger=load('lib/public-assessments/ledger.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient:()=>({rpc:async()=>({data:ledgerResult,error:null})})}});
test('production entitlement reads reject sandbox grants; existing live/waiver rights survive paused sales',async()=>{
 configure('live');process.env.DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED='false';
 ledgerResult={id:'fixture',grant_kind:'stripe_test'};assert.equal(await ledger.hasPublicAssessmentEntitlement('owner','designid'),false);
 ledgerResult={id:'fixture',grant_kind:'stripe_live'};assert.equal(await ledger.hasPublicAssessmentEntitlement('owner','designid'),true);
 ledgerResult={id:'fixture',grant_kind:'waiver'};assert.equal(await ledger.hasPublicAssessmentEntitlement('owner','designid'),true);
 delete process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_LEDGER_ENABLED;assert.equal(await ledger.hasPublicAssessmentEntitlement('owner','designid'),false);
});
test('checkout rejects wrong provider catalog before reserving any order',async()=>{
 configure();Object.assign(process.env,{DYDD_PUBLIC_DESIGNID_TEST_STRIPE_PRICE_ID:'price_fixture',DYDD_PUBLIC_DESIGNID_TEST_STRIPE_PRODUCT_ID:'prod_fixture',DYDD_PUBLIC_DESIGNID_TEST_AMOUNT_CENTS:'1999'});
 const catalog={livemode:false,active:true,type:'one_time',currency:'usd',unit_amount:1999,product:'prod_fixture'};
 // from().insert does not exist on the fulfillment-only DB double: reaching it would fail this invariant.
 StripeDouble.prototype.prices={retrieve:async()=>catalog};
 for(const [field,value] of [['livemode',true],['active',false],['type','recurring'],['currency','eur'],['unit_amount',1],['product','prod_other']]){
  const original=catalog[field];catalog[field]=value;
  await assert.rejects(()=>payments.createPublicAssessmentCheckout({id:'owner'},'designid'),/Approved Stripe catalog mismatch/);catalog[field]=original;
 }
 await assert.rejects(()=>payments.createPublicAssessmentCheckout({id:'owner'},'designid','foreign-source'),/cannot have a source/);
});

test('website offer is exactly USD 19.99, not the separate app PD15 catalog',()=>{
 configure('live'); Object.assign(process.env,{DYDD_PUBLIC_DESIGNPD_LIVE_STRIPE_PRICE_ID:'price_fixture',DYDD_PUBLIC_DESIGNPD_LIVE_STRIPE_PRODUCT_ID:'prod_fixture'});
 for(const amount of ['1500','2000','0','1999.5']){process.env.DYDD_PUBLIC_DESIGNPD_LIVE_AMOUNT_CENTS=amount;assert.throws(()=>payments.publicPaymentConfiguration('designpd'));}
 process.env.DYDD_PUBLIC_DESIGNPD_LIVE_AMOUNT_CENTS='1999';assert.equal(payments.publicPaymentConfiguration('designpd').amount,1999);
});
test('foreign signed checkout events are ignored without grants',async()=>{
 configure();const prior=fulfilled;const response=await notify({type:'checkout.session.completed',livemode:false,data:{object:{payment_status:'paid',metadata:{app:'fruitlife'}}}});
 assert.equal(response.status,200);assert.equal(fulfilled,prior);assert.equal((await response.json()).ignored,true);
});
test('production waiver hashes are separated from sandbox hashes and no bearer code is stored',()=>{
 configure();const sandbox=ledger.hashPublicAssessmentCode('designid','fixture');configure('live');const live=ledger.hashPublicAssessmentCode('designid','fixture');assert.notEqual(sandbox,live);assert.equal(live.length,64);assert.notEqual(live,ledger.hashPublicAssessmentCode('designpd','fixture'));
});
