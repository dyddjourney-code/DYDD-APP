const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
const {validatePublicAssessmentSession,publicPaymentConfiguration}=load('lib/public-assessments/payments.ts');
const order={id:'order',user_id:'owner',product:'designpd',source_snapshot_id:'owned-designid',expected_amount:1500,expected_price_id:'price_expected',currency:'usd'};
const original={livemode:false,mode:'payment',payment_status:'paid',status:'complete',amount_total:1500,currency:'usd',client_reference_id:'owner',metadata:{app:'dydd_public_assessments_sandbox_v1',order_id:'order',user_id:'owner',product:'designpd',source_id:'owned-designid'},line_items:{has_more:false,data:[{quantity:1,price:{id:'price_expected'}}]}};
assert.equal(validatePublicAssessmentSession(order,original),true);
let checks=1;
for(const [field,value]of [['livemode',true],['mode','subscription'],['payment_status','unpaid'],['status','open'],['amount_total',1],['currency','eur'],['client_reference_id','foreign']]){const s=structuredClone(original);s[field]=value;assert.throws(()=>validatePublicAssessmentSession(order,s));checks++;}
for(const [field,value]of [['app','foreign-app'],['order_id','foreign-order'],['user_id','foreign'],['product','designid'],['source_id','foreign-source']]){const s=structuredClone(original);s.metadata[field]=value;assert.throws(()=>validatePublicAssessmentSession(order,s));checks++;}
for(const transform of [s=>s.line_items.has_more=true,s=>s.line_items.data=[],s=>s.line_items.data.push(s.line_items.data[0]),s=>s.line_items.data[0].quantity=2,s=>s.line_items.data[0].price.id='price_wrong',s=>s.line_items.data[0].price=null]){const s=structuredClone(original);transform(s);assert.throws(()=>validatePublicAssessmentSession(order,s));checks++;}
delete process.env.DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED;assert.throws(()=>publicPaymentConfiguration('designid'));checks++;
process.env.DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED='true';process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';process.env.STRIPE_DYDD_TEST_KEY='sk_live_synthetic_NOT_A_KEY';assert.throws(()=>publicPaymentConfiguration('designid'));checks++;
console.log(`PASS ${checks} payment evidence/configuration guards; no Stripe/provider calls.`);
