import 'server-only';
import { isSandbox } from '@/lib/environment';
export type PublicPaymentMode = 'test' | 'live';
export const sandboxAssessmentDatabase = 'https://atemrshtshxoqnuevvqu.supabase.co';
/** Separate ledger readiness from checkout availability: pausing sales never erases rights. */
export function publicAssessmentLedgerEnabled() {
 if (isSandbox()) return process.env.NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF === 'atemrshtshxoqnuevvqu'
  && process.env.NEXT_PUBLIC_SUPABASE_URL === sandboxAssessmentDatabase;
 const expected = process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_SUPABASE_URL;
 return process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_LEDGER_ENABLED === 'true'
  && process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_ACCESS_POLICY === 'grandfathered-v1'
  && process.env.DYDD_PUBLIC_ASSESSMENT_GRANDFATHER_INVENTORY_READY === 'true'
  && !!expected && /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(expected)
  && expected !== sandboxAssessmentDatabase && expected === process.env.NEXT_PUBLIC_SUPABASE_URL;
}
export type VerifiedCheckoutUser = { id: string; email_confirmed_at?: string };
/** Server-only input: the caller must obtain this user from auth.getUser(), never FormData.
 * This is checkout permission only, not an assessment/course entitlement or owner role.
 * A malformed list disables the entire exception; absent configuration is disabled.
 */
export function isProductionAssessmentCanary(user?: VerifiedCheckoutUser) {
 if (process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT !== 'production' || isSandbox()
  || !user?.email_confirmed_at || !Number.isFinite(Date.parse(user.email_confirmed_at))) return false;
 const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
 if (!uuid.test(user.id)) return false;
 const ids = (process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_CANARY_USER_IDS || '').split(',').map(id => id.trim());
 return ids.every(id => uuid.test(id)) && ids.includes(user.id);
}
export function publicPaymentRuntime(purpose: 'checkout' | 'webhook' = 'checkout', verifiedUser?: VerifiedCheckoutUser) {
 const mode = process.env.DYDD_PUBLIC_ASSESSMENT_STRIPE_MODE;
 if (mode !== 'test' && mode !== 'live') throw Error('Explicit assessment Stripe mode required.');
 if ((mode === 'test') !== isSandbox() || !publicAssessmentLedgerEnabled()) throw Error('Assessment environment mismatch.');
 const enabled = purpose === 'checkout'
  ? process.env.DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED === 'true' || (mode === 'live' && isProductionAssessmentCanary(verifiedUser))
  : process.env.DYDD_PUBLIC_ASSESSMENT_WEBHOOKS_ENABLED === 'true';
 if (!enabled
  || (mode === 'live' && process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_PAYMENTS_ENABLED !== 'true')) throw Error('Assessment payments disabled.');
 // Dedicated LIVE override wins, including when invalid; never cross test/live modes.
 const secret = mode === 'test'
  ? process.env.STRIPE_DYDD_TEST_KEY || ''
  : process.env.DYDD_PUBLIC_ASSESSMENT_STRIPE_LIVE_KEY || process.env.STRIPE_SECRET_KEY || '';
 if (!new RegExp('^(sk|rk)_' + mode + '_').test(secret)) throw Error('Stripe key mode mismatch.');
 const origin = process.env[mode === 'test' ? 'DYDD_PUBLIC_ASSESSMENT_TEST_ORIGIN' : 'DYDD_PUBLIC_ASSESSMENT_LIVE_ORIGIN'] || '';
 const url = new URL(origin);
 if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password) throw Error('Explicit HTTPS checkout origin required.');
 return {mode, provider: mode === 'test' ? 'stripe_test' as const : 'stripe_live' as const,
  livemode: mode === 'live', secret, origin, app: mode === 'test' ? 'dydd_public_assessments_sandbox_v1' : 'dydd_public_assessments_live_v1'};
}
