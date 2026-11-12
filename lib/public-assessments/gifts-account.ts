import 'server-only';
import type { AssessmentSnapshotSummary } from '@/lib/assessments/student-context';
import { createHash } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type GiftsSnapshot = { id: string; assessment_type: string; user_id?: string | null; scores?: Record<string, unknown> | null };
export async function linkCurrentPublicGiftsToAccount(sessionId: string, token: string) {
  const { data: { user }, error } = await (await createSupabaseServerClient()).auth.getUser();
  if (error || !user?.email_confirmed_at || !user.email || user.is_anonymous) throw Error('Sign in to a verified account first.');
  if (!/^[0-9a-f-]{36}$/i.test(sessionId) || !/^[A-Za-z0-9_-]{32}$/.test(token)) throw Error('A valid Spiritual Gifts session link is required.');
  const { data, error: claimError } = await createSupabaseAdminClient().rpc('dydd_gifts_link_verified_account', {
    p_session: sessionId, p_user: user.id, p_hash: createHash('sha256').update(token).digest('hex'),
  });
  if (claimError || data !== sessionId) throw Error('This completed public assessment could not be connected. It may already belong to another account.');
  return sessionId;
}
/** Apply AFTER legacy participant lookup. Public Gifts never inherit participant/email ownership.
 * Session provenance covers old public snapshots whose scores incorrectly say native_app.
 * Explicit historical snapshot owners remain unchanged pending a separate provenance review.
 */
export async function filterPublicGiftsSnapshots<T extends GiftsSnapshot>(snapshots: T[], userId: string): Promise<T[]> {
  const gifts = snapshots.filter(s => s.assessment_type === 'spiritual_gifts');
  if (!gifts.length) return snapshots;
  const db = createSupabaseAdminClient();
  const { data: sessions, error } = await db.from('spiritual_gifts_sessions')
    .select('id,result_snapshot_id,metadata').in('result_snapshot_id', gifts.map(s => s.id));
  if (error) throw Error('Spiritual Gifts ownership could not be checked.');
  const publicIds = new Set(gifts.filter(s => s.scores?.channel === 'public_assessment').map(s => s.id));
  for (const s of sessions || []) if (s.metadata?.channel === 'public_assessment') publicIds.add(s.result_snapshot_id);
  if (!publicIds.size) return snapshots;
  const { data: links, error: linkError } = await db.from('dydd_gifts_account_links')
    .select('snapshot_id').eq('user_id', userId).in('snapshot_id', [...publicIds]);
  if (linkError) throw Error('Spiritual Gifts ownership could not be checked.');
  const owned = new Set((links || []).map(l => l.snapshot_id));
  return snapshots.filter(s => !publicIds.has(s.id) || (s.user_id ? s.user_id === userId : owned.has(s.id)));
}
/** Claim links do not rewrite snapshots or participant identities; list them separately. */
export async function getLinkedPublicGiftsSnapshots(userId: string): Promise<AssessmentSnapshotSummary[]> {
  const db = createSupabaseAdminClient();
  const { data: links, error } = await db.from('dydd_gifts_account_links').select('snapshot_id').eq('user_id', userId);
  if (error) throw Error('Spiritual Gifts ownership could not be checked.');
  if (!links?.length) return [];
  const result = await db.from('assessment_snapshots').select('id,assessment_type,created_at,scores,source,source_submitted_at,user_id,participant_id').in('id', links.map(l => l.snapshot_id));
  if (result.error) throw Error('Connected Spiritual Gifts results could not be read.');
  return filterPublicGiftsSnapshots((result.data || []) as AssessmentSnapshotSummary[], userId);
}
