import 'server-only';
import Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { publicPaymentRuntime } from './config';
import { publicPaymentConfiguration, validatePublicAssessmentSession } from './payments';
import { guestRecoveryPath, guestSessionPath } from './guest-capability';
import { guestRecords, guestSourceSnapshot, paidGuestOrder, type GuestSession, type GuestOrder } from './guest';
import { registerGuestCheckoutReminder, markGuestCheckoutResumed } from './guest-checkout-reminder';
import { scoreDesignPd } from '@/lib/designpd/engine';

export function validateGuestPayment(order:GuestOrder,session:Stripe.Checkout.Session) {
 if(session.metadata?.ownership!=='guest-v1'||session.metadata?.guest_session_id!==order.session_id||session.metadata?.user_id)throw Error('Guest payment ownership mismatch.');
 // Reuse the exact catalog/amount/session verifier without changing account validation.
 return validatePublicAssessmentSession({...order,user_id:order.session_id,source_snapshot_id:order.source_result_id},
  {...session,metadata:{...session.metadata,user_id:session.metadata.guest_session_id}});
}
export async function createGuestCheckout(session:GuestSession,token:string,product:'designid'|'designpd',sourceId?:string) {
 // No Auth identity accepted. Only an exact verified guest capability canary may bypass paused PUBLIC sales.
 const config=publicPaymentConfiguration(product,undefined,session.capability_hash);
 const records=await guestRecords(session.id);
 if(product==='designpd'){
  const source=records.results.find(r=>r.id===sourceId&&r.product==='designid');
  if(!source)throw Error('Open the private recovery link for your completed DesignID first.');
  await paidGuestOrder(session.id,source.order_id);scoreDesignPd(guestSourceSnapshot(source));
 }else if(sourceId)throw Error('DesignID cannot have a source.');
 const existing=records.orders.find(o=>o.product===product&&(o.source_result_id||null)===(sourceId||null)&&['pending','paid'].includes(o.status));
 if(existing)return resumeGuestCheckout(session,token,existing.id);
 const price=await config.stripe.prices.retrieve(config.price);
 const productId=typeof price.product==='string'?price.product:price.product.id;
 if(price.livemode!==config.livemode||!price.active||price.type!=='one_time'||price.currency!=='usd'||price.unit_amount!==1999||productId!==config.productId)throw Error('Approved Stripe catalog mismatch.');
 const db=createSupabaseAdminClient();
 const reserved=await db.rpc('dydd_guest_reserve_order',{p_session_id:session.id,p_product:product,p_source:sourceId||null,p_provider:config.provider,p_product_id:config.productId,p_price:config.price});
 if(reserved.error||!reserved.data)throw Error('A purchase or assessment timing check needs recovery. Use your existing private link or contact support before repurchasing.');
 const order={id:String(reserved.data),session_id:session.id,product,source_result_id:sourceId||null,status:'pending',payment_provider:config.provider,expected_product_id:config.productId,expected_price_id:config.price,expected_amount:1999,currency:'usd',payment_reference:''} as GuestOrder;
 return openGuestCheckout(session,token,order,config);
}
/** Resume one intent. Never replace an open or completed provider session. */
export async function resumeGuestCheckout(session:GuestSession,token:string,orderId:string) {
 const records=await guestRecords(session.id),order=records.orders.find(o=>o.id===orderId);
 if(!order)throw Error('This purchase is not available through your private link.');
 await markGuestCheckoutResumed(session.id);
 if(order.status==='paid')return guestSessionPath(session.id);
 if(order.status!=='pending')throw Error('This purchase is no longer payable. Contact DYDD if you need help.');
 if(order.product==='designpd'){
  const source=records.results.find(r=>r.id===order.source_result_id&&r.product==='designid');
  if(!source)throw Error('The completed DesignID for this purchase is unavailable.');
  await paidGuestOrder(session.id,source.order_id);scoreDesignPd(guestSourceSnapshot(source));
 }
 const config=publicPaymentConfiguration(order.product,undefined,session.capability_hash);
 if(order.payment_provider!==config.provider||order.expected_product_id!==config.productId||order.expected_price_id!==config.price)throw Error('Purchase configuration needs review; do not start another payment.');
 if(order.payment_reference){
  const checkout=await config.stripe.checkout.sessions.retrieve(order.payment_reference);
  // Bind provider identity before any reuse, fulfillment or replacement.
  if(checkout.id!==order.payment_reference||checkout.livemode!==config.livemode||checkout.mode!=='payment'||checkout.client_reference_id!==session.id||checkout.metadata?.ownership!=='guest-v1'||checkout.metadata.order_id!==order.id||checkout.metadata.guest_session_id!==session.id||checkout.metadata.product!==order.product||(checkout.metadata.source_id||'')!==(order.source_result_id||''))throw Error('Checkout identity needs review. Your purchase is preserved.');
  if(checkout.status==='complete'){
   if(checkout.payment_status==='paid'){await fulfillGuestCheckout(checkout.id);return guestSessionPath(session.id);}
   throw Error('Payment is processing. Do not pay again. Return shortly to check your saved purchase.');
  }
  if(checkout.status==='open'){
   if(!checkout.url)throw Error('Secure checkout is temporarily unavailable. Please retry this purchase.');
   return checkout.url;
  }
  if(checkout.status!=='expired'||checkout.payment_status!=='unpaid')throw Error('Payment status needs review. Do not pay again.');
 }
 return openGuestCheckout(session,token,order,config);
}
async function openGuestCheckout(session:GuestSession,token:string,order:GuestOrder,config:ReturnType<typeof publicPaymentConfiguration>) {
 const db=createSupabaseAdminClient();
 try{
  const metadata={app:config.app,ownership:'guest-v1',order_id:order.id,guest_session_id:session.id,product:order.product,source_id:order.source_result_id||''};
  const recovery=config.origin+guestRecoveryPath(session.id,token);
  // Same order + previous expired reference => same replacement in concurrent requests.
  const checkout=await config.stripe.checkout.sessions.create({mode:'payment',payment_method_types:['card'],wallet_options:{link:{display:'never'}},client_reference_id:session.id,customer_email:session.participant_email,line_items:[{price:order.expected_price_id,quantity:1}],custom_text:{submit:{message:'Digital assessment and report. All sales are final. Personal use only; no unauthorized copying or distribution. Technical help: support@discoverdivine.design.'}},metadata,payment_intent_data:{metadata,receipt_email:session.participant_email},success_url:recovery+'&product='+order.product,cancel_url:recovery+'&product='+order.product},{idempotencyKey:'dydd-guest-'+order.id+(order.payment_reference?'-after-'+order.payment_reference:'')});
  if(!checkout.url||checkout.livemode!==config.livemode)throw Error('Checkout mode mismatch.');
  let update=db.from('dydd_guest_orders').update({payment_reference:checkout.id}).eq('id',order.id).eq('session_id',session.id).eq('status','pending');
  if(order.payment_reference)update=update.eq('payment_reference',order.payment_reference);
  const saved=await update.select('id').maybeSingle();
  if(saved.error)throw Error('Checkout linkage failed.');
  if(!saved.data){
   const current=(await guestRecords(session.id)).orders.find(o=>o.id===order.id);
   if(current?.status==='paid')return guestSessionPath(session.id);
   if(current?.status!=='pending'||current.payment_reference!==checkout.id)throw Error('Checkout linkage changed.');
  }
  // Queue registration is durable only: never sends during checkout.
  try{await registerGuestCheckoutReminder(order.id,token);}catch{/* Never strand an already created secure checkout on an optional reminder failure. */}
  return checkout.url;
 }catch{
  throw Error('Your purchase is saved, but secure checkout could not be opened. Retry Resume secure checkout. If you have paid, check payment status instead; do not start a new purchase.');
 }
}

