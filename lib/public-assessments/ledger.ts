import 'server-only';
import { createHash } from 'node:crypto';
import { isSandbox } from '@/lib/environment';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type PublicAssessmentProduct = 'designid' | 'designpd';
export type PublicAssessmentEntitlement = {
  id: string; order_id: string; user_id: string; product: PublicAssessmentProduct;
  source_snapshot_id: string | null; grant_kind: 'waiver' | 'stripe_test'; created_at: string;
  consumed_at: string | null; revoked_at: string | null; completion_snapshot_id: string | null;
};
function sandboxLedgerEnabled() {
  return isSandbox() && process.env.NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF === 'atemrshtshxoqnuevvqu'
    && process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://atemrshtshxoqnuevvqu.supabase.co';
}
/** Hash is product-domain-separated; never persist/log the bearer code. */
export function hashPublicAssessmentCode(product: PublicAssessmentProduct, code: string) {
  if (product !== 'designid' && product !== 'designpd') throw new Error('Unknown assessment product.');
  return createHash('sha256').update(`dydd-public-assessment:sandbox:v1:${product}:${code.trim().toUpperCase()}`).digest('hex');
}
/** Only unconsumed, unrevoked one-off access. This does not imply school/course membership. */
export async function getPublicAssessmentEntitlement(userId: string, product: PublicAssessmentProduct, sourceId?: string): Promise<PublicAssessmentEntitlement | null> {
  if (!sandboxLedgerEnabled()) return null;
  const { data, error } = await createSupabaseAdminClient().rpc('dydd_has_public_assessment_entitlement', {
    p_user_id: userId, p_product: product, p_source_snapshot_id: sourceId ?? null,
  });
  if (error) throw new Error('Unable to check assessment access. Please retry.');
  return data as PublicAssessmentEntitlement | null;
}
export async function hasPublicAssessmentEntitlement(userId: string, product: PublicAssessmentProduct, sourceId?: string): Promise<boolean> {
  return Boolean(await getPublicAssessmentEntitlement(userId, product, sourceId));
}
/** Caller must obtain userId from verified server Auth, never form data. Same-user retry returns same id.
 * A completed DesignID is validated/owned and bound to the exact source inside the redemption transaction.
 * Entry/save must separately preserve existing timing checks. The successful save transaction must mark
 * consumed_at + completion_snapshot_id together; failed saves must not consume this entitlement.
 */
export async function redeemPublicAssessmentCode(userId: string, product: PublicAssessmentProduct, code: string, sourceId?: string): Promise<PublicAssessmentEntitlement> {
  if (!sandboxLedgerEnabled()) throw new Error('Assessment code access is only available in the isolated sandbox.');
  const normalized = code.trim().toUpperCase();
  const prefix = product === 'designid' ? 'SANDBOX-DID-' : 'SANDBOX-DPD-';
  if (!normalized.startsWith(prefix) || !/^SANDBOX-(DID|DPD)-[A-F0-9]{40}$/.test(normalized)) throw new Error('Invalid assessment code.');
  const { data, error } = await createSupabaseAdminClient().rpc('dydd_redeem_public_assessment_code', {
    p_code_hash: hashPublicAssessmentCode(product, normalized), p_user_id: userId,
    p_product: product, p_source_snapshot_id: sourceId ?? null,
  });
  if (error || !data) throw new Error('Code could not be redeemed. Check the code and, for DesignPD, select your valid completed DesignID.');
  return data as PublicAssessmentEntitlement;
}
