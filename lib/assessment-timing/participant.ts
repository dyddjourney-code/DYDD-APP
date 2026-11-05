import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { normalizeEmail, participantEmailCandidates } from '@/lib/identity/email';
/** Claim only the verified account's own/unowned linked history; never steal a row. */
export async function claimTimingParticipant(userId: string, email: string, displayName: string) {
  const db = createSupabaseAdminClient();
  const normalized = normalizeEmail(email);
  if (!userId || !normalized) throw Error('Sign in with a verified email before starting this assessment.');
  const found = await db.from('assessment_participants').select('id,user_id,normalized_email').in('normalized_email', participantEmailCandidates(normalized));
  if (found.error) throw Error('Your assessment identity could not be checked. Please retry.');
  if (found.data?.some(row => row.user_id && row.user_id !== userId)) throw Error('This assessment history belongs to a different account. Contact support.');
  const existing = found.data?.find(row => row.user_id === userId) ?? found.data?.[0];
  if (existing) {
    const claim = db.from('assessment_participants').update({ user_id: userId, display_name: displayName, updated_at: new Date().toISOString() }).eq('id', existing.id);
    const saved = await (existing.user_id ? claim.eq('user_id', userId) : claim.is('user_id', null)).select('id').maybeSingle();
    if (saved.error || !saved.data) throw Error('Your assessment identity changed. Please retry.');
    return saved.data;
  }
  const inserted = await db.from('assessment_participants').insert({ user_id: userId, normalized_email: normalized, display_name: displayName }).select('id').single();
  if (inserted.error?.code === '23505') return claimTimingParticipant(userId, email, displayName);
  if (inserted.error || !inserted.data) throw Error('Unable to connect your assessment record. Please retry.');
  return inserted.data;
}
