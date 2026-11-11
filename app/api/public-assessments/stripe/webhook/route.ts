import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { publicPaymentRuntime } from '@/lib/public-assessments/config';
import { fulfillPublicAssessmentSession } from '@/lib/public-assessments/payments';
import { generateDesignPdForUser } from '@/lib/designpd/service';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
export const runtime='nodejs';
export const maxDuration=120;
export async function POST(request:NextRequest) {
 let config;
 try {config=publicPaymentRuntime('webhook');}catch{return NextResponse.json({error:'Assessment payments are not connected.'},{status:503});}
 const stripe=new Stripe(config.secret);
 const secret=process.env[`DYDD_PUBLIC_ASSESSMENT_STRIPE_${config.mode.toUpperCase()}_WEBHOOK_SECRET`];
 if(!secret)return NextResponse.json({error:'Assessment webhook is not connected.'},{status:503});
 let event;
 try{event=stripe.webhooks.constructEvent(await request.text(),request.headers.get('stripe-signature')||'',secret);}catch{return NextResponse.json({error:'Invalid payment notification.'},{status:400});}
 if(event.livemode!==config.livemode)return NextResponse.json({error:'Payment event mode mismatch.'},{status:400});
 try{
  if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
   const session=event.data.object;
   if(session.metadata?.app!==config.app)return NextResponse.json({received:true,ignored:true});
   if(session.payment_status!=='paid')return NextResponse.json({received:true,fulfilled:false});
   const entitlement=await fulfillPublicAssessmentSession(session.id);
   if(entitlement.product==='designpd'){
    const db=createSupabaseAdminClient();const identity=await db.auth.admin.getUserById(entitlement.user_id);
    if(identity.error||!identity.data.user?.email_confirmed_at)throw Error('Verified account unavailable.');
    const form=new FormData();form.set('designIdSnapshotId',entitlement.source_snapshot_id||'');form.set('emailReport','yes');
    const snapshot=await generateDesignPdForUser(identity.data.user,form,true);
    if(snapshot){const saved=await db.from('dydd_public_assessment_orders').update({report_snapshot_id:snapshot}).eq('id',entitlement.order_id);if(saved.error)throw Error('Report linkage needs recovery.');}
   }
  }else if(event.type==='checkout.session.async_payment_failed'||event.type==='checkout.session.expired'){
   const session=event.data.object;
   if(session.metadata?.app!==config.app)return NextResponse.json({received:true,ignored:true});
   const saved=await createSupabaseAdminClient().from('dydd_public_assessment_orders').update({status:event.type.endsWith('expired')?'cancelled':'failed'}).eq('payment_reference',session.id).eq('payment_provider',config.provider).eq('status','pending');
   if(saved.error)throw Error('Order update needs recovery.');
  }else if(event.type==='charge.refunded'||event.type==='charge.dispute.created'){
   const object=event.data.object;const payment='payment_intent' in object?object.payment_intent:null;
   if(typeof payment==='string'){
    // Shared Stripe account: foreign refunds/disputes cannot create assessment tombstones.
    // Session evidence also supports refund-before-first-fulfillment, before intent is stored locally.
    const sessions=await stripe.checkout.sessions.list({payment_intent:payment,limit:100});
    let belongs=false;
    for(const session of sessions.data){
     if(session.livemode!==config.livemode||session.metadata?.app!==config.app)continue;
     const order=await createSupabaseAdminClient().from('dydd_public_assessment_orders').select('id,user_id,product,source_snapshot_id').eq('payment_reference',session.id).eq('payment_provider',config.provider).maybeSingle();
     if(order.error)throw Error('Reversal ownership lookup needs recovery.');
     if(order.data && session.metadata?.order_id===order.data.id && session.metadata?.user_id===order.data.user_id && session.metadata?.product===order.data.product && (session.metadata?.source_id||'')===(order.data.source_snapshot_id||''))belongs=true;
    }
    if(!belongs)return NextResponse.json({received:true,ignored:true});
    const revoked=await createSupabaseAdminClient().rpc('dydd_revoke_public_assessment_payment',{p_payment_intent:payment,p_provider:config.provider});
    if(revoked.error||revoked.data!==true)throw Error('Payment reversal needs recovery.');
   }
  }
  return NextResponse.json({received:true});
 }catch{return NextResponse.json({error:'Payment is not fulfilled; retry or reconcile this event.'},{status:500});}
}
