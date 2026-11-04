import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertTestBilling, testCatalog, leadershipCoupon, type TestCapability } from "./test-billing-config";
import { qualifyingTestParticipants } from "./test-entitlements";
export type TestOrder={id:string;user_id:string;capability:TestCapability;scope_id:string;price_id:string;coupon_id:string|null;checkout_session_id:string|null;status:string};
const idOf=(value: string | {id:string} | null | undefined)=>typeof value==="string"?value:value?.id;
function must<T>(r:{data:T;error:unknown}):T {if(r.error)throw new Error("TEST billing storage unavailable.");return r.data;}
async function orderFor(id:string|null|undefined) {
 if(!id)throw new Error("Missing TEST order reference.");
 const order=must(await createSupabaseAdminClient().from("dydd_test_billing_orders").select("*").eq("id",id).single()) as TestOrder;
 if(!order || testCatalog[order.capability]?.price!==order.price_id)throw new Error("Unrecognized TEST order.");
 return order;
}
async function saveEntitlement(order:TestOrder,sourceId:string,active:boolean,paid:boolean,expiresAt:string|null,checkedAt:string,invalidated=false) {
 must(await createSupabaseAdminClient().rpc("dydd_test_save_entitlement",{p_order:order.id,p_source:sourceId,
 p_active:active,p_paid:paid,p_expires:expiresAt,p_checked:checkedAt,p_invalidated:invalidated}));
}
async function invoiceIsUnrefunded(stripe:Stripe,invoice:Stripe.Invoice) {
 const payments=await stripe.invoicePayments.list({invoice:invoice.id!,status:"paid",limit:100});
 if(payments.has_more)throw new Error("TEST invoice payment evidence exceeds one page; review required.");
 let verified=invoice.amount_paid===0;
 for(const payment of payments.data) {
 if(payment.livemode!==false)throw new Error("Non-TEST invoice payment refused.");
 const piId=idOf(payment.payment.payment_intent),chargeId=idOf(payment.payment.charge);
 const pi=piId?await stripe.paymentIntents.retrieve(piId,{expand:["latest_charge"]}):null;
 if(pi && (pi.livemode!==false||pi.status!=="succeeded"))return false;
 const charge=pi && typeof pi.latest_charge==="object"?pi.latest_charge:chargeId?await stripe.charges.retrieve(chargeId):null;
 if(!charge||charge.livemode===true||charge.amount_refunded>0||charge.disputed)return false;
 verified=true;
 }
 return verified;
}
async function reconcileLeadershipRenewal(stripe:Stripe,order:TestOrder,invoiceId:string,subscriptionId:string) {
 const db=createSupabaseAdminClient();
 const previous=must(await db.from("dydd_test_billing_renewals").select("*").eq("invoice_id",invoiceId).maybeSingle());
 if(previous?.status==="applied"||previous?.status==="review")return;
 const invoice=await stripe.invoices.retrieve(invoiceId);
 if(invoice.livemode!==false)throw new Error("Non-TEST renewal refused.");
 const count=previous?.qualifying_count ?? await qualifyingTestParticipants(order.user_id),amount=count>=20?0:count>=10?1000:2000;
 // Non-editable delayed delivery is durable review, not an endless retry of impossible invoice edits.
 const audit={invoice_id:invoiceId,order_id:order.id,qualifying_count:count,expected_amount:amount,status:invoice.status==="draft"?"pending":previous?.status==="pending"&&invoice.total===amount?"applied":"review",updated_at:new Date().toISOString()};
 must(await db.from("dydd_test_billing_renewals").upsert(audit,{onConflict:"invoice_id"}));
 if(invoice.status!=="draft")return;
 // Pause automatic finalization until eligibility has been reconciled and read back.
 await stripe.invoices.update(invoiceId,{auto_advance:false},{idempotencyKey:`dydd-test-renewal-hold-${invoiceId}`});
 const coupon=leadershipCoupon(count);
 await stripe.subscriptions.update(subscriptionId,{discounts:"",proration_behavior:"none"},{idempotencyKey:`dydd-test-remove-initial-${invoiceId}`});
 const adjusted=await stripe.invoices.update(invoiceId,{discounts:coupon?[{coupon}]:""},{idempotencyKey:`dydd-test-renewal-${invoiceId}`});
 if(adjusted.livemode!==false||adjusted.currency!=="usd"||adjusted.total!==amount)throw new Error("TEST renewal amount did not match verified eligibility; invoice held for retry/review.");
 await stripe.invoices.update(invoiceId,{auto_advance:true},{idempotencyKey:`dydd-test-renewal-release-${invoiceId}`});
 must(await db.from("dydd_test_billing_renewals").update({status:"applied"}).eq("invoice_id",invoiceId));
}
export async function fulfillTestSubscription(stripe:Stripe,subscriptionId:string) {
 assertTestBilling();const checkedAt=new Date().toISOString();
 // Re-read current Stripe state: out-of-order webhook delivery cannot restore cancelled access.
 const sub=await stripe.subscriptions.retrieve(subscriptionId,{expand:["latest_invoice"]});
 if(sub.livemode!==false || sub.metadata.app!=="dydd_test")throw new Error("Non-TEST subscription refused.");
 const order=await orderFor(sub.metadata.order_id);
 if(!testCatalog[order.capability].recurring || sub.metadata.user_id!==order.user_id || sub.metadata.scope_id!==order.scope_id || sub.items.data.length!==1 || sub.items.data[0].price.id!==order.price_id)
 throw new Error("Subscription does not match this TEST order.");
 const invoice=typeof sub.latest_invoice==="object"?sub.latest_invoice:null;
 const end=sub.items.data[0].current_period_end;
 const paid=invoice?.status==="paid" && (order.capability!=="personal" || invoice.amount_paid>0) && await invoiceIsUnrefunded(stripe,invoice);
 const active=["active","canceled"].includes(sub.status) && paid && end>Date.now()/1000;
 if(order.capability==="circle_leadership" && paid && sub.discounts?.length)
 await stripe.subscriptions.update(sub.id,{discounts:"",proration_behavior:"none"},{idempotencyKey:`dydd-test-initial-discount-clear-${sub.id}`});
 must(await createSupabaseAdminClient().from("dydd_test_billing_orders").update({subscription_id:sub.id,status:order.status==="revoked"?"revoked":"paid",updated_at:new Date().toISOString()}).eq("id",order.id).neq("status","revoked"));
 await saveEntitlement(order,sub.id,active,paid,new Date(end*1000).toISOString(),checkedAt,invoice?.status==="paid"&&!paid);
}
export async function fulfillTestCheckout(stripe:Stripe,sessionId:string) {
 assertTestBilling();const checkedAt=new Date().toISOString();
 const session=await stripe.checkout.sessions.retrieve(sessionId,{expand:["line_items.data.price"]});
 if(session.livemode!==false || session.metadata?.app!=="dydd_test")throw new Error("Non-TEST checkout refused.");
 const order=await orderFor(session.metadata.order_id);
 if(session.client_reference_id!==order.user_id || session.metadata.user_id!==order.user_id ||
 session.metadata.scope_id!==order.scope_id || order.checkout_session_id!==session.id || session.line_items?.data.length!==1 ||
 session.line_items.data[0].quantity!==1 || session.line_items.data[0].price?.id!==order.price_id || session.currency!=="usd")
 throw new Error("Checkout does not match this TEST order.");
 if(session.status!=="complete")return;
 if(testCatalog[order.capability].recurring) {
 const subId=idOf(session.subscription);if(!subId)throw new Error("Missing TEST subscription.");
 await fulfillTestSubscription(stripe,subId);return;
 }
 if(session.payment_status!=="paid" || session.amount_total!==testCatalog[order.capability].amount)return;
 // Re-read refunds before granting, including retries after a charge.refunded event.
 const piId=idOf(session.payment_intent);
 if(!piId)throw new Error("Missing TEST payment intent.");
 const pi=await stripe.paymentIntents.retrieve(piId,{expand:["latest_charge"]});
 const charge=typeof pi.latest_charge==="object"?pi.latest_charge:null;
 if(pi.livemode!==false || pi.status!=="succeeded" || !charge || charge.amount_refunded>0 || charge.disputed) {
 await saveEntitlement(order,session.id,false,false,null,checkedAt);return;
 }
 must(await createSupabaseAdminClient().from("dydd_test_billing_orders").update({payment_intent_id:piId,status:order.status==="revoked"?"revoked":"paid",updated_at:new Date().toISOString()}).eq("id",order.id).neq("status","revoked"));
 await saveEntitlement(order,session.id,true,true,null,checkedAt);
}
export async function handleTestEvent(stripe:Stripe,event:Stripe.Event) {
 assertTestBilling();if(event.livemode!==false)throw new Error("LIVE events are refused by TEST billing.");
 const db=createSupabaseAdminClient();
 const seen=must(await db.from("dydd_test_billing_events").select("id").eq("id",event.id).maybeSingle());if(seen)return;
 if(["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event.type)) {
 const session=event.data.object as Stripe.Checkout.Session;
 if(session.metadata?.app==="dydd_test")await fulfillTestCheckout(stripe,session.id);
 } else if(event.type.startsWith("customer.subscription.")) {
 const sub=event.data.object as Stripe.Subscription;
 if(sub.metadata?.app==="dydd_test")await fulfillTestSubscription(stripe,sub.id);
 } else if(["invoice.paid","invoice.payment_failed","invoice.created"].includes(event.type)) {
 const invoice=event.data.object as Stripe.Invoice;
 const subId=idOf(invoice.parent?.subscription_details?.subscription);
 if(subId) {
 const sub=await stripe.subscriptions.retrieve(subId);
 if(sub.metadata.app==="dydd_test") {
 if(event.type==="invoice.created" && invoice.billing_reason==="subscription_cycle") {
 const order=await orderFor(sub.metadata.order_id);
 if(order.capability==="circle_leadership")await reconcileLeadershipRenewal(stripe,order,invoice.id!,subId);
 } else await fulfillTestSubscription(stripe,subId);
 }
 }
 } else if(event.type==="charge.refunded" || event.type==="charge.dispute.created") {
 const object=event.data.object as Stripe.Charge | Stripe.Dispute;
 const charge=event.type==="charge.refunded"?object as Stripe.Charge:await stripe.charges.retrieve(idOf((object as Stripe.Dispute).charge)!);
 const pi=idOf(charge.payment_intent);
 if(pi){
 const intent=await stripe.paymentIntents.retrieve(pi);
 if(intent.livemode!==false)throw new Error("Non-TEST refund intent refused.");
 // Refund can beat the initial fulfillment write. Resolve the immutable server-created
 // metadata, not only the association that fulfillment may not yet have saved.
 const metadataOrder=intent.metadata?.app==="dydd_test"?await orderFor(intent.metadata.order_id):null;
 if(metadataOrder && (testCatalog[metadataOrder.capability].recurring || intent.metadata.user_id!==metadataOrder.user_id || intent.metadata.scope_id!==metadataOrder.scope_id))throw new Error("Refund does not match its TEST order.");
 const invoicePayments=await stripe.invoicePayments.list({payment:{type:"payment_intent",payment_intent:pi},limit:100});
 if(invoicePayments.has_more)throw new Error("TEST refund payment associations require review.");
 for(const payment of invoicePayments.data){
 if(payment.livemode!==false)throw new Error("Non-TEST refund association refused.");
 const invoice=await stripe.invoices.retrieve(idOf(payment.invoice)!);
 const subId=idOf(invoice.parent?.subscription_details?.subscription);
 if(subId){const sub=await stripe.subscriptions.retrieve(subId);if(sub.metadata.app==="dydd_test")await fulfillTestSubscription(stripe,subId);}
 }
 const associated=must(await db.from("dydd_test_billing_orders").select("id").eq("payment_intent_id",pi));
 const orders=[...new Map([...(associated||[]),...(metadataOrder?[metadataOrder]:[])].map(order=>[order.id,order])).values()];
 for(const order of orders){must(await db.from("dydd_test_billing_orders").update({status:"revoked"}).eq("id",order.id).neq("status","revoked"));must(await db.from("dydd_test_billing_entitlements").update({active:false}).eq("order_id",order.id));}}
 }
 // Record only after fulfillment; failures return5xx and Stripe can retry. Unique source upserts make replay/concurrency safe.
 must(await db.from("dydd_test_billing_events").upsert({id:event.id,type:event.type},{onConflict:"id",ignoreDuplicates:true}));
}
