import 'server-only';
import Stripe from 'stripe';

/** Read-only deployment diagnostic. Fixed catalog, no customer data or provider objects. */
export async function verifyAssessmentLiveStripeCatalog() {
 const key = process.env.DYDD_PUBLIC_ASSESSMENT_STRIPE_LIVE_KEY || process.env.STRIPE_SECRET_KEY || '';
 const liveKey = /^(sk|rk)_live_/.test(key);
 const status = {ok:false,liveKey,designid:false,designpd:false,
  salesPaused:process.env.DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED === 'false',
  accessPolicyInactive:process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_ACCESS_POLICY !== 'grandfathered-v1'};
 if (!liveKey) return status;
 const stripe = new Stripe(key, {maxNetworkRetries:0,timeout:10000});
 const expected = [
  {price:'price_1SpvNlABW64O7Vgm7A21M9dA',product:'prod_TnWQY5tMSZpbYo'},
  {price:'price_1UajaWABW64O7VgmkpiD7KL7',product:'prod_UODe7BcedrK2cg'},
 ];
 const checks = await Promise.all(expected.map(async item => {
  try {
   const price = await stripe.prices.retrieve(item.price);
   const product = typeof price.product === 'string' ? price.product : price.product.id;
   return price.id === item.price && product === item.product && price.livemode === true
    && price.active === true && price.type === 'one_time' && price.currency === 'usd'
    && price.unit_amount === 1999;
  } catch { return false; }
 }));
 return {...status,ok:checks.every(Boolean),designid:checks[0],designpd:checks[1]};
}
