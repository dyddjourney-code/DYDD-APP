import { getCircleBillingState, getAccountCircleBillingState } from "@/lib/commerce/circle-billing";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { testBillingEnabled, validUuid } from "@/lib/commerce/test-billing-config";
import { hasLifetimePersonalAccess } from "@/lib/commerce/personal-access";
import { hasTestEntitlement, qualifyingTestParticipants } from "@/lib/commerce/test-entitlements";
const reply = (body: unknown, status = 200) => NextResponse.json(body, {status, headers:{"Cache-Control":"private, no-store"}});
export async function GET(request: Request) {
 if (!testBillingEnabled()) return reply({error:"TEST billing disabled"},404);
 const {data:{user}} = await (await createSupabaseServerClient()).auth.getUser();
 if (!user) return reply({error:"Sign in to purchase. Preview does not create a purchasing account."},401);
 try {
  const scope = new URL(request.url).searchParams.get("circleId");
  let circle = null;
  if (scope) {
   if (!validUuid(scope)) return reply({error:"Invalid Circle"},400);
   const result = await createSupabaseAdminClient().from("journey_circle_plans").select("id,plan,status").eq("id",scope).eq("user_id",user.id).neq("status","archived").maybeSingle();
   if (result.error) throw Error("Circle unavailable");
   if (!result.data) return reply({error:"Choose your own saved Circle before purchasing."},403);
   circle = result.data;
  }
  const lifetime = await hasLifetimePersonalAccess(user.id);
  const [personal, leadership, count, couples] = await Promise.all([
   hasTestEntitlement(user.id,"personal"), hasTestEntitlement(user.id,"circle_leadership"),
   qualifyingTestParticipants(user.id), circle?.plan?.format === "Couple" ? hasTestEntitlement(user.id,"couples_circle",circle.id) : false,
  ]);
  const renewals = await createSupabaseAdminClient().from("dydd_test_billing_renewals").select("invoice_id,dydd_test_billing_orders!inner(user_id)").eq("dydd_test_billing_orders.user_id",user.id).eq("status","review");
  if (renewals.error) throw Error("Renewal status unavailable");
  const billing=circle?await getCircleBillingState(user.id,circle.id,circle.plan?.format):await getAccountCircleBillingState(user.id);
  return reply({billing,upcomingLeadershipAmount:count>=20?0:count>=10?1000:2000,renewalReview:Boolean(renewals.data?.length),personal:personal || lifetime,lifetime,leadership,count,couples,verified:Boolean(user.email_confirmed_at),circleFormat:circle?.plan?.format});
 } catch { return reply({error:"Your access could not be checked. Please refresh before purchasing."},503); }
}
