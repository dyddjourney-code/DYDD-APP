import { NextResponse } from "next/server";
import { getTestStripe,assertTestBilling } from "@/lib/commerce/test-billing-config";
import { handleTestEvent } from "@/lib/commerce/test-billing";
export const runtime="nodejs";
export async function POST(request:Request) {
 try{assertTestBilling();}catch{return NextResponse.json({error:"TEST billing disabled"},{status:404});}
 const secret=process.env.STRIPE_DYDD_TEST_WEBHOOK_SECRET;
 if(!secret?.startsWith("whsec_"))return NextResponse.json({error:"TEST webhook not configured"},{status:503});
 const signature=request.headers.get("stripe-signature");if(!signature)return NextResponse.json({error:"Missing signature"},{status:400});
 const body=await request.text();if(body.length>1048576)return NextResponse.json({error:"Webhook too large"},{status:413});
 let event,stripe;
 try {stripe=getTestStripe();}catch{return NextResponse.json({error:"TEST runtime key not configured"},{status:503});}
 try{event=stripe.webhooks.constructEvent(body,signature,secret);}catch{return NextResponse.json({error:"Invalid webhook signature"},{status:400});}
 if(event.livemode!==false)return NextResponse.json({error:"LIVE event refused"},{status:400});
 try{await handleTestEvent(stripe,event);return NextResponse.json({received:true});}
 catch{return NextResponse.json({error:"TEST fulfillment failed; retry delivery"},{status:500});}
}
