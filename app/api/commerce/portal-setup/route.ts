import {NextResponse} from 'next/server';
import {operationActor} from '@/lib/circles/operations';
import {testBillingEnabled,getTestStripe} from '@/lib/commerce/test-billing-config';
import {ensureTestPortalConfiguration} from '@/lib/commerce/test-subscriptions';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
/** Owner-only runtime readiness/setup. Creates no customer, subscription or charge. */
export async function POST(request:Request){
 if(!testBillingEnabled())return reply({error:'Not found'},404);
 if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Open the owner console on this site.'},403);
 const actor=await operationActor();if(!actor)return reply({error:'Verified owner account required.'},401);if(!actor.owner)return reply({error:'Owner approval required.'},403);
 try{const stripe=getTestStripe(),id=await ensureTestPortalConfiguration(stripe),config=await stripe.billingPortal.configurations.retrieve(id);if(config.livemode!==false||!config.active||config.features.subscription_cancel.mode!=='at_period_end')throw Error();return reply({ready:true,id,livemode:false,cancelMode:config.features.subscription_cancel.mode,paymentMethodUpdate:config.features.payment_method_update.enabled,noCustomersOrPayments:true});}catch(error){const e=error as {statusCode?:number;code?:string};return reply({error:'TEST billing-portal configuration could not be verified.',providerStatus:e.statusCode||null,providerCode:e.code||null},503);}
}
