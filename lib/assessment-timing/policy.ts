import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isSandbox } from '@/lib/environment';
import { addSixCalendarMonths } from '@/lib/designid/retake-policy';
import { participantEmailCandidates } from '@/lib/identity/email';

export const assessmentTimingDays = { designid: 90, spiritual_gifts: 30, fruitful_self: 30 } as const;
export type TimedAssessment = keyof typeof assessmentTimingDays;
export type AssessmentEligibility = {
  allowed: boolean; owner: boolean; nextEligible: string | null; nextEligibleLabel: string | null;
  previousAttemptId: string | null; previousCompletedAt: string | null; previousCompletionId?: string | null;
  reason: 'first_attempt' | 'interval_elapsed' | 'reflection_interval' | 'one_use_grant' | 'legacy_override' | 'owner';
  grantId: string | null; legacyOverrideId: string | null;
};
export function timingDateLabel(value: string | null) {
  return value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'America/New_York' }).format(new Date(value)) : null;
}
/** All sandbox entry points consult the same DB history and trusted-account policy.
 * The email argument is retained for compatibility; sandbox authority comes from auth.users.
 * This branch is deliberately inactive outside the isolated sandbox runtime. */
export async function getAssessmentEligibility(userId: string, email: string, type: TimedAssessment, owner = false): Promise<AssessmentEligibility> {
  const db = createSupabaseAdminClient();
  if (isSandbox()) {
    const result = await db.rpc('dydd_assessment_eligibility', { p_user_id: userId, p_assessment_type: type, p_owner_exemption: owner });
    if (result.error || !result.data) throw Error('Unable to check assessment timing. Your saved results are unchanged. Please retry.');
    const value = result.data as Omit<AssessmentEligibility, 'nextEligibleLabel'>;
    return { ...value, nextEligibleLabel: timingDateLabel(value.nextEligible) };
  }
  // Preserve the deployed production DesignID six-calendar-month policy verbatim.
  if (type !== 'designid') return { allowed: true, owner, nextEligible: null, nextEligibleLabel: null, previousAttemptId: null, previousCompletedAt: null, reason: owner ? 'owner' : 'first_attempt', grantId: null, legacyOverrideId: null };
  const participants = await db.from('assessment_participants').select('id').or(`user_id.eq.${userId},normalized_email.in.(${participantEmailCandidates(email).join(',')})`);
  if (participants.error) throw Error('Unable to check DesignID assessment history. Please try again.');
  const ids = (participants.data ?? []).map(p => p.id);
  const history = await db.from('assessment_snapshots').select('id,created_at,source_submitted_at').eq('assessment_type', 'designid').or(`user_id.eq.${userId}${ids.length ? `,participant_id.in.(${ids.join(',')})` : ''}`).order('created_at', { ascending: false });
  if (history.error) throw Error('Unable to check DesignID assessment history. Please try again.');
  const previous = [...(history.data ?? [])].sort((a,b) => Date.parse(b.source_submitted_at ?? b.created_at) - Date.parse(a.source_submitted_at ?? a.created_at))[0];
  const completed = previous?.source_submitted_at ?? previous?.created_at ?? null;
  const next = completed ? addSixCalendarMonths(completed).toISOString() : null;
  const overrides = ids.length ? await db.from('designid_retake_overrides').select('id').in('participant_id', ids).is('used_at', null).gt('expires_at', new Date().toISOString()).limit(1) : { data: [], error: null };
  if (overrides.error) throw Error('Unable to check DesignID retake access. Please try again.');
  const legacyOverrideId = overrides.data?.[0]?.id ?? null;
  const allowed = owner || Boolean(legacyOverrideId) || !next || Date.parse(next) <= Date.now();
  return { allowed, owner, nextEligible: next, nextEligibleLabel: timingDateLabel(next), previousAttemptId: previous?.id ?? null, previousCompletedAt: completed, reason: owner ? 'owner' : legacyOverrideId ? 'legacy_override' : !previous ? 'first_attempt' : allowed ? 'interval_elapsed' : 'reflection_interval', grantId: null, legacyOverrideId };
}
export async function getAssessmentTimingForUser(userId: string, email: string, owner = false) {
  const [designid, spiritual_gifts, fruitful_self] = await Promise.all([
    getAssessmentEligibility(userId, email, 'designid', owner),
    getAssessmentEligibility(userId, email, 'spiritual_gifts', owner),
    getAssessmentEligibility(userId, email, 'fruitful_self', owner),
  ]);
  return { designid, spiritual_gifts, fruitful_self };
}
