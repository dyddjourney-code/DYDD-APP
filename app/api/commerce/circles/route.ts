import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCircleBillingState, getAccountCircleBillingState } from "@/lib/commerce/circle-billing";
import { testBillingEnabled,validUuid } from "@/lib/commerce/test-billing-config";
import { qualifyingTestParticipants } from "@/lib/commerce/test-entitlements";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:Request) {
 if(!testBillingEnabled())return reply({error:"Not available"},404);
 const {data:{user}}=await(await createSupabaseServerClient()).auth.getUser();
 if(!user)return reply({error:"Sign in"},401);
 try {
 const id=new URL(request.url).searchParams.get("circleId");
 let billing;
 if(id) {
 if(!validUuid(id))return reply({error:"Invalid Circle"},400);
 const {data,error}=await createSupabaseAdminClient().from("journey_circle_plans").select("id,user_id,plan").eq("id",id).eq("user_id",user.id).maybeSingle();
 if(error)throw error;
 if(!data)return reply({error:"Choose your own Circle"},403);
 billing=await getCircleBillingState(user.id,id,data.plan?.format);
 } else billing=await getAccountCircleBillingState(user.id);
 const qualifyingCount=await qualifyingTestParticipants(user.id);
 return reply({billing,qualifyingCount,upcomingLeadershipAmount:qualifyingCount>=20?0:qualifyingCount>=10?1000:2000,currency:"usd",evaluatedAt:"monthly_renewal"});
 } catch {return reply({error:"Billing status unavailable"},503);}
}
