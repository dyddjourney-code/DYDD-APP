import "server-only";
import { NextResponse } from "next/server";
import { isSandbox } from "@/lib/environment";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasTestCircleTools } from "@/lib/commerce/test-entitlements";
import { savedDesignId, savedGifts } from "@/lib/circles/data";
import { eligibleCoupleCapacity, type CoupleSharedMember } from "@/lib/circles/couples-shared";
export const dynamic="force-dynamic";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
type Snapshot={id:string;user_id:string|null;participant_id:string|null;assessment_type:string;scores:Record<string,unknown>;created_at:string;source_submitted_at:string|null};
/** This is a minimal consented shared projection, never a personal report endpoint. */
export async function GET(request:Request){
 if(!isSandbox())return reply({error:"Not found."},404);
 try{
  const supabase=await createSupabaseServerClient(),user=(await supabase.auth.getUser()).data.user;
  if(!user?.email_confirmed_at)return reply({error:"Sign in with your verified account to view shared Couples results."},401);
  const id=new URL(request.url).searchParams.get("circleId");if(!id||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))return reply({error:"Choose your Couples Circle."},400);
  const db=createSupabaseAdminClient();
  const plan=await db.from("journey_circle_plans").select("id,user_id,status,plan").eq("id",id).maybeSingle();if(plan.error)throw Error();
  if(!plan.data||plan.data.plan?.format!=="Couple"||!plan.data.user_id)return reply({error:"Couples Circle unavailable."},404);
  const memberships=await db.from("dydd_circle_memberships").select("user_id,display_name").eq("circle_id",id).eq("status","accepted");if(memberships.error)throw Error();
  const ids=[...new Set([plan.data.user_id,...(memberships.data||[]).map(m=>m.user_id).filter(Boolean)])] as string[];
  if(!ids.includes(user.id))return reply({error:"This Couples Circle is not available to your account."},403);
  if(ids.length>2)return reply({error:"This Circle needs a two-person capacity correction before shared results can open."},409);
  if(plan.data.status!=="active"||!await hasTestCircleTools(plan.data.user_id,id,"Couple"))return reply({members:[],pending:"Activate this two-person Circle and its Couples unlock before sharing results."});
  const consent=await db.from("dydd_circle_consents").select("user_id,people,insights").eq("circle_id",id).in("user_id",ids);if(consent.error)throw Error();
  const byConsent=new Map((consent.data||[]).map(c=>[c.user_id,c]));
  // Both spouses opt in independently. Revocation immediately closes the shared comparison.
  if(ids.length!==2||ids.some(uid=>byConsent.get(uid)?.insights!==true))return reply({members:[],consented:byConsent.get(user.id)?.insights===true,pending:"Waiting for both accepted partners to explicitly consent to insight sharing for this Circle. No private reports are disclosed."});
  const participants=await db.from("assessment_participants").select("id,user_id").in("user_id",ids);if(participants.error)throw Error();
  const owners=new Map((participants.data||[]).map(p=>[p.id,p.user_id]));
  const fields="id,user_id,participant_id,assessment_type,scores,created_at,source_submitted_at";
  const direct=await db.from("assessment_snapshots").select(fields).in("user_id",ids).in("assessment_type",["designid","spiritual_gifts"]).order("created_at",{ascending:false}).limit(1000);if(direct.error)throw Error();
  const linked=owners.size?await db.from("assessment_snapshots").select(fields).in("participant_id",[...owners.keys()]).in("assessment_type",["designid","spiritual_gifts"]).order("created_at",{ascending:false}).limit(1000):{data:[],error:null};if(linked.error)throw Error();
  const rows=[...new Map([...(direct.data||[]),...(linked.data||[])].map(r=>[r.id,r])).values()] as Snapshot[];
  const complete=rows.filter(r=>r.scores?.completed!==false&&!['draft','pending','in_progress','incomplete'].includes(String(r.scores?.status||'').toLowerCase())).sort((a,b)=>Date.parse(b.source_submitted_at||b.created_at)-Date.parse(a.source_submitted_at||a.created_at)||Date.parse(b.created_at)-Date.parse(a.created_at));
  const members:CoupleSharedMember[]=ids.map((uid,index)=>{
   const eligible=complete.filter(r=>{const owner=r.participant_id?owners.get(r.participant_id):null;if(r.participant_id&&(!owner||r.user_id&&r.user_id!==owner))return false;return (r.user_id||owner)===uid;});
   const design=eligible.find(r=>r.assessment_type==="designid"),gifts=eligible.find(r=>r.assessment_type==="spiritual_gifts");
   const member=(memberships.data||[]).find(m=>m.user_id===uid);
   const name=uid===user.id?"You":byConsent.get(uid)?.people&&member?.display_name?member.display_name:`Partner ${index+1}`;
   return {id:uid,name,designId:design?eligibleCoupleCapacity(savedDesignId(design.scores).designId):null,gifts:gifts?savedGifts(gifts.scores):[]};
  });
  return reply({members,consented:true,pending:members.some(m=>!m.designId||!m.gifts.length)?"Both partners consented. Some saved results are still pending; available results appear below.":undefined});
 }catch{return reply({error:"Shared results could not be checked. Your private reports have not been opened."},503);}
}

/** Both accepted partners may edit shared scheduling, never identities/results/rosters. */
// One shared-logistics mutation implementation for both route entry points.
export { POST } from "../shared-plan/route";
