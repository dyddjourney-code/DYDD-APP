import { redirect, notFound } from 'next/navigation';
import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { testBillingEnabled } from '@/lib/commerce/test-billing-config';
import { getPersonalMembershipState, safeAccountReturn } from '@/lib/commerce/account-access';
import { ContextualPurchases } from '@/components/contextual-purchases';

export const dynamic = 'force-dynamic';
export default async function RenewPersonalMembership({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  if (!testBillingEnabled()) notFound();
  const params = await searchParams;
  const next = safeAccountReturn(params?.next);
  const { data: { user } } = await (await createSupabaseServerClient()).auth.getUser();
  if (!user) redirect('/login?' + new URLSearchParams({ next: '/renew?' + new URLSearchParams({ next }) }));
  const state = await getPersonalMembershipState(user.id);
  if (state.phase === 'active' || state.phase === 'lifetime') redirect(next);
  return <main className="journey-shell hq-standalone-page">
    <section className="fruitlife-panel">
      <h1>Continue your personal journey</h1>
      <p>{state.phase === "expired" ? "Your personal membership has ended. Renew" : "Start your personal membership"} using this same account to continue your courses, assessments and Waypoints.</p>
      <p>Signed in as <strong>{user.email}</strong>. Your assessment history, reports, workbook reflections and saved progress remain connected to this account. No new account is needed.</p>
      {state.paidThrough && <p>Your paid access ended on {new Date(state.paidThrough).toLocaleDateString('en-US', { timeZone: 'UTC' })}.</p>}
      <p>Separately purchased DesignPD reports and Couples Circle records are preserved. Spiritual Gifts remains free.</p>
      <a className="button secondary" href="/field-kit">View saved reports</a>{' '}
      <a className="button secondary" href="/spiritual-gifts">Open Spiritual Gifts</a>
    </section>
    <Suspense fallback={<p>Opening your membership options…</p>}><ContextualPurchases area="personal" personalActionLabel="Renew membership" /></Suspense>
    <p>Sandbox test payments · No real charges</p>
  </main>;
}
