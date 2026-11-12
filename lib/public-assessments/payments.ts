import 'server-only';
import Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { publicPaymentRuntime, type VerifiedCheckoutUser } from './config';
import type { PublicAssessmentProduct } from './ledger';
import { getOwnedArtifactSnapshot } from '@/lib/assessments/artifact-access';
import { normalizeEmail } from '@/lib/identity/email';
import { scoreDesignPd } from '@/lib/designpd/engine';

/** Deliberate cutover switch. No runtime key/catalog is created or connected by this build. */
export function publicPaymentConfiguration(product: PublicAssessmentProduct, verifiedUser?: VerifiedCheckoutUser, verifiedGuestCapabilityHash?:string) {
 const runtime=publicPaymentRuntime('checkout',verifiedUser,verifiedGuestCapabilityHash);
 if(product!=='designid'&&product!=='designpd')throw Error('Unknown assessment product.');
 const prefix=product==='designid'?'DESIGNID':'DESIGNPD';
 const price=process.env[`DYDD_PUBLIC_${prefix}_${runtime.mode.toUpperCase()}_STRIPE_PRICE_ID`]||'';
 const amount=Number(process.env[`DYDD_PUBLIC_${prefix}_${runtime.mode.toUpperCase()}_AMOUNT_CENTS`]);
 const productId=process.env[`DYDD_PUBLIC_${prefix}_${runtime.mode.toUpperCase()}_STRIPE_PRODUCT_ID`]||'';
 if(!/^price_/.test(price)||!/^prod_/.test(productId)||!Number.isSafeInteger(amount)||amount!==1999)throw Error('The approved one-off price is not configured.');
 return {...runtime,stripe:new Stripe(runtime.secret),price,productId,amount,currency:'usd'};
}
export async function createPublicAssessmentCheckout(user:VerifiedCheckoutUser & {email?:string},product:PublicAssessmentProduct,sourceId?:string) {
 // Verify prerequisite before even constructing an order or contacting Stripe.
 if(product==='designpd'){
  const source=sourceId?await getOwnedArtifactSnapshot(sourceId,user.id,normalizeEmail(user.email)):null;
  if(!source)throw Error('Complete a valid DesignID first.');scoreDesignPd(source);
 }
 if(product==='designid'&&sourceId)throw Error('DesignID cannot have a source.');
 const config=publicPaymentConfiguration(product,user),db=createSupabaseAdminClient();
 const price=await config.stripe.prices.retrieve(config.price);
 const priceProduct=typeof price.product==='string'?price.product:price.product.id;
 if(price.livemode!==config.livemode||!price.active||price.type!=='one_time'||price.currency!==config.currency||price.unit_amount!==config.amount||priceProduct!==config.productId)throw Error('Approved Stripe catalog mismatch.');
 const order=await db.from('dydd_public_assessment_orders').insert({user_id:user.id,product,source_snapshot_id:sourceId??null,status:'pending',payment_provider:config.provider,expected_product_id:config.productId,expected_price_id:config.price,expected_amount:config.amount,currency:config.currency}).select('id').single();
 if(order.error||!order.data)throw Error('Unable to reserve your checkout.');
 try{
  const session=await config.stripe.checkout.sessions.create({mode:'payment',line_items:[{price:config.price,quantity:1}],client_reference_id:user.id,customer_email:user.email,custom_text:{submit:{message:'Digital assessment/report. All sales final; no refunds except as required by law. Personal use only; no unauthorized copying or distribution. Technical help: support@discoverdivine.design.'}},payment_intent_data:{receipt_email:user.email,metadata:{app:config.app,order_id:order.data.id,user_id:user.id,product,source_id:sourceId||''}},metadata:{app:config.app,order_id:order.data.id,user_id:user.id,product,source_id:sourceId||''},success_url:config.origin+'/assessments/'+product+'?checkout=returned'+(sourceId?'&sourceId='+encodeURIComponent(sourceId):''),cancel_url:config.origin+'/assessments/'+product+'?checkout=cancelled'+(sourceId?'&sourceId='+encodeURIComponent(sourceId):'')},{idempotencyKey:'dydd-public-assessment-'+order.data.id});
  if(session.livemode!==config.livemode||!session.url)throw Error('Checkout mode validation failed.');
  const saved=await db.from('dydd_public_assessment_orders').update({payment_provider:config.provider,payment_reference:session.id}).eq('id',order.data.id).eq('status','pending').select('id').single();
  if(saved.error||!saved.data)throw Error('Checkout could not be attached to your order.');
  return session.url;
 }catch{await db.from('dydd_public_assessment_orders').update({status:'failed'}).eq('id',order.data.id).eq('status','pending');throw Error('Checkout is unavailable. No access was granted.');}
}
/** Re-read signed-event session at Stripe, never trust a return URL or client payment flag. */
export async function fulfillPublicAssessmentSession(sessionId:string) {
 const runtime=publicPaymentRuntime('webhook'),db=createSupabaseAdminClient();
 const found=await db.from('dydd_public_assessment_orders').select('*').eq('payment_reference',sessionId).eq('payment_provider',runtime.provider).maybeSingle();
 if(found.error||!found.data)throw Error('Unknown assessment order.');const order=found.data;
 const config={...runtime,stripe:new Stripe(runtime.secret)};
 const session=await config.stripe.checkout.sessions.retrieve(sessionId,{expand:['line_items']});
 validatePublicAssessmentSession(order,session);
 const paymentIntentId=typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id;
 if(!paymentIntentId)throw Error('Paid payment-intent evidence is missing.');
 const intent=await config.stripe.paymentIntents.retrieve(paymentIntentId,{expand:['latest_charge']});
 const charge=typeof intent.latest_charge==='string'?await config.stripe.charges.retrieve(intent.latest_charge):intent.latest_charge;
 if(intent.livemode!==config.livemode||intent.status!=='succeeded'||!charge||charge.livemode!==config.livemode||charge.amount_refunded>0||charge.disputed||!charge.paid||charge.currency!==order.currency||charge.amount!==order.expected_amount||intent.amount!==order.expected_amount||intent.amount_received!==order.expected_amount||intent.currency!==order.currency||charge.payment_intent!==paymentIntentId)throw Error('This payment is refunded, disputed, or not currently successful.');

 const result=await db.rpc('dydd_apply_verified_public_assessment_payment',{p_provider:config.provider,p_order_id:order.id,p_provider_reference:session.id,p_amount:session.amount_total,p_currency:session.currency,p_price_id:order.expected_price_id,p_payment_intent:paymentIntentId});
 if(result.error||!result.data)throw Error('Assessment fulfillment needs recovery.');
 return result.data as {id:string;order_id:string;user_id:string;product:PublicAssessmentProduct;source_snapshot_id:string|null};
}

