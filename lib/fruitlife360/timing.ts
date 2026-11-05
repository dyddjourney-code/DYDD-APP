import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAssessmentEligibility } from '@/lib/assessment-timing/policy';

/** Only self-only completions share this timer. Observer groups have their own round quota. */
export async function requireFruitLifeSelfEligibility(userId: string, email: string, owner = false) {
  const eligibility = await getAssessmentEligibility(userId, email, 'fruitful_self', owner);
  if (!eligibility.allowed) throw new Error(`Available again on ${eligibility.nextEligibleLabel ?? eligibility.nextEligible}.`);
  return eligibility;
}

export async function refreshFruitLifeRound(sessionId: string) {
  const { data, error } = await createSupabaseAdminClient().rpc('dydd_fruitlife_refresh_completion', { p_session_id: sessionId });
  if (error) throw new Error(error.message);
  return data === true;
}
