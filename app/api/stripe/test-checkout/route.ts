import { claimCoupleCircle } from "@/lib/commerce/circle-billing";
import { dc3PersonalCoupon } from "@/lib/commerce/dc3";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAssessmentSnapshotsForUser } from "@/lib/assessments/student-context";
import { hasLifetimePersonalAccess } from "@/lib/commerce/personal-access";
import { getTestStripe,testBillingOrigin,testCatalog,leadershipCoupon,validUuid,type TestCapability } from "@/lib/commerce/test-billing-config";
import { hasTestEntitlement,qualifyingTestParticipants } from "@/lib/commerce/test-entitlements";
export const runtime="nodejs";
const reply=(error:string,status:number)=>NextResponse.json({error},{status,headers:{"Cache-Control":"private, no-store"}});
function returnPath(capability: TestCapability, scopeId: string, status: string) {
 if(capability === "designpd") return `/designpd?snapshot=${encodeURIComponent(scopeId)}&checkout=${status}`;
 if(capability === "couples_circle") return `/camp-circle/my-circles?circle=${encodeURIComponent(scopeId)}&checkout=${status}`;
 if(capability === "circle_leadership") return `/camp-circle/my-circles?checkout=${status}`;
 return `/hq?checkout=${status}#purchases`;
}
export async function POST(request:Request) {
 try {
 const origin=testBillingOrigin();
 if(request.headers.get("origin")!==new URL(request.url).origin || request.headers.get("sec-fetch-site")==="cross-site")return reply("Open checkout from your account on this site.",403);
 const auth=await createSupabaseServerClient(),{data:{user},error:authError}=await auth.auth.getUser();
 if(authError||!user?.id||!user.email_confirmed_at)return reply("Sign in with a verified account before checkout.",401);
 if(Number(request.headers.get("content-length")||0)>4096)return reply("Checkout request is too large.",413);
 const body=await request.json(),capability=body.capability as TestCapability;
 if(!Object.hasOwn(testCatalog,capability))return reply("Choose a valid membership or add-on.",400);
 const lifetime=await hasLifetimePersonalAccess(user.id);
 if(capability==="personal" && lifetime)return reply("Personal access is already included in your lifetime grant. No payment is needed.",409);
 if(capability==="designpd" && (lifetime||isDyddAdminEmail(user.email)))return reply("DesignPD is already included in your authorized access. No payment is needed.",409);
 const db=createSupabaseAdminClient();let scopeId="account";
 if(capability==="designpd") {
 if(!validUuid(body.scopeId))return reply("Choose your saved DesignID result.",400);
 const snapshots=await getAssessmentSnapshotsForUser(user.id,user.email || "");
 if(!snapshots.all.some(s=>s.id===body.scopeId&&s.assessment_type==="designid"))return reply("This DesignID result is not available to your account.",403);
 scopeId=body.scopeId;
 } else if(capability==="couples_circle") {
 if(!validUuid(body.scopeId))return reply("Save a two-person Circle first.",400);
 const {data:circle,error}=await db.from("journey_circle_plans").select("plan,status").eq("id",body.scopeId).eq("user_id",user.id).maybeSingle();
 if(error)throw Error("Circle storage unavailable");
 if(!circle||circle.plan?.format!=="Couple"||circle.status==="archived")return reply("Choose your own two-person Circle.",403);
 scopeId=body.scopeId;
 }
 if(["circle_leadership","couples_circle"].includes(capability) && !await hasLifetimePersonalAccess(user.id) && !await hasTestEntitlement(user.id,"personal"))return reply("Start your separate personal membership first.",402);
 if(await hasTestEntitlement(user.id,capability,scopeId))return reply("This membership or add-on is already active.",409);
 const stripe=getTestStripe(),spec=testCatalog[capability];
 let dc3:string|null=null;
 try { dc3=await dc3PersonalCoupon(stripe,capability,body.discountCode); }
 catch(error) { return reply(error instanceof Error?error.message:"Invalid discount",400); }
 if(capability==="couples_circle") {
 try { await claimCoupleCircle(user.id,scopeId); }
 catch(error) { return reply(error instanceof Error?error.message:"Couples binding unavailable",409); }
 }
 // Do not start a second recurring subscription while an existing one is unpaid/past-due.
 if(spec.recurring){
 const existing=await db.from("dydd_test_billing_orders").select("subscription_id").eq("user_id",user.id).eq("capability",capability).not("subscription_id","is",null);
 if(existing.error)throw Error("TEST subscriptions could not be checked");
 for(const row of existing.data||[]){const subscription=await stripe.subscriptions.retrieve(row.subscription_id!);
 if(subscription.livemode!==false)throw Error("Non-TEST subscription refused");
 if(!["canceled","incomplete_expired"].includes(subscription.status))return reply("You already have this subscription. Resolve or cancel it before starting another.",409);}
 }
 const price=await stripe.prices.retrieve(spec.price);
 if(price.livemode!==false||!price.active||price.currency!=="usd"||price.unit_amount!==spec.amount||Boolean(price.recurring)!==spec.recurring||spec.recurring&&price.recurring?.interval!=="month")throw Error("TEST price verification failed");
 const {data:prior,error:priorError}=await db.from("dydd_test_billing_orders").select("*").eq("user_id",user.id).eq("capability",capability).eq("scope_id",scopeId).eq("status","open").maybeSingle();
 if(priorError)throw Error("TEST billing storage unavailable");
 let order=prior;
 if(prior && capability==="personal" && prior.coupon_id!==dc3)return reply("An existing checkout uses a different Personal price. Complete or let it expire before changing the discount.",409);
 if(prior?.checkout_session_id){
 const session=await stripe.checkout.sessions.retrieve(prior.checkout_session_id);
 if(session.livemode!==false)throw Error("Non-TEST checkout refused");
 if(session.status==="open"&&session.url)return NextResponse.json({url:session.url});
 if(session.status==="complete")return reply("Payment received. Your access is being confirmed; refresh access on your purchase page shortly.",409);
 const expired=await db.from("dydd_test_billing_orders").update({status:"expired"}).eq("id",prior.id);if(expired.error)throw Error("TEST billing storage unavailable");order=null;
 }
 if(!order){
 const coupon=capability==="circle_leadership"?leadershipCoupon(await qualifyingTestParticipants(user.id)):dc3;
 const inserted=await db.from("dydd_test_billing_orders").insert({user_id:user.id,capability,scope_id:scopeId,price_id:spec.price,coupon_id:coupon}).select("*").single();
 if(inserted.error?.code==="23505")return reply("Checkout is already starting in another tab. Retry in a moment.",409);
 if(inserted.error)throw Error("TEST billing storage unavailable");order=inserted.data;
 }
 const metadata={app:"dydd_test",order_id:order.id,user_id:user.id,capability,scope_id:scopeId};
 const session=await stripe.checkout.sessions.create({mode:spec.recurring?"subscription":"payment",client_reference_id:user.id,
 customer_email:user.email,metadata,line_items:[{price:spec.price,quantity:1}],payment_method_types:["card"],
 ...(spec.recurring?{subscription_data:{metadata}}:{payment_intent_data:{metadata}}),
 ...(order.coupon_id?{discounts:[{coupon:order.coupon_id}]}:{}),
 success_url:`${origin}${returnPath(capability,scopeId,"returned")}`,cancel_url:`${origin}${returnPath(capability,scopeId,"cancelled")}`,
 },{idempotencyKey:`dydd-test-checkout-${order.id}`});
 if(session.livemode!==false||!session.url)throw Error("TEST checkout URL unavailable");
 const saved=await db.from("dydd_test_billing_orders").update({checkout_session_id:session.id}).eq("id",order.id);if(saved.error)throw Error("Checkout could not be saved; retry");
 return NextResponse.json({url:session.url},{headers:{"Cache-Control":"private, no-store"}});
 } catch {return reply("TEST checkout is not configured or is temporarily unavailable. No access has been granted. Please retry after configuration is complete.",503);}
}
