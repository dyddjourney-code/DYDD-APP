import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
import {getAssessmentSnapshotsForUser} from "@/lib/assessments/student-context";
import {testBillingEnabled} from "@/lib/commerce/test-billing-config";
import {hasTestEntitlement,qualifyingTestParticipants} from "@/lib/commerce/test-entitlements";
import {TestCheckoutButton} from "./checkout-button";
export const dynamic="force-dynamic";
export default async function Memberships({searchParams}:{searchParams:Promise<{checkout?:string}>}){
 if(!testBillingEnabled())notFound();
 const {data:{user}}=await(await createSupabaseServerClient()).auth.getUser();
 if(!user)redirect("/login?next=%2Fmemberships");
 const params=await searchParams;
 const db=createSupabaseAdminClient(),reports=await getAssessmentSnapshotsForUser(user.id,user.email || "");
 const circles=await db.from("journey_circle_plans").select("id,plan").eq("user_id",user.id).neq("status","archived");
 if(circles.error)throw Error("Your Circle choices could not be loaded.");
 const designIds=reports.all.filter(r=>r.assessment_type==="designid");
 const couples=(circles.data||[]).filter(c=>c.plan?.format==="Couple");
 const designAccess=await Promise.all(designIds.map(async r=>({...r,unlocked:await hasTestEntitlement(user.id,"designpd",r.id)})));
 const coupleAccess=await Promise.all(couples.map(async c=>({...c,unlocked:await hasTestEntitlement(user.id,"couples_circle",c.id)})));
 const renewals=await db.from("dydd_test_billing_renewals").select("invoice_id,dydd_test_billing_orders!inner(user_id)").eq("dydd_test_billing_orders.user_id",user.id).eq("status","review");
 if(renewals.error)throw Error("Your TEST renewal status could not be loaded.");
 const personal=await hasTestEntitlement(user.id,"personal"),leadership=await hasTestEntitlement(user.id,"circle_leadership"),count=await qualifyingTestParticipants(user.id);
 return <main className="fruitlife-shell"><section className="fruitlife-panel">
 <p className="section-label">Sandbox · Stripe TEST mode</p><h1 style={{fontSize:"clamp(1.75rem,5vw,2.75rem)",overflowWrap:"normal",wordBreak:"normal"}}>Memberships & add-ons</h1>
 <p>These purchases use Stripe test payments and unlock only your isolated sandbox account. No real charges.</p>
 <p><Link href="/base-camp">Back to Base Camp</Link> · <Link href="/camp-circle">My Circles</Link></p>
 {params.checkout==="returned"?<p role="status">You returned from Stripe. Access appears after the verified payment notification arrives. Returning here never grants access. <Link href="/memberships">Refresh access</Link></p>:null}
 {params.checkout==="cancelled"?<p role="status">Checkout cancelled. No new access was granted.</p>:null}
 {renewals.data?.length?<p role="alert">A TEST leadership renewal needs billing review because its invoice was already finalized before eligibility could be applied. Your personal membership is unchanged.</p>:null}
 <h2>Personal · $10/month</h2><p>{personal?"Active TEST personal membership.":"Your own personal membership, separate from leadership and add-ons."}</p>
 {!personal?<TestCheckoutButton capability="personal" label="Start personal · $10/month"/>:null}
 <h2>Circle Leadership · additional $20/month</h2><p>{leadership?"Active TEST leadership membership. ":""}{count} qualifying paid participants. Your next renewal price at this count: ${count>=20?0:count>=10?10:20}/month. Rechecked at renewal; your personal membership stays separate.</p>
 {!leadership?<TestCheckoutButton capability="circle_leadership" label="Start leadership membership"/>:null}
 <h2>Couples Circle · $5 once per couple</h2><p>Save a two-person Circle first. This unlock applies to that Circle only. Both people still need their own personal membership.</p>
 {coupleAccess.map(c=><div key={c.id}><h3>{c.plan.name||"Couples Circle"}</h3>{c.unlocked?<p>Unlocked in TEST mode. <Link href="/camp-circle/my-circles">Open My Circles</Link></p>:<TestCheckoutButton capability="couples_circle" scopeId={c.id} label="Unlock this couple · $5 once"/>}</div>)}
 {!coupleAccess.length?<p><Link href="/camp-circle">Save a Couples Circle draft</Link></p>:null}
 <h2>DesignPD · $15 per saved DesignID result</h2><p>Your purchased result-specific expansion includes its report and supporting course. A new DesignID result needs its own unlock. This does not change assessment scoring or prerequisites.</p>
 {designAccess.map(r=><div key={r.id}><h3>DesignID · {new Date(r.created_at).toLocaleDateString("en-US")}</h3>{r.unlocked?<p>Unlocked in TEST mode. <Link href={`/designpd?snapshot=${r.id}`}>Open this result’s DesignPD</Link></p>:<TestCheckoutButton capability="designpd" scopeId={r.id} label="Unlock this DesignID result · $15 once"/>}</div>)}
 {!designAccess.length?<p><Link href="/designid">Complete DesignID first</Link></p>:null}
 <p><Link href="/designpd">Open DesignPD</Link></p>
 </section></main>;
}
