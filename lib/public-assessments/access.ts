import { isDyddAdminEmail } from '@/lib/admin-access';
import { hasIncludedAssessmentAccess } from './included-access';
import { hasPublicAssessmentEntitlement } from './ledger';
/** Report-only grants never imply membership or course rights. */
export async function standaloneDesignIdAccess(user:{id:string;email?:string|null}) {
 if (isDyddAdminEmail(user.email) || await hasIncludedAssessmentAccess(user.id)) return {allowed:true,standalone:false};
 const allowed=await hasPublicAssessmentEntitlement(user.id,'designid');
 return {allowed,standalone:allowed};
}
