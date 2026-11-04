import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertTestBilling, testBillingEnabled } from "./test-billing-config";
export type CircleBillingAction = "create" | "enroll" | "operate" | "read";
export type CircleBillingState = {
 phase: "active" | "transition" | "read_only" | "unpaid";
 canCreate: boolean; canEnroll: boolean; canOperate: boolean; canRead: boolean;
 paidThrough: string | null; transitionEndsAt: string | null;
 personalActive: boolean; couples: boolean;
};
/** Exact Circle authorization must precede this commercial check. Never accepts client entitlements. */
export async function getCircleBillingState(ownerId: string, circleId: string | null, format: string): Promise<CircleBillingState> {
 assertTestBilling();
 const {data,error}=await createSupabaseAdminClient().rpc("dydd_circle_billing_state",{p_owner:ownerId,p_circle:circleId,p_format:format});
 if(error||!data)throw new Error("Circle billing status could not be verified.");
 return data as CircleBillingState;
}
export const getAccountCircleBillingState=(userId:string)=>getCircleBillingState(userId,null,"Small Group");
export async function requireCircleBillingAction(ownerId:string,circleId:string|null,format:string,action:CircleBillingAction) {
 if(!testBillingEnabled())return; // Production behavior remains unchanged.
 const state=await getCircleBillingState(ownerId,circleId,format);
 const allowed=action==="read"?state.canRead:action==="create"?state.canCreate:action==="enroll"?state.canEnroll:state.canOperate;
 if(!allowed)throw new Error(state.phase==="transition"?"Your Circle is in its 30-day transition. Renew leadership before adding Circles or people.":"Renew the required membership to operate this Circle. Saved records remain available.");
}
export async function claimCoupleCircle(userId:string,circleId:string) {
 assertTestBilling();
 const db=createSupabaseAdminClient();
 const identity=await db.auth.admin.getUserById(userId);
 if(identity.error||!identity.data.user?.email)throw new Error("Verified purchasing identity required.");
 const {error}=await db.rpc("dydd_test_claim_couple",{p_user:userId,p_circle:circleId,p_owner_email:identity.data.user.email});
 if(error)throw new Error("Couples unlock belongs to one persistent two-person Circle. Restore that Circle or contact support.");
}
