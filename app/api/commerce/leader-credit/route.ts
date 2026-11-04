import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertTestBilling,testBillingEnabled,validUuid } from "@/lib/commerce/test-billing-config";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
/** Selection affects the next renewal's count, never an already-settled invoice. */
export async function POST(request:Request) {
 if(!testBillingEnabled())return reply({error:"Not available"},404);
 if(request.headers.get("origin")!==new URL(request.url).origin||request.headers.get("sec-fetch-site")==="cross-site")return reply({error:"Use your account on this site"},403);
 const {data:{user}}=await(await createSupabaseServerClient()).auth.getUser();
 if(!user?.email_confirmed_at)return reply({error:"Sign in with a verified account"},401);
 try {
 assertTestBilling();
 const body=await request.json();
 if(body.leaderId!==null&&!validUuid(body.leaderId))return reply({error:"Choose a valid leader, or null to opt out"},400);
 const {error}=await createSupabaseAdminClient().rpc("dydd_test_choose_credited_leader",{p_participant:user.id,p_leader:body.leaderId});
 if(error)return reply({error:"Choose a leader of one of your accepted active Circles"},403);
 return reply({leaderId:body.leaderId,effective:"next_renewal"});
 }catch{return reply({error:"Your leader credit could not be saved"},503);}
}
export async function GET() {
 if(!testBillingEnabled())return reply({error:"Not available"},404);
 const {data:{user}}=await(await createSupabaseServerClient()).auth.getUser();
 if(!user)return reply({error:"Sign in"},401);
 try {
 assertTestBilling();const db=createSupabaseAdminClient();
 const choice=await db.from("dydd_test_leader_credits").select("leader_id").eq("participant_id",user.id).maybeSingle();
 const memberships=await db.from("dydd_circle_memberships").select("circle_id,email").eq("user_id",user.id).eq("status","accepted");
 if(choice.error||memberships.error)throw Error();
 const ids=(memberships.data||[]).map(m=>m.circle_id);
 const circles=ids.length?await db.from("journey_circle_plans").select("id,user_id,plan").in("id",ids).eq("status","active"):{data:[],error:null};
 if(circles.error)throw Error();
 const leaders=new Map<string,{leaderId:string,circleName:string}>();
 for(const circle of circles.data||[]) {
 if(circle.user_id===user.id||circle.plan?.format==="Couple")continue;
 const emails=(memberships.data||[]).filter(m=>m.circle_id===circle.id).map(m=>m.email);
 if(!(circle.plan?.participants||[]).some((p:{email?:string})=>emails.includes(p.email?.toLowerCase()||"")))continue;
 leaders.set(circle.user_id,{leaderId:circle.user_id,circleName:String(circle.plan?.name||"Circle")});
 }
 return reply({explicit:Boolean(choice.data),leaderId:choice.data?.leader_id??null,leaders:[...leaders.values()],effective:"next_renewal"});
 }catch{return reply({error:"Your leader credit could not be checked"},503);}
}