export async function fulfillGuestCheckout(sessionId:string) {
 const config=publicPaymentRuntime('webhook'),db=createSupabaseAdminClient(),stripe=new Stripe(config.secret);
 const found=await db.from('dydd_guest_orders').select('*').eq('payment_reference',sessionId).eq('payment_provider',config.provider).maybeSingle();
 if(found.error||!found.data)throw Error('Unknown guest purchase.');
 const order=found.data as GuestOrder;
 const session=await stripe.checkout.sessions.retrieve(sessionId,{expand:['line_items']});
 validateGuestPayment(order,session);
 const intentId=typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id;
 if(!intentId)throw Error('Payment intent is missing.');
 const intent=await stripe.paymentIntents.retrieve(intentId,{expand:['latest_charge']});
 const charge=typeof intent.latest_charge==='string'?await stripe.charges.retrieve(intent.latest_charge):intent.latest_charge;
 if(intent.livemode!==config.livemode||intent.status!=='succeeded'||intent.amount!==1999||intent.amount_received!==1999||intent.currency!=='usd'||!charge||charge.livemode!==config.livemode||!charge.paid||charge.refunded||charge.amount_refunded>0||charge.disputed||charge.amount!==1999||charge.currency!=='usd'||charge.payment_intent!==intentId)throw Error('Payment is not currently successful.');
 const applied=await db.rpc('dydd_guest_apply_payment',{p_order_id:order.id,p_provider:config.provider,p_reference:session.id,p_intent:intentId,p_amount:session.amount_total,p_currency:session.currency,p_price:order.expected_price_id});
 if(applied.error||applied.data!==true)throw Error('Guest payment needs recovery.');
 return order;
}
export async function reverseGuestPayment(provider:string,intent:string,session:Stripe.Checkout.Session) {
 const db=createSupabaseAdminClient();
 const found=await db.from('dydd_guest_orders').select('*').eq('payment_reference',session.id).eq('payment_provider',provider).maybeSingle();
 if(found.error)throw Error('Reversal lookup failed.');
 const o=found.data as GuestOrder|null;
 if(!o||session.metadata?.ownership!=='guest-v1'||session.metadata.order_id!==o.id||session.metadata.guest_session_id!==o.session_id||session.metadata.product!==o.product||(session.metadata.source_id||'')!==(o.source_result_id||''))return false;
 const saved=await db.rpc('dydd_guest_reverse_payment',{p_provider:provider,p_intent:intent,p_reference:session.id});
 if(saved.error||saved.data!==true)throw Error('Guest reversal needs recovery.');
 return true;
}
