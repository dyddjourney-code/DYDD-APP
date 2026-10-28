import { createHash } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/** Commercial entitlement only. Never replaces assessment, identity, privacy or seat checks. */
export async function hasLifetimePersonalAccess(userId: string) {
  if (!userId) return false;
  const { data, error } = await createSupabaseAdminClient().from('dydd_personal_access')
    .select('scope').eq('user_id', userId).maybeSingle();
  if (error) throw new Error('Your saved access could not be checked. Please try again.');
  return data?.scope === 'personal_all_access';
}
export async function hasIncludedPersonalAccess(userId: string) {
  return Boolean(userId) && (await hasLifetimePersonalAccess(userId));
}
export function betaCodeHash(input: unknown) {
  if (typeof input !== 'string' || input.length > 128) return null;
  const normalized = input.toUpperCase().replace(/[\s-]/g, '');
  return /^DYDD[A-F0-9]{32}$/.test(normalized)
    ? createHash('sha256').update(normalized).digest('hex') : null;
}
