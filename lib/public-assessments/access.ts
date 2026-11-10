import { isSandbox } from '@/lib/environment';
import { isDyddAdminEmail } from '@/lib/admin-access';
import { hasIncludedPersonalAccess } from '@/lib/commerce/personal-access';
import { getPersonalMembershipState } from '@/lib/commerce/account-access';
import { hasPublicAssessmentEntitlement } from './ledger';
/** One-off access does not grant membership or courses. Existing paid/included access remains. */
export async function standaloneDesignIdAccess(user:{id:string;email?:string|null}) {
 if(!isSandbox()||isDyddAdminEmail(user.email)||await hasIncludedPersonalAccess(user.id))return {allowed:true,standalone:false};
 const membership=await getPersonalMembershipState(user.id);
 if(membership.phase==='active'||membership.phase==='lifetime')return {allowed:true,standalone:false};
 const allowed=await hasPublicAssessmentEntitlement(user.id,'designid');
 return {allowed,standalone:allowed};
}
