import 'server-only';
import { hasIncludedAssessmentAccess } from './included-access';

/** Completion remains a prerequisite, never a school/course entitlement.
 * Reuse the explicit launch grandfather inventory and existing lifetime rights,
 * not sandbox membership or a paid public-assessment entitlement. The shared
 * policy preserves pre-cutover production behavior until explicit grandfathered-v1 selection;
 * launch must freeze the grandfather inventory BEFORE enabling public sales.
 * Neither checkout, waiver redemption nor report completion may add that right.
 * Gifts and FruitLife retain their existing course policy.
 */
export async function hasAssessmentCourseCapability(
  userId: string,
  courseSlug: string,
): Promise<boolean> {
  if (!['designid-foundations', 'designpd-alignment'].includes(courseSlug)) return true;
  if (!userId) return false;
  return hasIncludedAssessmentAccess(userId);
}
