const assert = require('node:assert/strict');
const user = '11111111-1111-4111-8111-111111111111';
const end = Math.floor(Date.now()/1000)+86400, start=end-2592000;
let mutations=0,mode='valid',cancelled=false,lastOptions;
const product={id:'prod_personal',active:true,livemode:true,metadata:{app:'dydd',capability:'personal'}};
const price={id:'price_personal',active:true,livemode:true,unit_amount:1000,currency:'usd',type:'recurring',recurring:{interval:'month',interval_count:1,usage_type:'licensed'},product};
const sub=()=>({id:'sub_owned',livemode:mode!=='test',metadata:{app:'dydd',capability:mode==='circle'?'circle_leadership':'personal',user_id:mode==='foreign'?'other':user},status:'active',customer:'cus_owned',items:{has_more:false,data:[{quantity:1,price,current_period_end:end,current_period_start:start}]},latest_invoice:'in_paid',cancel_at_period_end:cancelled,collection_method:'charge_automatically'});
class Stripe { constructor(){this.prices={retrieve:async()=>({...price,unit_amount:mode==='wrong-price'?2000:1000})};this.subscriptions={search:async()=>({has_more:false,data:mode==='none'?[]:mode==='multiple'?[sub(),sub()]:[sub()]}),retrieve:async()=>sub(),update:async(id,body,options)=>{mutations++;assert.deepEqual(body,{cancel_at_period_end:true});lastOptions=options;cancelled=true;return sub()}};this.customers={retrieve:async()=>({id:'cus_owned',livemode:true,metadata:{app:'dydd',user_id:mode==='foreign-customer'?'other':user}})};this.invoices={retrieve:async()=>({livemode:true,status:mode==='unpaid'?'open':'paid',customer:'cus_owned',lines:{has_more:false,data:[{parent:{type:'subscription_item_details',subscription_item_details:{subscription:'sub_owned'}},pricing:{price_details:{price:'price_personal'}},period:{start,end}}]}})}} }
process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='production';process.env.STRIPE_SECRET_KEY='sk_live_fixture';process.env.STRIPE_PERSONAL_PRICE_ID='price_personal';process.env.STRIPE_PERSONAL_PRODUCT_ID='prod_personal';
const load=require('../scripts/fruitlife-test-load.cjs');
const service=load('lib/commerce/personal-subscription.ts',{stripe:Stripe});
(async()=>{
 for(const value of ['test','foreign','foreign-customer','circle','wrong-price','multiple']){mode=value;assert.equal((await service.getPersonalSubscription(user)).state,'unavailable',value);await assert.rejects(()=>service.cancelPersonalSubscription(user,new Date(end*1000).toISOString()));}assert.equal(mutations,0);
 mode='none';assert.equal((await service.getPersonalSubscription(user)).state,'none');
 mode='unpaid';const unpaid=await service.getPersonalSubscription(user);assert.equal(unpaid.paidThrough,null);assert.equal(unpaid.canCancel,false);assert.equal(unpaid.nextBillAt,null);
 mode='valid';const summary=await service.getPersonalSubscription(user);assert.equal(summary.paidThrough,new Date(end*1000).toISOString());assert.equal(summary.nextBillAt,summary.paidThrough);assert.equal(summary.canCancel,true);
 await assert.rejects(()=>service.cancelPersonalSubscription(user,new Date((end+1)*1000).toISOString()));assert.equal(mutations,0);
 const result=await service.cancelPersonalSubscription(user,summary.paidThrough);assert.equal(result.cancelAtPeriodEnd,true);assert.equal(result.nextBillAt,null);assert.equal(result.paidThrough,summary.paidThrough);assert.match(lastOptions.idempotencyKey,/^[a-f0-9]{64}$/);
 await service.cancelPersonalSubscription(user,summary.paidThrough);assert.equal(mutations,1);
 delete process.env.STRIPE_PERSONAL_PRICE_ID;assert.equal((await service.getPersonalSubscription(user)).state,'unavailable');
 delete process.env.STRIPE_PERSONAL_PRODUCT_ID;assert.equal((await service.getPersonalSubscription(user)).state,'current');
 mode='circle';assert.equal((await service.getPersonalSubscription(user)).state,'unavailable');
 delete process.env.STRIPE_SECRET_KEY;assert.equal((await service.getPersonalSubscription(user)).state,'unavailable');
 console.log('PASS Personal catalog, live mode, user/customer ownership, scope, ambiguity, paid invoice boundary, stale confirmation, cancellation and idempotency');
})().catch(e=>{console.error(e);process.exitCode=1});
