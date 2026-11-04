import type Stripe from 'stripe';
import {testBillingOrigin,testCatalog} from './test-billing-config';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
export async function ownedTestSubscriptions(stripe:Stripe,userId:string){
 const orders=await createSupabaseAdminClient().from('dydd_test_billing_orders').select('id,user_id,capability,subscription_id,price_id,scope_id').eq('user_id',userId).in('capability',['personal','circle_leadership']).not('subscription_id','is',null).order('created_at',{ascending:false}).limit(50);
 if(orders.error)throw Error('Subscription records unavailable');
 const ids=(orders.data||[]).map(o=>o.subscription_id).filter(Boolean);
 const saved=ids.length?await createSupabaseAdminClient().from('dydd_test_billing_entitlements').select('source_id,paid_through').eq('user_id',userId).in('source_id',ids):{data:[],error:null};
 if(saved.error)throw Error('Verified paid boundaries unavailable');
 const seen=new Set<string>(),result=[];
 for(const order of orders.data||[]){if(!order.subscription_id||seen.has(order.subscription_id))continue;seen.add(order.subscription_id);const sub=await stripe.subscriptions.retrieve(order.subscription_id);
 if(sub.livemode!==false||sub.metadata.app!=='dydd_test'||sub.metadata.user_id!==userId||sub.metadata.order_id!==order.id||sub.metadata.scope_id!==order.scope_id||sub.items.data.length!==1||sub.items.data[0].price.id!==order.price_id||testCatalog[order.capability as 'personal'|'circle_leadership'].price!==order.price_id)throw Error('Subscription identity check failed');
 result.push({order,sub,paidThrough:(saved.data||[]).find(e=>e.source_id===sub.id)?.paid_through||null});}
 return result;
}
/** Test-only configuration contains no customers, subscriptions or charges. */
export async function ensureTestPortalConfiguration(stripe:Stripe){
 let after:string|undefined;
 do{const page=await stripe.billingPortal.configurations.list({limit:100,...(after?{starting_after:after}:{})});
 const match=page.data.find(c=>c.active&&c.livemode===false&&c.metadata?.app==='dydd_test'&&c.metadata?.purpose==='circles_customer_portal_v1'&&c.features.subscription_cancel.mode==='at_period_end'&&c.features.subscription_cancel.enabled&&c.features.payment_method_update.enabled);
 if(match)return match.id;if(!page.has_more)break;after=page.data.at(-1)?.id;if(!after)throw Error('Portal pagination unavailable');}while(true);
 const config=await stripe.billingPortal.configurations.create({business_profile:{headline:'Manage your DYDD sandbox membership'},default_return_url:testBillingOrigin()+'/hq#purchases',features:{invoice_history:{enabled:true},payment_method_update:{enabled:true},subscription_cancel:{enabled:true,mode:'at_period_end'}},metadata:{app:'dydd_test',purpose:'circles_customer_portal_v1'}},{idempotencyKey:'dydd-test-circles-customer-portal-v1'});
 if(config.livemode!==false||!config.active)throw Error('TEST portal configuration required');return config.id;
}
