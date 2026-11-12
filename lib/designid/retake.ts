import { createSupabaseAdminClient } from '../supabase/admin';
import { normalizeEmail } from '../identity/email';
import { getOwnedAssessmentSnapshots } from '../public-assessments/identity';

import { addSixCalendarMonths } from './retake-policy';
export { addSixCalendarMonths } from './retake-policy';
export async function getDesignIdEligibility(userId: string, email: string, owner = false) {
  const client = createSupabaseAdminClient();
  const {data: participants, error: participantError} = await client.from('assessment_participants').select('id').eq('user_id',userId);
  if (participantError) throw new Error('Unable to check DesignID assessment history. Please try again.');
  const ids = (participants ?? []).map(p => p.id);
  const history = (await getOwnedAssessmentSnapshots({id:userId,email:normalizeEmail(email)},{includeGuest:true})).filter(s=>s.assessment_type==='designid');
  const previous = [...(history ?? [])].sort((a,b) => Date.parse(b.source_submitted_at ?? b.created_at) - Date.parse(a.source_submitted_at ?? a.created_at))[0];
  const nextEligible = previous ? addSixCalendarMonths(previous.source_submitted_at ?? previous.created_at) : null;
  const {data: overrides, error: overrideError} = ids.length ? await client.from('designid_retake_overrides').select('id').in('participant_id',ids).is('used_at',null).gt('expires_at',new Date().toISOString()).limit(1) : {data:[],error:null};
  if (overrideError) throw new Error('Unable to check DesignID retake access. Please try again.');
  return { allowed: owner || Boolean(overrides?.length) || !nextEligible || nextEligible.getTime() <= Date.now(), owner,
    nextEligible: nextEligible?.toISOString() ?? null,
    nextEligibleLabel: nextEligible ? new Intl.DateTimeFormat('en-US',{dateStyle:'long',timeZone:'America/New_York'}).format(nextEligible) : null,
    previousAttemptId: previous?.id ?? null,
  };
}
