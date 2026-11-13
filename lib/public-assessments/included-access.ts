import 'server-only';
import { hasIncludedPersonalAccess, hasLifetimePersonalAccess } from '@/lib/commerce/personal-access';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isSandbox } from '@/lib/environment';
/** Prior production behavior remains until an explicit assessed launch cutover.
 * Once selected, the scoped policy survives sales/ledger pauses. Never roll it back after launch.
 * Cutover requires a separately reviewed grandfather inventory; never infer membership from a report.
 * This scope affects assessment creation only, not historical artifacts or Fruitful Life 360/subscriptions.
 */
export async function hasIncludedAssessmentAccess(userId: string): Promise<boolean> {
 if (!userId) return false;
 if (!isSandbox() && process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_ACCESS_POLICY !== 'grandfathered-v1') return hasIncludedPersonalAccess(userId);
 if (await hasLifetimePersonalAccess(userId)) return true;
 const { data, error } = await createSupabaseAdminClient().from('dydd_assessment_grandfathered_access')
  .select('user_id').eq('user_id', userId).maybeSingle();
 if (error) throw Error('Your existing assessment access could not be verified. Please retry.');
 return Boolean(data);
}
