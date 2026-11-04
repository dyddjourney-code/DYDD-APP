import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasLifetimePersonalAccess } from './personal-access';
import { assertTestBilling, testBillingEnabled } from './test-billing-config';
import { isDyddAdminEmail } from '@/lib/admin-access';
import { redirect } from 'next/navigation';

export type PersonalMembershipState = {
  phase: 'untracked' | 'active' | 'expired' | 'lifetime';
  paidThrough: string | null;
};
export type PersonalMembershipEvidence = {
  active: boolean; paid: boolean; expires_at: string | null; paid_through: string | null;
  order_id: string;
};
/** The paid boundary is exclusive. Failed invoices cannot advance saved paid history.
 * A revoked order cannot authorize content even if an older entitlement is still active.
 */
export function personalMembershipState(rows: PersonalMembershipEvidence[], revoked: Set<string> = new Set(), now = Date.now()): PersonalMembershipState {
  const valid = rows.filter(row => !revoked.has(row.order_id));
  const boundaries = valid.map(row => Date.parse(row.paid_through || '')).filter(Number.isFinite);
  const paidThrough = boundaries.length ? new Date(Math.max(...boundaries)).toISOString() : null;
  const active = valid.some(row => row.active && row.paid &&
    Date.parse(row.expires_at || '') > now && Date.parse(row.paid_through || '') > now);
  return { phase: active ? 'active' : rows.length ? 'expired' : 'untracked', paidThrough };
}
/** Only the isolated TEST ledger is consulted; legacy/production behavior is unchanged. */
export async function getPersonalMembershipState(userId: string): Promise<PersonalMembershipState> {
  if (!testBillingEnabled() || !userId) return { phase: 'untracked', paidThrough: null };
  assertTestBilling();
  if (await hasLifetimePersonalAccess(userId)) return { phase: 'lifetime', paidThrough: null };
  const db = createSupabaseAdminClient();
  const evidence = await db.from('dydd_test_billing_entitlements')
    .select('active,paid,expires_at,paid_through,order_id').eq('user_id', userId).eq('capability', 'personal').eq('scope_id', 'account');
  if (evidence.error) throw Error('Your personal membership could not be checked. Your saved work is unchanged. Please retry.');
  const rows = (evidence.data || []) as PersonalMembershipEvidence[];
  if (!rows.length) return personalMembershipState([]);
  const orders = await db.from('dydd_test_billing_orders').select('id,status').eq('user_id', userId).in('id', rows.map(row => row.order_id));
  if (orders.error) throw Error('Your personal membership purchase could not be verified. Please retry.');
  // Missing evidence fails closed as well as explicitly revoked evidence.
  const valid = new Set((orders.data || []).filter(order => order.status !== 'revoked').map(order => order.id));
  return personalMembershipState(rows, new Set(rows.filter(row => !valid.has(row.order_id)).map(row => row.order_id)));
}

export function safeAccountReturn(value: unknown, fallback = '/hq') {
  if (typeof value !== 'string' || /[\\\u0000-\u001f]/.test(value) || !value.startsWith('/') || value.startsWith('//')) return fallback;
  const url = new URL(value, 'https://sandbox.invalid');
  if (url.origin !== 'https://sandbox.invalid' || /^\/(?:renew|login|auth)(?:\/|$)/.test(url.pathname)) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}
export function personalRenewalPath(next: unknown = '/hq') {
  return '/renew?' + new URLSearchParams({ next: safeAccountReturn(next) });
}
/** Purchased DesignPD/Couple records, downloads, history and the free Gifts trail
 * are NOT membership-backed content. Their existing object authorization remains mandatory.
 */
export function membershipBackedCourse(slug: string) {
  return ['discover-your-divine-design', 'designid-foundations', 'fruitlife-360-formation'].includes(slug);
}
export async function personalMembershipExpired(user: { id: string; email?: string | null }) {
  if (!testBillingEnabled() || isDyddAdminEmail(user.email)) return false;
  return (await getPersonalMembershipState(user.id)).phase === 'expired';
}
export async function requirePersonalMembershipContent(user: { id: string; email?: string | null } | null, next: string) {
  if (!testBillingEnabled()) return;
  if (!user) redirect('/login?' + new URLSearchParams({ next: safeAccountReturn(next) }));
  if (await personalMembershipExpired(user)) redirect(personalRenewalPath(next));
}
export async function signedInAccountDestination(user: { id: string; email?: string | null } | null, next: unknown) {
  const requested = typeof next === 'string' && next.startsWith('/renew?')
    ? new URL(next, 'https://sandbox.invalid').searchParams.get('next') : next;
  const destination = safeAccountReturn(requested);
  // Recovery and password update must always remain possible on the same identity.
  const pathname = new URL(destination, 'https://sandbox.invalid').pathname;
  const exempt = /^\/(?:reset-password|spiritual-gifts|designpd|camp-circle|field-kit|api\/artifacts)(?:\/|$)/.test(pathname) ||
    /^\/courses\/(?:designpd-alignment|spiritual-gifts-service)(?:[/?#]|$)/.test(destination);
  const report = /^\/(?:designid|fruitlife360)\/report(?:[/?#]|$)/.test(destination);
  return user && !exempt && !report && await personalMembershipExpired(user) ? personalRenewalPath(destination) : destination;
}

/** A verified self token is still required by the caller. Paid standalone sessions
 * remain available; an ended membership cannot be bypassed with an old self URL.
 * Completed session status/report history and observer participation are unchanged.
 */
export async function requireFruitLifeSelfMembership(sessionId: string) {
  if (!testBillingEnabled()) return;
  assertTestBilling();
  const db = createSupabaseAdminClient();
  const result = await db.from('fruitlife_360_sessions').select('created_by_user_id').eq('id', sessionId).maybeSingle();
  if (result.error) throw Error('Your assessment access could not be checked. Please retry.');
  const userId = result.data?.created_by_user_id;
  if (!userId || (await getPersonalMembershipState(userId)).phase !== 'expired') return;
  const purchase = await db.from('fruitlife_360_entitlements').select('id').eq('user_id', userId)
    .eq('fruitlife_session_id', sessionId).in('status', ['active', 'consumed']).limit(1);
  if (purchase.error) throw Error('Your saved assessment purchase could not be checked. Please retry.');
  if (purchase.data?.length) return;
  const identity = await db.auth.admin.getUserById(userId);
  if (identity.error) throw Error('Your assessment account could not be verified. Please retry.');
  if (isDyddAdminEmail(identity.data.user?.email)) return;
  redirect(personalRenewalPath('/fruitlife360'));
}
