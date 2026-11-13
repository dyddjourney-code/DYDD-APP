import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type AccountPurchaseRecord = { id: string; product: string; status: string; recordedAt: string; amount: number | null; currency: string | null };
/** Only server-verified account IDs; never match purchases by email or contact text. */
export async function getAccountPurchases(userId: string): Promise<{ records: AccountPurchaseRecord[]; unavailable: boolean }> {
 if (!userId) return { records: [], unavailable: false };
 try {
  const db = createSupabaseAdminClient();
  const [direct, links] = await Promise.all([
   db.from('dydd_public_assessment_orders').select('id,product,status,created_at,fulfilled_at,expected_amount,currency,payment_provider').eq('user_id', userId).in('status', ['paid', 'refunded', 'waived']).order('created_at', { ascending: false }).limit(50),
   db.from('dydd_guest_account_links').select('session_id').eq('user_id', userId).limit(100),
  ]);
  if (direct.error || links.error) throw Error('Purchase records unavailable');
  const sessions = (links.data || []).map(row => row.session_id);
  const guests = sessions.length ? await db.from('dydd_guest_orders').select('id,product,status,paid_at,created_at,expected_amount,currency').in('session_id', sessions).eq('payment_provider', 'stripe_live').in('status', ['paid', 'refunded']).order('created_at', { ascending: false }).limit(50) : { data: [], error: null };
  if (guests.error) throw Error('Purchase records unavailable');
  const records = [
   ...(direct.data || []).filter(row => row.payment_provider === 'stripe_live' || row.status === 'waived').map(row => ({ id: row.id, product: row.product, status: row.status, recordedAt: row.fulfilled_at || row.created_at, amount: row.status === 'waived' ? null : row.expected_amount, currency: row.currency })),
   ...(guests.data || []).map(row => ({ id: row.id, product: row.product, status: row.status, recordedAt: row.paid_at || row.created_at, amount: row.expected_amount, currency: row.currency })),
  ].sort((a,b) => b.recordedAt.localeCompare(a.recordedAt)).slice(0,50);
  return { records, unavailable: false };
 } catch { return { records: [], unavailable: true }; }
}
