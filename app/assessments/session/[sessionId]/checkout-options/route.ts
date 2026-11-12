import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireGuest, guestRecords } from '@/lib/public-assessments/guest';
import { isProductionGuestAssessmentCanary, publicPaymentRuntime } from '@/lib/public-assessments/config';
export const dynamic='force-dynamic';
/** Narrow owner-canary read-only acceptance diagnostics; unavailable for ordinary public guests. */
export async function GET(_request:Request,{params}:{params:Promise<{sessionId:string}>}) {
 try {
  const {sessionId}=await params,{session}=await requireGuest(sessionId);
  if(!isProductionGuestAssessmentCanary(session.capability_hash))throw Error('Unavailable');
  const runtime=publicPaymentRuntime('webhook'),stripe=new Stripe(runtime.secret);
  const configurations=await stripe.paymentMethodConfigurations.list({limit:10}).catch(()=>null);
  const records=await guestRecords(sessionId);
  const previous=await Promise.all(records.orders.filter(o=>o.payment_reference?.startsWith('cs_')).map(async o=>{
   const checkout=await stripe.checkout.sessions.retrieve(o.payment_reference);
   return {product:o.product,paymentMethodTypes:checkout.payment_method_types,status:checkout.status};
  }));
  return NextResponse.json({newGuestCheckout:{paymentMethodTypes:['card'],linkExcluded:true,eligibleCardWalletsRetained:true},previous,providerConfigurationReadable:!!configurations,configurations:(configurations?.data||[]).map(c=>({active:c.active,isDefault:c.is_default,card:c.card?.display_preference?.value,link:c.link?.display_preference?.value,applePay:c.apple_pay?.display_preference?.value,googlePay:c.google_pay?.display_preference?.value})),issuerAuthentication:'Controlled by the card issuer; not suppressed.'},{headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
 }catch{return NextResponse.json({error:'Unavailable'},{status:403,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});}
}
