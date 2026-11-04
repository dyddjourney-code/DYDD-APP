import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertTestBilling, testBillingEnabled, type TestCapability } from "./test-billing-config";
export async function hasTestEntitlement(userId:string,capability:TestCapability,scopeId="account") {
 if(!testBillingEnabled()||!userId)return false;
 assertTestBilling();
 const {data,error}=await createSupabaseAdminClient().from("dydd_test_billing_entitlements").select("active,expires_at")
 .eq("user_id",userId).eq("capability",capability).eq("scope_id",scopeId).eq("active",true);
 if(error)throw new Error("Your TEST access could not be checked. Please retry.");
 return (data||[]).some(row=>!row.expires_at || Date.parse(row.expires_at)>Date.now());
}
export async function qualifyingTestParticipants(userId:string) {
 assertTestBilling();
 const {data,error}=await createSupabaseAdminClient().rpc("dydd_test_qualifying_participants",{leader:userId});
 if(error)throw new Error("Qualifying paid participants could not be checked.");
 return Number(data||0);
}

/** Existing creator/member authorization must run first. Payments never grant Circle ownership. */
export async function hasTestCircleTools(userId:string|null,circleId:string,format:string) {
 if(!testBillingEnabled()||!userId)return true; // Validated private owner-preview remains a non-purchasing preview.
 const {getCircleBillingState}=await import("./circle-billing");
 return (await getCircleBillingState(userId,circleId,format)).canOperate;
}
