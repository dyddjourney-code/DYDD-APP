import { NextRequest, NextResponse } from 'next/server';
import { publicPaymentConfiguration, fulfillPublicAssessmentSession } from '@/lib/public-assessments/payments';
import { generateDesignPdForUser } from '@/lib/designpd/service';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
export const runtime='nodejs';
export const maxDuration=120;
export async function POST(request:NextRequest) {
 const secret=process.env.DYDD_PUBLIC_ASSESSMENT_STRIPE_WEBHOOK_SECRET;
 if(process.env.DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED!=='true'||!secret)return NextResponse.json({error:'Assessment payments are not connected.'},{status:503});
 let event;
 try{event=publicPaymentConfiguration('designid').stripe.webhooks.constructEvent(await request.text(),request.headers.get('stripe-signature')||'',secret);}catch{return NextResponse.json({error:'Invalid payment notification.'},{status:400});}
 if(event.livemode!==false)return NextResponse.json({error:'Live payment events are not accepted.'},{status:400});
 try{
  if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
   const session=event.data.object;
   if(session.payment_status!=='paid')return NextResponse.json({received:true,fulfilled:false});
   const entitlement=await fulfillPublicAssessmentSession(session.id);
   if(entitlement.product==='designpd'){
    const db=createSupabaseAdminClient();const identity=await db.auth.admin.getUserById(entitlement.user_id);
    if(identity.error||!identity.data.user?.email_confirmed_at)throw Error('Verified account unavailable.');
    const form=new FormData();form.set('designIdSnapshotId',entitlement.source_snapshot_id||'');form.set('emailReport','yes');
    const snapshot=await generateDesignPdForUser(identity.data.user,form,true);
    if(snapshot)await db.from('dydd_public_assessment_orders').update({report_snapshot_id:snapshot}).eq('id',entitlement.order_id);
   }
  }else if(event.type==='checkout.session.async_payment_failed'||event.type==='checkout.session.expired'){
   const session=event.data.object;
   await createSupabaseAdminClient().from('dydd_public_assessment_orders').update({status:event.type.endsWith('expired')?'cancelled':'failed'}).eq('payment_reference',session.id).eq('status','pending');
  }else if(event.type==='charge.refunded'||event.type==='charge.dispute.created'){
   const object=event.data.object;const payment='payment_intent' in object?object.payment_intent:null;
   if(typeof payment==='string')await createSupabaseAdminClient().rpc('dydd_revoke_public_assessment_payment',{p_payment_intent:payment});
  }
  return NextResponse.json({received:true});
 }catch{return NextResponse.json({error:'Payment is not fulfilled; retry or reconcile this event.'},{status:500});}
}
