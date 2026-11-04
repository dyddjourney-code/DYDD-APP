import {NextResponse} from 'next/server';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {testBillingEnabled,getTestStripe,testBillingOrigin,validUuid} from '@/lib/commerce/test-billing-config';
import {ownedTestSubscriptions,ensureTestPortalConfiguration} from '@/lib/commerce/test-subscriptions';
import {fulfillTestSubscription} from '@/lib/commerce/test-billing';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function actor(){return (await(await createSupabaseServerClient()).auth.getUser()).data.user;}
export async function GET(){
 if(!testBillingEnabled())return reply({error:'Not found'},404);const user=await actor();if(!user?.email_confirmed_at)return reply({error:'Sign in with a verified account.'},401);
 try{const rows=await ownedTestSubscriptions(getTestStripe(),user.id);return reply({subscriptions:rows.filter(r=>!['canceled','incomplete_expired'].includes(r.sub.status)).map(({order,sub,paidThrough})=>({capability:order.capability,status:sub.status,cancelPending:sub.cancel_at_period_end,paidThrough}))});}catch{return reply({error:'Your subscription settings could not be checked.'},503);}
}
export async function POST(request:Request){
 if(!testBillingEnabled())return reply({error:'Not found'},404);
 if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Use your account on this site.'},403);
 const user=await actor();if(!user?.email_confirmed_at)return reply({error:'Sign in with a verified account.'},401);
 try{const raw=await request.text();if(raw.length>2000)return reply({error:'Request too large.'},413);let body;try{body=JSON.parse(raw);}catch{return reply({error:'Check the subscription action.'},400);}
 if(!['personal','circle_leadership'].includes(body.capability)||!['cancel_at_period_end','resume','portal'].includes(body.action)||!validUuid(body.requestId))return reply({error:'Choose a valid subscription action.'},400);
 const stripe=getTestStripe(),rows=await ownedTestSubscriptions(stripe,user.id),row=rows.find(r=>r.order.capability===body.capability&&!['canceled','incomplete_expired'].includes(r.sub.status));if(!row)return reply({error:'No current subscription of that type belongs to this account.'},404);
 if(body.action==='portal'){const customer=typeof row.sub.customer==='string'?row.sub.customer:row.sub.customer?.id;if(!customer)throw Error();const configuration=await ensureTestPortalConfiguration(stripe);const session=await stripe.billingPortal.sessions.create({customer,configuration,return_url:testBillingOrigin()+'/hq#purchases'});const url=new URL(session.url);if(url.protocol!=='https:'||url.hostname!=='billing.stripe.com')throw Error();return reply({url:session.url});}
 await stripe.subscriptions.update(row.sub.id,{cancel_at_period_end:body.action==='cancel_at_period_end',proration_behavior:'none'},{idempotencyKey:`dydd-test-subscription-${row.sub.id}-${body.action}-${body.requestId}`});
 await fulfillTestSubscription(stripe,row.sub.id);return reply({saved:true,cancelPending:body.action==='cancel_at_period_end',paidThrough:row.paidThrough});
 }catch{return reply({error:'Your TEST subscription settings could not be updated. Your saved work is preserved.'},503);}
}