/** Pure evidence verifier; an event/return URL alone can never authorize access. */
export function validatePublicAssessmentSession(order: {id:string;user_id:string;product:string;source_snapshot_id:string|null;expected_amount:number;expected_price_id:string;expected_product_id?:string;payment_provider?:string;payment_reference?:string;currency:string}, session:Stripe.Checkout.Session) {
 const line=session.line_items?.data;
 const live=order.payment_provider==='stripe_live';
 const app=live?'dydd_public_assessments_live_v1':'dydd_public_assessments_sandbox_v1';
 const product=line?.[0]?.price?.product;
 const productId=typeof product==='string'?product:product?.id;
 if((live&&(!order.expected_product_id||!order.payment_reference))||(order.payment_provider&&!['stripe_test','stripe_live'].includes(order.payment_provider))||(order.payment_reference&&session.id!==order.payment_reference)||(order.expected_product_id&&productId!==order.expected_product_id)||session.livemode!==live||session.mode!=='payment'||session.payment_status!=='paid'||session.status!=='complete'||session.amount_total!==order.expected_amount||session.currency!==order.currency||session.client_reference_id!==order.user_id||session.metadata?.app!==app||session.metadata?.order_id!==order.id||session.metadata?.user_id!==order.user_id||session.metadata?.product!==order.product||(session.metadata?.source_id||'')!==(order.source_snapshot_id||'')||session.line_items?.has_more||line?.length!==1||line[0].quantity!==1||line[0].price?.id!==order.expected_price_id)throw Error('Verified payment does not match the assessment order.');
 return true;
}
