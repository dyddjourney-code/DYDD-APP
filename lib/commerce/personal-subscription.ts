import 'server-only';
import Stripe from 'stripe';
import { createHash } from 'node:crypto';

export type PersonalSubscriptionSummary = {
 state: 'unavailable' | 'none' | 'current'; message?: string;
 status?: string; cancelAtPeriodEnd?: boolean; paidThrough?: string | null;
 nextBillAt?: string | null; canCancel?: boolean; amount?: number; currency?: string;
};
const unavailable: PersonalSubscriptionSummary = { state: 'unavailable', message: 'Personal subscription billing is currently unavailable. Your existing access has not changed.' };
function configuration() {
 const key = process.env.STRIPE_SECRET_KEY;
 const price = process.env.STRIPE_PERSONAL_PRICE_ID;
 const product = process.env.STRIPE_PERSONAL_PRODUCT_ID;
 if (process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT !== 'production' || !key || !/^(sk|rk)_live_/.test(key) || !price?.startsWith('price_') || !product?.startsWith('prod_')) return null;
 return { stripe: new Stripe(key), price, product };
}
const objectId = (value: string | { id: string } | null | undefined) => typeof value === 'string' ? value : value?.id;
const iso = (seconds: number) => Number.isSafeInteger(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
/** Internal server use only: userId must come from auth.getUser(), never request input.
 * Metadata contract is deliberately independent of beta grants and Circle billing.
 * Provisioning must stamp app=dydd, capability=personal, user_id on subscription
 * and app=dydd,user_id on its Stripe customer. Email alone never establishes ownership.
 */
async function owned(userId: string) {
 const config = configuration();
 if (!config || !/^[0-9a-f-]{36}$/i.test(userId)) return null;
 const { stripe, price, product } = config;
 const catalog = await stripe.prices.retrieve(price, { expand: ['product'] });
 const itemProduct = catalog.product;
 if (!catalog.livemode || !catalog.active || catalog.unit_amount !== 1000 || catalog.currency !== 'usd' || catalog.type !== 'recurring' || catalog.recurring?.interval !== 'month' || catalog.recurring.interval_count !== 1 || catalog.recurring.usage_type !== 'licensed' || objectId(itemProduct) !== product || typeof itemProduct === 'string' || itemProduct.deleted || !itemProduct.active || !itemProduct.livemode || itemProduct.metadata.app !== 'dydd' || itemProduct.metadata.capability !== 'personal') throw Error('Personal catalog verification failed');
 const found = await stripe.subscriptions.search({ query: `metadata['app']:'dydd' AND metadata['capability']:'personal' AND metadata['user_id']:'${userId}'`, limit: 100 });
 if (found.has_more) throw Error('Ambiguous membership');
 const candidates = found.data.filter(s => !['canceled', 'incomplete_expired'].includes(s.status));
 if (candidates.length > 1) throw Error('Ambiguous membership');
 if (!candidates.length) return { stripe, sub: null, summary: { state: 'none', message: 'No verified current Personal subscription was found. Your existing access has not changed.' } as PersonalSubscriptionSummary };
 // Search is discovery only; retrieve and reverify immediately before any mutation.
 const sub = await stripe.subscriptions.retrieve(candidates[0].id);
 const item = sub.items.data[0];
 const customer = await stripe.customers.retrieve(objectId(sub.customer)!);
 if (!sub.livemode || sub.metadata.app !== 'dydd' || sub.metadata.capability !== 'personal' || sub.metadata.user_id !== userId || customer.deleted || !customer.livemode || customer.metadata.app !== 'dydd' || customer.metadata.user_id !== userId || sub.items.has_more || sub.items.data.length !== 1 || item.quantity !== 1 || item.price.id !== price || objectId(item.price.product) !== product || sub.schedule || sub.collection_method !== 'charge_automatically') throw Error('Personal ownership verification failed');
 let paidThrough: string | null = null;
 if (sub.latest_invoice) {
  const invoice = await stripe.invoices.retrieve(objectId(sub.latest_invoice)!);
  const lines = invoice.lines.data.filter(line => objectId(line.parent?.subscription_item_details?.subscription) === sub.id && line.pricing?.price_details?.price === price && line.period.end === item.current_period_end && line.period.start === item.current_period_start);
  if (invoice.livemode && invoice.status === 'paid' && objectId(invoice.customer) === customer.id && !invoice.lines.has_more && lines.length === 1) paidThrough = iso(lines[0].period.end);
 }
 const renewable = sub.status === 'active' && !!paidThrough && new Date(paidThrough).getTime() > Date.now() && !sub.pause_collection && !sub.cancel_at;
 const canCancel = renewable && !sub.cancel_at_period_end;
 return { stripe, sub, summary: { state: 'current', status: sub.status, cancelAtPeriodEnd: sub.cancel_at_period_end, paidThrough, nextBillAt: renewable && !sub.cancel_at_period_end ? iso(item.current_period_end) : null, canCancel, amount: 1000, currency: 'usd' } as PersonalSubscriptionSummary };
}
export async function getPersonalSubscription(userId: string): Promise<PersonalSubscriptionSummary> {
 try { return (await owned(userId))?.summary ?? unavailable; } catch { return unavailable; }
}
export async function cancelPersonalSubscription(userId: string, expectedPaidThrough: string): Promise<PersonalSubscriptionSummary> {
 const record = await owned(userId);
 if (!record?.sub || record.summary.paidThrough !== expectedPaidThrough) throw Error('Reload your membership details before trying again.');
 if (record.sub.cancel_at_period_end) return record.summary;
 if (!record.summary.canCancel) throw Error('This membership cannot be changed online right now.');
 const key = createHash('sha256').update(`personal-cancel-v1:${userId}:${record.sub.id}:${expectedPaidThrough}`).digest('hex');
 const changed = await record.stripe.subscriptions.update(record.sub.id, { cancel_at_period_end: true }, { idempotencyKey: key });
 if (!changed.cancel_at_period_end || changed.id !== record.sub.id || changed.items.data[0]?.current_period_end !== record.sub.items.data[0].current_period_end) throw Error('Cancellation could not be verified. Reload your membership details.');
 return { ...record.summary, cancelAtPeriodEnd: true, nextBillAt: null, canCancel: false };
}
